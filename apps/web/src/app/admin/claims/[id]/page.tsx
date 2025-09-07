'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { Shield, ArrowLeft, Lock, CheckCircle, XCircle, AlertTriangle, Eye, Edit, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface InsuranceClaim {
  id: string
  status: 'new' | 'investigating' | 'under_review' | 'approved' | 'rejected' | 'settled' | 'paid' | 'closed'
  description: string | null
  incidentAt: string | null
  photos: any
  createdAt: string
  settlementAmount?: number
  vehicle: {
    id: string
    vin: string
    make: string | null
    model: string | null
    year: number | null
    org: {
      name: string
    }
  }
}

export default function AdminClaimDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [claim, setClaim] = useState<InsuranceClaim | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '' as any,
    description: '',
    settlementAmount: ''
  })
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/claims')
        return
      }
      fetchClaim()
    }
  }, [user, sessionLoading])

  const fetchClaim = async () => {
    try {
      const response = await fetch(`/api/claims/${resolvedParams.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setClaim(data.claim)
        setEditForm({
          status: data.claim.status,
          description: data.claim.description || '',
          settlementAmount: data.claim.settlementAmount?.toString() || ''
        })
      } else {
        toast.error(`Failed to fetch claim: ${data.error}`)
        router.push('/admin/claims')
      }
    } catch (error) {
      toast.error('Error fetching claim')
      console.error('Error fetching claim:', error)
      router.push('/admin/claims')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClaim = async () => {
    if (!claim) return

    // Validation for required fields based on status
    if (['approved', 'settled', 'paid'].includes(editForm.status) && !editForm.settlementAmount) {
      toast.error('Settlement amount is required for this status')
      return
    }

    if (editForm.status === 'rejected' && !editForm.description.trim()) {
      toast.error('Internal notes are required when rejecting a claim')
      return
    }

    try {
      const response = await fetch(`/api/claims/${claim.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: editForm.status,
          description: editForm.description,
          settlementAmount: editForm.settlementAmount ? parseFloat(editForm.settlementAmount) : null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsEditing(false)
        toast.success('Claim updated successfully!')
        await fetchClaim() // Refresh the claim data
      } else {
        toast.error(`Failed to update claim: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating claim:', error)
      toast.error('Error updating claim')
    }
  }

  const confirmCloseClaim = async () => {
    if (!claim) return
    
    try {
      const response = await fetch(`/api/claims/${claim.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'closed',
          description: editForm.description || 'Claim closed and finalized'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowCloseConfirmation(false)
        toast.success('Claim closed permanently')
        await fetchClaim()
      } else {
        toast.error(`Failed to close claim: ${data.error}`)
      }
    } catch (error) {
      console.error('Error closing claim:', error)
      toast.error('Error closing claim')
    }
  }

  const getVehicleDisplay = (vehicle: InsuranceClaim['vehicle']) => {
    if (vehicle && vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return 'Unknown Vehicle'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading claim details..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS'))) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You need admin privileges to view this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!claim) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Claim Not Found</h2>
            <p className="mt-2 text-gray-600">The requested claim could not be found.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const canEdit = claim.status !== 'closed'

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={`Claim #${claim.id.substring(0, 8)}`}
        description="Review and manage insurance claim"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Claims', href: '/admin/claims' },
          { label: `Claim #${claim.id.substring(0, 8)}` }
        ]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/claims')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Claims List
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Insurance Claim Details
              </h2>
              <div className="flex items-center space-x-4">
                <StatusBadge status={claim.status} />
                {claim.status === 'closed' && (
                  <span className="text-sm text-gray-500 flex items-center">
                    <Lock className="h-4 w-4 mr-1" />
                    Final - Cannot be modified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Vehicle Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Vehicle:</span>{' '}
                      <span className="text-gray-900">{getVehicleDisplay(claim.vehicle)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">VIN:</span>{' '}
                      <span className="text-gray-900 font-mono">{claim.vehicle?.vin || 'N/A'}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Organization:</span>{' '}
                      <span className="text-gray-900">{claim.vehicle?.org?.name || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Claim Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Claim Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Filed Date:</span>{' '}
                      <span className="text-gray-900">{formatDate(claim.createdAt)}</span>
                    </p>
                    {claim.incidentAt && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Incident Date:</span>{' '}
                        <span className="text-gray-900">{formatDate(claim.incidentAt)}</span>
                      </p>
                    )}
                    {(claim.settlementAmount || editForm.settlementAmount) && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Settlement Amount:</span>{' '}
                        <span className="text-gray-900 font-semibold">
                          ${claim.settlementAmount || editForm.settlementAmount}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {claim.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Photos */}
                {claim.photos && Array.isArray(claim.photos) && claim.photos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Photos ({claim.photos.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {claim.photos.map((photo: any, index: number) => (
                        <div key={index} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">📷 Photo {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Panel */}
              <div className="lg:col-span-1">
                {isEditing && canEdit ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Update Claim</h3>
                    
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
                        <option value="investigating">Investigating</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="settled">Settled</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>

                    {(['approved', 'settled', 'paid'].includes(editForm.status)) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Settlement Amount ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.settlementAmount}
                          onChange={(e) => setEditForm({ ...editForm, settlementAmount: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter settlement amount..."
                        />
                      </div>
                    )}

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
                        onClick={handleUpdateClaim}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Actions</h3>
                    
                    {canEdit ? (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Claim
                        </button>

                        {/* Quick Actions */}
                        {claim.status === 'new' && (
                          <button
                            onClick={() => {
                              setEditForm({ ...editForm, status: 'investigating' })
                              setIsEditing(true)
                            }}
                            className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                          >
                            Start Investigation
                          </button>
                        )}
                        
                        {(claim.status === 'investigating' || claim.status === 'under_review') && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setEditForm({ ...editForm, status: 'approved' })
                                setIsEditing(true)
                              }}
                              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setEditForm({ ...editForm, status: 'rejected' })
                                setIsEditing(true)
                              }}
                              className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        )}

                        {claim.status === 'paid' && (
                          <button
                            onClick={() => setShowCloseConfirmation(true)}
                            className="w-full bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Close Claim Permanently
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded-md text-sm text-center border border-gray-200 flex items-center justify-center">
                          <Lock className="h-4 w-4 mr-1" />
                          Claim Closed (Final)
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          This claim has been permanently closed and cannot be modified.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Close Confirmation Modal */}
        {showCloseConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Claim Closure</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  You are about to permanently close this insurance claim. This action is <strong>irreversible</strong> and cannot be undone.
                </p>
                <p className="text-sm text-gray-600">
                  Once closed, the claim status cannot be modified and all related processes will be finalized.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCloseConfirmation(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCloseClaim}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Close Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}