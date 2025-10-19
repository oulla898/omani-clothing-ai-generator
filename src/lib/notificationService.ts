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

Examples of when to give fun, playful feedback:
- User asks for animals: '🐪 نحن للأزياء وليس الحيوانات!' (Arabic)
- User asks for women/females: '👔 متخصصون في الأزياء الرجالية فقط!' (Arabic)
- User asks for family with women: '🧔 رجال فقط! لا نساء حالياً' (Arabic)
- User asks for couples: 'عريس فقط! العروسة لاحقاً 😊' (Arabic)
- User asks for group : 'مجموعة رجال فقط اليوم! 🎩' (Arabic)
- User asks for cars: '🚗 Cars? We do dishdashas!' (English)
- User asks for food: '🍽️ نطرز دشاديش مو نطبخ!' (Arabic)
- User asks for buildings: '🏛️ نصمم أزياء مو عمارات!' (Arabic)
- User asks for inappropriate content: 'الملابس التقليدية أجمل! 👌' (Arabic)

IMPORTANT: If the prompt mentions women, girls, females, family (عائلة), couples (ثنائي/زوجين), mixed groups, or "boy and girl" together, redirect them to men-only content with a fun message.

Be creative, fun, and use emojis! Match their language and keep the energy positive.

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
