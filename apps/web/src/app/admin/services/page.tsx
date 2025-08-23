'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ServiceRequest {
  id: string
  type: 'inspection' | 'cleaning' | 'repair' | 'storage' | 'titlework'
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  priceUSD: number | null
  notes: string | null
  createdAt: string
  vehicle: {
    id: string
    vin: string
    make: string | null
    model: string | null
    year: number | null
  }
  org: {
    name: string
    type: string
  }
}

interface User {
  id: string
  roles: string[]
}

export default function AdminServicesPage() {
  const router = useRouter()
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: 'pending',
    type: 'all'
  })
  const [editingService, setEditingService] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '' as any,
    priceUSD: '',
    notes: ''
  })

  useEffect(() => {
    fetchUserSession()
    fetchServiceRequests()
  }, [filter])

  const fetchUserSession = async () => {
    // This would normally come from your auth context/session
    // For now, simulating admin user
    const userSession = { id: 'admin1', roles: ['ADMIN'] }
    setUser(userSession)
    
    // Check if user has admin access
    if (!userSession.roles.includes('ADMIN') && !userSession.roles.includes('OPS')) {
      router.push('/services')
      return
    }
  }

  const fetchServiceRequests = async () => {
    try {
      let url = '/api/services'
      const params = new URLSearchParams()
      if (filter.status !== 'all') params.append('status', filter.status)
      if (filter.type !== 'all') params.append('type', filter.type)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setServiceRequests(data.serviceRequests || [])
      } else {
        console.error('Failed to fetch service requests:', data.error)
      }
    } catch (error) {
      console.error('Error fetching service requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (service: ServiceRequest) => {
    setEditingService(service.id)
    setEditForm({
      status: service.status,
      priceUSD: service.priceUSD?.toString() || '',
      notes: service.notes || ''
    })
  }

  const handleUpdateService = async (serviceId: string) => {
    try {
      const updateData: any = {
        status: editForm.status,
        notes: editForm.notes
      }
      
      if (editForm.priceUSD) {
        updateData.priceUSD = parseFloat(editForm.priceUSD)
      }

      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      
      if (response.ok) {
        // Update the local state
        setServiceRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === serviceId ? { ...request, ...data.serviceRequest } : request
          )
        )
        setEditingService(null)
        alert('Service request updated successfully!')
      } else {
        alert(`Failed to update service request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating service request:', error)
      alert('Error updating service request')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return '🔍'
      case 'cleaning':
        return '🧽'
      case 'repair':
        return '🔧'
      case 'storage':
        return '📦'
      case 'titlework':
        return '📄'
      default:
        return '⚙️'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading service requests...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin - Service Requests</h1>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</a>
              <a href="/services" className="text-blue-600 hover:text-blue-800">Dealer View</a>
              <a href="/admin/claims" className="text-blue-600 hover:text-blue-800">Claims</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mr-2">
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending (Needs Review)</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label htmlFor="type-filter" className="text-sm font-medium text-gray-700 mr-2">
                  Type:
                </label>
                <select
                  id="type-filter"
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="inspection">Inspection</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="repair">Repair</option>
                  <option value="storage">Storage</option>
                  <option value="titlework">Title Work</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Service Requests List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Service Requests for Review ({serviceRequests.length})
            </h3>
            
            {serviceRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">No service requests found</div>
                <p className="text-sm text-gray-400 mt-1">
                  No service requests match the current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Service Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center mb-2">
                              <span className="mr-2">{getTypeIcon(service.type)}</span>
                              <h4 className="text-lg font-medium text-gray-900 capitalize">
                                {service.type} Service
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600">
                              {service.vehicle.year && service.vehicle.make && service.vehicle.model
                                ? `${service.vehicle.year} ${service.vehicle.make} ${service.vehicle.model}`
                                : 'Unknown Vehicle'} - {service.vehicle.vin}
                            </p>
                            <p className="text-sm text-gray-500">
                              Organization: {service.org.name} ({service.org.type})
                            </p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatDate(service.createdAt)}
                            </p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                            {service.status.replace('_', ' ')}
                          </span>
                        </div>

                        {service.notes && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600">{service.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Panel */}
                      <div className="lg:col-span-1">
                        {editingService === service.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                              </label>
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (USD)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.priceUSD}
                                onChange={(e) => setEditForm({ ...editForm, priceUSD: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Notes
                              </label>
                              <textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add notes..."
                              />
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateService(service.id)}
                                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingService(null)}
                                className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Current Price:</p>
                              <p className="text-sm text-gray-900">
                                {service.priceUSD ? `$${Number(service.priceUSD).toFixed(2)}` : 'Not set'}
                              </p>
                            </div>

                            <button
                              onClick={() => startEditing(service)}
                              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              Review & Price
                            </button>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingService(service.id)
                                  setEditForm({ status: 'approved', priceUSD: '', notes: '' })
                                }}
                                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                              >
                                Quick Approve
                              </button>
                              <button
                                onClick={() => {
                                  setEditingService(service.id)
                                  setEditForm({ status: 'rejected', priceUSD: '', notes: '' })
                                }}
                                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}