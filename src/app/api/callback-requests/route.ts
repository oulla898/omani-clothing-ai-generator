import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contact, notes, userId, package: packageInfo } = body

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact is required' },
        { status: 400 }
      )
    }

    // Store callback request in database
    const { data, error } = await supabase
      .from('callback_requests')
      .insert([
        {
          contact,
          notes: notes || null,
          user_id: userId,
          package_credits: packageInfo?.credits || null,
          package_price: packageInfo?.omr || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error storing callback request:', error)
      return NextResponse.json(
        { error: 'Failed to store callback request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error processing callback request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
