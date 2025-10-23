import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export class TranslationService {
  static isArabicText(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF]/
    return arabicRegex.test(text)
  }

  static async translateAndEnhance(prompt: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' })
      
      const enhancePrompt = `You are an AI assistant that translates Arabic to English and refines prompts for mostly Omani traditional clothing image generation.

**RULES:**

1.  Translate the user's core idea into English.
2.  Enhance the translation with descriptive, culturally accurate details suitable for an image generator.
3.  **Always** begin the final prompt with the word "omani".
4.  If the input contains sexual, indecent, or revealing descriptions, override them. Generate a prompt for modest Omani traditional clothing (e.g., dishdasha (only for men), Never mention khanjar. Default to single man portrait. abaya is (only for women, just like hijab), thobe (same as dishdasha), turban (only for men), musar (only for men)). NEVER mention body parts, swimsuits, lingerie, or nudity.
5.  Keep the subject faithful to the user's intent (e.g., man, woman, child) but ensure they are always clothed in modest attire.
6.  If the user's prompt asks for a specific Omani location, you may (or may not) subtly incorporate relevant environmental details. Never mention the city name; if needed, describe its vibe or environment. **IMPORTANT: Only add these details if the location is relevant and not overridden by a more specific context (e.g., "school", "office", "market", "home", "mosque"). When a specific setting is mentioned, focus on that setting instead of adding regional environmental details.** Prefer general, context-aware descriptions over specific landmarks unless clearly requested. For example:

    * For **Muscat Governorate**, add details of the city's blend of contemporary and traditional architecture, such as the grandeur of the Sultan Qaboos Grand Mosque with its magnificent domes, towering minarets, and intricate interior details like the hand-woven Persian carpet and massive crystal chandelier. Mention the spacious, modern malls that incorporate Omani design elements, creating a unique shopping experience that reflects the nation's progressive outlook while honoring its heritage. The vibe is a mix of modern and historic, with colors ranging from the white and sandstone of the buildings to the blue of the sea.
    * For **Dhofar Governorate (e.g., Salalah)**, describe the lush green landscapes of the Khareef monsoon season, coconut groves, and the scent of frankincense. The vibe is subtropical and relaxed, with dominant colors of green and the turquoise of the Arabian Sea. This region is known for its frankincense trade and unique climate.
    * For **Musandam Governorate**, include imagery of the dramatic fjords, towering cliffs plunging into turquoise waters, and isolated villages. The vibe is rugged and majestic, with a color palette of harsh black ochre cliffs and deep blue-green water. It is popular for dhow cruises.
    * For **Ad Dakhiliyah Governorate (e.g., Nizwa, Jebel Akhdar)**, add descriptions of the formidable Al Hajar Mountains, ancient forts like Nizwa Fort, traditional souqs, and terraced farms on the "Green Mountain" (Jebel Akhdar). The vibe is historic and cultural, with earthy tones of the mountains and fortifications. This area is considered the cultural heartland of Oman.
    * For **Ash Sharqiyah North and South Governorates (e.g., Sharqiya Sands, Sur)**, describe the vast, rolling golden dunes of the Sharqiya Sands, the traditional Bedouin lifestyle, and the maritime history of cities like Sur. The vibe is adventurous and traditional, with the golden-orange of the desert and the deep blue of the Arabian Sea.
    * For **Al Batinah North and South Governorates (e.g., Sohar, Barka)**, mention the fertile coastal plains, lush date palm groves, and historic forts along the coast. The vibe is agricultural and coastal, with colors of green from the farms and the blue of the Sea of Oman. Sohar is historically known as a major trading port.
    * For **Al Wusta Governorate**, depict the vast, arid landscapes of the Empty Quarter, the rugged coastline, and the unique wildlife of the Arabian Oryx Sanctuary. The vibe is remote and starkly beautiful, with a palette of whites, beiges, and the blue of the Arabian Sea. It is a hub for oil and gas and is seeing significant industrial development like refineries and petrochemical plants.
    * For **Ad Dhahirah Governorate**, describe the arid plains and historical sites, including ancient tombs and forts. The general atmosphere is that of a desert region with a rich history.
    * For **Al Buraimi Governorate**, include details of its oases and historical forts, reflecting its position as a border region with a blend of desert and settled life.

7.  Respond **ONLY** with the final English text (the refined prompt or the simple translation). *YOU NEVER* add explanations, *YOU NEVER* add justification, *YOU NEVER* respond with anything but the refined prompt.

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

      // DEBUG: Log before sanitization
      console.log('🔍 BEFORE SANITIZE:', enhancedText)

      // Sanitize the AI response to remove any inappropriate content
      enhancedText = this.sanitizePrompt(enhancedText)
      
      // DEBUG: Log after sanitization
      console.log('✅ AFTER SANITIZE:', enhancedText)
      
      // Ensure it starts with 'omani' if the AI didn't follow the rule
      if (!enhancedText.toLowerCase().startsWith('omani')) {
        enhancedText = `omani ${enhancedText}`
      }

      return enhancedText
    } catch (error) {
      console.error('Translation/enhancement error:', error)
      // Enhanced fallback that never returns Arabic text
      return this.createSafeFallback(prompt)
    }
  }

  static createSafeFallback(prompt: string): string {
    // Clean and sanitize the prompt
    let cleanPrompt = this.sanitizePrompt(prompt)
    
    // If Arabic text, provide a safe English fallback
    if (this.isArabicText(cleanPrompt)) {
      return "omani man wearing traditional white dishdasha with elegant embroidery"
    }
    
    // For English text, clean and enhance
    return `omani ${cleanPrompt}`
  }

  static sanitizePrompt(prompt: string): string {
    // List of inappropriate words to remove (case-insensitive)
    const inappropriateWords = [
      'burkini', 'burqini', 'burkiny', 'burquini',
      'swimsuit', 'swim suit', 'swimming suit', 'swimwear',
      'bikini', 'biqini', 'bikiny', 'bикини',
      'lingerie', 'underwear', 'bra', 'panties',
      'naked', 'nude', 'topless', 'bottomless',
      'revealing', 'sexy', 'erotic', 'adult',
      'shorts', 'mini skirt', 'crop top', 'tank top',
      'cleavage', 'exposed', 'bare', 'skin showing',
      'beach', 'swimming', 'swim', 'water'
    ]
    
    let cleanedPrompt = prompt
    
    console.log('🧹 SANITIZING:', cleanedPrompt)
    
    // Multiple aggressive passes
    for (let pass = 0; pass < 3; pass++) {
      inappropriateWords.forEach(word => {
        // Try multiple regex patterns
        const patterns = [
          new RegExp(`\\b${word}\\b`, 'gi'),  // Word boundaries
          new RegExp(word, 'gi'),              // Without boundaries
          new RegExp(`\\(${word}\\)`, 'gi'),   // In parentheses
          new RegExp(word.split('').join('\\s*'), 'gi')  // With possible spaces
        ]
        
        patterns.forEach(regex => {
          const before = cleanedPrompt
          cleanedPrompt = cleanedPrompt.replace(regex, '')
          if (before !== cleanedPrompt) {
            console.log(`  🗑️ REMOVED "${word}" via pattern ${regex}`)
          }
        })
      })
    }
    
    // Clean up extra spaces, commas, parentheses
    cleanedPrompt = cleanedPrompt
      .replace(/\(\s*\)/g, '')        // Empty parentheses
      .replace(/,\s*,/g, ',')         // Double commas
      .replace(/\s+/g, ' ')           // Multiple spaces
      .replace(/\s*,\s*/g, ', ')      // Clean commas
      .trim()
    
    console.log('✨ SANITIZED RESULT:', cleanedPrompt)
    
    // If the prompt becomes empty or too short after cleaning, provide safe default
    if (cleanedPrompt.length < 3) {
      return "traditional omani clothing"
    }
    
    return cleanedPrompt
  }
}
