import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CreditsManager } from '@/lib/credits'

/**
 * Webhook endpoint for Replicate predictions
 * Called when a prediction completes (succeeded/failed/canceled)
 * 
 * This is a backup in case the user closes the tab before polling completes
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [WEBHOOK] Received Replicate webhook')

    // Get query params (userId and prompt passed when creating prediction)
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const prompt = url.searchParams.get('prompt') || 'Taif generation'

    if (!userId) {
      console.error('❌ [WEBHOOK] No userId in webhook URL')
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Parse webhook body
    const prediction = await request.json()

    console.log('📊 [WEBHOOK] Prediction ID:', prediction.id)
    console.log('📊 [WEBHOOK] Status:', prediction.status)

    // Only process completed predictions
    if (prediction.status !== 'succeeded') {
      console.log('⏭️ [WEBHOOK] Ignoring non-success status:', prediction.status)
      return NextResponse.json({ received: true })
    }

    const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output

    if (!imageUrl) {
      console.error('❌ [WEBHOOK] No image URL in output')
      return NextResponse.json({ error: 'No image URL' }, { status: 400 })
    }

    console.log('🖼️ [WEBHOOK] Image URL:', imageUrl)

    // Check if this prediction was already saved (by polling)
    const { data: existing } = await supabase
      .from('user_generations')
      .select('id')
      .eq('user_id', userId)
      .eq('image_url', imageUrl)
      .single()

    if (existing) {
      console.log('⏭️ [WEBHOOK] Already saved by polling, skipping')
      return NextResponse.json({ received: true, alreadySaved: true })
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('user_generations')
      .insert({
        user_id: userId,
        prompt: decodeURIComponent(prompt),
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('❌ [WEBHOOK] Failed to save:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('✅ [WEBHOOK] Saved to database')

    // Deduct credits (if not already deducted by polling)
    await CreditsManager.deductCredits(userId, 1)
    console.log('💰 [WEBHOOK] Credits deducted')

    return NextResponse.json({ 
      received: true, 
      saved: true,
      imageUrl 
    })

  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Also handle GET for webhook verification (some services ping with GET)
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
