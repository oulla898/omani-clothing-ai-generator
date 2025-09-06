import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { CreditsManager } from '@/lib/credits'
import { TranslationService } from '@/lib/translation'
import { supabase } from '@/lib/supabase'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check credits
    const userCredits = await CreditsManager.getUserCredits(userId)
    if (userCredits <= 0) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        success: false 
      }, { status: 400 })
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt is required',
        success: false 
      }, { status: 400 })
    }

    // Translate and enhance the prompt
    const enhancedPrompt = await TranslationService.translateAndEnhance(prompt)
    console.log('Enhanced prompt:', enhancedPrompt)

    // Generate image with Replicate
    const prediction = await replicate.predictions.create({
      version: '16fe80f481f289b423395181cb81f78a3e88018962e689157dcfeba15f149e2a',
      input: {
        prompt: enhancedPrompt,
        model: "dev",
        go_fast: false,
        lora_scale: 1,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        guidance_scale: 3,
        output_quality: 80,
        prompt_strength: 0.8,
        extra_lora_scale: 1,
        num_inference_steps: 28,
      },
    })

    // Wait for completion
    let result = prediction
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      result = await replicate.predictions.get(prediction.id)
    }

    if (result.status === 'failed') {
      return NextResponse.json({ 
        error: 'Image generation failed',
        success: false 
      }, { status: 500 })
    }

    const imageUrl = result.output?.[0] || result.output

    // Save generation to database
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
        console.error('Failed to save generation to database:', dbError)
      }
    } catch (dbError) {
      console.error('Database save error:', dbError)
    }

    // Deduct credits
    const deductSuccess = await CreditsManager.deductCredits(userId, 1)
    if (!deductSuccess) {
      console.warn('Failed to deduct credits after successful generation')
    }

    // Get remaining credits
    const remainingCredits = await CreditsManager.getUserCredits(userId)

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      enhancedPrompt: enhancedPrompt,
      remainingCredits
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}
