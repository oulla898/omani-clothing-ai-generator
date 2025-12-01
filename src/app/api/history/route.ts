import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's generation history
    const { data: generations, error } = await supabase
      .from('user_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('History fetch error:', error)
      return Response.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    return Response.json({ 
      generations: generations || [],
      total: generations?.length || 0
    })

  } catch (error) {
    console.error('History API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
