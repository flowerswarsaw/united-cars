'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, ArrowLeft, Clock, CheckCircle, Package, Truck, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface TitleDetail {
  id: string
  status: 'pending' | 'received' | 'packed' | 'sent'
  location?: string
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
  package?: {
    id: string
    trackingNumber: string
    provider: string
    status: string
    type: string
    shippedAt?: string
    deliveredAt?: string
  }
}

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending Processing',
    nextStatus: 'received'
  },
  received: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileText,
    label: 'Received',
    nextStatus: 'packed'
  },
  packed: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Package,
    label: 'Packed',
    nextStatus: 'sent'
  },
  sent: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Truck,
    label: 'Sent',
    nextStatus: null
  }
}

export default function TitleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [title, setTitle] = useState<TitleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    location: '',
    notes: '',
    trackingNumber: ''
  })
  const [user] = useState({
    name: 'Admin User',
    email: 'admin@demo.com',
    roles: ['ADMIN'],
    orgName: 'United Cars Admin'
  })

  useEffect(() => {
    if (params.id) {
      fetchTitleDetail(params.id as string)
    }
  }, [params.id])

  const fetchTitleDetail = async (titleId: string) => {
    try {
      const response = await fetch(`/api/titles/${titleId}`)
      const result = await response.json()

      if (response.ok) {
        setTitle(result.title)
        setUpdateForm({
          location: result.title.location || '',
          notes: '',
          trackingNumber: result.title.package?.trackingNumber || ''
        })
      } else {
        toast.error(`Failed to load title: ${result.error}`)
        router.push('/titles')
      }
    } catch (error) {
      console.error('Error fetching title:', error)
      toast.error('Error loading title details')
      router.push('/titles')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!title) return

    const nextStatus = statusConfig[title.status].nextStatus
    if (!nextStatus) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/titles/${title.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nextStatus,
          location: updateForm.location || undefined,
          notes: updateForm.notes || undefined,
          trackingNumber: (nextStatus === 'packed' || nextStatus === 'sent') ? updateForm.trackingNumber || undefined : undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Title status updated to ${nextStatus}!`)
        setTitle(result.title)
        setShowStatusUpdate(false)
        setUpdateForm({ location: '', notes: '', trackingNumber: '' })
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

  const getVehicleDisplay = () => {
    if (!title) return 'Unknown Vehicle'
    const parts = []
    if (title.vehicle.year) parts.push(title.vehicle.year.toString())
    if (title.vehicle.make) parts.push(title.vehicle.make)
    if (title.vehicle.model) parts.push(title.vehicle.model)
    return parts.join(' ') || 'Unknown Vehicle'
  }

  const canUpdateStatus = (user.roles.includes('ADMIN') || user.roles.includes('OPS')) && 
                          title?.status !== 'sent'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading title details...</p>
        </div>
      </div>
    )
  }

  if (!title) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Title not found</p>
          <Link href="/titles" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Titles
          </Link>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[title.status].icon
  const nextStatus = statusConfig[title.status].nextStatus

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/titles"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Titles
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getVehicleDisplay()} - Title
              </h1>
              <p className="text-gray-600 mt-1">VIN: {title.vehicle.vin}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[title.status].color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusConfig[title.status].label}
              </span>
              {canUpdateStatus && nextStatus && (
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Mark as {statusConfig[nextStatus].label}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Title Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{title.status}</p>
                </div>
                {title.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Location</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {title.location}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(title.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(title.updatedAt)}</p>
                </div>
              </div>
              
              {title.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {title.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Package Information */}
            {title.package && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Package</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tracking Number</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{title.package.trackingNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Provider</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{title.package.provider}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Package Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{title.package.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Package Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{title.package.type}</p>
                  </div>
                  {title.package.shippedAt && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Shipped At</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(title.package.shippedAt)}</p>
                      </div>
                      {title.package.deliveredAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Delivered At</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(title.package.deliveredAt)}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Status Update Modal */}
            {showStatusUpdate && nextStatus && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Update to {statusConfig[nextStatus].label}
                      </h3>
                      <button
                        onClick={() => setShowStatusUpdate(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location (optional)
                      </label>
                      <input
                        type="text"
                        value={updateForm.location}
                        onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Current location of title"
                      />
                    </div>

                    {(nextStatus === 'packed' || nextStatus === 'sent') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tracking Number {nextStatus === 'sent' ? '*' : '(optional)'}
                        </label>
                        <input
                          type="text"
                          value={updateForm.trackingNumber}
                          onChange={(e) => setUpdateForm({ ...updateForm, trackingNumber: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Package tracking number"
                          required={nextStatus === 'sent'}
                        />
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
                        onClick={handleStatusUpdate}
                        disabled={updating || (nextStatus === 'sent' && !updateForm.trackingNumber)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updating ? 'Updating...' : `Mark as ${statusConfig[nextStatus].label}`}
                      </button>
                      <button
                        onClick={() => setShowStatusUpdate(false)}
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
                  const isActive = title.status === status
                  const isPast = Object.keys(statusConfig).indexOf(title.status) > index
                  const Icon = config.icon

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
                <p className="text-xs text-gray-500 font-mono">{title.vehicle.vin}</p>
                <p className="text-xs text-gray-500">Status: {title.vehicle.status}</p>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
              <p className="text-sm text-gray-900">{title.vehicle.org.name}</p>
              <p className="text-xs text-gray-500 capitalize">{title.vehicle.org.type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
