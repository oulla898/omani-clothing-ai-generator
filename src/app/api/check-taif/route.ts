import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreditsManager } from '@/lib/credits'
import { supabase } from '@/lib/supabase'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    const body = await request.json()
    const { predictionId, prompt } = body

    if (!predictionId) {
      return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 })
    }

    console.log('🔍 [CHECK-TAIF] Checking prediction:', predictionId)

    // Get prediction status from Replicate
    const prediction = await replicate.predictions.get(predictionId)

    console.log('📊 [CHECK-TAIF] Status:', prediction.status)

    // Calculate progress percentage based on status
    let progress = 0
    let progressMessage = ''
    
    switch (prediction.status) {
      case 'starting':
        progress = 10
        progressMessage = 'Starting GPU...'
        break
      case 'processing':
        // Estimate progress based on logs if available
        progress = 50
        progressMessage = 'Generating image...'
        // Try to parse progress from logs
        if (prediction.logs) {
          const match = prediction.logs.match(/(\d+)%/)
          if (match) {
            progress = Math.min(90, parseInt(match[1]))
          }
        }
        break
      case 'succeeded':
        progress = 100
        progressMessage = 'Complete!'
        break
      case 'failed':
        progress = 0
        progressMessage = 'Generation failed'
        break
      case 'canceled':
        progress = 0
        progressMessage = 'Canceled'
        break
      default:
        progress = 5
        progressMessage = 'Queued...'
    }

    // If completed successfully, save to DB and deduct credits
    if (prediction.status === 'succeeded' && prediction.output) {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output

      console.log('✅ [CHECK-TAIF] Generation complete, saving...')
      console.log('🖼️ Image URL:', imageUrl)

      // Save to database
      try {
        const { error: dbError } = await supabase
          .from('user_generations')
          .insert({
            user_id: userId,
            prompt: prompt || 'Taif generation',
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (dbError) {
          console.error('Failed to save generation:', dbError)
        } else {
          console.log('📊 Generation saved to database')
        }
      } catch (dbError) {
        console.error('Database save error:', dbError)
      }

      // Deduct credits
      const deductSuccess = await CreditsManager.deductCredits(userId, 1)
      if (!deductSuccess) {
        console.warn('Failed to deduct credits')
      }

      const remainingCredits = await CreditsManager.getUserCredits(userId)

      return NextResponse.json({
        success: true,
        status: 'succeeded',
        progress: 100,
        progressMessage: 'Complete!',
        imageUrl,
        remainingCredits
      })
    }

    // If failed
    if (prediction.status === 'failed') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        progress: 0,
        progressMessage: 'Generation failed',
        error: prediction.error || 'Unknown error'
      })
    }

    // Still processing
    return NextResponse.json({
      success: true,
      status: prediction.status,
      progress,
      progressMessage,
      logs: prediction.logs?.slice(-200) // Last 200 chars of logs
    })

  } catch (error) {
    console.error('❌ [CHECK-TAIF] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
}
