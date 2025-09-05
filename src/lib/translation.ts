import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export class TranslationService {
  static isArabicText(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF]/
    return arabicRegex.test(text)
  }

  static async translateAndEnhance(prompt: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      
      const enhancePrompt = this.isArabicText(prompt)
        ? `Translate this Arabic description to English and enhance it for AI image generation of traditional Omani clothing. Focus on details like colors, patterns, fabrics, and traditional elements. Keep it concise but descriptive: "${prompt}"`
        : `Enhance this English description for AI image generation of traditional Omani clothing. Add relevant details about traditional Omani styles, colors, and patterns: "${prompt}"`

      const result = await model.generateContent(enhancePrompt)
      const response = await result.response
      let enhancedText = response.text().trim()

      // Ensure it mentions Omani traditional clothing
      if (!enhancedText.toLowerCase().includes('omani')) {
        enhancedText = `Traditional Omani ${enhancedText}`
      }

      return enhancedText
    } catch (error) {
      console.error('Translation/enhancement error:', error)
      // Fallback
      return this.isArabicText(prompt) 
        ? `Traditional Omani clothing: ${prompt}` 
        : `Traditional Omani ${prompt}`
    }
  }
}
