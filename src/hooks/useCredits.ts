'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '../lib/supabase'

export function useCredits() {
  const { user } = useUser()
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserCredits()
    }
  }, [user])

  const fetchUserCredits = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // First, try to get existing credits
      const { data: existingCredits, error: fetchError } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (!existingCredits) {
        // User doesn't exist, create with 10 free credits
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert([{ user_id: user.id, credits: 10 }])
          .select('credits')
          .single()

        if (insertError) throw insertError
        setCredits(newCredits.credits)
      } else {
        setCredits(existingCredits.credits)
      }
    } catch (err) {
      console.error('Error fetching credits:', err)
      setError('Failed to load credits')
    } finally {
      setLoading(false)
    }
  }

  const deductCredit = async (): Promise<boolean> => {
    if (!user || credits === null || credits <= 0) {
      return false
    }

    try {
      const newCredits = credits - 1
      const { error } = await supabase
        .from('user_credits')
        .update({ credits: newCredits })
        .eq('user_id', user.id)

      if (error) throw error

      setCredits(newCredits)
      return true
    } catch (err) {
      console.error('Error deducting credit:', err)
      setError('Failed to deduct credit')
      return false
    }
  }

  const refreshCredits = () => {
    if (user) {
      fetchUserCredits()
    }
  }

  return {
    credits,
    loading,
    error,
    deductCredit,
    refreshCredits,
    hasCredits: credits !== null && credits > 0
  }
}
