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

    const credits = await CreditManager.getUserCredits(userId)
    
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

    const { action, amount, description } = await request.json()

    if (!action || !amount) {
      return NextResponse.json({ error: 'Action and amount are required' }, { status: 400 })
    }

    let success = false

    if (action === 'deduct') {
      success = await CreditManager.deductCredits(userId, amount, description)
    } else if (action === 'add') {
      success = await CreditManager.addCredits(userId, amount, description)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!success && action === 'deduct') {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
    }

    const newCredits = await CreditManager.getUserCredits(userId)
    
    return NextResponse.json({ credits: newCredits, success: true })
  } catch (error) {
    console.error('Error updating credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
