'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard, AlertCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import toast from 'react-hot-toast'

interface FinancialSummary {
  totalInvoiced: number
  totalPaid: number
  totalPending: number
  outstandingBalance: number
  currency: string
  invoiceStats: {
    draft: number
    sent: number
    paid: number
    overdue: number
    cancelled: number
  }
  paymentStats: {
    submitted: number
    processing: number
    completed: number
    failed: number
  }
}

export default function BalancePage() {
  const { user, loading: sessionLoading } = useSession()
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinancialSummary()
  }, [])

  const fetchFinancialSummary = async () => {
    try {
      // Fetch both invoices and payments to calculate summary
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/payments')
      ])

      if (!invoicesRes.ok || !paymentsRes.ok) {
        throw new Error('Failed to fetch financial data')
      }

      const invoicesData = await invoicesRes.json()
      const paymentsData = await paymentsRes.json()

      const invoices = invoicesData.invoices || []
      const payments = paymentsData.payments || []

      // Calculate summary from the data
      const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
      const totalPaid = payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: number, p: any) => sum + p.amount, 0)
      const totalPending = payments
        .filter((p: any) => ['SUBMITTED', 'PROCESSING'].includes(p.status))
        .reduce((sum: number, p: any) => sum + p.amount, 0)

      const invoiceStats = {
        draft: invoices.filter((i: any) => i.status === 'DRAFT').length,
        sent: invoices.filter((i: any) => i.status === 'SENT').length,
        paid: invoices.filter((i: any) => i.status === 'PAID').length,
        overdue: invoices.filter((i: any) => i.status === 'OVERDUE').length,
        cancelled: invoices.filter((i: any) => i.status === 'CANCELLED').length,
      }

      const paymentStats = {
        submitted: payments.filter((p: any) => p.status === 'SUBMITTED').length,
        processing: payments.filter((p: any) => p.status === 'PROCESSING').length,
        completed: payments.filter((p: any) => p.status === 'COMPLETED').length,
        failed: payments.filter((p: any) => p.status === 'FAILED').length,
      }

      setSummary({
        totalInvoiced,
        totalPaid,
        totalPending,
        outstandingBalance: totalInvoiced - totalPaid,
        currency: 'USD',
        invoiceStats,
        paymentStats
      })

    } catch (error) {
      toast.error('Error fetching financial summary')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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
        <LoadingState text="Loading financial summary..." />
      </AppLayout>
    )
  }

  if (!summary) {
    return (
      <AppLayout user={user}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Unable to load financial data</h2>
          <p className="text-gray-500">Please try refreshing the page.</p>
        </div>
      </AppLayout>
    )
  }

  const balanceColor = summary.outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'
  const balanceIcon = summary.outstandingBalance >= 0 ? TrendingUp : TrendingDown

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Financial Balance"
        description="Overview of invoices, payments, and outstanding balances"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Balance' }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Invoiced</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(summary.totalInvoiced, summary.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Paid</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(summary.totalPaid, summary.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(summary.totalPending, summary.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${summary.outstandingBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {React.createElement(balanceIcon, { 
                    className: `h-6 w-6 ${summary.outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'}` 
                  })}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
                  <p className={`text-2xl font-semibold ${balanceColor}`}>
                    {formatCurrency(summary.outstandingBalance, summary.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invoice Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Receipt className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Invoice Summary</h3>
                </div>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Draft</dt>
                    <dd className="text-sm text-gray-900">{summary.invoiceStats.draft}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Sent</dt>
                    <dd className="text-sm text-gray-900">{summary.invoiceStats.sent}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Paid</dt>
                    <dd className="text-sm text-green-600 font-medium">{summary.invoiceStats.paid}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Overdue</dt>
                    <dd className="text-sm text-red-600 font-medium">{summary.invoiceStats.overdue}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Cancelled</dt>
                    <dd className="text-sm text-gray-500">{summary.invoiceStats.cancelled}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Payment Summary</h3>
                </div>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                    <dd className="text-sm text-blue-600 font-medium">{summary.paymentStats.submitted}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Processing</dt>
                    <dd className="text-sm text-yellow-600 font-medium">{summary.paymentStats.processing}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Completed</dt>
                    <dd className="text-sm text-green-600 font-medium">{summary.paymentStats.completed}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Failed</dt>
                    <dd className="text-sm text-red-600 font-medium">{summary.paymentStats.failed}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}