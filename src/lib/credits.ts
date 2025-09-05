import { supabase } from './supabase'

export class CreditsManager {
  static async getUserCredits(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // User not found, create with initial credits
          const newUser = await this.initializeUser(userId)
          return newUser?.credits || 10
        }
        throw error
      }

      return data.credits
    } catch (error) {
      console.error('Error getting user credits:', error)
      return 0
    }
  }

  static async initializeUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .insert({ user_id: userId, credits: 10 })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error initializing user:', error)
      return null
    }
  }

  static async deductCredits(userId: string, amount: number = 1): Promise<boolean> {
    try {
      const currentCredits = await this.getUserCredits(userId)
      
      if (currentCredits < amount) {
        return false
      }

      const { error } = await supabase
        .from('user_credits')
        .update({ credits: currentCredits - amount })
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deducting credits:', error)
      return false
    }
  }
}
