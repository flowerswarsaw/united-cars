'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { Wrench, DollarSign, Calendar, MapPin, User, Building, Truck, AlertTriangle, CheckCircle, Clock, Edit3, Save, X, FileText, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface ServiceDetail {
  id: string
  type: 'towing' | 'shipping' | 'auction_fees' | 'storage' | 'inspection'
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
  requestedDate: string
  completedDate: string | null
  price: number
  currency: 'USD' | 'CAD'
  description: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  vehicle: {
    id: string
    vin: string
    make: string | null
    model: string | null
    year: number | null
    org: {
      name: string
    }
  }
  serviceProvider: {
    name: string
    contact: string
    location: string
  } | null
  assignedTo: {
    name: string
    email: string
  } | null
  invoiceDetails: {
    invoiceNumber: string | null
    invoiceDate: string | null
    dueDate: string | null
    paidDate: string | null
  } | null
  locationDetails: {
    pickupLocation: string | null
    dropoffLocation: string | null
    distance: number | null
  } | null
  statusHistory: Array<{
    status: string
    changedAt: string
    changedBy: string
    notes: string | null
  }>
}

const statusConfig = {
  pending: {
    color: 'warning',
    icon: Clock,
    label: 'Pending Approval'
  },
  approved: {
    color: 'info',
    icon: CheckCircle,
    label: 'Approved'
  },
  rejected: {
    color: 'error',
    icon: X,
    label: 'Rejected'
  },
  in_progress: {
    color: 'info',
    icon: Edit3,
    label: 'In Progress'
  },
  completed: {
    color: 'success',
    icon: CheckCircle,
    label: 'Completed'
  },
  cancelled: {
    color: 'error',
    icon: X,
    label: 'Cancelled'
  }
}

const serviceTypeConfig = {
  towing: { icon: '🚛', label: 'Towing Service' },
  shipping: { icon: '🚢', label: 'Shipping' },
  auction_fees: { icon: '🏛️', label: 'Auction Fees' },
  storage: { icon: '🏬', label: 'Storage' },
  inspection: { icon: '🔍', label: 'Inspection' }
}

export default function AdminServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: sessionLoading } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    price: '',
    assignedTo: ''
  })

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/services')
        return
      }
      if (params.id) {
        fetchServiceDetail(params.id as string)
      }
    }
  }, [user, sessionLoading, params.id])

  const fetchServiceDetail = async (serviceId: string) => {
    try {
      // Mock detailed service data
      const mockService: ServiceDetail = {
        id: serviceId,
        type: serviceId.includes('towing') ? 'towing' : serviceId.includes('shipping') ? 'shipping' : 'auction_fees',
        status: serviceId.includes('rejected') ? 'rejected' : serviceId.includes('pending') ? 'pending' : 'completed',
        requestedDate: '2024-03-15T10:30:00Z',
        completedDate: serviceId.includes('completed') ? '2024-03-18T14:20:00Z' : null,
        price: serviceId.includes('towing') ? 325.00 : serviceId.includes('shipping') ? 1850.00 : 275.00,
        currency: 'USD',
        description: serviceId.includes('towing') 
          ? 'Emergency towing from accident location to secure facility'
          : serviceId.includes('shipping') 
          ? 'Container shipping from Long Beach to Vancouver'
          : 'Auction registration and bidding fees for Copart Dallas',
        notes: serviceId.includes('rejected') 
          ? 'Rejected due to excessive pricing. Request alternative quote.'
          : serviceId.includes('pending')
          ? 'Awaiting manager approval for pricing above standard rate.'
          : 'Service completed successfully. Invoice processed and paid.',
        createdAt: '2024-03-15T10:30:00Z',
        updatedAt: '2024-03-16T09:15:00Z',
        vehicle: {
          id: 'vehicle-1',
          vin: '1HGBH41JXMN109186',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          org: {
            name: 'Premium Auto Dealers'
          }
        },
        serviceProvider: {
          name: serviceId.includes('towing') ? 'Express Towing LLC' : serviceId.includes('shipping') ? 'Pacific Container Lines' : 'Copart Auction Services',
          contact: serviceId.includes('towing') ? '(555) 123-4567' : serviceId.includes('shipping') ? '(555) 987-6543' : '(555) 555-0123',
          location: serviceId.includes('towing') ? 'Dallas, TX' : serviceId.includes('shipping') ? 'Long Beach, CA' : 'Dallas, TX'
        },
        assignedTo: {
          name: 'Mike Rodriguez',
          email: 'mike@admin.com'
        },
        invoiceDetails: serviceId.includes('completed') ? {
          invoiceNumber: 'INV-2024-0315',
          invoiceDate: '2024-03-18T14:20:00Z',
          dueDate: '2024-04-17T23:59:59Z',
          paidDate: '2024-03-20T10:30:00Z'
        } : {
          invoiceNumber: null,
          invoiceDate: null,
          dueDate: null,
          paidDate: null
        },
        locationDetails: serviceId.includes('towing') ? {
          pickupLocation: '1234 Main St, Dallas, TX 75201',
          dropoffLocation: 'SecureAuto Storage, 5678 Industrial Blvd, Dallas, TX 75235',
          distance: 12.5
        } : serviceId.includes('shipping') ? {
          pickupLocation: 'Long Beach Container Terminal, Long Beach, CA',
          dropoffLocation: 'Port of Vancouver, Vancouver, BC',
          distance: 1350.0
        } : null,
        statusHistory: [
          {
            status: 'pending',
            changedAt: '2024-03-15T10:30:00Z',
            changedBy: 'System',
            notes: 'Service request submitted'
          },
          {
            status: serviceId.includes('rejected') ? 'rejected' : serviceId.includes('pending') ? 'pending' : 'approved',
            changedAt: '2024-03-16T09:15:00Z',
            changedBy: 'Mike Rodriguez',
            notes: serviceId.includes('rejected') 
              ? 'Pricing exceeds approved limits' 
              : serviceId.includes('pending')
              ? 'Escalated for manager review'
              : 'Approved for processing'
          }
        ]
      }
      
      setService(mockService)
      setEditForm({
        status: mockService.status,
        notes: mockService.notes || '',
        price: mockService.price.toString(),
        assignedTo: mockService.assignedTo?.email || ''
      })
    } catch (error) {
      toast.error('Error fetching service details')
      console.error('Error fetching service:', error)
      router.push('/admin/services')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!service) return

    try {
      // In production, this would call the API
      const updatedService = {
        ...service,
        status: editForm.status as ServiceDetail['status'],
        notes: editForm.notes,
        price: parseFloat(editForm.price),
        updatedAt: new Date().toISOString()
      }
      
      setService(updatedService)
      setIsEditing(false)
      toast.success('Service updated successfully!')
    } catch (error) {
      console.error('Error updating service:', error)
      toast.error('Error updating service')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVehicleDisplay = () => {
    if (!service) return 'Unknown Vehicle'
    const parts = []
    if (service.vehicle.year) parts.push(service.vehicle.year.toString())
    if (service.vehicle.make) parts.push(service.vehicle.make)
    if (service.vehicle.model) parts.push(service.vehicle.model)
    return parts.join(' ') || 'Unknown Vehicle'
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading service details..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS'))) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You need admin privileges to view this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!service) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Service Not Found</h2>
            <p className="mt-2 text-gray-600">The requested service could not be found.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const StatusIcon = statusConfig[service.status].icon
  const serviceTypeInfo = serviceTypeConfig[service.type]

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={`${serviceTypeInfo.label} - Service Management`}
        description={`Manage service request #${service.id.toUpperCase()}`}
        breadcrumbs={[
          { label: 'Admin' }, 
          { label: 'Services', href: '/admin/services' }, 
          { label: `#${service.id.substring(0, 8)}` }
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions Card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <StatusIcon className="h-6 w-6 mr-3 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Service Status</h2>
                    <p className="text-sm text-gray-600">Current status and management actions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusBadge status={statusConfig[service.status].color} />
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {service.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-800">This service request has been rejected and requires attention.</p>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add service notes, updates, or issues..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {service.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Service Notes</label>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-900">{service.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service Information */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                Service Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Service Type</label>
                  <div className="flex items-center">
                    <span className="mr-2">{serviceTypeInfo.icon}</span>
                    <p className="text-sm text-gray-900">{serviceTypeInfo.label}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                    <p className="text-sm text-gray-900 font-medium">
                      {formatCurrency(service.price, service.currency)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Requested Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm text-gray-900">{formatDate(service.requestedDate)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Completed Date</label>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm text-gray-900">{formatDate(service.completedDate)}</p>
                  </div>
                </div>
              </div>
              
              {service.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{service.description}</p>
                  </div>
                </div>
              )}

              {/* Location Details */}
              {service.locationDetails && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Location Details</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.locationDetails.pickupLocation && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Pickup Location</label>
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-blue-600 mr-1 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-900">{service.locationDetails.pickupLocation}</p>
                        </div>
                      </div>
                    )}
                    {service.locationDetails.dropoffLocation && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Dropoff Location</label>
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-900">{service.locationDetails.dropoffLocation}</p>
                        </div>
                      </div>
                    )}
                    {service.locationDetails.distance && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Distance</label>
                        <p className="text-sm text-gray-900">{service.locationDetails.distance} miles</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Vehicle</label>
                  <p className="text-sm text-gray-900 font-medium">{getVehicleDisplay()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">VIN</label>
                  <p className="text-sm text-gray-900 font-mono">{service.vehicle.vin}</p>
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            {service.invoiceDetails && (service.invoiceDetails.invoiceNumber || service.status === 'completed') && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Invoice Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Invoice Number</label>
                    <p className="text-sm text-gray-900">{service.invoiceDetails.invoiceNumber || 'Pending'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Invoice Date</label>
                    <p className="text-sm text-gray-900">{formatDate(service.invoiceDetails.invoiceDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                    <p className="text-sm text-gray-900">{formatDate(service.invoiceDetails.dueDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Paid Date</label>
                    <p className="text-sm text-gray-900">{formatDate(service.invoiceDetails.paidDate)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Organization
              </h3>
              <p className="text-sm text-gray-900 font-medium">{service.vehicle.org.name}</p>
            </div>

            {/* Service Provider */}
            {service.serviceProvider && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Service Provider
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 font-medium">{service.serviceProvider.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Phone className="h-3 w-3 mr-1" />
                    {service.serviceProvider.contact}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {service.serviceProvider.location}
                  </div>
                </div>
              </div>
            )}

            {/* Assignment */}
            {service.assignedTo && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Assigned To
                </h3>
                <p className="text-sm text-gray-900 font-medium">{service.assignedTo.name}</p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Mail className="h-3 w-3 mr-1" />
                  {service.assignedTo.email}
                </div>
              </div>
            )}

            {/* Status History */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Status History
              </h3>
              <div className="space-y-4">
                {service.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {entry.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(entry.changedAt)}</p>
                      <p className="text-xs text-gray-500">by {entry.changedBy}</p>
                      {entry.notes && (
                        <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}