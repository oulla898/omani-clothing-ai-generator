import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { TranslationService } from '@/lib/translation'
import { NotificationService } from '@/lib/notificationService'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt is required',
        success: false 
      }, { status: 400 })
    }

    // Quickly translate/enhance prompt and check for notifications in parallel
    const [enhancedPrompt, notification] = await Promise.all([
      TranslationService.translateAndEnhance(prompt),
      NotificationService.checkPrompt(prompt)
    ])
    
    console.log('Enhanced prompt:', enhancedPrompt)
    if (notification) {
      console.log('User notification:', notification)
    }

    return NextResponse.json({
      success: true,
      enhancedPrompt: enhancedPrompt,
      notification: notification
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}
