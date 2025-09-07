'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Eye, FileText, Receipt, Ban, ThumbsUp, ThumbsDown } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PaymentAllocation {
  invoiceId: string
  invoiceNumber?: string
  allocatedAmount: number
}

interface PaymentDetail {
  id: string
  method: string
  amount: number
  currency: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELED'
  proofUrl: string | null
  ref: string | null
  senderName: string | null
  transferDate: string | null
  allocations: string | null // JSON string of allocations
  totalAllocated: number | null
  remainingAmount: number | null
  balanceChange: number | null
  declineReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
  invoiceId: string | null
  orgId: string
  createdBy: {
    name: string
    email: string
  }
  reviewer?: {
    name: string
    email: string
  }
}

const statusConfig = {
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending Review'
  },
  APPROVED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved'
  },
  DECLINED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Declined'
  },
  CANCELED: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    label: 'Canceled'
  }
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const paymentId = params.id as string

  useEffect(() => {
    if (paymentId) {
      fetchPayment()
    }
  }, [paymentId])

  const fetchPayment = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`)
      const data = await response.json()
      
      if (response.ok) {
        setPayment(data.payment)
      } else {
        toast.error(`Failed to fetch payment: ${data.error}`)
        router.push('/payments')
      }
    } catch (error) {
      toast.error('Error fetching payment details')
      console.error('Error:', error)
      router.push('/payments')
    } finally {
      setLoading(false)
    }
  }

  // Parse allocations from JSON string
  const getAllocations = (): PaymentAllocation[] => {
    if (!payment?.allocations) return []
    try {
      const parsed = JSON.parse(payment.allocations)
      return Object.entries(parsed).map(([invoiceId, amount]) => ({
        invoiceId,
        allocatedAmount: amount as number
      }))
    } catch (error) {
      console.error('Error parsing allocations:', error)
      return []
    }
  }

  const handleApprove = async () => {
    if (!payment || actionLoading) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (response.ok) {
        setPayment(data.payment)
        toast.success('Payment approved successfully')
      } else {
        toast.error(`Failed to approve payment: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error approving payment')
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!payment || actionLoading || !declineReason.trim()) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/payments/${paymentId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason.trim() })
      })
      const data = await response.json()
      
      if (response.ok) {
        setPayment(data.payment)
        setShowDeclineModal(false)
        setDeclineReason('')
        toast.success('Payment declined')
      } else {
        toast.error(`Failed to decline payment: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error declining payment')
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!payment || actionLoading) return
    
    if (!confirm('Are you sure you want to cancel this payment? This action cannot be undone.')) {
      return
    }
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (response.ok) {
        setPayment(data.payment)
        toast.success('Payment canceled')
      } else {
        toast.error(`Failed to cancel payment: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error canceling payment')
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Check user permissions
  const userRoles = user?.roles || []
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('OPS')
  const isOwner = payment?.createdBy?.email === user?.email
  const canApproveDecline = isAdmin && payment?.status === 'PENDING'
  const canCancel = (isOwner || isAdmin) && payment?.status === 'PENDING'

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading payment details..." />
      </AppLayout>
    )
  }

  if (!payment) {
    return (
      <AppLayout user={user}>
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Payment not found</h2>
          <p className="text-gray-500 mb-6">The requested payment could not be found.</p>
          <Link href="/payments" className="text-blue-600 hover:text-blue-800">
            ← Back to Payments
          </Link>
        </div>
      </AppLayout>
    )
  }

  const StatusIcon = statusConfig[payment.status].icon

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`Payment ${payment.ref || payment.id}`}
        description={`${formatCurrency(payment.amount, payment.currency)} via ${payment.method}`}
        breadcrumbs={[
          { label: 'Finance', href: '/payments' },
          { label: 'Payments', href: '/payments' },
          { label: payment.ref || payment.id }
        ]}
        action={
          <div className="flex items-center space-x-3">
            {canApproveDecline && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Decline
                </button>
              </>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban className="h-4 w-4 mr-2" />
                {actionLoading ? 'Canceling...' : 'Cancel Payment'}
              </button>
            )}
            <Link
              href="/payments"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Link>
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Payment Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
                    <p className="text-sm text-gray-500">Reference: {payment.ref || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusIcon className="h-5 w-5" />
                  <StatusBadge status={payment.status} />
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payment.method.replace('_', ' ')}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Created By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div>{payment.createdBy.name}</div>
                    <div className="text-gray-500">{payment.createdBy.email}</div>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(payment.createdAt)}</dd>
                </div>

                {payment.updatedAt !== payment.createdAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(payment.updatedAt)}</dd>
                  </div>
                )}

                {payment.method === 'bank_transfer' && payment.senderName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sender Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{payment.senderName}</dd>
                  </div>
                )}

                {payment.method === 'bank_transfer' && payment.transferDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Transfer Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(payment.transferDate)}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payment.version}</dd>
                </div>

                {payment.reviewer && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reviewed By</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div>{payment.reviewer.name}</div>
                      <div className="text-gray-500">{payment.reviewer.email}</div>
                    </dd>
                  </div>
                )}

                {payment.reviewedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reviewed</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(payment.reviewedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Decline Reason */}
          {payment.status === 'DECLINED' && payment.declineReason && (
            <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 mb-6">
              <div className="px-6 py-4 border-b border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Payment Declined</h3>
                    <p className="text-sm text-red-700">This payment was declined by the review team</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <div>
                  <dt className="text-sm font-medium text-red-700 mb-2">Decline Reason</dt>
                  <dd className="text-sm text-red-900 bg-red-100 rounded-lg p-3">{payment.declineReason}</dd>
                </div>
              </div>
            </div>
          )}

          {/* Payment Allocation Details */}
          {(getAllocations().length > 0 || 
            (payment.totalAllocated !== null && payment.totalAllocated !== undefined && !isNaN(payment.totalAllocated)) ||
            (payment.balanceChange !== null && payment.balanceChange !== undefined && !isNaN(payment.balanceChange))) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Payment Allocation</h3>
                <p className="text-sm text-gray-500">How this payment was distributed</p>
              </div>
              
              <div className="px-6 py-6">
                {getAllocations().length > 0 ? (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700">Invoice Allocations</h4>
                    <div className="space-y-3">
                      {getAllocations().map((allocation) => (
                        <div key={allocation.invoiceId} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                          <div>
                            <div className="font-medium text-gray-900">Invoice {allocation.invoiceId}</div>
                            <div className="text-sm text-gray-500">Allocated amount</div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(allocation.allocatedAmount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mb-6">No specific invoice allocations recorded</div>
                )}

                {/* Allocation Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Allocation Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-700">Total Payment</div>
                      <div className="text-lg font-semibold text-blue-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                    </div>
                    
                    {payment.totalAllocated !== null && payment.totalAllocated !== undefined && !isNaN(payment.totalAllocated) && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-green-700">Allocated to Invoices</div>
                        <div className="text-lg font-semibold text-green-900">
                          {formatCurrency(payment.totalAllocated)}
                        </div>
                      </div>
                    )}

                    {payment.remainingAmount !== null && payment.remainingAmount !== undefined && !isNaN(payment.remainingAmount) && payment.remainingAmount > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-purple-700">Added to Balance</div>
                        <div className="text-lg font-semibold text-purple-900">
                          {formatCurrency(payment.remainingAmount)}
                        </div>
                      </div>
                    )}

                    {payment.balanceChange !== null && payment.balanceChange !== undefined && !isNaN(payment.balanceChange) && (
                      <div className={`rounded-lg p-4 ${payment.balanceChange >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`text-sm font-medium ${payment.balanceChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          Balance Impact
                        </div>
                        <div className={`text-lg font-semibold ${payment.balanceChange >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          {payment.balanceChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(payment.balanceChange))}
                        </div>
                      </div>
                    )}

                    {/* Show fallback message for old payments without allocation data */}
                    {(payment.totalAllocated === null || payment.totalAllocated === undefined || isNaN(payment.totalAllocated)) && 
                     (payment.balanceChange === null || payment.balanceChange === undefined || isNaN(payment.balanceChange)) && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-yellow-700">Legacy Payment</div>
                        <div className="text-sm text-yellow-600">
                          This payment was created before detailed allocation tracking was implemented.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-6">
              {payment.proofUrl && (
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Payment Proof</h3>
                      <p className="text-sm text-gray-500">Documentation attached to this payment</p>
                    </div>
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Proof
                    </a>
                  </div>
                </div>
              )}

              {payment.invoiceId && (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Related Invoice</h3>
                      <p className="text-sm text-gray-500">This payment is associated with an invoice</p>
                    </div>
                    <Link
                      href={`/invoices/${payment.invoiceId}`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      View Invoice
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Decline Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please provide a reason for declining this payment
              </p>
            </div>
            
            <div className="px-6 py-4">
              <label htmlFor="decline-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Decline Reason
              </label>
              <textarea
                id="decline-reason"
                rows={4}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter the reason for declining this payment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
              {!declineReason.trim() && (
                <p className="text-sm text-red-600 mt-1">Decline reason is required</p>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false)
                  setDeclineReason('')
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={actionLoading || !declineReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Declining...' : 'Decline Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}