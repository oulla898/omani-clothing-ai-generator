/**
 * Nano Banana Service
 * 
 * Uses Gemini 2.5 Flash Image for generation with intelligent component image references.
 * Understands Omani culture, clothing, and locations deeply.
 * 
 * SIGNATURE STYLE: Cinematic Omani
 * - Warm golden hour / dramatic side lighting
 * - Rich deep shadows with film grain texture
 * - Earthy desaturated tones (sand, terracotta, olive) 
 * - Pops of traditional Omani colors (indigo, burgundy, gold)
 * - Medium format film look, shallow depth of field
 */

import { GoogleGenAI } from '@google/genai'
import { readFile, readdir } from 'fs/promises'
import { join, extname } from 'path'

// Component images directory - stored in src/assets (NOT public - users can't access)
const IMAGES_BASE_DIR = join(process.cwd(), 'src', 'assets', 'component-images')

export interface GenerationOptions {
  useComponentImages?: boolean
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
}

export interface GenerationResult {
  success: boolean
  imageBase64?: string
  enhancedPrompt?: string
  componentsUsed?: string[]
  error?: string
}

interface ComponentImage {
  category: string        // Top-level folder (e.g., "mussar", "khanjar")
  subcategory?: string    // Subfolder if any (e.g., "formal", "سعيدية")
  filename: string
  filepath: string
  relativePath: string    // Full path relative to IMAGES_BASE_DIR for display
}

interface SelectedImageWithInstruction {
  category: string
  subcategory?: string
  filename: string
  instruction: string     // LLM provides this
  filepath?: string
}

interface AnalysisResult {
  needs_references: boolean
  orientation_context?: string  // e.g., "from behind", "side profile"
  selected_images: SelectedImageWithInstruction[]
  subject_description: string
  scene_description: string
  style_notes: string
}

// Signature style suffix for consistent cinematic look
const SIGNATURE_STYLE = `Cinematic Omani aesthetic, warm golden hour lighting with rich deep shadows, earthy desaturated color palette with traditional Omani color accents (indigo, burgundy, gold), medium format film photography look, shallow depth of field, dramatic side lighting, photorealistic, high quality.`

/**
 * Recursively scan a directory and return all image files with their category/subcategory info
 */
async function scanDirectory(dirPath: string, category: string, subcategory?: string): Promise<ComponentImage[]> {
  const images: ComponentImage[] = []
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // Recurse into subdirectory
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
    // Directory doesn't exist or can't be read, skip silently
  }
  
  return images
}

/**
 * Dynamically discover all component images from the library
 * Automatically detects all top-level folders as categories and subfolders as subcategories
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
 * Get a random image from a specific category (and optionally subcategory)
 */
async function getRandomImageFromCategory(
  category: string, 
  subcategory?: string,
  allImages?: ComponentImage[]
): Promise<ComponentImage | null> {
  // If we already have the images list, filter from it
  if (allImages) {
    const matching = allImages.filter(img => {
      if (subcategory) {
        return img.category === category && img.subcategory === subcategory
      }
      return img.category === category
    })
    
    if (matching.length === 0) return null
    
    // Fisher-Yates shuffle for true randomness
    for (let i = matching.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matching[i], matching[j]] = [matching[j], matching[i]]
    }
    
    const selected = matching[0]
    console.log(`📂 Available in ${category}${subcategory ? '/' + subcategory : ''}: ${matching.length} files`)
    console.log(`🎲 Selected: ${selected.filename}`)
    return selected
  }
  
  // Otherwise scan the directory directly
  const dirPath = subcategory 
    ? join(IMAGES_BASE_DIR, category, subcategory)
    : join(IMAGES_BASE_DIR, category)
    
  const images = await scanDirectory(dirPath, category, subcategory)
  
  if (images.length === 0) return null
  
  // Fisher-Yates shuffle
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]]
  }
  
  const selected = images[0]
  console.log(`📂 Available in ${category}${subcategory ? '/' + subcategory : ''}: ${images.length} files`)
  console.log(`🎲 Selected: ${selected.filename}`)
  return selected
}

/**
 * Get MIME type from file path
 */
function getMimeType(filepath: string): string {
  const ext = extname(filepath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

/**
 * Build the comprehensive analysis prompt for Gemini
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

export class NanoBananaService {
  /**
   * Generate an image using Nano Banana (Gemini 2.5 Flash Image)
   * 
   * Intelligently selects reference images and builds instructional prompts for authentic Omani imagery.
   */
  static async generate(prompt: string, options: GenerationOptions = {}): Promise<GenerationResult> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
      const useComponents = options.useComponentImages ?? true
      const aspectRatio = options.aspectRatio ?? '1:1'
      
      const selectedImages: SelectedImageWithInstruction[] = []
      let analysisResult: AnalysisResult | null = null
      
      // Step 1: Intelligent analysis with component selection (using fast lite model)
      if (useComponents) {
        const availableImages = await getAvailableImages()
        
        if (availableImages.length > 0) {
          console.log(`🎯 Agent analyzing request... (${availableImages.length} reference images available)`)
          
          // Build image list showing full relative path
          const imageList = availableImages.map(img => `[${img.relativePath}]`).join('\n')
          const analysisPrompt = buildAnalysisPrompt(prompt, imageList)

          try {
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
              config: { 
                responseMimeType: 'application/json'
              }
            })
            
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              analysisResult = JSON.parse(text) as AnalysisResult
              console.log('🤖 LLM Analysis Result:', JSON.stringify(analysisResult, null, 2))
              
              // Get selected images with their instructions (handle random selection)
              if (analysisResult.needs_references && analysisResult.selected_images) {
                for (const sel of analysisResult.selected_images) {
                  const selPath = sel.subcategory 
                    ? `${sel.category}/${sel.subcategory}/${sel.filename}`
                    : `${sel.category}/${sel.filename}`
                  console.log(`📋 LLM selected: ${selPath}`)
                  
                  // Handle random selection
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
                        instruction: sel.instruction || `Use this ${sel.category} reference image. The subject should wear/use this item exactly as shown.`,
                        filepath: randomImg.filepath
                      })
                      console.log(`🎲 Random pick: ${randomImg.relativePath}`)
                    }
                  } else {
                    // Find specific file
                    const found = availableImages.find(img => {
                      const matchesCategory = img.category === sel.category
                      const matchesSubcategory = sel.subcategory 
                        ? img.subcategory === sel.subcategory 
                        : true
                      const matchesFilename = img.filename === sel.filename
                      return matchesCategory && matchesSubcategory && matchesFilename
                    })
                    if (found) {
                      selectedImages.push({
                        ...sel,
                        filepath: found.filepath
                      })
                    } else {
                      console.warn(`⚠️ File not found: ${selPath}, trying random from category`)
                      // Fallback to random from category
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
              
              if (analysisResult.orientation_context) {
                console.log('🔄 Orientation:', analysisResult.orientation_context)
              }
              console.log('👤 Subject:', analysisResult.subject_description)
              console.log('🎬 Scene:', analysisResult.scene_description)
              if (selectedImages.length > 0) {
                console.log('📎 References:', selectedImages.map(i => i.filename).join(', '))
              } else {
                console.log('✨ Generating without references')
              }
            }
          } catch (err) {
            console.warn('⚠️ Analysis failed, generating directly:', err)
          }
        }
      }
      
      // Step 2: Build the MASTER PROMPT with per-image instructions
      let masterPrompt = ''
      
      if (analysisResult) {
        masterPrompt = `Generate a photorealistic image with the following specifications:

=== SUBJECT ===
${analysisResult.subject_description}

=== SCENE ===
${analysisResult.scene_description}
`
        
        // Add reference image instructions (provided by LLM)
        if (selectedImages.length > 0) {
          masterPrompt += `\n=== CLOTHING REFERENCES (Use these EXACTLY as instructed) ===\n`
          selectedImages.forEach((img, index) => {
            masterPrompt += `\n[REFERENCE IMAGE ${index + 1}]\n`
            masterPrompt += `${img.instruction}\n`
          })
        }
        
        masterPrompt += `\n=== STYLE ===\n${analysisResult.style_notes}\n\n${SIGNATURE_STYLE}`
      } else {
        // Fallback if analysis failed
        masterPrompt = `${prompt}\n\n${SIGNATURE_STYLE}`
      }
      
      console.log('📝 Master prompt built')
      console.log('📐 Aspect ratio:', aspectRatio)
      
      // Step 3: Build content parts (prompt + reference images)
      type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } }
      const parts: ContentPart[] = [{ text: masterPrompt }]
      
      // Add reference images if selected
      for (const img of selectedImages) {
        if (img.filepath) {
          try {
            const buffer = await readFile(img.filepath)
            parts.push({
              inlineData: {
                mimeType: getMimeType(img.filepath),
                data: buffer.toString('base64')
              }
            })
            console.log(`📷 Added reference: ${img.filename}`)
          } catch (err) {
            console.warn(`⚠️ Couldn't read ${img.filename}:`, err)
          }
        }
      }
      
      // Step 4: Generate with Gemini 2.5 Flash Image
      console.log('🎨 Generating with Nano Banana...')
      
      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-image',
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
        contents: [{ role: 'user', parts }],
      })
      
      // Collect image from stream
      let imageBase64: string | undefined
      
      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              imageBase64 = part.inlineData.data
              break
            }
          }
        }
        if (imageBase64) break
      }
      
      if (!imageBase64) {
        throw new Error('No image generated')
      }
      
      console.log('✅ Generated successfully!')
      
      // Build enhanced prompt for display
      const enhancedPrompt = analysisResult 
        ? `${analysisResult.subject_description}. ${analysisResult.scene_description}`
        : prompt
      
      return {
        success: true,
        imageBase64,
        enhancedPrompt,
        componentsUsed: selectedImages.map(i => i.filename)
      }
      
    } catch (error) {
      console.error('❌ Generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
