'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useGenerations, Generation } from '../hooks/useGenerations'

export default function ImageHistory() {
  const { generations, loading, error, deleteGeneration } = useGenerations()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<Generation | null>(null)

  const handleDelete = async (generationId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      setDeletingId(generationId)
      const success = await deleteGeneration(generationId)
      if (!success) {
        alert('Failed to delete image. Please try again.')
      }
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Generated Images</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading your images...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Generated Images</h2>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Generated Images</h2>
          <span className="text-sm text-gray-500">
            {generations.length} image{generations.length !== 1 ? 's' : ''}
          </span>
        </div>

        {generations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600">No images generated yet</p>
            <p className="text-sm text-gray-500 mt-1">Start creating to see your history here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((generation) => (
              <div key={generation.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="aspect-square bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedImage(generation)}
                >
                  <Image
                    src={generation.image_url}
                    alt={`Generated: ${generation.prompt}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                
                <div className="p-3">
                  <p className="text-sm text-gray-800 line-clamp-2 mb-2">
                    {generation.prompt}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDate(generation.created_at)}</span>
                    <button
                      onClick={() => handleDelete(generation.id)}
                      disabled={deletingId === generation.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deletingId === generation.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for full-size image view */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Generated Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <Image
                  src={selectedImage.image_url}
                  alt={`Generated: ${selectedImage.prompt}`}
                  width={800}
                  height={800}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Prompt:</strong> {selectedImage.prompt}
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Created:</strong> {formatDate(selectedImage.created_at)}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <a
                  href={selectedImage.image_url}
                  download={`omani-clothing-${selectedImage.id}.webp`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(selectedImage.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
