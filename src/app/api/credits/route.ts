import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { CreditsManager } from '@/lib/credits'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const credits = await CreditsManager.getUserCredits(userId)
    
    return NextResponse.json({ credits })
  } catch (error) {
    console.error('Error getting credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
