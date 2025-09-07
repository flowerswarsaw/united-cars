'use client'

import { useState, useRef } from 'react'
import { X, Upload, CreditCard, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface OutstandingInvoice {
  id: string
  number: string
  amount: number
  dueDate: string
}

interface PaymentSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  outstandingInvoices: OutstandingInvoice[]
  userBalance: number
  onSubmit: () => void
}

type PaymentMethod = 'bank_transfer' | 'balance'

export function PaymentSubmissionModal({ 
  isOpen, 
  onClose, 
  outstandingInvoices, 
  userBalance, 
  onSubmit 
}: PaymentSubmissionModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [amount, setAmount] = useState<number>(0)
  const [senderName, setSenderName] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const totalAllocated = Object.values(allocations).reduce((sum, allocation) => sum + allocation, 0)
  const remainingAmount = amount - totalAllocated
  const newBalance = paymentMethod === 'balance' ? userBalance - amount : userBalance + Math.max(0, remainingAmount)

  const handleAllocationChange = (invoiceId: string, allocationAmount: number) => {
    const invoice = outstandingInvoices.find(inv => inv.id === invoiceId)
    if (!invoice) return
    
    // Ensure allocation doesn't exceed invoice amount
    const maxAllocation = Math.min(invoice.amount, allocationAmount)
    const validAllocation = Math.max(0, maxAllocation)
    
    setAllocations(prev => ({
      ...prev,
      [invoiceId]: validAllocation
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB')
        return
      }
      setProofFile(file)
    }
  }

  const validateForm = () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return false
    }

    if (totalAllocated > amount) {
      toast.error('Total allocation cannot exceed payment amount')
      return false
    }

    if (paymentMethod === 'balance' && amount > userBalance) {
      toast.error('Insufficient balance')
      return false
    }

    if (paymentMethod === 'bank_transfer') {
      if (!senderName.trim()) {
        toast.error('Please enter the sender name')
        return false
      }
      if (!transferDate) {
        toast.error('Please select the transfer date')
        return false
      }
      if (!proofFile) {
        toast.error('Please upload payment confirmation PDF')
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('method', paymentMethod)
      formData.append('amount', amount.toString())
      
      if (paymentMethod === 'bank_transfer') {
        formData.append('senderName', senderName)
        formData.append('transferDate', transferDate)
        if (proofFile) {
          formData.append('proofFile', proofFile)
        }
      }

      // Add manual allocations
      formData.append('allocations', JSON.stringify(allocations))

      const response = await fetch('/api/payments', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Payment submitted successfully')
        onSubmit()
        onClose()
        resetForm()
      } else {
        toast.error(result.error || 'Failed to submit payment')
      }
    } catch (error) {
      toast.error('Error submitting payment')
      console.error('Payment submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setPaymentMethod('bank_transfer')
    setAmount(0)
    setSenderName('')
    setTransferDate('')
    setProofFile(null)
    setAllocations({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Submit Payment</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Outstanding Invoices Summary */}
            {outstandingInvoices.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-amber-800 mb-2">Outstanding Invoices</h3>
                <div className="space-y-1">
                  {outstandingInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between text-sm text-amber-700">
                      <span>{invoice.number}</span>
                      <span>{formatCurrency(invoice.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-amber-200 pt-1 mt-2">
                    <div className="flex justify-between text-sm font-medium text-amber-800">
                      <span>Total Outstanding:</span>
                      <span>{formatCurrency(totalOutstanding)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Balance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">Current Balance:</span>
                <span className="text-lg font-semibold text-blue-900">
                  {formatCurrency(userBalance)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-5 w-5 text-blue-600 mb-2" />
                  <div className="font-medium">Bank Transfer</div>
                  <div className="text-sm text-gray-500">Transfer money from bank</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('balance')}
                  disabled={userBalance <= 0}
                  className={`p-4 border-2 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentMethod === 'balance'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-green-600 mb-2" />
                  <div className="font-medium">Pay from Balance</div>
                  <div className="text-sm text-gray-500">Use account balance</div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Bank Transfer Fields */}
            {paymentMethod === 'bank_transfer' && (
              <>
                <div>
                  <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="Name of the person/company sending the transfer"
                  />
                </div>

                <div>
                  <label htmlFor="transferDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="transferDate"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="proofFile" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Confirmation PDF <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="proofFile"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose PDF File
                    </button>
                    {proofFile && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {proofFile.name}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload bank transfer confirmation or payment receipt (PDF only, max 10MB)
                  </p>
                </div>
              </>
            )}

            {/* Manual Payment Allocation */}
            {amount > 0 && outstandingInvoices.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Allocate Payment to Invoices</h3>
                <div className="space-y-3">
                  {outstandingInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between bg-white rounded border p-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{invoice.number}</div>
                        <div className="text-xs text-gray-500">
                          Outstanding: {formatCurrency(invoice.amount)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={invoice.amount}
                            value={allocations[invoice.id] || ''}
                            onChange={(e) => handleAllocationChange(invoice.id, parseFloat(e.target.value) || 0)}
                            className="pl-8 pr-3 py-1 w-24 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Allocation Summary */}
                <div className="mt-4 pt-3 border-t border-gray-300 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Allocated:</span>
                    <span className={`font-medium ${totalAllocated > amount ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(totalAllocated)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Going to Balance:</span>
                    <span className={`font-medium ${remainingAmount < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatCurrency(Math.max(0, remainingAmount))}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>New Balance:</span>
                      <span className={newBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(newBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Over-allocation Warning */}
                {totalAllocated > amount && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-700">
                        You've allocated {formatCurrency(totalAllocated - amount)} more than your payment amount.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Balance Insufficient Warning */}
            {paymentMethod === 'balance' && amount > userBalance && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">
                    Insufficient balance. You need {formatCurrency(amount - userBalance)} more to make this payment.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-4">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (paymentMethod === 'balance' && amount > userBalance)}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}