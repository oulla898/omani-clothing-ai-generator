import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { CreditsManager } from '@/lib/credits'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('🔍 Auth header present?', !!authHeader)
    console.log('🔍 Auth header preview:', authHeader ? authHeader.substring(0, 30) + '...' : 'NONE')
    
    const { userId } = await auth()
    console.log('🔍 Clerk userId from auth():', userId || 'NULL')
    console.log('🔍 CLERK_SECRET_KEY set?', !!process.env.CLERK_SECRET_KEY)
    console.log('🔍 CLERK_SECRET_KEY prefix:', process.env.CLERK_SECRET_KEY?.substring(0, 10))
    
    if (!userId) {
      console.error('❌ No userId - returning 401')
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
