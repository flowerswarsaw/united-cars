'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface InsuranceClaim {
  id: string
  status: 'new' | 'review' | 'approved' | 'rejected' | 'paid'
  description: string | null
  incidentAt: string | null
  photos: any
  createdAt: string
  vehicle: {
    id: string
    vin: string
    make: string | null
    model: string | null
    year: number | null
  }
  org: {
    name: string
    type: string
  }
}

interface User {
  id: string
  roles: string[]
}

export default function AdminClaimsPage() {
  const router = useRouter()
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('new')
  const [editingClaim, setEditingClaim] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '' as any,
    description: ''
  })

  useEffect(() => {
    fetchUserSession()
    fetchClaims()
  }, [filter])

  const fetchUserSession = async () => {
    // This would normally come from your auth context/session
    // For now, simulating admin user
    const userSession = { id: 'admin1', roles: ['ADMIN'] }
    setUser(userSession)
    
    // Check if user has admin access
    if (!userSession.roles.includes('ADMIN') && !userSession.roles.includes('OPS')) {
      router.push('/claims')
      return
    }
  }

  const fetchClaims = async () => {
    try {
      const url = filter === 'all' ? '/api/claims' : `/api/claims?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setClaims(data.claims || [])
      } else {
        console.error('Failed to fetch claims:', data.error)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (claim: InsuranceClaim) => {
    setEditingClaim(claim.id)
    setEditForm({
      status: claim.status,
      description: claim.description || ''
    })
  }

  const handleUpdateClaim = async (claimId: string) => {
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: editForm.status,
          description: editForm.description
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update the local state
        setClaims(prevClaims =>
          prevClaims.map(claim =>
            claim.id === claimId ? { ...claim, ...data.claim } : claim
          )
        )
        setEditingClaim(null)
        alert('Claim updated successfully!')
      } else {
        alert(`Failed to update claim: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating claim:', error)
      alert('Error updating claim')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'review':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'paid':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading insurance claims...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin - Insurance Claims</h1>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</a>
              <a href="/claims" className="text-blue-600 hover:text-blue-800">Dealer View</a>
              <a href="/admin/services" className="text-blue-600 hover:text-blue-800">Services</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Filter by status:
              </label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Claims</option>
                <option value="new">New (Needs Review)</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Claims List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Claims for Review ({claims.length})
            </h3>
            
            {claims.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">No claims found</div>
                <p className="text-sm text-gray-400 mt-1">
                  No claims match the current filter.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {claims.map((claim) => (
                  <div key={claim.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Claim Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                              Insurance Claim #{claim.id.substring(0, 8)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              <strong>Vehicle:</strong> {claim.vehicle.year && claim.vehicle.make && claim.vehicle.model
                                ? `${claim.vehicle.year} ${claim.vehicle.make} ${claim.vehicle.model}`
                                : 'Unknown Vehicle'} - {claim.vehicle.vin}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Organization:</strong> {claim.org.name} ({claim.org.type})
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Filed:</strong> {formatDate(claim.createdAt)}
                            </p>
                            {claim.incidentAt && (
                              <p className="text-sm text-gray-600">
                                <strong>Incident Date:</strong> {formatDate(claim.incidentAt)}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                            {claim.status}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-700">
                              {claim.description || 'No description provided'}
                            </p>
                          </div>
                        </div>

                        {claim.photos && Array.isArray(claim.photos) && claim.photos.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Photos ({claim.photos.length}):
                            </p>
                            <div className="flex space-x-2">
                              {claim.photos.slice(0, 3).map((photo: any, index: number) => (
                                <div key={index} className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                  <span className="text-xs text-gray-500">📷</span>
                                </div>
                              ))}
                              {claim.photos.length > 3 && (
                                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                  <span className="text-xs text-gray-500">+{claim.photos.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Panel */}
                      <div className="lg:col-span-1">
                        {editingClaim === claim.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                              </label>
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="new">New</option>
                                <option value="review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Internal Notes
                              </label>
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={4}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add internal review notes..."
                              />
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateClaim(claim.id)}
                                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingClaim(null)}
                                className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <button
                              onClick={() => startEditing(claim)}
                              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              Review Claim
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setEditingClaim(claim.id)
                                  setEditForm({ status: 'approved', description: '' })
                                }}
                                className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClaim(claim.id)
                                  setEditForm({ status: 'rejected', description: '' })
                                }}
                                className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>

                            {claim.status === 'approved' && (
                              <button
                                onClick={() => {
                                  setEditingClaim(claim.id)
                                  setEditForm({ status: 'paid', description: 'Claim payment processed' })
                                }}
                                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}