import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreditsManager } from '@/lib/credits'
import { supabase } from '@/lib/supabase'
import { imageGenerationLimiter } from '@/lib/rateLimiter'
import { NanoBananaService } from '@/lib/nano-banana'
import { FluxService } from '@/lib/flux-service'

// Model types
type ModelType = 'nano' | 'flux'

export async function POST(request: NextRequest) {
  try {
    // Enhanced logging for debugging
    const cookies = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    console.log('Request cookies:', cookies ? 'present' : 'missing');
    console.log('Auth header:', authHeader ? 'present' : 'missing');

    let userId: string | null = null;
    let sessionId: string | null = null;

    // Try Bearer token first (more reliable for cookie issues)
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { verifyToken } = await import('@clerk/backend');
        const verified = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!
        });
        userId = verified.sub;
        console.log('✅ Bearer token verified:', userId);
      } catch (error) {
        console.error('❌ Bearer token verification failed:', error);
      }
    }

    // Fallback to cookie-based auth if no Bearer token or verification failed
    if (!userId) {
      const authResult = await auth();
      userId = authResult.userId;
      sessionId = authResult.sessionId;
      console.log('Cookie auth result:', { userId, sessionId });

      if (!userId) {
        // Wait 500ms and retry once in case of session propagation delay
        console.log('No userId found, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryAuth = await auth();
        userId = retryAuth.userId;
        sessionId = retryAuth.sessionId;
        console.log('Retry auth result:', { userId, sessionId });
        
        if (!userId) {
          console.error('No userId found even after retry');
          return NextResponse.json(
            { 
              error: 'Session not ready', 
              code: 'AUTH_PENDING',
              retry: true,
              message: 'Please wait a moment and try again'
            }, 
            { status: 401 }
          );
        }
      }
    }

    // Check rate limit
    const rateLimitCheck = imageGenerationLimiter.check(userId)
    if (!rateLimitCheck.allowed) {
      const waitTime = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
      return NextResponse.json({ 
        error: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
        success: false,
        rateLimitExceeded: true,
        waitTime: waitTime
      }, { status: 429 })
    }

    // Check credits
    const userCredits = await CreditsManager.getUserCredits(userId)
    if (userCredits <= 0) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        success: false 
      }, { status: 400 })
    }

    const { prompt, options } = await request.json()

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt is required',
        success: false 
      }, { status: 400 })
    }

    // Determine which model to use (default: nano)
    const selectedModel: ModelType = options?.model === 'flux' ? 'flux' : 'nano'
    
    // Map aspect ratio from frontend format
    const aspectRatioMap: { [key: string]: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' } = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:4': '3:4'
    }
    const aspectRatio = aspectRatioMap[options?.aspectRatio] || '1:1'

    let imageUrl: string
    let enhancedPrompt: string = prompt
    let componentsUsed: string[] | undefined

    if (selectedModel === 'flux') {
      // ═══════════════════════════════════════════════════════════════
      // 🎨 TAIF MODEL - Great for portraits, single person, mussar
      // ═══════════════════════════════════════════════════════════════
      console.log('🎨 Generating with Taif...')
      console.log('📝 User prompt:', prompt)
      
      const fluxResult = await FluxService.generate(prompt, {
        aspectRatio: aspectRatio,
        mode: options?.goFast ? 'fast' : 'quality',
        outputFormat: options?.outputFormat || 'webp'
      })

      if (!fluxResult.success || !fluxResult.imageUrl) {
        console.error('❌ Taif generation failed:', fluxResult.error)
        return NextResponse.json({ 
          error: fluxResult.error || 'Image generation failed',
          success: false 
        }, { status: 500 })
      }

      imageUrl = fluxResult.imageUrl
      enhancedPrompt = fluxResult.enhancedPrompt || prompt

    } else {
      // ═══════════════════════════════════════════════════════════════
      // 🍌 RAZZA MODEL - Great for most things, especially khanjar
      // ═══════════════════════════════════════════════════════════════
      console.log('🍌 Generating with Razza...')
      console.log('📝 User prompt:', prompt)
      
      const nanoResult = await NanoBananaService.generate(prompt, {
        useComponentImages: options?.useComponentImages ?? true,
        aspectRatio: aspectRatio
      })
      
      if (!nanoResult.success || !nanoResult.imageBase64) {
        console.error('❌ Razza generation failed:', nanoResult.error)
        return NextResponse.json({ 
          error: nanoResult.error || 'Image generation failed',
          success: false 
        }, { status: 500 })
      }

      imageUrl = `data:image/png;base64,${nanoResult.imageBase64}`
      enhancedPrompt = nanoResult.enhancedPrompt || prompt
      componentsUsed = nanoResult.componentsUsed
    }

    // Save generation to database
    try {
      const { error: dbError } = await supabase
        .from('user_generations')
        .insert({
          user_id: userId,
          prompt: prompt,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Failed to save generation to database:', dbError)
      } else {
        console.log('📊 Generation saved successfully')
      }
    } catch (dbError) {
      console.error('Database save error:', dbError)
    }

    // Deduct credits
    const deductSuccess = await CreditsManager.deductCredits(userId, 1)
    if (!deductSuccess) {
      console.warn('Failed to deduct credits after successful generation')
    }

    // Get remaining credits
    const remainingCredits = await CreditsManager.getUserCredits(userId)

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      enhancedPrompt: enhancedPrompt,
      remainingCredits,
      componentsUsed,
      model: selectedModel
    })

  } catch (error) {
    console.error('Generation error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('auth')) {
        errorMessage = 'Authentication failed';
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded';
        statusCode = 429;
      } else if (error.message.includes('credits')) {
        errorMessage = 'Insufficient credits';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    )
  }
}
