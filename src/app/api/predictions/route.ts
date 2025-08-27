import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Create prediction with Replicate
    const prediction = await replicate.predictions.create({
      version: '16fe80f481f289b423395181cb81f78a3e88018962e689157dcfeba15f149e2a',
      input: {
        prompt: `omani, ${prompt}`,
        model: "dev",
        go_fast: false,
        lora_scale: 1,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        guidance_scale: 3,
        output_quality: 80,
        prompt_strength: 0.8,
        extra_lora_scale: 1,
        num_inference_steps: 28,
      },
    })

    // Wait for the prediction to complete
    let completedPrediction = prediction
    while (completedPrediction.status !== 'succeeded' && completedPrediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      completedPrediction = await replicate.predictions.get(prediction.id)
    }

    if (completedPrediction.status === 'failed') {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
    }

    return NextResponse.json({
      id: completedPrediction.id,
      output: completedPrediction.output,
      status: completedPrediction.status,
    })

  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
