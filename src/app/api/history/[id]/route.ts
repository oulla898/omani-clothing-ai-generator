import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimiters } from '@/lib/rateLimit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting for delete operations
    const rateLimitResult = await new Promise<boolean>((resolve) => {
      rateLimiters.general(request as any, {
        status: (code: number) => ({
          json: (data: any) => {
            resolve(false);
            return NextResponse.json(data, { status: code });
          }
        }),
        setHeader: () => {},
      } as any, () => resolve(true));
    });

    if (!rateLimitResult) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded for delete operations.',
        retryAfter: 60 // 1 minute
      }, { status: 429 });
    }

    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const imageId = params.id

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    // Delete the generation record (only if it belongs to the user)
    const { error } = await supabase
      .from('user_generations')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId) // Security: only delete own images

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
