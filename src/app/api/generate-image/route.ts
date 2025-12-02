/**
 * Nano Banana Image Generation API
 * 
 * Phase 2 of split API to avoid Vercel 30s timeout.
 * This endpoint takes the analysis result and generates the actual image.
 * Takes ~15 seconds.
 * 
 * Requires: analysis result from /api/analyze
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreditsManager } from '@/lib/credits'
import { supabase } from '@/lib/supabase'
import { GoogleGenAI } from '@google/genai'
import { readFile } from 'fs/promises'
import { extname } from 'path'

// Signature style for consistent cinematic look
const SIGNATURE_STYLE = `Cinematic Omani aesthetic, warm golden hour lighting with rich deep shadows, earthy desaturated color palette with traditional Omani color accents (indigo, burgundy, gold), medium format film photography look, shallow depth of field, dramatic side lighting, photorealistic, high quality.`

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
 * Get MIME type from file path
 */
function getMimeType(filepath: string): string {
  const ext = extname(filepath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
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
    
    // Credits check (double-check before generation)
    const userCredits = await CreditsManager.getUserCredits(userId)
    if (userCredits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }
    
    const { analysis, selectedImages, aspectRatio, prompt } = await request.json()
    
    if (!analysis || !prompt) {
      return NextResponse.json({ error: 'Analysis result and prompt are required' }, { status: 400 })
    }
    
    const analysisResult = analysis as AnalysisResult
    const images = (selectedImages || []) as SelectedImageWithInstruction[]
    const ratio = aspectRatio || '1:1'
    
    console.log('🎨 [GENERATE-IMAGE] Starting generation...')
    console.log('📐 Aspect ratio:', ratio)
    console.log('📎 Reference images:', images.length)
    
    // Build master prompt
    let masterPrompt = ''
    
    if (analysisResult.subject_description) {
      masterPrompt = `Generate a photorealistic image with the following specifications:

=== SUBJECT ===
${analysisResult.subject_description}

=== SCENE ===
${analysisResult.scene_description}
`
      
      // Add reference image instructions
      if (images.length > 0) {
        masterPrompt += `\n=== CLOTHING REFERENCES (Use these EXACTLY as instructed) ===\n`
        images.forEach((img, index) => {
          masterPrompt += `\n[REFERENCE IMAGE ${index + 1}]\n`
          masterPrompt += `${img.instruction}\n`
        })
      }
      
      masterPrompt += `\n=== STYLE ===\n${analysisResult.style_notes}\n\n${SIGNATURE_STYLE}`
    } else {
      // Fallback
      masterPrompt = `${prompt}\n\n${SIGNATURE_STYLE}`
    }
    
    console.log('📝 Master prompt built')
    
    // Build content parts (prompt + reference images)
    type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } }
    const parts: ContentPart[] = [{ text: masterPrompt }]
    
    // Add reference images
    for (const img of images) {
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
    
    // Generate with Gemini 2.5 Flash Image
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    
    console.log('🍌 Calling Razza ...')
    
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-image',
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          aspectRatio: ratio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
        },
      },
      contents: [{ role: 'user', parts }],
    })
    
    // Collect image from stream
    let imageBase64: string | undefined
    
    for await (const chunk of response) {
      const chunkParts = chunk.candidates?.[0]?.content?.parts
      if (chunkParts) {
        for (const part of chunkParts) {
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
    
    const imageUrl = `data:image/png;base64,${imageBase64}`
    
    // Save to database
    try {
      const { error: dbError } = await supabase
        .from('user_generations')
        .insert({
          user_id: userId,
          prompt: prompt,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Failed to save generation:', dbError)
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
    }
    
    // Deduct credits
    const deductSuccess = await CreditsManager.deductCredits(userId, 1)
    if (!deductSuccess) {
      console.warn('Failed to deduct credits')
    }
    
    // Get remaining credits
    const remainingCredits = await CreditsManager.getUserCredits(userId)
    
    const generationTime = Date.now() - startTime
    console.log(`✅ [GENERATE-IMAGE] Completed in ${generationTime}ms`)
    
    // Build enhanced prompt for display
    const enhancedPrompt = analysisResult.subject_description 
      ? `${analysisResult.subject_description}. ${analysisResult.scene_description}`
      : prompt
    
    return NextResponse.json({
      success: true,
      imageUrl,
      enhancedPrompt,
      remainingCredits,
      componentsUsed: images.map(i => i.filename),
      model: 'nano',
      generationTime
    })
    
  } catch (error) {
    console.error('❌ [GENERATE-IMAGE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    )
  }
}
