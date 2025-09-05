import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  if (userId) {
    // User is already signed in, redirect back to home
    return Response.redirect(new URL('/', request.url))
  }
  
  // Redirect to Clerk's hosted sign-in page
  const signInUrl = `${process.env.CLERK_SIGN_IN_URL || 'https://accounts.clerk.dev/sign-in'}?redirect_url=${encodeURIComponent(new URL('/', request.url).toString())}`
  return Response.redirect(signInUrl)
}
