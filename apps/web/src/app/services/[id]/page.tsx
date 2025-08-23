'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wrench, ArrowLeft, Clock, CheckCircle, Play, XCircle, Eye, FileText, DollarSign, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

interface ServiceDetail {
  id: string
  type: 'inspection' | 'cleaning' | 'repair' | 'storage' | 'titlework'
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  priceUSD?: number
  notes?: string
  createdAt: string
  updatedAt: string
  vehicle: {
    id: string
    vin: string
    make?: string
    model?: string
    year?: number
    status: string
    org: {
      id: string
      name: string
      type: string
    }
  }
  org: {
    id: string
    name: string
    type: string
  }
}

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending Approval',
    nextStatuses: ['approved', 'rejected']
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved',
    nextStatuses: ['in_progress', 'rejected']
  },
  in_progress: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    label: 'In Progress',
    nextStatuses: ['completed', 'rejected']
  },
  completed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Completed',
    nextStatuses: []
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected',
    nextStatuses: []
  }
}

const serviceTypeConfig = {
  inspection: { icon: Eye, label: 'Inspection', color: 'bg-blue-50 text-blue-700' },
  cleaning: { icon: Wrench, label: 'Cleaning', color: 'bg-green-50 text-green-700' },
  repair: { icon: Wrench, label: 'Repair', color: 'bg-orange-50 text-orange-700' },
  storage: { icon: FileText, label: 'Storage', color: 'bg-purple-50 text-purple-700' },
  titlework: { icon: FileText, label: 'Title Work', color: 'bg-gray-50 text-gray-700' }
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showStatusUpdate, setShowStatusUpdate] = useState<string | null>(null)
  const [updateForm, setUpdateForm] = useState({
    priceUSD: '',
    notes: '',
    createInvoice: false
  })
  const [user] = useState({
    name: 'Admin User',
    email: 'admin@demo.com',
    roles: ['ADMIN'],
    orgName: 'United Cars Admin'
  })

  useEffect(() => {
    if (params.id) {
      fetchServiceDetail(params.id as string)
    }
  }, [params.id])

  const fetchServiceDetail = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`)
      const result = await response.json()

      if (response.ok) {
        setService(result.serviceRequest)
        setUpdateForm({
          priceUSD: result.serviceRequest.priceUSD?.toString() || '',
          notes: '',
          createInvoice: false
        })
      } else {
        toast.error(`Failed to load service: ${result.error}`)
        router.push('/services')
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      toast.error('Error loading service details')
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!service) return

    setUpdating(true)
    try {
      const requestBody: any = {
        status: newStatus,
        notes: updateForm.notes || undefined
      }

      // Add price if provided
      if (updateForm.priceUSD) {
        requestBody.priceUSD = parseFloat(updateForm.priceUSD)
      }

      // Add invoice creation flag if completing service
      if (newStatus === 'completed' && updateForm.createInvoice) {
        requestBody.createInvoice = true
      }

      const response = await fetch(`/api/services/${service.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (response.ok) {
        const actionMsg = newStatus === 'completed' && updateForm.createInvoice 
          ? `Service ${newStatus} and invoice created!` 
          : `Service status updated to ${newStatus}!`
        toast.success(actionMsg)
        setService(result.serviceRequest)
        setShowStatusUpdate(null)
        setUpdateForm({ priceUSD: '', notes: '', createInvoice: false })
      } else {
        toast.error(`Failed to update status: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error updating status')
    } finally {
      setUpdating(false)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  const getVehicleDisplay = () => {
    if (!service) return 'Unknown Vehicle'
    const parts = []
    if (service.vehicle.year) parts.push(service.vehicle.year.toString())
    if (service.vehicle.make) parts.push(service.vehicle.make)
    if (service.vehicle.model) parts.push(service.vehicle.model)
    return parts.join(' ') || 'Unknown Vehicle'
  }

  const canUpdateStatus = (user.roles.includes('ADMIN') || user.roles.includes('OPS')) && 
                          service?.status !== 'completed' && service?.status !== 'rejected'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Service request not found</p>
          <Link href="/services" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Services
          </Link>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[service.status].icon
  const ServiceIcon = serviceTypeConfig[service.type].icon
  const nextStatuses = statusConfig[service.status].nextStatuses

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/services"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ServiceIcon className="h-8 w-8 mr-3 text-gray-600" />
                {serviceTypeConfig[service.type].label} Service
              </h1>
              <p className="text-gray-600 mt-1">{getVehicleDisplay()} • VIN: {service.vehicle.vin}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[service.status].color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusConfig[service.status].label}
              </span>
              {canUpdateStatus && nextStatuses.length > 0 && (
                <div className="flex space-x-2">
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setShowStatusUpdate(status)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        status === 'approved' 
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : status === 'rejected' 
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Mark as {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Service Type</label>
                  <div className="mt-1 flex items-center">
                    <ServiceIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{serviceTypeConfig[service.type].label}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Status</label>
                  <p className="mt-1 text-sm text-gray-900">{statusConfig[service.status].label}</p>
                </div>
                {service.priceUSD && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Price</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {formatPrice(Number(service.priceUSD))}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(service.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(service.updatedAt)}</p>
                </div>
              </div>
              
              {service.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {service.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Status Update Modal */}
            {showStatusUpdate && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Update to {statusConfig[showStatusUpdate].label}
                      </h3>
                      <button
                        onClick={() => setShowStatusUpdate(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    
                    {(showStatusUpdate === 'approved' || showStatusUpdate === 'completed') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Price (USD) {showStatusUpdate === 'completed' ? '*' : '(optional)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={updateForm.priceUSD}
                          onChange={(e) => setUpdateForm({ ...updateForm, priceUSD: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 150.00"
                          required={showStatusUpdate === 'completed'}
                        />
                      </div>
                    )}

                    {showStatusUpdate === 'completed' && updateForm.priceUSD && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="createInvoice"
                          checked={updateForm.createInvoice}
                          onChange={(e) => setUpdateForm({ ...updateForm, createInvoice: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="createInvoice" className="ml-2 block text-sm text-gray-900">
                          Create invoice automatically
                        </label>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={updateForm.notes}
                        onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add any notes about this status update..."
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStatusUpdate(showStatusUpdate)}
                        disabled={updating || (showStatusUpdate === 'completed' && !updateForm.priceUSD)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                      >
                        {showStatusUpdate === 'completed' && updateForm.createInvoice && (
                          <Receipt className="h-4 w-4 mr-1" />
                        )}
                        {updating ? 'Updating...' : `Mark as ${statusConfig[showStatusUpdate].label}`}
                      </button>
                      <button
                        onClick={() => setShowStatusUpdate(null)}
                        disabled={updating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h2>
              <div className="space-y-4">
                {Object.entries(statusConfig).map(([status, config], index) => {
                  const isActive = service.status === status
                  const isPast = ['pending', 'approved', 'in_progress', 'completed'].indexOf(service.status) > index
                  const Icon = config.icon

                  // Skip rejected in timeline unless it's the current status
                  if (status === 'rejected' && service.status !== 'rejected') return null

                  return (
                    <div key={status} className="flex">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive || isPast ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isActive || isPast ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-blue-900' : isPast ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {config.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-blue-600">Current Status</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle</h2>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{getVehicleDisplay()}</p>
                <p className="text-xs text-gray-500 font-mono">{service.vehicle.vin}</p>
                <p className="text-xs text-gray-500">Status: {service.vehicle.status}</p>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
              <p className="text-sm text-gray-900">{service.vehicle.org.name}</p>
              <p className="text-xs text-gray-500 capitalize">{service.vehicle.org.type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
