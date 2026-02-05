/**
 * Razza Analysis API
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
import { buildAnalysisPrompt } from '@/lib/nano-banana'

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
