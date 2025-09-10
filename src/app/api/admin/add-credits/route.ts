import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, credits, paymentMethod, amount, adminKey } = await request.json();

    // Simple admin authentication - replace with proper auth in production
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userId || !credits || credits <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Add credits to user
    const { data: userData, error: userError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const newCredits = userData.credits + credits;

    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: newCredits })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    // Log the credit addition for audit trail
    const { error: logError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: credits,
        payment_method: paymentMethod || 'whatsapp_bank_transfer',
        payment_amount: amount,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log transaction:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${credits} credits to user ${userId}`,
      newBalance: newCredits
    });

  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
