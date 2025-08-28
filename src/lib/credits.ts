import { supabase } from './supabase'

export interface UserCredits {
  id: string
  user_id: string
  credits: number
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'deduct' | 'add' | 'initial'
  description: string
  created_at: string
}

export class CreditManager {
  /**
   * Initialize user with default credits (10) when they first sign up
   */
  static async initializeUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      // Check if user already has credits
      const { data: existing } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existing) {
        return existing
      }

      // Create new user credits
      const { data: newCredits, error: creditsError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          credits: 10
        })
        .select()
        .single()

      if (creditsError) throw creditsError

      // Log initial credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: 10,
          type: 'initial',
          description: 'Initial signup bonus'
        })

      return newCredits
    } catch (error) {
      console.error('Error initializing user credits:', error)
      return null
    }
  }

  /**
   * Get user's current credit balance
   */
  static async getUserCredits(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If user doesn't exist, initialize them
        if (error.code === 'PGRST116') {
          const newUser = await this.initializeUserCredits(userId)
          return newUser?.credits || 0
        }
        throw error
      }

      return data.credits
    } catch (error) {
      console.error('Error getting user credits:', error)
      return 0
    }
  }

  /**
   * Deduct credits from user account
   */
  static async deductCredits(userId: string, amount: number, description: string = 'Image generation'): Promise<boolean> {
    try {
      // Get current credits
      const currentCredits = await this.getUserCredits(userId)
      
      if (currentCredits < amount) {
        return false // Insufficient credits
      }

      const newCredits = currentCredits - amount

      // Update credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ credits: newCredits })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -amount,
          type: 'deduct',
          description
        })

      return true
    } catch (error) {
      console.error('Error deducting credits:', error)
      return false
    }
  }

  /**
   * Add credits to user account
   */
  static async addCredits(userId: string, amount: number, description: string = 'Credits added'): Promise<boolean> {
    try {
      // Get current credits
      const currentCredits = await this.getUserCredits(userId)
      const newCredits = currentCredits + amount

      // Update credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ credits: newCredits })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'add',
          description
        })

      return true
    } catch (error) {
      console.error('Error adding credits:', error)
      return false
    }
  }

  /**
   * Get user's credit transaction history
   */
  static async getCreditHistory(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error getting credit history:', error)
      return []
    }
  }

  /**
   * Get all users with their credit balances (for admin)
   */
  static async getAllUsersCredits(): Promise<UserCredits[]> {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error getting all users credits:', error)
      return []
    }
  }
}
