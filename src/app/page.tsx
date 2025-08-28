'use client'

import { useState } from 'react'
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs'
import Image from 'next/image'
import { useCredits } from '../hooks/useCredits'
import { useGenerations } from '../hooks/useGenerations'
import ImageHistory from '../components/ImageHistory'

export default function Home() {
  const { isSignedIn, user } = useUser()
  const { credits, loading: creditsLoading, hasCredits, deductCredit } = useCredits()
  const { saveGeneration, totalGenerations } = useGenerations()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if (!hasCredits) {
      setError('You have no credits remaining. Please purchase more credits to continue.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    // Deduct credit first
    const creditDeducted = await deductCredit()
    if (!creditDeducted) {
      setError('Failed to deduct credit. Please try again.')
      setIsGenerating(false)
      return
    }

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const imageUrl = data.output?.[0]
      setGeneratedImage(imageUrl)

      // Save the generation to database
      if (imageUrl) {
        await saveGeneration(prompt, imageUrl)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Omani Traditional Clothing AI Generator
          </h1>
          <p className="text-gray-600 mb-6">
            Create beautiful images of traditional Omani clothing with AI
          </p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Sign In to Start Creating
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Omani Traditional Clothing Generator
            </h1>
            <p className="text-gray-600">Welcome, {user?.firstName}!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-600">Credits:</span>
              <span className="ml-2 font-bold text-lg">
                {creditsLoading ? '...' : credits ?? 0}
              </span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-600">Images:</span>
              <span className="ml-2 font-bold text-lg">
                {totalGenerations}
              </span>
            </div>
            <SignOutButton>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-lg mb-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'generate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Generate New Image
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Image History ({totalGenerations})
          </button>
        </div>

        {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Image</h2>
            
            <div className="mb-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Describe the traditional Omani clothing you want to create:
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., elegant white dishdasha with gold embroidery, traditional Omani turban..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={generateImage}
              disabled={isGenerating || !hasCredits || creditsLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isGenerating ? 'Generating...' : !hasCredits ? 'No Credits Remaining' : 'Generate Image (1 Credit)'}
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Note: &quot;omani&quot; will be automatically added to your prompt for best results
            </p>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Image</h2>
            
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating your image...</p>
                </div>
              ) : generatedImage ? (
                <Image
                  src={generatedImage}
                  alt="Generated Omani traditional clothing"
                  width={400}
                  height={400}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Your generated image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : (
          <ImageHistory />
        )}
      </div>
    </div>
  )
}
