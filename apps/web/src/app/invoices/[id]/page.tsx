'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Receipt, ArrowLeft, Eye, Download, Clock, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import toast from 'react-hot-toast'

interface InvoiceDetail {
  id: string
  number: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED'
  total: number
  subtotal: number
  vat: number
  currency: string
  issuedAt: string | null
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
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

const statusConfig = {
  PENDING: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    label: 'Pending'
  },
  PAID: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Paid'
  },
  OVERDUE: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    label: 'Overdue'
  },
  CANCELED: {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: XCircle,
    label: 'Canceled'
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const invoiceId = params.id as string

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      const data = await response.json()
      
      if (response.ok) {
        setInvoice(data.invoice)
      } else {
        toast.error(`Failed to fetch invoice: ${data.error}`)
        router.push('/invoices')
      }
    } catch (error) {
      toast.error('Error fetching invoice details')
      console.error('Error:', error)
      router.push('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not issued'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading invoice details..." />
      </AppLayout>
    )
  }

  if (!invoice) {
    return (
      <AppLayout user={user}>
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Invoice not found</h2>
          <p className="text-gray-500 mb-6">The requested invoice could not be found.</p>
          <Link href="/invoices" className="text-blue-600 hover:text-blue-800">
            ← Back to Invoices
          </Link>
        </div>
      </AppLayout>
    )
  }

  // Safely get status config with fallback
  const getStatusInfo = (status: string) => {
    const validStatuses: Record<string, any> = statusConfig
    return validStatuses[status] || statusConfig.PENDING
  }
  
  const statusInfo = getStatusInfo(invoice.status)
  const StatusIcon = statusInfo.icon
  const lineTotal = (line: any) => line.qty * line.unitPrice

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}/pdf`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoice-${invoice.number}.pdf`
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

  return (
    <AppLayout user={user}>
      {/* Header with Actions - Only visible on screen */}
      <div className="print:hidden">
        <PageHeader
          title={invoice.number}
          description={`Invoice for ${invoice.org.name} • ${formatCurrency(invoice.total, invoice.currency)}`}
          breadcrumbs={[
            { label: 'Finance', href: '/invoices' },
            { label: 'Invoices', href: '/invoices' },
            { label: invoice.number }
          ]}
          action={
            <div className="flex items-center space-x-3">
              <button 
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Print
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <Link
                href="/invoices"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Link>
            </div>
          }
        />
      </div>

      {/* Professional Invoice Document */}
      <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
        <div className="max-w-4xl mx-auto py-8 print:py-0">
          <div className="bg-white shadow-lg print:shadow-none">
            {/* Invoice Header */}
            <div className="px-8 py-8 border-b border-gray-200">
              <div className="flex justify-between items-start">
                {/* Company Info (United Cars) */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">UNITED CARS</h1>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Vehicle Import & Export Services</p>
                    <p>1234 Commerce Street, Suite 500</p>
                    <p>Los Angeles, CA 90028, USA</p>
                    <p>Phone: +1 (555) 123-4567</p>
                    <p>Email: billing@unitedcars.com</p>
                    <p>Tax ID: 12-3456789</p>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">INVOICE</h2>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between min-w-[200px]">
                      <span className="text-gray-600">Invoice #:</span>
                      <span className="font-semibold">{invoice.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : 'Not issued'}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-600">Status:</span>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Bill To:</h3>
                  <div className="text-sm text-gray-900 space-y-1">
                    <p className="font-semibold text-lg">{invoice.org.name}</p>
                    <p>Attention: Accounts Payable</p>
                    <p>123 Business Avenue</p>
                    <p>City, State 12345</p>
                    <p>United States</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Payment Terms:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Net 30 Days</p>
                    <p>Payment due within 30 days of invoice date</p>
                    <p>Late fees may apply after due date</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="px-8 py-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Description</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Vehicle</th>
                    <th className="text-center py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide w-16">Qty</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide w-24">Rate</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line, index) => (
                    <tr key={line.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="py-4 text-sm text-gray-900">
                        <div className="font-medium">{line.description}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-900">
                        {line.vehicle ? (
                          <div>
                            <div className="font-medium">{line.vehicle.vin}</div>
                            <div className="text-gray-600 text-xs">
                              {line.vehicle.year} {line.vehicle.make} {line.vehicle.model}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-4 text-center text-sm text-gray-900">
                        {line.qty}
                      </td>
                      <td className="py-4 text-right text-sm text-gray-900">
                        {formatCurrency(line.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(lineTotal(line), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Totals */}
            <div className="px-8 py-6 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">{formatCurrency(invoice.vat, invoice.currency)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total Due:</span>
                      <span className="text-blue-600">{formatCurrency(invoice.total, invoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Payment Instructions */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {invoice.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Notes:</h3>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Payment Instructions:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Wire Transfer:</p>
                    <p>Bank: First National Bank</p>
                    <p>Account: 1234567890</p>
                    <p>Routing: 987654321</p>
                    <p className="pt-2">Please include invoice number in payment reference.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-800 text-white text-center">
              <p className="text-sm">Thank you for your business!</p>
              <p className="text-xs text-gray-300 mt-1">
                Questions about this invoice? Contact us at billing@unitedcars.com or +1 (555) 123-4567
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}