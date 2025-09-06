import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
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

    // Get notification immediately
    const notification = await NotificationService.checkPrompt(prompt)
    
    return NextResponse.json({
      success: true,
      notification: notification
    })

  } catch (error) {
    console.error('Notification check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}
