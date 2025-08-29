'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '../lib/supabase'

interface DebugResult {
  step?: string
  success?: boolean
  data?: unknown
  error?: string
  user_id?: string
  count?: number
}

export default function DebugPanel() {
  const { user } = useUser()
  const [result, setResult] = useState<DebugResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      // Test basic Supabase connection
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .limit(1)
      
      setResult({ 
        step: 'connection_test',
        success: !error,
        data,
        error: error?.message 
      })
    } catch (err) {
      setResult({ 
        step: 'connection_test',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
    setLoading(false)
  }

  const testInsert = async () => {
    if (!user) {
      setResult({ error: 'No user logged in' })
      return
    }

    setLoading(true)
    try {
      const testData = {
        user_id: user.id,
        prompt: 'Debug test prompt',
        image_url: 'https://replicate.delivery/test-image.webp'
      }

      console.log('Testing insert with data:', testData)

      const { data, error } = await supabase
        .from('user_generations')
        .insert([testData])
        .select()

      setResult({
        step: 'insert_test',
        success: !error,
        data,
        error: error?.message,
        user_id: user.id
      })
    } catch (err) {
      setResult({
        step: 'insert_test',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        user_id: user?.id
      })
    }
    setLoading(false)
  }

  const testSelect = async () => {
    if (!user) {
      setResult({ error: 'No user logged in' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_generations')
        .select('*')
        .eq('user_id', user.id)

      setResult({
        step: 'select_test',
        success: !error,
        data,
        error: error?.message,
        count: data?.length || 0
      })
    } catch (err) {
      setResult({
        step: 'select_test',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">🐛 Debug Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Connection
        </button>
        <button
          onClick={testInsert}
          disabled={loading || !user}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Insert
        </button>
        <button
          onClick={testSelect}
          disabled={loading || !user}
          className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Select
        </button>
      </div>

      {user && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <strong>Current User ID:</strong> {user.id}
        </div>
      )}

      {loading && <div>Testing...</div>}

      {result && (
        <div className="bg-gray-50 p-4 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
