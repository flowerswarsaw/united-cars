'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { CheckCircle, XCircle, Clock, FileText, Camera, DollarSign, MapPin, Calendar, User, Building, Truck, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface IntakeDetail {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  auction: 'copart' | 'iaa'
  auctionLot: string | null
  vin: string
  make: string | null
  model: string | null
  year: number | null
  purchasePrice: number | null
  destinationPort: string
  notes: string | null
  createdAt: string
  reviewedAt: string | null
  org: {
    id: string
    name: string
  }
  assignedTo: {
    name: string
    email: string
  } | null
  auctionLocation: {
    name: string
    state: string
  } | null
  attachments: Array<{
    id: string
    kind: string
    filename: string
    uploadedAt: string
  }>
}

const statusConfig = {
  pending: {
    color: 'warning',
    icon: Clock,
    label: 'Pending Review'
  },
  approved: {
    color: 'success',
    icon: CheckCircle,
    label: 'Approved'
  },
  rejected: {
    color: 'error',
    icon: XCircle,
    label: 'Rejected'
  }
}

export default function AdminIntakeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [intake, setIntake] = useState<IntakeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: sessionLoading } = useSession()
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/intake')
        return
      }
      if (params.id) {
        fetchIntakeDetail(params.id as string)
      }
    }
  }, [user, sessionLoading, params.id])

  const fetchIntakeDetail = async (intakeId: string) => {
    try {
      // Mock data for demonstration
      const mockIntake: IntakeDetail = {
        id: intakeId,
        status: intakeId === 'intake-5' ? 'pending' : 'approved',
        auction: 'copart',
        auctionLot: '47854125',
        vin: '1HGBH41JXMN109186',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        purchasePrice: 15750.00,
        destinationPort: 'Long Beach',
        notes: 'Minor front-end damage, clean title, good mechanical condition. Requested by premium dealer client.',
        createdAt: '2024-03-15T10:30:00Z',
        reviewedAt: intakeId === 'intake-5' ? null : '2024-03-16T14:20:00Z',
        org: {
          id: 'org-1',
          name: 'Premium Auto Dealers'
        },
        assignedTo: {
          name: 'Sarah Wilson',
          email: 'sarah@admin.com'
        },
        auctionLocation: {
          name: 'Copart Dallas',
          state: 'TX'
        },
        attachments: [
          {
            id: 'att-1',
            kind: 'auction_photos',
            filename: 'front-damage.jpg',
            uploadedAt: '2024-03-15T10:35:00Z'
          },
          {
            id: 'att-2',
            kind: 'payment_confirmation',
            filename: 'payment-receipt.pdf',
            uploadedAt: '2024-03-15T11:00:00Z'
          }
        ]
      }
      
      setIntake(mockIntake)
    } catch (error) {
      toast.error('Error fetching intake details')
      console.error('Error fetching intake:', error)
      router.push('/admin/intake')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!intake) return

    try {
      // In production, this would call the API
      const updatedIntake = {
        ...intake,
        status: action === 'approve' ? 'approved' as const : 'rejected' as const,
        reviewedAt: new Date().toISOString()
      }
      
      setIntake(updatedIntake)
      toast.success(`Intake ${action}d successfully!`)
      setReviewAction(null)
      setReviewNotes('')
    } catch (error) {
      console.error(`Error ${action}ing intake:`, error)
      toast.error(`Error ${action}ing intake`)
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

  const getAuctionIcon = (auction: string) => {
    switch (auction.toLowerCase()) {
      case 'copart': return '🏢'
      case 'iaa': return '🏭'
      default: return '📍'
    }
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading intake details..." />
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

  if (!intake) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Intake Not Found</h2>
            <p className="mt-2 text-gray-600">The requested intake could not be found.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const StatusIcon = statusConfig[intake.status].icon
  const isPending = intake.status === 'pending'

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={`${getVehicleDisplay()} - Intake Review`}
        description={`Review and manage intake request #${intake.id.substring(0, 8).toUpperCase()}`}
        breadcrumbs={[
          { label: 'Admin' }, 
          { label: 'Intake', href: '/admin/intake' }, 
          { label: `#${intake.id.substring(0, 8)}` }
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <StatusIcon className="h-6 w-6 mr-3 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Current Status</h2>
                    <p className="text-sm text-gray-600">Intake request status and review information</p>
                  </div>
                </div>
                <StatusBadge status={statusConfig[intake.status].color} />
              </div>

              {intake.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">This intake is pending admin review and approval.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Vehicle</label>
                  <p className="text-sm text-gray-900 font-medium">{getVehicleDisplay()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">VIN</label>
                  <p className="text-sm text-gray-900 font-mono">{intake.vin}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Auction</label>
                  <div className="flex items-center">
                    <span className="mr-2">{getAuctionIcon(intake.auction)}</span>
                    <p className="text-sm text-gray-900">{intake.auction.toUpperCase()}</p>
                  </div>
                </div>
                {intake.auctionLot && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Lot Number</label>
                    <p className="text-sm text-gray-900">{intake.auctionLot}</p>
                  </div>
                )}
                {intake.purchasePrice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Purchase Price</label>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <p className="text-sm text-gray-900 font-medium">
                        ${Number(intake.purchasePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Destination Port</label>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-blue-600 mr-1" />
                    <p className="text-sm text-gray-900">{intake.destinationPort}</p>
                  </div>
                </div>
                {intake.auctionLocation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Auction Location</label>
                    <p className="text-sm text-gray-900">{intake.auctionLocation.name}, {intake.auctionLocation.state}</p>
                  </div>
                )}
              </div>
              
              {intake.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{intake.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Documents & Photos
              </h2>
              {(intake.attachments || []).length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No files uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(intake.attachments || []).map((attachment) => (
                    <div key={attachment.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                        <p className="text-xs text-gray-500">
                          {attachment.kind.replace('_', ' ')} • {formatDate(attachment.uploadedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Review Actions */}
            {isPending && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Actions</h2>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Organization
              </h3>
              <p className="text-sm text-gray-900 font-medium">{intake.org.name}</p>
            </div>

            {/* Assignment */}
            {intake.assignedTo && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Assigned To
                </h3>
                <p className="text-sm text-gray-900 font-medium">{intake.assignedTo.name}</p>
                <p className="text-xs text-gray-500">{intake.assignedTo.email}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Intake Created</p>
                    <p className="text-xs text-gray-500">{formatDate(intake.createdAt)}</p>
                  </div>
                </div>

                {intake.reviewedAt && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        intake.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <StatusIcon className={`h-4 w-4 ${
                          intake.status === 'approved' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {intake.status === 'approved' ? 'Approved' : 'Rejected'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(intake.reviewedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}