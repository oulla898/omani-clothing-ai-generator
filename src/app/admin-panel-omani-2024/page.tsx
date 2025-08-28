'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  user_id: string
  credits: number
  created_at: string
  updated_at: string
  // We'll need to fetch user details from Clerk API separately
  email?: string
  firstName?: string
  lastName?: string
}

export default function AdminPanel() {
  const { isSignedIn, user } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [creditAmount, setCreditAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Simple admin check (in production, use proper role-based access)
  const isAdmin = user?.emailAddresses[0]?.emailAddress === 'admin@omani-clothing.com'

  // Fetch all users and their credits
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSignedIn || !isAdmin) return
      
      try {
        const response = await fetch('/api/admin/credits')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [isSignedIn, isAdmin])

  const updateUserCredits = async () => {
    if (!selectedUser || creditAmount === 0) {
      alert('Please select a user and enter a credit amount')
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: selectedUser,
          action: 'add',
          amount: creditAmount,
          description: `Admin credit adjustment by ${user?.emailAddresses[0]?.emailAddress}`
        }),
      })

      if (response.ok) {
        alert('Credits updated successfully!')
        setSelectedUser('')
        setCreditAmount(0)
        
        // Refresh users list
        const refreshResponse = await fetch('/api/admin/credits')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setUsers(data.users)
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to update credits: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating credits:', error)
      alert('Error updating credits')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Panel</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the admin panel</p>
          <SignInButton mode="modal">
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Admin Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-600">Manage users and credits</p>
          </div>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                users.map(user => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{user.firstName || 'Unknown'} {user.lastName || 'User'}</h3>
                      <p className="text-sm text-gray-600">{user.email || user.user_id}</p>
                      <p className="text-xs text-gray-400">ID: {user.user_id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">{user.credits}</span>
                      <p className="text-xs text-gray-500">credits</p>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Credit Management */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Add Credits</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.user_id}>
                      {user.firstName || 'Unknown'} {user.lastName || 'User'} ({user.email || user.user_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credits to Add
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  placeholder="Enter amount"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={updateUserCredits}
                disabled={!selectedUser || creditAmount === 0 || isUpdating}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {isUpdating ? 'Updating...' : 'Add Credits'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {users.reduce((sum, user) => sum + user.credits, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(users.reduce((sum, user) => sum + user.credits, 0) / users.length)}
              </div>
              <div className="text-sm text-gray-600">Avg Credits per User</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
