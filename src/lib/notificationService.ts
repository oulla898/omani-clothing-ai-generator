import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export class NotificationService {
  static async checkPrompt(prompt: string): Promise<string | null> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      
      const checkPrompt = `You're a friendly AI assistant for an Omani traditional clothing generator. The user just submitted this prompt for image generation:

'${prompt}'

If this prompt is perfect for generating Omani men's traditional clothing (dishdasha, bisht, khanjar, musar, etc.), just respond with: GOOD

If the prompt needs a gentle redirect, respond with a fun, friendly message in the SAME LANGUAGE as the user's prompt. Keep it to 6 words maximum and be playful about it. 

Examples of when to give feedback:
- User asks for animals: 'نحن خبراء في الأزياء العمانية!' (Arabic)
- User asks for women: 'متخصصون في الأزياء الرجالية حالياً!' (Arabic)  
- User asks for cars: 'We do traditional clothing, not cars!' (English)
- User asks for inappropriate content: 'الملابس التقليدية أجمل وأفضل!' (Arabic)

Be creative, fun, and helpful! Match their language and energy.

USER PROMPT: ${prompt}
YOUR RESPONSE:`

      const result = await model.generateContent(checkPrompt)
      const response = await result.response
      const feedback = response.text().trim()

      // If Gemini says "GOOD", no notification needed
      if (feedback === 'GOOD' || feedback.toLowerCase() === 'good') {
        return null
      }

      return feedback
    } catch (error) {
      console.error('Notification check error:', error)
      return null // Don't show notification if service fails
    }
  }
}
