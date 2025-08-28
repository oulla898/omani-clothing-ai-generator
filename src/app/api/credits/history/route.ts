import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreditManager } from '@/lib/credits'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const history = await CreditManager.getCreditHistory(userId, limit)
    
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error getting credit history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
