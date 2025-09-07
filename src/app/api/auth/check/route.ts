import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    return NextResponse.json({ 
      authenticated: !!userId,
      userId: userId || null 
    })
  } catch {
    return NextResponse.json({ 
      authenticated: false,
      userId: null 
    })
  }
}

export async function POST(request: NextRequest) {
  const { action } = await request.json()
  
  if (action === 'signin') {
    // Redirect to Clerk sign-in
    return NextResponse.redirect('/sign-in')
  }
  
  if (action === 'signout') {
    // Handle sign out
    return NextResponse.json({ success: true })
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
