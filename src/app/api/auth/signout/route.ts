  import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST() {
  const { userId, sessionId } = await auth()
  
  if (!userId || !sessionId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    // Revoke the session
    const client = await clerkClient()
    await client.sessions.revokeSession(sessionId)
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Sign out error:', error)
    return Response.json({ error: 'Sign out failed' }, { status: 500 })
  }
}
