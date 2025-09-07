'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, CreditCard, Upload, Eye, Download, FileText } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { PaymentSubmissionModal } from '@/components/payments/payment-submission-modal'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from '@/hooks/useSession'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Payment {
  id: string
  method: string
  amount: number
  currency: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELED'
  proofUrl: string | null
  ref: string | null
  senderName: string | null
  transferDate: string | null
  createdAt: string
  org: {
    name: string
  }
  invoice: {
    id: string
    number: string
  } | null
  createdBy: {
    name: string
    email: string
  }
}

// Component to display allocated invoices for a payment
function PaymentInvoiceDisplay({ payment }: { payment: Payment }) {
  // Parse allocation data from the payment
  const getAllocatedInvoices = () => {
    try {
      // If payment has allocations JSON, parse it
      if ((payment as any).allocations) {
        const allocations = JSON.parse((payment as any).allocations)
        return Object.keys(allocations).filter(invoiceId => allocations[invoiceId] > 0)
      }
      
      // Fallback to single invoice if exists
      if (payment.invoice) {
        return [payment.invoice.id]
      }
      
      return []
    } catch (error) {
      console.error('Error parsing payment allocations:', error)
      return payment.invoice ? [payment.invoice.id] : []
    }
  }

  const allocatedInvoices = getAllocatedInvoices()

  if (allocatedInvoices.length === 0) {
    return <span className="text-sm text-gray-500">No invoice allocation</span>
  }

  if (allocatedInvoices.length === 1) {
    // Single invoice - show as link if we have invoice data
    const invoiceId = allocatedInvoices[0]
    if (payment.invoice && payment.invoice.id === invoiceId) {
      return (
        <Link
          href={`/invoices/${payment.invoice.id}`}
          className="text-sm text-blue-600 hover:text-blue-900"
        >
          {payment.invoice.number}
        </Link>
      )
    } else {
      return <span className="text-sm text-gray-900">{invoiceId}</span>
    }
  }

  // Multiple invoices - show count with tooltip or expandable list
  return (
    <div className="text-sm">
      <span className="text-gray-900 font-medium">{allocatedInvoices.length} invoices</span>
      <div className="text-xs text-gray-500 mt-1">
        {allocatedInvoices.slice(0, 2).map((invoiceId, index) => (
          <div key={invoiceId}>
            {invoiceId}
            {index === 1 && allocatedInvoices.length > 2 && (
              <span className="text-gray-400">... +{allocatedInvoices.length - 2} more</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0
  })
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    PENDING: 0,
    APPROVED: 0,
    DECLINED: 0,
    CANCELED: 0
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([])
  const [userBalance, setUserBalance] = useState(0)
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    fetchPayments()
    fetchOutstandingInvoices()
    fetchUserBalance()
  }, [filter, pagination.page, searchTerm])

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      })
      
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/payments?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setPayments(data.payments || [])
        setPagination(data.pagination)
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      } else {
        toast.error(`Failed to fetch payments: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error fetching payments')
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }


  const filteredPayments = payments

  const filterOptions = [
    { value: 'all', label: 'All Payments', count: statusCounts.all },
    { value: 'PENDING', label: 'Pending Review', count: statusCounts.PENDING },
    { value: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
    { value: 'DECLINED', label: 'Declined', count: statusCounts.DECLINED },
    { value: 'CANCELED', label: 'Canceled', count: statusCounts.CANCELED },
  ]

  const fetchOutstandingInvoices = async () => {
    try {
      const response = await fetch('/api/invoices/outstanding')
      const data = await response.json()
      
      if (response.ok) {
        // Map to expected format for payment modal
        const invoicesForModal = data.invoices.map((inv: any) => ({
          id: inv.id,
          number: inv.number,
          amount: inv.remainingAmount, // Use remaining amount instead of total
          dueDate: inv.issuedAt
        }))
        setOutstandingInvoices(invoicesForModal)
      } else {
        console.error('Failed to fetch outstanding invoices:', data.error)
        // Fallback to empty array
        setOutstandingInvoices([])
      }
    } catch (error) {
      console.error('Error fetching outstanding invoices:', error)
      setOutstandingInvoices([])
    }
  }

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/user/balance')
      const data = await response.json()
      
      if (response.ok) {
        setUserBalance(data.balance || 0)
      } else {
        console.error('Failed to fetch user balance:', data.error)
        setUserBalance(0)
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
      setUserBalance(0)
    }
  }

  const handlePaymentSubmit = () => {
    fetchPayments()
    fetchUserBalance()
    setIsModalOpen(false)
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Payments"
        description="Track payment submissions and approvals"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Payments' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex items-center space-x-2 flex-wrap">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter === option.value
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                      {option.count > 0 && (
                        <span className="ml-1 text-xs">({option.count})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Intents {filteredPayments.length > 0 && `(${pagination.total})`}
              </h2>
            </div>
          </div>

          <div className="p-6">
            {loading || sessionLoading ? (
              <LoadingState text="Loading payments..." />
            ) : filteredPayments.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="h-12 w-12" />}
                title="No payments found"
                description={
                  searchTerm 
                    ? `No payments match "${searchTerm}"`
                    : filter === 'all'
                      ? 'No payment intents have been submitted yet.'
                      : `No payments with status "${filter}".`
                }
              />
            ) : (
              <>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transfer Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.ref || payment.id.slice(0, 8)}
                            </div>
                            {payment.proofUrl && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Upload className="h-3 w-3 mr-1" />
                                Proof attached
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PaymentInvoiceDisplay payment={payment} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {(payment as any).senderName || 'N/A'}
                            </div>
                            {(payment as any).transferDate && (
                              <div className="text-sm text-gray-500">
                                {formatDate((payment as any).transferDate)}
                              </div>
                            )}
                            {payment.proofUrl && (
                              <div className="flex items-center mt-1 space-x-2">
                                <a
                                  href={payment.proofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900 flex items-center text-xs"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  View Proof
                                </a>
                                <a
                                  href={payment.proofUrl}
                                  download
                                  className="text-green-600 hover:text-green-900 flex items-center text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={payment.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment.createdBy.name}</div>
                            <div className="text-sm text-gray-500">{payment.createdBy.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/payments/${payment.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.perPage) + 1} to{' '}
                      {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm border rounded-lg ${
                            page === pagination.page
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Submission Modal */}
      <PaymentSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        outstandingInvoices={outstandingInvoices}
        userBalance={userBalance}
        onSubmit={handlePaymentSubmit}
      />
    </AppLayout>
  )
}