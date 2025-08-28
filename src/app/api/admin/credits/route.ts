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

    // Simple admin check - in production, implement proper role-based access
    // You can use Clerk's organization features or custom metadata for this
    // For now, we'll check if it's a specific admin email
    // Note: You'll need to get the user's email from Clerk to check admin status
    
    const users = await CreditManager.getAllUsersCredits()
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error getting all users credits:', error)
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

    // Simple admin check - in production, implement proper role-based access
    // For now, we'll allow the admin functionality
    
    const { targetUserId, action, amount, description } = await request.json()

    if (!targetUserId || !action || !amount) {
      return NextResponse.json({ 
        error: 'Target user ID, action, and amount are required' 
      }, { status: 400 })
    }

    let success = false

    if (action === 'add') {
      success = await CreditManager.addCredits(
        targetUserId, 
        amount, 
        description || `Admin credit addition by ${userId}`
      )
    } else if (action === 'deduct') {
      success = await CreditManager.deductCredits(
        targetUserId, 
        amount, 
        description || `Admin credit deduction by ${userId}`
      )
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!success && action === 'deduct') {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
    }

    const newCredits = await CreditManager.getUserCredits(targetUserId)
    
    return NextResponse.json({ credits: newCredits, success: true })
  } catch (error) {
    console.error('Error updating user credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
