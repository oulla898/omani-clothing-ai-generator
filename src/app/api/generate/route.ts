import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { CreditsManager } from '@/lib/credits'
import { TranslationService } from '@/lib/translation'
import { supabase } from '@/lib/supabase'
import { imageGenerationLimiter } from '@/lib/rateLimiter'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

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

    // Translate/enhance prompt
    const enhancedPrompt = await TranslationService.translateAndEnhance(prompt)
    
    console.log('Enhanced prompt:', enhancedPrompt)

    // Advanced options logic
    let aspect_ratio = options?.aspectRatio || "1:1";
    if (aspect_ratio === "custom" && options?.customWidth && options?.customHeight) {
      aspect_ratio = `${options.customWidth}:${options.customHeight}`;
    }
    const go_fast = options?.mode === "fast";
    const num_inference_steps = go_fast ? 14 : 28;
    const output_format = options?.outputFormat || "webp";

    // Generate image with Replicate
    const prediction = await replicate.predictions.create({
      version: '16fe80f481f289b423395181cb81f78a3e88018962e689157dcfeba15f149e2a',
      input: {
        prompt: enhancedPrompt,
        model: "dev",
        go_fast,
        lora_scale: 1,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio,
        output_format,
        guidance_scale: 3,
        output_quality: 80,
        prompt_strength: 0.8,
        extra_lora_scale: 1,
        num_inference_steps,
      },
    })

    // Wait for completion
    let result = prediction
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      result = await replicate.predictions.get(prediction.id)
    }

    if (result.status === 'failed') {
      return NextResponse.json({ 
        error: 'Image generation failed',
        success: false 
      }, { status: 500 })
    }

    const imageUrl = result.output?.[0] || result.output

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
      remainingCredits
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
