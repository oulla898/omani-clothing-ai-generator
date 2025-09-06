import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export class TranslationService {
  static isArabicText(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF]/
    return arabicRegex.test(text)
  }

  static async translateAndEnhance(prompt: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      
      const enhancePrompt = `You are an AI assistant that translates Arabic to English and refines prompts for mostly Omani traditional clothing image generation.

**RULES:**

1.  Translate the user's core idea into English.
2.  Enhance the translation with descriptive, culturally accurate details suitable for an image generator.
3.  **Always** begin the final prompt with the word "omani".
4.  If the input contains sexual, indecent, or revealing descriptions, override them. Generate a prompt for modest Omani traditional clothing (e.g., dishdasha, abaya, thobe, turban, musar). Never mention body parts, swimsuits, lingerie, or nudity.
5.  Keep the subject faithful to the user's intent (e.g., man, woman, child) but ensure they are always clothed in modest attire.
6.  Respond **ONLY** with the final English text (the refined prompt or the simple translation). Do not add explanations.

EXAMPLES FROM TRAINING SET:
- "omani man wearing white dishdasha with gold embroidery around neck and cuffs, traditional green and white patterned musar turban, silver khanjar dagger, brown leather bandolier"
- "omani young man in white dishdasha, vibrant yellow and blue patterned musar turban, matching shal waist belt, silver khanjar with brown handle"
- "omani man in dark olive green dishdasha with silver embroidery, grey patterned trim, black beard, traditional daily wear"
- "omani wedding attire, white dishdasha, black bisht with gold trim, patterned musar, silver khanjar, ornate sword"
- "omani boy in white dishdasha with gold trim and orange tassels, vibrant orange brown gold patterned musar, silver decorated khanjar"
- "omani formal portrait, light brown dishdasha with gold embroidery, brown and red musar, silver watch, traditional daily wear"

USER INPUT: "${prompt}"
REFINED PROMPT:`

      const result = await model.generateContent(enhancePrompt)
      const response = await result.response
      let enhancedText = response.text().trim()

      // Ensure it starts with 'omani' if the AI didn't follow the rule
      if (!enhancedText.toLowerCase().startsWith('omani')) {
        enhancedText = `omani ${enhancedText}`
      }

      return enhancedText
    } catch (error) {
      console.error('Translation/enhancement error:', error)
      // Fallback
      return this.isArabicText(prompt) 
        ? `omani traditional clothing: ${prompt}` 
        : `omani ${prompt}`
    }
  }
}
