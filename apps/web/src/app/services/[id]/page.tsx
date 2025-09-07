'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wrench, ArrowLeft, Clock, CheckCircle, Play, XCircle, DollarSign, Receipt, Camera, Star, Shield, Image, Palette, Droplets, AlertTriangle, Search, FileCheck, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from '@/hooks/useSession'

interface ServiceDetail {
  id: string
  type: 'video_service' | 'vip_full' | 'plastic_covering' | 'vip_fastest' | 'extra_photos' | 'window_covering' | 'moisture_absorber'
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled'
  priceUSD?: number
  notes?: string
  rejectionReason?: string | null
  statusHistory?: Array<{
    id: string
    status: string
    changedAt: string
    changedBy: string
    notes?: string | null
  }>
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
    nextStatuses: ['approved', 'rejected'],
    description: 'Service request is awaiting admin approval'
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved',
    nextStatuses: ['in_progress'],
    description: 'Service request has been approved and can begin'
  },
  in_progress: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    label: 'In Progress',
    nextStatuses: ['completed'],
    description: 'Service work is currently being performed'
  },
  completed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Completed',
    nextStatuses: [],
    description: 'Service work has been completed successfully'
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected',
    nextStatuses: [],
    description: 'Service request has been rejected by admin'
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    label: 'Cancelled',
    nextStatuses: [],
    description: 'Service request was cancelled by dealer'
  }
}

const serviceTypeConfig = {
  video_service: { icon: Camera, label: 'Video Service', color: 'bg-blue-50 text-blue-700' },
  vip_full: { icon: Star, label: 'VIP Full Package', color: 'bg-yellow-50 text-yellow-700' },
  vip_fastest: { icon: Star, label: 'VIP Fastest', color: 'bg-orange-50 text-orange-700' },
  plastic_covering: { icon: Shield, label: 'Plastic Covering', color: 'bg-green-50 text-green-700' },
  extra_photos: { icon: Image, label: 'Extra Photos', color: 'bg-purple-50 text-purple-700' },
  window_covering: { icon: Palette, label: 'Window Covering', color: 'bg-indigo-50 text-indigo-700' },
  moisture_absorber: { icon: Droplets, label: 'Moisture Control', color: 'bg-cyan-50 text-cyan-700' }
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
  const { user, loading: sessionLoading } = useSession()

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
        // Refresh the router to ensure all pages show updated data
        router.refresh()
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
    if (!service || !service.vehicle) return 'Unknown Vehicle'
    const parts = []
    if (service.vehicle.year) parts.push(service.vehicle.year.toString())
    if (service.vehicle.make) parts.push(service.vehicle.make)
    if (service.vehicle.model) parts.push(service.vehicle.model)
    return parts.join(' ') || service.vehicle.vin || 'Unknown Vehicle'
  }

  const canUpdateStatus = user?.roles.includes('ADMIN') || false  // Only admin users can update service status
  
  const getAvailableStatuses = (currentStatus: string, isAdmin: boolean) => {
    if (!currentStatus || !statusConfig[currentStatus]) return []
    
    const config = statusConfig[currentStatus]
    const nextStatuses = [...config.nextStatuses]
    
    // Add retrograde statuses for admin users
    if (isAdmin) {
      nextStatuses.push(...config.adminRetroStatuses)
    }
    
    return [...new Set(nextStatuses)] // Remove duplicates
  }

  const getButtonStyles = (status: string, currentStatus: string, isModal: boolean = false) => {
    const isRetrograde = statusConfig[currentStatus]?.adminRetroStatuses?.includes(status)
    
    // Base styles - different sizing for modal vs quick action buttons
    const baseStyles = isModal 
      ? 'px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm flex items-center'
      : 'px-3 py-1 text-sm font-medium rounded-lg transition-colors shadow-sm'
    
    if (isRetrograde) {
      // Retrograde actions - orange with subtle border
      return `${baseStyles} bg-orange-500 text-white hover:bg-orange-600 border border-orange-400 ${isModal ? 'disabled:opacity-50' : ''}`
    }
    
    // Forward progression actions
    switch (status) {
      case 'approved':
        return `${baseStyles} bg-green-600 text-white hover:bg-green-700 border border-green-500 ${isModal ? 'disabled:opacity-50' : ''}`
      case 'rejected':
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700 border border-red-500 ${isModal ? 'disabled:opacity-50' : ''}`
      case 'completed':
        return `${baseStyles} bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-500 ${isModal ? 'disabled:opacity-50' : ''}`
      case 'in_progress':
        return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 border border-blue-500 ${isModal ? 'disabled:opacity-50' : ''}`
      case 'pending':
        return `${baseStyles} bg-yellow-600 text-white hover:bg-yellow-700 border border-yellow-500 ${isModal ? 'disabled:opacity-50' : ''}`
      default:
        return `${baseStyles} bg-gray-600 text-white hover:bg-gray-700 border border-gray-500 ${isModal ? 'disabled:opacity-50' : ''}`
    }
  }

  if (loading || sessionLoading) {
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
  const availableStatuses = getAvailableStatuses(service.status, user?.roles?.includes('ADMIN') || false)

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
              <p className="text-gray-600 mt-1">{getVehicleDisplay()} • VIN: {service.vehicle?.vin || 'Unknown VIN'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[service.status].color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusConfig[service.status].label}
              </span>
              {!canUpdateStatus && (
                <span className="text-sm text-gray-500 italic">
                  Dealers can apply for services - status managed by administrators
                </span>
              )}
              {canUpdateStatus && availableStatuses.length > 0 && (
                <div className="flex space-x-2">
                  {availableStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setShowStatusUpdate(status)}
                      className={getButtonStyles(status, service.status)}
                    >
                      {statusConfig[service.status].adminRetroStatuses?.includes(status) 
                        ? `↩️ Revert to ${statusConfig[status].label}` 
                        : `Mark as ${statusConfig[status].label}`
                      }
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
                {service.priceUSD !== null && service.priceUSD !== undefined && (
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
              
              {!canUpdateStatus && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>Service Request Submitted</strong><br />
                        Your service request has been received and will be reviewed by our administrators. You can apply for services and wait for approval, but only admins can manage service statuses and approvals.
                      </p>
                    </div>
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
                        className={getButtonStyles(showStatusUpdate, service.status, true)}
                      >
                        {showStatusUpdate === 'completed' && updateForm.createInvoice && (
                          <Receipt className="h-4 w-4 mr-1" />
                        )}
                        {updating ? 'Updating...' : 
                          statusConfig[service.status].adminRetroStatuses?.includes(showStatusUpdate)
                            ? `↩️ Revert to ${statusConfig[showStatusUpdate].label}`
                            : `Mark as ${statusConfig[showStatusUpdate].label}`
                        }
                      </button>
                      <button
                        onClick={() => setShowStatusUpdate(null)}
                        disabled={updating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
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
                <p className="text-xs text-gray-500 font-mono">{service.vehicle?.vin || 'Unknown VIN'}</p>
                <p className="text-xs text-gray-500">Status: {service.vehicle?.status || 'Unknown'}</p>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
              <p className="text-sm text-gray-900">{service.vehicle?.org?.name || 'Unknown Organization'}</p>
              <p className="text-xs text-gray-500 capitalize">{service.vehicle?.org?.type || 'unknown'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
