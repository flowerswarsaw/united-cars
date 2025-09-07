'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, FileText, Download, Eye, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from '@/hooks/useSession'

interface Invoice {
  id: string
  number: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED'
  total: number
  subtotal: number
  currency: string
  issuedAt: string
  dueDate: string | null
  createdAt: string
  org: {
    name: string
  }
  lines: Array<{
    id: string
    description: string
    qty: number
    unitPrice: number
    vehicle?: {
      vin: string
      make: string | null
      model: string | null
      year: number | null
    }
  }>
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
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
    PAID: 0,
    OVERDUE: 0,
    CANCELED: 0
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    fetchInvoices()
  }, [filter, pagination.page, searchTerm])

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      })
      
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/invoices?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setInvoices(data.invoices || [])
        setPagination(data.pagination)
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      } else {
        toast.error(`Failed to fetch invoices: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error fetching invoices')
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Number(amount))
  }

  const filteredInvoices = invoices

  const filterOptions = [
    { value: 'all', label: 'All Invoices', count: statusCounts.all },
    { value: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
    { value: 'PAID', label: 'Paid', count: statusCounts.PAID },
    { value: 'OVERDUE', label: 'Overdue', count: statusCounts.OVERDUE },
    { value: 'CANCELED', label: 'Canceled', count: statusCounts.CANCELED },
  ]

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleDownloadPDF = async (invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceNumber}/pdf`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoice-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download PDF')
    }
  }

  const handleCancelInvoice = async (invoiceId: string) => {
    const reason = prompt('Please provide a reason for canceling this invoice:')
    if (!reason) return

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        toast.success('Invoice canceled successfully')
        fetchInvoices()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel invoice')
      }
    } catch (error) {
      toast.error('Error canceling invoice')
      console.error('Error canceling invoice:', error)
    }
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Invoices"
        description="Manage customer invoices and billing"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices' }]}
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
                          ? 'bg-purple-100 text-purple-700'
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
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                {user?.role === 'ADMIN' && (
                  <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Invoices {filteredInvoices.length > 0 && `(${pagination.total})`}
              </h2>
            </div>
          </div>

          <div className="p-6">
            {loading || sessionLoading ? (
              <LoadingState text="Loading invoices..." />
            ) : filteredInvoices.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No invoices found"
                description={
                  searchTerm 
                    ? `No invoices match "${searchTerm}"`
                    : filter === 'all'
                      ? 'No invoices have been created yet.'
                      : `No invoices with status "${filter}".`
                }
              />
            ) : (
              <>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issued
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.lines.length} line{invoice.lines.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={invoice.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.org.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invoice.issuedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/invoices/${invoice.number}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button 
                                onClick={() => handleDownloadPDF(invoice.number)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {user?.role === 'ADMIN' && ['PENDING', 'OVERDUE'].includes(invoice.status) && (
                                <button 
                                  onClick={() => handleCancelInvoice(invoice.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cancel Invoice"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
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
                              ? 'bg-purple-600 text-white border-purple-600'
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
    </AppLayout>
  )
}