/**
 * Nano Banana Analysis API
 * 
 * Phase 1 of split API to avoid Vercel 30s timeout.
 * This endpoint only analyzes the prompt and selects reference images.
 * Takes ~10-15 seconds.
 * 
 * Returns: analysis result with selected images for use by /api/generate-image
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreditsManager } from '@/lib/credits'
import { imageGenerationLimiter } from '@/lib/rateLimiter'
import { GoogleGenAI } from '@google/genai'
import { readdir } from 'fs/promises'
import { join, extname } from 'path'

// Component images directory
const IMAGES_BASE_DIR = join(process.cwd(), 'src', 'assets', 'component-images')

interface ComponentImage {
  category: string
  subcategory?: string
  filename: string
  filepath: string
  relativePath: string
}

interface SelectedImageWithInstruction {
  category: string
  subcategory?: string
  filename: string
  instruction: string
  filepath?: string
}

interface AnalysisResult {
  needs_references: boolean
  orientation_context?: string
  selected_images: SelectedImageWithInstruction[]
  subject_description: string
  scene_description: string
  style_notes: string
}

/**
 * Recursively scan a directory and return all image files
 */
async function scanDirectory(dirPath: string, category: string, subcategory?: string): Promise<ComponentImage[]> {
  const images: ComponentImage[] = []
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        const subImages = await scanDirectory(fullPath, category, entry.name)
        images.push(...subImages)
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          const relativePath = subcategory 
            ? `${category}/${subcategory}/${entry.name}`
            : `${category}/${entry.name}`
          
          images.push({
            category,
            subcategory,
            filename: entry.name,
            filepath: fullPath,
            relativePath
          })
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return images
}

/**
 * Get all available component images
 */
async function getAvailableImages(): Promise<ComponentImage[]> {
  const images: ComponentImage[] = []
  
  try {
    const topLevelEntries = await readdir(IMAGES_BASE_DIR, { withFileTypes: true })
    
    for (const entry of topLevelEntries) {
      if (entry.isDirectory()) {
        const categoryPath = join(IMAGES_BASE_DIR, entry.name)
        const categoryImages = await scanDirectory(categoryPath, entry.name)
        images.push(...categoryImages)
      }
    }
  } catch {
    console.warn('⚠️ Could not read component images directory')
  }
  
  return images
}

/**
 * Get random image from category
 */
async function getRandomImageFromCategory(
  category: string, 
  subcategory?: string,
  allImages?: ComponentImage[]
): Promise<ComponentImage | null> {
  if (allImages) {
    const matching = allImages.filter(img => {
      if (subcategory) {
        return img.category === category && img.subcategory === subcategory
      }
      return img.category === category
    })
    
    if (matching.length === 0) return null
    
    for (let i = matching.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matching[i], matching[j]] = [matching[j], matching[i]]
    }
    
    return matching[0]
  }
  
  return null
}

/**
 * Build analysis prompt for LLM
 */
function buildAnalysisPrompt(userRequest: string, imageList: string): string {
  return `You are an expert Omani traditional clothing stylist and cultural advisor. Your job is to analyze user requests and select appropriate reference images for generating authentic Omani imagery.

=== USER REQUEST ===
"${userRequest}"

=== AVAILABLE REFERENCE IMAGES ===
The following images are available. Format: [category/subcategory/filename] or [category/filename]
${imageList}

=== OMANI CLOTHING KNOWLEDGE ===

**Headwear (for men only):**
- **Mussar (مصر)**: Traditional Omani turban. Comes in various colors, patterns, and styles.
  - Different subcategories may represent different styles (formal, سعيدية, etc.)
   -The imama is a white turban, typically worn by Omani men sheikhs and religious figures, which is characterized by its white neatly wrapped top part and a distinctive fringe or tassel that hangs from the back and drapes around the neck. ALWAYS describe the imama well.
- **Kuma (كمة)**: Embroidered cap worn under the mussar or alone. Various colors available.
- Note: "مصر" in Arabic almost always means "mussar" (turban), NOT Egypt, in the context of clothing.

**Body Garments:**
- **Dishdasha**: The traditional long robe worn by Omani men. Usually white, but can be other colors.
- **Bisht**: Formal cloak worn over dishdasha for special occasions.

**Accessories:**
- **Khanjar (خنجر)**: Traditional curved silver dagger with ornate handle, worn with a silver belt around the waist.
- **Shal (شال)**: Optional fabric belt/sash worn around the waist.

=== CRITICAL: WHEN TO USE REFERENCES ===

**ONLY use reference images when the subject is wearing TRADITIONAL Omani clothing:**
- Dishdasha (traditional robe)
- Bisht (formal cloak)
- Any Traditional formal Omani attire

**NEVER use reference images for modern/casual clothing:**
- Jeans, pants, trousers
- T-shirts, shirts, jackets
- Suits, casual wear
- Any Western-style/ non Omani clothing

**Language Rule - NEVER use the word "Omani" for casual clothing:**
- If wearing jeans, shirt, casual clothes → use "khaliji man" NOT "Omani man"
- If wearing dishdasha, bisht, mussar → can use "Omani man"
- The word "Omani" implies traditional attire. For modern clothes, use "Arab" instead.

**Selection Logic:**
- Look at ALL available categories and subcategories dynamically
- Match user's request to the most appropriate images based on color, style, or context
- If user specifies a style/type (e.g., "formal mussar", "سعيدية"), look for matching subcategory
- If no specific style requested, you can pick from any subcategory within that category

=== ORIENTATION & VIEW HANDLING ===

**CRITICAL: When user requests specific angles or views:**
- "back view", "from behind", "rear", "ظهر" → Look for images with "back" in the name
- "side view", "profile", "جانب" → Look for images with "side" in the name
- If requesting a specific view, ALL selected components should use that view consistently

**Orientation Consistency Rule:**
- If user wants a "back view" of a man with khanjar:
  - Select back view mussar if available
  - For khanjar: since khanjar is worn on front, write instruction like "Show only the silver belt from behind (khanjar blade not visible from back)"
- If user wants "side profile":
  - Select side view images if available
  - Describe how each component appears from the side

=== MODESTY & SAFETY RULES ===

**Respect the Subject:**
- Be faithful to what the user wants (man, woman, child, character, named person)
- Preserve their identity, appearance, and characteristics as specified
- Always keep clothing MODEST regardless of subject
- Do NOT mix men's and women's clothing styles unless specifically requested
- Dishdasha and mussar are for MALES ONLY - never put them on females unless explicitly requested

**For Females (CRITICAL - ALWAYS FOLLOW):**
- Little girl (under 10): can wear modest colorful dress without hijab
- Teen girl or adult woman: MUST ALWAYS include FULL HIJAB covering ALL hair completely - no hair visible at all
- ALWAYS describe hijab explicitly: "wearing full hijab that completely covers all hair"
- NEVER mention hair, hairstyle, or any visible hair for teen/adult women
- NEVER use word "headscarf" - ALWAYS use "full hijab covering all hair"
- Default women's attire: "black abaya and full black hijab covering all hair completely"
- If colorful hijab requested, still ensure: "full [color] hijab covering all hair completely"

**Absolute Prohibitions:**
- Never mention: body parts, swimsuits, swimwear, bikinis, burkinis, lingerie, nudity, revealing clothes
- If input contains sexual/indecent content, override completely with modest alternative
- Default fallback: "Omani man wearing traditional white dishdasha and mussar, closeup studio portrait, dramatic lighting"

**Male Defaults (when request is vague):**
- If user says "رجل عماني" or "Omani man" with NO clothing specified → default to dishdasha + mussar
- If user mentions ANY modern clothing (jeans, shirt, etc.) → NO references, describe as "Khaliji man", not "Omani man"
- The word "عماني/Omani" in the request does NOT mean they must wear traditional clothes if they specified modern clothes

=== OMANI LOCATIONS (for background context) ===

If user mentions Omani locations, add subtle environmental hints:

- **Muscat**: Contemporary + traditional architecture, Sultan Qaboos Grand Mosque, white/sandstone buildings, blue sea. People: olive to tan skin.
- **Dhofar/Salalah**: Lush green Khareef landscapes, coconut groves, frankincense, turquoise sea. People: bronze to deep brown skin.
- **Musandam**: Dramatic fjords, towering cliffs, turquoise waters. People: tan to olive.
- **Ad Dakhiliyah (Nizwa, Jebel Akhdar)**: Al Hajar Mountains, ancient forts, terraced farms. People: olive to tan.
- **Ash Sharqiyah (Sharqiya Sands, Sur)**: Golden dunes, Bedouin lifestyle, maritime history. People: tan to bronze.

=== COMPOSITION & QUALITY ===

- Prefer: medium shot, waist-up, bust shot, three-quarter portrait, or closeup
- Avoid full body shots unless explicitly requested
- Include: professional photography, soft studio lighting, dramatic lighting, cinematic mood
- Quality: high quality, photorealistic, ultra detailed

=== YOUR TASK ===

1. Analyze the user's request
2. Identify which Omani components are needed (if any)
3. **CRITICAL RULE FOR TRADITIONAL VS MODERN CLOTHING**:
   - If wearing TRADITIONAL Omani clothes (dishdasha, bisht) → MUST include mussar OR kuma, set needs_references=true
   - If wearing MODERN/CASUAL clothes (jeans, shirt, jacket, suit, t-shirt) → needs_references=false, NO mussar, NO kuma, NO references at all
   - If khanjar is selected → MUST ALSO include mussar (khanjar always comes with mussar)
   - If shal is selected → use "shal + mussar + khanjar" category if available (complete ensemble)
   - NEVER put mussar/kuma on someone wearing jeans or modern clothes - that's culturally incorrect
4. Detect if user wants a specific orientation/view (back, side, front)
5. Select the BEST matching reference images from the available list
6. For EACH selected image, write a DETAILED instruction explaining:
   - WHAT the image shows
   - WHERE/HOW to use it on the subject
   - How it appears from the requested ANGLE (if specific view requested)
   - Any MODIFICATIONS needed (color changes, etc.)
7. Create a subject description (who, features, expression, skin tone, AND orientation/angle)
8. Create a scene description (composition, lighting, background)

=== RESPONSE FORMAT (JSON only) ===

{
  "needs_references": true/false,
  "orientation_context": "front view (default)" | "back view - subject facing away from camera" | "side profile - subject facing left/right" | null,
  "selected_images": [
    {
      "category": "category_name (top-level folder)",
      "subcategory": "subcategory_name or null if image is directly in category folder",
      "filename": "exact_filename.ext OR 'random' if no specific color/style was requested",
      "instruction": "DETAILED instruction: 1) What this item is, 2) How to wear/display it, 3) How it appears from the requested angle, 4) Any modifications. Leave empty string if filename is 'random' and no special instructions needed."
    }
  ],
  "subject_description": "Detailed description INCLUDING orientation. Example: 'Adult Omani man seen from behind, olive skin, wearing white dishdasha. His back is to the camera.'",
  "scene_description": "Composition, camera angle, lighting, background.",
  "style_notes": "Additional style notes: mood, color grading, quality."
}

IMPORTANT: 
- If user specifies a COLOR or STYLE, find the matching filename
- If user does NOT specify, set filename to "random"
- If requesting a specific view/angle, add "orientation_context" and reflect it in subject_description
- Instructions should be self-contained - they go to image generation model

Return ONLY valid JSON, no other text.`
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Auth check
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { verifyToken } = await import('@clerk/backend')
        const verified = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!
        })
        userId = verified.sub
      } catch {
        // Token verification failed
      }
    }
    
    if (!userId) {
      const authResult = await auth()
      userId = authResult.userId
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    // Rate limit check
    const rateLimitCheck = imageGenerationLimiter.check(userId)
    if (!rateLimitCheck.allowed) {
      const waitTime = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
      return NextResponse.json({ 
        error: `Rate limit exceeded. Wait ${waitTime} seconds.`,
        rateLimitExceeded: true,
        waitTime
      }, { status: 429 })
    }
    
    // Credits check
    const userCredits = await CreditsManager.getUserCredits(userId)
    if (userCredits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }
    
    const { prompt, options } = await request.json()
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    
    const aspectRatio = options?.aspectRatio || '1:1'
    
    console.log('🔍 [ANALYZE] Starting analysis for:', prompt.substring(0, 50) + '...')
    
    // Get available images
    const availableImages = await getAvailableImages()
    
    if (availableImages.length === 0) {
      // No reference images, return simple analysis
      return NextResponse.json({
        success: true,
        analysis: {
          needs_references: false,
          selected_images: [],
          subject_description: prompt,
          scene_description: 'Professional photography, dramatic lighting',
          style_notes: 'Cinematic Omani aesthetic'
        },
        selectedImages: [],
        aspectRatio,
        prompt,
        analysisTime: Date.now() - startTime
      })
    }
    
    // Build image list for LLM
    const imageList = availableImages.map(img => `[${img.relativePath}]`).join('\n')
    const analysisPrompt = buildAnalysisPrompt(prompt, imageList)
    
    // Call Gemini for analysis
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
      config: { responseMimeType: 'application/json' }
    })
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!text) {
      throw new Error('No analysis response from LLM')
    }
    
    const analysisResult = JSON.parse(text) as AnalysisResult
    console.log('🤖 [ANALYZE] LLM result:', JSON.stringify(analysisResult, null, 2))
    
    // Resolve selected images (handle random selection)
    const selectedImages: SelectedImageWithInstruction[] = []
    
    if (analysisResult.needs_references && analysisResult.selected_images) {
      for (const sel of analysisResult.selected_images) {
        if (sel.filename === 'random') {
          const randomImg = await getRandomImageFromCategory(
            sel.category,
            sel.subcategory || undefined,
            availableImages
          )
          if (randomImg) {
            selectedImages.push({
              category: sel.category,
              subcategory: sel.subcategory,
              filename: randomImg.filename,
              instruction: sel.instruction || `Use this ${sel.category} reference image.`,
              filepath: randomImg.filepath
            })
            console.log(`🎲 [ANALYZE] Random pick: ${randomImg.relativePath}`)
          }
        } else {
          const found = availableImages.find(img => {
            const matchesCategory = img.category === sel.category
            const matchesSubcategory = sel.subcategory ? img.subcategory === sel.subcategory : true
            const matchesFilename = img.filename === sel.filename
            return matchesCategory && matchesSubcategory && matchesFilename
          })
          
          if (found) {
            selectedImages.push({ ...sel, filepath: found.filepath })
          } else {
            // Fallback to random
            const randomImg = await getRandomImageFromCategory(
              sel.category,
              sel.subcategory || undefined,
              availableImages
            )
            if (randomImg) {
              selectedImages.push({
                category: sel.category,
                subcategory: sel.subcategory,
                filename: randomImg.filename,
                instruction: sel.instruction || `Use this ${sel.category} reference image.`,
                filepath: randomImg.filepath
              })
            }
          }
        }
      }
    }
    
    const analysisTime = Date.now() - startTime
    console.log(`✅ [ANALYZE] Completed in ${analysisTime}ms`)
    
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      selectedImages,
      aspectRatio,
      prompt,
      analysisTime
    })
    
  } catch (error) {
    console.error('❌ [ANALYZE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
