import Replicate from 'replicate'
import { TranslationService } from './translation'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Flux model version (from omani-simple)
const FLUX_MODEL_VERSION = '428aa12661bfddd60ccb1ee98f5e645c0245d8469796db1a7779994bbc1a8e13'

export interface FluxOptions {
  aspectRatio?: string
  customWidth?: number
  customHeight?: number
  mode?: 'quality' | 'fast'
  outputFormat?: 'webp' | 'png' | 'jpg'
}

export interface FluxResult {
  success: boolean
  imageUrl?: string
  enhancedPrompt?: string
  error?: string
}

export class FluxService {
  /**
   * Generate an image using Flux via Replicate
   * Great for: portraits, single person shots, mussar details
   * Not as good for: khanjar (dagger) details
   */
  static async generate(
    userPrompt: string,
    options: FluxOptions = {}
  ): Promise<FluxResult> {
    try {
      console.log('🎨 Taif: Starting generation...')
      console.log('📝 User prompt:', userPrompt)

      // Step 1: Translate and enhance the prompt using TranslationService
      const enhancedPrompt = await TranslationService.translateAndEnhance(userPrompt)
      console.log('✨ Enhanced prompt:', enhancedPrompt)

      // Step 2: Handle aspect ratio (exactly like omani-simple)
      let aspect_ratio = options.aspectRatio || "1:1";
      if (aspect_ratio === "custom" && options.customWidth && options.customHeight) {
        aspect_ratio = `${options.customWidth}:${options.customHeight}`;
      }

      // Step 3: Determine inference steps based on speed mode (exactly like omani-simple)
      const go_fast = options.mode === "fast";
      const num_inference_steps = go_fast ? 14 : 28;

      // Step 4: Output format
      const output_format = options.outputFormat || "webp";

      console.log('⚙️ Taif settings:', {
        aspect_ratio,
        num_inference_steps,
        output_format,
        go_fast
      })

      // Step 5: Call Replicate API using predictions.create (exactly like omani-simple)
      const prediction = await replicate.predictions.create({
        version: FLUX_MODEL_VERSION,
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
          output_quality: 100,
          prompt_strength: 0.8,
          extra_lora_scale: 1,
          num_inference_steps,
        },
      })

      // Wait for completion (exactly like omani-simple)
      let result = prediction
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        result = await replicate.predictions.get(prediction.id)
      }

      if (result.status === 'failed') {
        return {
          success: false,
          error: 'Image generation failed'
        }
      }

      const imageUrl = result.output?.[0] || result.output

      if (!imageUrl) {
        return {
          success: false,
          error: 'No image URL returned from Taif'
        }
      }

      console.log('✅ Taif: Generation complete')
      console.log('🖼️ Image URL:', imageUrl)

      return {
        success: true,
        imageUrl: imageUrl as string,
        enhancedPrompt
      }

    } catch (error) {
      console.error('❌ Taif generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
