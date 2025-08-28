import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreditManager } from '@/lib/credits'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses.find((email: any) => email.id === user.primaryEmailAddressId)?.emailAddress
    
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    console.log('Getting credits for email:', userEmail)
    const credits = await CreditManager.getUserCredits(userEmail)
    
    return NextResponse.json({ credits })
  } catch (error) {
    console.error('Error getting credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses.find((email: any) => email.id === user.primaryEmailAddressId)?.emailAddress
    
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const { action, amount, description } = await request.json()

    if (!action || !amount) {
      return NextResponse.json({ error: 'Action and amount are required' }, { status: 400 })
    }

    let success = false

    console.log(`${action} ${amount} credits for email:`, userEmail)

    if (action === 'deduct') {
      success = await CreditManager.deductCredits(userEmail, amount, description)
    } else if (action === 'add') {
      success = await CreditManager.addCredits(userEmail, amount, description)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!success && action === 'deduct') {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
    }

    const newCredits = await CreditManager.getUserCredits(userEmail)
    
    return NextResponse.json({ credits: newCredits, success: true })
  } catch (error) {
    console.error('Error updating credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
