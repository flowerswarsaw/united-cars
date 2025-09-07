'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, FileText, Camera, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from '@/hooks/useSession'
import { PaymentConfirmationUpload } from '@/components/intake/PaymentConfirmationUpload'

interface IntakeDetail {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  auction: 'COPART' | 'IAA'
  auctionLot?: string
  vin: string
  make?: string
  model?: string
  year?: number
  purchasePriceUSD?: number
  destinationPort: string
  notes?: string
  createdAt: string
  reviewedAt?: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  reviewedBy?: {
    id: string
    name: string
    email: string
  }
  auctionLocation?: {
    id: string
    name: string
    code: string
    state: string
  }
  attachments: Array<{
    id: string
    kind: string
    filename: string
    uploadedAt: string
  }>
  org: {
    id: string
    name: string
    type: string
  }
}

const statusConfig = {
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Pending Review'
  },
  APPROVED: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Approved'
  },
  REJECTED: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Rejected'
  }
}

export default function IntakeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [intake, setIntake] = useState<IntakeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: sessionLoading } = useSession()
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchIntakeDetail(params.id as string)
      
      // Check for success message
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      
      if (success === 'declared') {
        toast.success('🏆 Auction win declared successfully! Awaiting admin approval.')
        
        // Clean up URL
        window.history.replaceState({}, '', `/intake/${params.id}`)
      }
    }
  }, [params.id])

  const fetchIntakeDetail = async (intakeId: string) => {
    try {
      const response = await fetch(`/api/intakes/${intakeId}`)
      const result = await response.json()

      if (response.ok) {
        setIntake(result.intake)
      } else {
        toast.error(`Failed to load intake: ${result.error}`)
        router.push('/intake')
      }
    } catch (error) {
      console.error('Error fetching intake:', error)
      toast.error('Error loading intake details')
      router.push('/intake')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!intake) return

    try {
      const response = await fetch(`/api/intakes/${intake.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          notes: reviewNotes
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Intake ${action}d successfully!`)
        setIntake(result.intake)
        setReviewAction(null)
        setReviewNotes('')
      } else {
        toast.error(`Failed to ${action} intake: ${result.error}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing intake:`, error)
      toast.error(`Error ${action}ing intake`)
    }
  }

  const handleRetract = async () => {
    if (!intake) return

    if (!confirm('Are you sure you want to retract this intake request?')) {
      return
    }

    try {
      const response = await fetch(`/api/intakes/${intake.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Intake retracted successfully!')
        router.push('/intake')
      } else {
        toast.error(`Failed to retract intake: ${result.error}`)
      }
    } catch (error) {
      console.error('Error retracting intake:', error)
      toast.error('Error retracting intake')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVehicleDisplay = () => {
    if (!intake) return 'Unknown Vehicle'
    const parts = []
    if (intake.year) parts.push(intake.year.toString())
    if (intake.make) parts.push(intake.make)
    if (intake.model) parts.push(intake.model)
    return parts.join(' ') || 'Unknown Vehicle'
  }

  const canReview = user?.roles?.includes('ADMIN') || user?.roles?.includes('OPS') || false
  const isPending = intake?.status === 'PENDING'
  const isOwner = intake?.org?.id === user?.orgId
  const isDealer = user?.roles?.includes('DEALER') || false

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading intake details...</p>
        </div>
      </div>
    )
  }

  if (!intake) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Intake not found</p>
          <Link href="/intake" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Intakes
          </Link>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[intake.status].icon

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/intake"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Intakes
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getVehicleDisplay()}
              </h1>
              <p className="text-gray-600 mt-1">Intake Request #{intake.id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[intake.status].color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusConfig[intake.status].label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">VIN</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{intake.vin}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Auction</label>
                  <p className="mt-1 text-sm text-gray-900">{intake.auction}</p>
                </div>
                {intake.auctionLot && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Lot Number</label>
                    <p className="mt-1 text-sm text-gray-900">{intake.auctionLot}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Destination Port</label>
                  <p className="mt-1 text-sm text-gray-900">{intake.destinationPort}</p>
                </div>
                {intake.purchasePriceUSD && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Purchase Price</label>
                    <p className="mt-1 text-sm text-gray-900">
                      ${Number(intake.purchasePriceUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
              
              {intake.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">{intake.notes}</p>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents & Photos</h2>
              {(intake.attachments || []).length === 0 ? (
                <div className="text-center py-6">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No files uploaded yet</p>
                  {isPending && (
                    <p className="text-sm text-gray-400 mt-1">
                      Files can be uploaded after intake creation
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {(intake.attachments || []).map((attachment) => (
                    <div key={attachment.id} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.kind} • {formatDate(attachment.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Payment Confirmation Upload */}
              {isPending && isOwner && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Upload Payment Confirmations</h3>
                  <PaymentConfirmationUpload intakeId={intake.id} onUpload={fetchIntakeDetail} />
                </div>
              )}
            </div>

            {/* Review Actions for Admin/OPS */}
            {canReview && isPending && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Review Actions</h2>
                {reviewAction ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Notes (optional)
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add any notes about your decision..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleReview(reviewAction)}
                        className={`px-4 py-2 rounded-md text-white font-medium ${
                          reviewAction === 'approve'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
                      </button>
                      <button
                        onClick={() => {
                          setReviewAction(null)
                          setReviewNotes('')
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setReviewAction('approve')}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => setReviewAction('reject')}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dealer Actions - Retract for pending intakes they created */}
            {isOwner && isDealer && isPending && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dealer Actions</h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    You can retract this intake request if it's no longer needed. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleRetract}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Retract Intake Request
                  </button>
                </div>
              </div>
            )}

            {/* Info message for dealers when intake is not pending */}
            {isOwner && isDealer && !isPending && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      This intake has been {intake?.status === 'APPROVED' ? 'approved' : 'rejected'} by admin. 
                      {intake?.status === 'REJECTED' && ' You may create a new intake request if needed.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Intake Created</p>
                    <p className="text-xs text-gray-500">{formatDate(intake.createdAt)}</p>
                    {intake.createdBy && (
                      <p className="text-xs text-gray-500">by {intake.createdBy?.name || 'Unknown'}</p>
                    )}
                  </div>
                </div>

                {intake.reviewedAt && intake.reviewedBy && (
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        intake.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <StatusIcon className={`h-4 w-4 ${
                          intake.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {intake.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(intake.reviewedAt)}</p>
                      <p className="text-xs text-gray-500">by {intake.reviewedBy?.name || 'Unknown'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organization */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
              <p className="text-sm text-gray-900">{intake.org?.name || 'Unknown Organization'}</p>
              <p className="text-xs text-gray-500 capitalize">{intake.org?.type || 'unknown'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}