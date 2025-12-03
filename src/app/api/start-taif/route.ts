import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { TranslationService } from '@/lib/translation'
import { CreditsManager } from '@/lib/credits'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const FLUX_MODEL_VERSION = '428aa12661bfddd60ccb1ee98f5e645c0245d8469796db1a7779994bbc1a8e13'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (same pattern as generate endpoint)
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { verifyToken } = await import('@clerk/backend')
        const verified = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!
        })
        userId = verified.sub
        console.log('✅ [START-TAIF] Bearer token verified:', userId)
      } catch (error) {
        console.error('❌ Bearer token verification failed:', error)
      }
    }

    if (!userId) {
      const authResult = await auth()
      userId = authResult.userId
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Check credits first
    const userCredits = await CreditsManager.getUserCredits(userId)
    if (userCredits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits', success: false }, { status: 400 })
    }

    const body = await request.json()
    const { prompt, aspectRatio = '1:1', mode = 'quality' } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log('🚀 [START-TAIF] Starting async generation...')
    console.log('📝 User prompt:', prompt)

    // Step 1: Enhance prompt with Gemini (fast, ~1-2s)
    const enhancedPrompt = await TranslationService.translateAndEnhance(prompt)
    console.log('✨ Enhanced prompt:', enhancedPrompt)

    // Step 2: Calculate settings
    const go_fast = mode === 'fast'
    const num_inference_steps = go_fast ? 14 : 28

    // Step 3: Get webhook URL (production URL)
    const webhookUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/webhook/replicate`
      : process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/replicate`
        : null

    console.log('🔗 Webhook URL:', webhookUrl || 'none (will use polling)')

    // Step 4: Start prediction (returns immediately!)
    const prediction = await replicate.predictions.create({
      version: FLUX_MODEL_VERSION,
      input: {
        prompt: enhancedPrompt,
        model: 'dev',
        go_fast,
        lora_scale: 1,
        megapixels: '1',
        num_outputs: 1,
        aspect_ratio: aspectRatio,
        output_format: 'webp',
        guidance_scale: 3,
        output_quality: 100,
        prompt_strength: 0.8,
        extra_lora_scale: 1,
        num_inference_steps,
      },
      // Add webhook if available
      ...(webhookUrl && {
        webhook: `${webhookUrl}?userId=${userId}&prompt=${encodeURIComponent(prompt)}`,
        webhook_events_filter: ['completed'],
      }),
    })

    console.log('✅ [START-TAIF] Prediction started:', prediction.id)
    console.log('📊 Status:', prediction.status)

    return NextResponse.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status,
      enhancedPrompt,
      message: 'Generation started! Polling for progress...'
    })

  } catch (error) {
    console.error('❌ [START-TAIF] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start generation' },
      { status: 500 }
    )
  }
}
