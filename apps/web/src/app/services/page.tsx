'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Wrench, Eye, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
    org: {
      name: string
    }
  }
}

export default function ServicesPage() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0
  })
  const [newService, setNewService] = useState({
    vehicleId: '',
    type: 'inspection' as const,
    notes: ''
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    fetchServiceRequests()
    fetchVehicles()
  }, [filter, pagination.page, searchTerm])

  const fetchServiceRequests = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      })
      
      if (filter.status !== 'all') params.append('status', filter.status)
      if (filter.type !== 'all') params.append('type', filter.type)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/services?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setServiceRequests(data.serviceRequests || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        toast.error(`Failed to fetch service requests: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error fetching service requests')
      console.error('Error fetching service requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      
      if (response.ok) {
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newService)
      })

      const data = await response.json()
      
      if (response.ok) {
        setServiceRequests([data.serviceRequest, ...serviceRequests])
        setShowNewForm(false)
        setNewService({ vehicleId: '', type: 'inspection', notes: '' })
        toast.success('Service request created successfully!')
      } else {
        toast.error(`Failed to create service request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating service request:', error)
      toast.error('Error creating service request')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <Eye className="h-4 w-4" />
      case 'cleaning':
        return <Wrench className="h-4 w-4" />
      case 'repair':
        return <Wrench className="h-4 w-4" />
      case 'storage':
        return <FileText className="h-4 w-4" />
      case 'titlework':
        return <FileText className="h-4 w-4" />
      default:
        return <Wrench className="h-4 w-4" />
    }
  }

  const getVehicleDisplay = (vehicle: ServiceRequest['vehicle']) => {
    if (vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return 'Unknown Vehicle'
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filterOptions = [
    { value: 'all', label: 'All Services', count: pagination.total },
    { value: 'pending', label: 'Pending', count: serviceRequests.filter(s => s.status === 'pending').length },
    { value: 'approved', label: 'Approved', count: serviceRequests.filter(s => s.status === 'approved').length },
    { value: 'in_progress', label: 'In Progress', count: serviceRequests.filter(s => s.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: serviceRequests.filter(s => s.status === 'completed').length },
    { value: 'rejected', label: 'Rejected', count: serviceRequests.filter(s => s.status === 'rejected').length },
  ]

  const typeOptions = [
    { value: 'all', label: 'All Types', count: pagination.total },
    { value: 'inspection', label: 'Inspection', count: serviceRequests.filter(s => s.type === 'inspection').length },
    { value: 'cleaning', label: 'Cleaning', count: serviceRequests.filter(s => s.type === 'cleaning').length },
    { value: 'repair', label: 'Repair', count: serviceRequests.filter(s => s.type === 'repair').length },
    { value: 'storage', label: 'Storage', count: serviceRequests.filter(s => s.type === 'storage').length },
    { value: 'titlework', label: 'Title Work', count: serviceRequests.filter(s => s.type === 'titlework').length },
  ]

  const canCreateService = user?.roles.includes('DEALER') || user?.roles.includes('ADMIN')

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Extra Services"
        description="Manage vehicle service requests and track their progress"
        breadcrumbs={[{ label: 'Operations' }, { label: 'Services' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex items-center space-x-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter({ ...filter, status: option.value })}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter.status === option.value
                          ? 'bg-blue-100 text-blue-700'
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
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                {canCreateService && (
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Service
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Type Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Service Type:</span>
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter({ ...filter, type: option.value })}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter.type === option.value
                      ? 'bg-green-100 text-green-700'
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
        </div>

        {/* New Service Form Modal */}
        {showNewForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
              <form onSubmit={handleCreateService} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">New Service Request</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <AlertCircle className="h-5 w-5" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle *
                  </label>
                  <select
                    value={newService.vehicleId}
                    onChange={(e) => setNewService({ ...newService, vehicleId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vin} - {vehicle.year && vehicle.make && vehicle.model
                          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                          : 'Unknown Vehicle'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    value={newService.type}
                    onChange={(e) => setNewService({ ...newService, type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="inspection">Inspection</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="repair">Repair</option>
                    <option value="storage">Storage</option>
                    <option value="titlework">Title Work</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newService.notes}
                    onChange={(e) => setNewService({ ...newService, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the service requirements..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Service Requests {serviceRequests.length > 0 && `(${pagination.total})`}
              </h2>
            </div>
          </div>

          <div className="p-6">
            {loading || sessionLoading ? (
              <LoadingState text="Loading service requests..." />
            ) : serviceRequests.length === 0 ? (
              <EmptyState
                icon={<Wrench className="h-12 w-12" />}
                title="No service requests found"
                description={
                  searchTerm 
                    ? `No service requests match "${searchTerm}"`
                    : filter.status === 'all' && filter.type === 'all'
                      ? 'No service requests have been created yet.'
                      : 'No service requests match the current filters.'
                }
              />
            ) : (
              <>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VIN
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {serviceRequests.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-3 text-gray-400">
                                {getTypeIcon(service.type)}
                              </div>
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {service.type.replace('_', ' ')}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getVehicleDisplay(service.vehicle)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 font-mono">
                              {service.vehicle.vin}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={service.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {service.priceUSD ? `$${Number(service.priceUSD).toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {service.vehicle.org.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(service.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/services/${service.id}`}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              View Details
                            </Link>
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
                              ? 'bg-blue-600 text-white border-blue-600'
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