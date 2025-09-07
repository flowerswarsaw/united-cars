'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import {
  Receipt,
  Building2,
  User,
  Car,
  Hash,
  CreditCard,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Minus
} from 'lucide-react'

interface PaymentLineItem {
  id: string
  description: string
  amount: number
}

interface InvoiceFormData {
  company: 'united_cars' | 'copart' | 'iaa'
  date: string
  customerType: 'private' | 'legal_entity'
  customerName: string
  documentNumber: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  vinNumber: string
  lotStockNumber: string
  memberBuyerNumber?: string
  purposeOfPayment: string
  price: number
  additionalPayments: PaymentLineItem[]
}

type Company = 'united_cars' | 'copart' | 'iaa'
type CustomerType = 'private' | 'legal_entity'

const COMPANY_OPTIONS: Array<{value: Company; label: string}> = [
  { value: 'united_cars', label: 'United Cars' },
  { value: 'copart', label: 'Copart' },
  { value: 'iaa', label: 'IAA (Insurance Auto Auctions)' }
]

const CUSTOMER_TYPE_OPTIONS: Array<{value: CustomerType; label: string}> = [
  { value: 'private', label: 'Private Individual' },
  { value: 'legal_entity', label: 'Legal Entity/Company' }
]

const PURPOSE_OPTIONS = [
  'Vehicle Purchase',
  'Service Fee',
  'Transportation Cost',
  'Storage Fee',
  'Documentation Fee',
  'Inspection Fee',
  'Title Processing',
  'Insurance Premium',
  'Customs Clearance',
  'Other (specify below)'
]

export default function InvoiceGeneratorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const { user, loading: sessionLoading } = useSession()

  const [formData, setFormData] = useState<InvoiceFormData>({
    company: 'united_cars',
    date: new Date().toISOString().split('T')[0],
    customerType: 'private',
    customerName: '',
    documentNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vinNumber: '',
    lotStockNumber: '',
    memberBuyerNumber: '',
    purposeOfPayment: 'Vehicle Purchase',
    price: 0,
    additionalPayments: []
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InvoiceFormData, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof InvoiceFormData, boolean>>>({})

  useEffect(() => {
    if (user && !sessionLoading) {
      setLoading(false)
    }
  }, [user, sessionLoading])

  const validateField = (field: keyof InvoiceFormData, value: any): string | null => {
    switch (field) {
      case 'customerName':
        return !value?.trim() ? 'Customer name is required' : null
      case 'documentNumber':
        return !value?.trim() ? `${formData.customerType === 'private' ? 'Passport/ID number' : 'Company registration number'} is required` : null
      case 'street':
        return !value?.trim() ? 'Street address is required' : null
      case 'city':
        return !value?.trim() ? 'City is required' : null
      case 'state':
        return !value?.trim() ? 'State is required' : null
      case 'postalCode':
        return !value?.trim() ? 'ZIP/Postal code is required' : null
      case 'country':
        return !value?.trim() ? 'Country is required' : null
      case 'vehicleMake':
        return !value?.trim() ? 'Vehicle make is required' : null
      case 'vehicleModel':
        return !value?.trim() ? 'Vehicle model is required' : null
      case 'vehicleYear':
        const year = parseInt(value)
        if (!value || isNaN(year)) return 'Vehicle year is required'
        if (year < 1900 || year > new Date().getFullYear() + 1) return 'Invalid vehicle year'
        return null
      case 'vinNumber':
        if (!value?.trim()) return 'VIN number is required'
        if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(value.trim())) return 'Invalid VIN format (17 characters, no I, O, Q)'
        return null
      case 'lotStockNumber':
        return !value?.trim() ? 'Lot/Stock number is required' : null
      case 'memberBuyerNumber':
        if ((formData.company === 'copart' || formData.company === 'iaa') && !value?.trim()) {
          return 'Member/Buyer number is required for Copart and IAA'
        }
        return null
      case 'purposeOfPayment':
        return !value?.trim() ? 'Purpose of payment is required' : null
      case 'price':
        const price = parseFloat(value?.toString() || '0')
        if (isNaN(price) || price <= 0) return 'Price must be greater than 0'
        return null
      default:
        return null
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InvoiceFormData, string>> = {}
    let isValid = true

    // Validate main form fields
    Object.keys(formData).forEach((key) => {
      if (key === 'additionalPayments') return // Skip, handle separately
      const field = key as keyof InvoiceFormData
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    // Validate additional payment items for United Cars
    if (formData.company === 'united_cars' && formData.additionalPayments.length > 0) {
      formData.additionalPayments.forEach((payment, index) => {
        if (!payment.description?.trim()) {
          newErrors[`additionalPayment_${index}_description` as keyof InvoiceFormData] = `Payment item #${index + 2} description is required`
          isValid = false
        }
        if (!payment.amount || payment.amount <= 0) {
          newErrors[`additionalPayment_${index}_amount` as keyof InvoiceFormData] = `Payment item #${index + 2} amount must be greater than 0`
          isValid = false
        }
      })
    }

    setErrors(newErrors)
    return isValid
  }

  const handleFieldChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleBlur = (field: keyof InvoiceFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field])
    setErrors(prev => ({ ...prev, [field]: error || undefined }))
  }

  const generateInvoice = async () => {
    if (!validateForm()) {
      return
    }

    setGenerating(true)
    
    try {
      const response = await fetch('/api/operations/invoice-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: formData.company,
          date: formData.date,
          customerType: formData.customerType,
          customerName: formData.customerName,
          documentNumber: formData.documentNumber,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          vinNumber: formData.vinNumber,
          lotStockNumber: formData.lotStockNumber,
          memberBuyerNumber: formData.memberBuyerNumber,
          purposeOfPayment: formData.purposeOfPayment,
          price: formData.price,
          additionalPayments: formData.additionalPayments
        })
      })

      if (!response.ok) {
        // Handle validation and server errors gracefully
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        if (response.status === 400 && errorData.details) {
          // Display validation errors to user
          if (Array.isArray(errorData.details)) {
            const fieldErrors: Partial<Record<keyof InvoiceFormData, string>> = {}
            errorData.details.forEach((err: any) => {
              if (err.field && err.message) {
                fieldErrors[err.field as keyof InvoiceFormData] = err.message
              }
            })
            setErrors(fieldErrors)
          }
          console.error('Validation errors:', errorData.details)
          return
        }
        
        throw new Error(errorData.details || errorData.error || 'Failed to generate invoice')
      }

      // Get invoice number from response headers
      const invoiceNumber = response.headers.get('X-Invoice-Number') || `INV-${Date.now()}`
      setLastGenerated(invoiceNumber)

      // Create blob from PDF response and trigger download
      const pdfBlob = await response.blob()
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('Invoice generated successfully:', invoiceNumber)
      
    } catch (error) {
      console.error('Failed to generate invoice:', error)
      
      // Antifragile error handling - show user-friendly message
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      // Could add toast notification here
      alert(`Invoice generation failed: ${errorMessage}. Please check your information and try again.`)
      
    } finally {
      setGenerating(false)
    }
  }

  const addPayment = () => {
    // Only available for United Cars invoices
    if (formData.company !== 'united_cars') return
    
    const newPaymentItem: PaymentLineItem = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      description: 'Vehicle Purchase', // Default to same as original
      amount: 0
    }
    
    setFormData(prev => ({
      ...prev,
      additionalPayments: [...prev.additionalPayments, newPaymentItem]
    }))
  }

  const updatePaymentItem = (id: string, field: 'description' | 'amount', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      additionalPayments: prev.additionalPayments.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }))
  }

  const removePaymentItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      additionalPayments: prev.additionalPayments.filter(item => item.id !== id)
    }))
  }

  const getTotalAmount = () => {
    const additionalTotal = formData.additionalPayments.reduce((sum, item) => sum + (item.amount || 0), 0)
    return formData.price + additionalTotal
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading invoice generator..." />
        </div>
      </AppLayout>
    )
  }

  const requiresMemberNumber = formData.company === 'copart' || formData.company === 'iaa'

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Invoice Generator"
        description="Generate professional invoices for United Cars, Copart, and IAA transactions"
        breadcrumbs={[{ label: 'Operations' }, { label: 'Invoice Generator' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto">
          <style jsx>{`
            /* Hide number input arrows */
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            
            input[type="number"] {
              -moz-appearance: textfield;
            }
            
            /* Global form field styling for proper text positioning */
            input,
            select,
            textarea {
              padding-left: 12px !important;
              padding-right: 12px !important;
              box-sizing: border-box;
            }
            
            /* Override Tailwind classes with proper spacing */
            .px-3 {
              padding-left: 12px !important;
              padding-right: 12px !important;
            }
            
            /* Special handling for inputs with left icons */
            input.pl-10,
            .pl-10 input {
              padding-left: 40px !important;
              padding-right: 12px !important;
            }
            
            /* Special handling for inputs with dollar sign */
            input.pl-7,
            .pl-7 input {
              padding-left: 28px !important;
            }
            
            /* Special handling for inputs with right elements */
            input.pr-10,
            .pr-10 input {
              padding-right: 40px !important;
            }
            
            /* Ensure consistent height and alignment */
            input,
            select {
              height: 36px;
              line-height: 1.5;
              display: flex;
              align-items: center;
            }
            
            /* Fix select dropdown appearance */
            select {
              appearance: none;
              background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
              background-position: right 8px center;
              background-repeat: no-repeat;
              background-size: 16px 12px;
              padding-right: 32px !important;
            }
          `}</style>

          {/* Main Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4">
              <form className="space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-100 flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleFieldChange('company', e.target.value as Company)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm h-9 px-3"
                      >
                        {COMPANY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        value={formData.date}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm h-9 px-3"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-100 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    Customer Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label htmlFor="customerType" className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="customerType"
                        value={formData.customerType}
                        onChange={(e) => handleFieldChange('customerType', e.target.value as CustomerType)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm h-9 px-3"
                      >
                        {CUSTOMER_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.customerType === 'private' ? 'Full Name' : 'Company Name'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => handleFieldChange('customerName', e.target.value)}
                        onBlur={() => handleBlur('customerName')}
                        className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                          touched.customerName && errors.customerName 
                            ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder={formData.customerType === 'private' ? 'John Doe' : 'Company LLC'}
                      />
                      {touched.customerName && errors.customerName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                          {errors.customerName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.customerType === 'private' ? 'ID/Passport Number' : 'Registration Number'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="documentNumber"
                      value={formData.documentNumber}
                      onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
                      onBlur={() => handleBlur('documentNumber')}
                      className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                        touched.documentNumber && errors.documentNumber 
                          ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                      placeholder={formData.customerType === 'private' ? 'A12345678' : 'LLC-123456789'}
                    />
                    {touched.documentNumber && errors.documentNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                        {errors.documentNumber}
                      </p>
                    )}
                  </div>
                  
                  {/* Address Section */}
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Address Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="street"
                          value={formData.street}
                          onChange={(e) => handleFieldChange('street', e.target.value)}
                          onBlur={() => handleBlur('street')}
                          className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                            touched.street && errors.street 
                              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                          placeholder="123 Main Street"
                        />
                        {touched.street && errors.street && (
                          <p className="mt-1 text-xs text-red-600">{errors.street}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                            onBlur={() => handleBlur('city')}
                            className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                              touched.city && errors.city 
                                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                            placeholder="Atlanta"
                          />
                          {touched.city && errors.city && (
                            <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="state"
                            value={formData.state}
                            onChange={(e) => handleFieldChange('state', e.target.value)}
                            onBlur={() => handleBlur('state')}
                            className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                              touched.state && errors.state 
                                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                            placeholder="GA"
                          />
                          {touched.state && errors.state && (
                            <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                            onBlur={() => handleBlur('postalCode')}
                            className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                              touched.postalCode && errors.postalCode 
                                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                            placeholder="30309"
                          />
                          {touched.postalCode && errors.postalCode && (
                            <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="country"
                            value={formData.country}
                            onChange={(e) => handleFieldChange('country', e.target.value)}
                            onBlur={() => handleBlur('country')}
                            className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                              touched.country && errors.country 
                                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                          >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="Mexico">Mexico</option>
                            <option value="Other">Other</option>
                          </select>
                          {touched.country && errors.country && (
                            <p className="mt-1 text-xs text-red-600">{errors.country}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-100 flex items-center">
                    <Car className="h-4 w-4 mr-2 text-gray-500" />
                    Vehicle Information
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="vehicleMake" className="block text-sm font-medium text-gray-700 mb-1">
                        Make <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="vehicleMake"
                        value={formData.vehicleMake}
                        onChange={(e) => handleFieldChange('vehicleMake', e.target.value)}
                        onBlur={() => handleBlur('vehicleMake')}
                        className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                          touched.vehicleMake && errors.vehicleMake 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="Toyota"
                      />
                      {touched.vehicleMake && errors.vehicleMake && (
                        <p className="mt-1 text-sm text-red-600">{errors.vehicleMake}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700 mb-1">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={(e) => handleFieldChange('vehicleModel', e.target.value)}
                        onBlur={() => handleBlur('vehicleModel')}
                        className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                          touched.vehicleModel && errors.vehicleModel 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="Camry"
                      />
                      {touched.vehicleModel && errors.vehicleModel && (
                        <p className="mt-1 text-sm text-red-600">{errors.vehicleModel}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="vehicleYear" className="block text-sm font-medium text-gray-700 mb-1">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={(e) => handleFieldChange('vehicleYear', e.target.value)}
                        onBlur={() => handleBlur('vehicleYear')}
                        min="1900"
                        max="2026"
                        className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                          touched.vehicleYear && errors.vehicleYear 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="2020"
                      />
                      {touched.vehicleYear && errors.vehicleYear && (
                        <p className="mt-1 text-xs text-red-600">{errors.vehicleYear}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label htmlFor="vinNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        VIN Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="vinNumber"
                        value={formData.vinNumber}
                        onChange={(e) => handleFieldChange('vinNumber', e.target.value.toUpperCase())}
                        onBlur={() => handleBlur('vinNumber')}
                        maxLength={17}
                        className={`block w-full rounded-md shadow-sm text-sm uppercase h-9 px-3 ${
                          touched.vinNumber && errors.vinNumber 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="1HGBH41JXMN109186"
                      />
                      {touched.vinNumber && errors.vinNumber && (
                        <p className="mt-1 text-xs text-red-600">{errors.vinNumber}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lotStockNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Lot/Stock Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          id="lotStockNumber"
                          value={formData.lotStockNumber}
                          onChange={(e) => handleFieldChange('lotStockNumber', e.target.value)}
                          onBlur={() => handleBlur('lotStockNumber')}
                          className={`pl-10 pr-3 block w-full rounded-md shadow-sm text-sm h-9 ${
                            touched.lotStockNumber && errors.lotStockNumber 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          placeholder="45123456"
                        />
                      </div>
                      {touched.lotStockNumber && errors.lotStockNumber && (
                        <p className="mt-1 text-xs text-red-600">{errors.lotStockNumber}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Member/Buyer Number - Only for Copart/IAA */}
                  {requiresMemberNumber && (
                    <div className="mt-3">
                      <label htmlFor="memberBuyerNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.company === 'copart' ? 'Copart Member Number' : 'IAA Buyer Number'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="memberBuyerNumber"
                        value={formData.memberBuyerNumber || ''}
                        onChange={(e) => handleFieldChange('memberBuyerNumber', e.target.value)}
                        onBlur={() => handleBlur('memberBuyerNumber')}
                        className={`block w-full rounded-md shadow-sm text-sm h-9 px-3 ${
                          touched.memberBuyerNumber && errors.memberBuyerNumber 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder={formData.company === 'copart' ? 'CP123456' : 'IAA987654'}
                      />
                      {touched.memberBuyerNumber && errors.memberBuyerNumber && (
                        <p className="mt-1 text-xs text-red-600">{errors.memberBuyerNumber}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Information Section */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-100 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      Payment Information
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="purposeOfPayment" className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose of Payment <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="purposeOfPayment"
                        value={formData.purposeOfPayment}
                        onChange={(e) => handleFieldChange('purposeOfPayment', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-9 px-3"
                      >
                        {PURPOSE_OPTIONS.map(purpose => (
                          <option key={purpose} value={purpose}>{purpose}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Price (USD) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="price"
                          value={formData.price || ''}
                          onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                          onBlur={() => handleBlur('price')}
                          min="0"
                          step="0.01"
                          className={`pl-7 pr-3 block w-full rounded-md shadow-sm text-sm h-9 ${
                            touched.price && errors.price 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {touched.price && errors.price && (
                        <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Payment Items - Only for United Cars */}
                  {formData.company === 'united_cars' && formData.additionalPayments.length > 0 && (
                    <div className="mt-3">
                      <div className="space-y-3">
                        {formData.additionalPayments.map((payment, index) => (
                          <div key={payment.id} className="grid grid-cols-1 lg:grid-cols-2 gap-3 relative">
                            <div>
                              <label htmlFor={`additionalPurpose-${payment.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Purpose of Payment #{index + 2} <span className="text-red-500">*</span>
                              </label>
                              <select
                                id={`additionalPurpose-${payment.id}`}
                                value={payment.description}
                                onChange={(e) => updatePaymentItem(payment.id, 'description', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-9 px-3"
                              >
                                <option value="">Select purpose...</option>
                                {PURPOSE_OPTIONS.map(purpose => (
                                  <option key={purpose} value={purpose}>{purpose}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="relative">
                              <label htmlFor={`additionalPrice-${payment.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Price (USD) <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                  type="number"
                                  id={`additionalPrice-${payment.id}`}
                                  value={payment.amount || ''}
                                  onChange={(e) => updatePaymentItem(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  className="pl-7 pr-10 block w-full rounded-md shadow-sm text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                                  placeholder="0.00"
                                />
                                {/* Remove button positioned in input */}
                                <button
                                  type="button"
                                  onClick={() => removePaymentItem(payment.id)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-400 hover:text-red-600 transition-colors"
                                  title="Remove this payment item"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total Amount Display */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">Total Amount:</span>
                          <span className="text-lg font-semibold text-blue-600">
                            ${getTotalAmount().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Add Payment Button - Only for United Cars */}
                    {formData.company === 'united_cars' && (
                      <button
                        type="button"
                        onClick={addPayment}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Item
                      </button>
                    )}
                    
                    {/* Create Invoice Button */}
                    <button
                      type="button"
                      onClick={generateInvoice}
                      disabled={generating}
                      className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Create Invoice
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Success Message */}
                  {lastGenerated && !generating && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        <p className="text-sm text-green-800">
                          Invoice <span className="font-medium">{lastGenerated}</span> generated successfully! 
                          The PDF has been saved to your downloads folder.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}