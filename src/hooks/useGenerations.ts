'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '../lib/supabase'

export interface Generation {
  id: string
  user_id: string
  prompt: string
  image_url: string
  created_at: string
  updated_at: string
}

export function useGenerations() {
  const { user } = useUser()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchGenerations()
    }
  }, [user])

  const fetchGenerations = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('user_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setGenerations(data || [])
    } catch (err) {
      console.error('Error fetching generations:', err)
      setError('Failed to load image history')
    } finally {
      setLoading(false)
    }
  }

  const saveGeneration = async (prompt: string, imageUrl: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('user_generations')
        .insert([{
          user_id: user.id,
          prompt,
          image_url: imageUrl
        }])

      if (error) throw error

      // Refresh the list to include the new generation
      await fetchGenerations()
      return true
    } catch (err) {
      console.error('Error saving generation:', err)
      setError('Failed to save image')
      return false
    }
  }

  const deleteGeneration = async (generationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('user_generations')
        .delete()
        .eq('id', generationId)
        .eq('user_id', user.id) // Security: ensure user can only delete their own

      if (error) throw error

      // Remove from local state
      setGenerations(prev => prev.filter(gen => gen.id !== generationId))
      return true
    } catch (err) {
      console.error('Error deleting generation:', err)
      setError('Failed to delete image')
      return false
    }
  }

  const refreshGenerations = () => {
    if (user) {
      fetchGenerations()
    }
  }

  return {
    generations,
    loading,
    error,
    saveGeneration,
    deleteGeneration,
    refreshGenerations,
    totalGenerations: generations.length
  }
}
