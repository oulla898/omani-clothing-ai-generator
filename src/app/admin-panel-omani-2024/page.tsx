'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'

// Simple in-memory user store for demo (replace with database later)
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

const mockUsers: User[] = [
  { id: '1', email: 'user1@example.com', firstName: 'Ahmed', lastName: 'Al-Omani' },
  { id: '2', email: 'user2@example.com', firstName: 'Fatima', lastName: 'Al-Sayed' },
  { id: '3', email: 'user3@example.com', firstName: 'Omar', lastName: 'Al-Rashid' },
]

export default function AdminPanel() {
  const { isSignedIn, user } = useUser()
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [creditAmount, setCreditAmount] = useState<number>(0)

  // Simple admin check (in production, use proper role-based access)
  const isAdmin = user?.emailAddresses[0]?.emailAddress === 'admin@omani-clothing.com'

  const updateUserCredits = () => {
    if (!selectedUser || creditAmount === 0) return

    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === selectedUser 
          ? { ...u, credits: u.credits + creditAmount }
          : u
      )
    )
    
    setSelectedUser('')
    setCreditAmount(0)
    alert('Credits updated successfully!')
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
              {users.map(user => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">{user.credits}</span>
                      <p className="text-xs text-gray-500">credits</p>
                    </div>
                  </div>
                </div>
              ))}
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
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
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
                disabled={!selectedUser || creditAmount === 0}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Add Credits
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
