'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Wrench, AlertCircle, Camera, Star, Shield, Image, Palette, Droplets, Download, ChevronFirst, ChevronLast } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ServiceRequest {
  id: string
  type: 'video_service' | 'vip_full' | 'plastic_covering' | 'vip_fastest' | 'extra_photos' | 'window_covering' | 'moisture_absorber'
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled'
  priceUSD: number | null
  notes: string | null
  rejectionReason?: string | null
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
  const [submitting, setSubmitting] = useState(false)
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
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  })
  const [typeCounts, setTypeCounts] = useState({
    all: 0,
    video_service: 0,
    vip_full: 0,
    plastic_covering: 0,
    vip_fastest: 0,
    extra_photos: 0,
    window_covering: 0,
    moisture_absorber: 0
  })
  const [newService, setNewService] = useState({
    vehicleId: '',
    type: 'video_service' as const,
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
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
        if (data.typeCounts) {
          setTypeCounts(data.typeCounts)
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

  const exportToCSV = () => {
    if (serviceRequests.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Service', 'Vehicle', 'VIN', 'Status', 'Price', 'Organization', 'Created Date']
    const rows = serviceRequests.map(service => [
      getServiceTypeLabel(service.type),
      getVehicleDisplay(service.vehicle),
      service.vehicle.vin,
      service.status,
      service.priceUSD ? `$${service.priceUSD}` : '',
      service.vehicle.org.name,
      new Date(service.createdAt).toLocaleDateString('en-US')
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `services-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Services data exported to CSV')
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
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
        setShowNewForm(false)
        setNewService({ vehicleId: '', type: 'video_service', notes: '' })
        toast.success('Service request created successfully!')
        // Refresh the services list to ensure new service appears with proper enrichment
        await fetchServiceRequests()
      } else {
        toast.error(`Failed to create service request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating service request:', error)
      toast.error('Error creating service request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to cancel this service request?')) {
      return
    }

    try {
      const response = await fetch(`/api/services/${serviceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled',
          notes: 'Service request cancelled by dealer'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Service request cancelled successfully!')
        await fetchServiceRequests()
      } else {
        toast.error(`Failed to cancel service request: ${data.error}`)
      }
    } catch (error) {
      console.error('Error cancelling service request:', error)
      toast.error('Error cancelling service request')
    }
  }

  // Check if current user can cancel this service request
  const canCancelService = (service: ServiceRequest) => {
    // Dealers can only cancel their own services in pending or approved status
    if (user?.roles?.includes('DEALER')) {
      // Check if it's the dealer's own service and in cancelable status
      if (service.status === 'pending' || service.status === 'approved') {
        return true
      }
    }
    
    return false
  }

  const canCreateClaim = (service: ServiceRequest) => {
    // Dealers can create claims for their own completed services
    if (user?.roles?.includes('DEALER')) {
      if (service.status === 'completed') {
        return true
      }
    }
    
    return false
  }

  const handleCreateClaim = async (serviceId: string) => {
    // Redirect to claims page to create a service dispute claim
    window.location.href = `/claims/new?serviceId=${serviceId}&type=service_dispute`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video_service':
        return <Camera className="h-4 w-4" />
      case 'vip_full':
        return <Star className="h-4 w-4" />
      case 'vip_fastest':
        return <Star className="h-4 w-4" />
      case 'plastic_covering':
        return <Shield className="h-4 w-4" />
      case 'extra_photos':
        return <Image className="h-4 w-4" />
      case 'window_covering':
        return <Palette className="h-4 w-4" />
      case 'moisture_absorber':
        return <Droplets className="h-4 w-4" />
      default:
        return <Wrench className="h-4 w-4" />
    }
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'video_service': return 'Video Service'
      case 'vip_full': return 'VIP Full Package'
      case 'vip_fastest': return 'VIP Fastest'
      case 'plastic_covering': return 'Plastic Covering'
      case 'extra_photos': return 'Extra Photos'
      case 'window_covering': return 'Window Covering'
      case 'moisture_absorber': return 'Moisture Control'
      default: return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getVehicleDisplay = (vehicle: ServiceRequest['vehicle']) => {
    if (!vehicle) {
      return 'Unknown Vehicle'
    }
    if (vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return vehicle.vin || 'Unknown Vehicle'
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

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '-'
    const numPrice = Number(price)
    if (isNaN(numPrice)) return '-'
    return `$${numPrice.toFixed(2)}`
  }

  const filterOptions = [
    { value: 'all', label: 'All Services', count: statusCounts.all },
    { value: 'pending', label: 'Pending', count: statusCounts.pending },
    { value: 'approved', label: 'Approved', count: statusCounts.approved },
    { value: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
    { value: 'completed', label: 'Completed', count: statusCounts.completed },
    { value: 'rejected', label: 'Rejected', count: statusCounts.rejected },
    { value: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
  ]

  const typeOptions = [
    { value: 'all', label: 'All Types', count: typeCounts.all },
    { value: 'video_service', label: 'Video Service', count: typeCounts.video_service },
    { value: 'vip_full', label: 'VIP Full', count: typeCounts.vip_full },
    { value: 'vip_fastest', label: 'VIP Fastest', count: typeCounts.vip_fastest },
    { value: 'plastic_covering', label: 'Plastic Cover', count: typeCounts.plastic_covering },
    { value: 'extra_photos', label: 'Extra Photos', count: typeCounts.extra_photos },
    { value: 'window_covering', label: 'Window Cover', count: typeCounts.window_covering },
    { value: 'moisture_absorber', label: 'Moisture Control', count: typeCounts.moisture_absorber },
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
          <div className="px-6 py-4 space-y-4">
            {/* Status Filters */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Status:</span>
              </div>
              <div className="flex flex-wrap gap-2">
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
            
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by VIN, make, model, or year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
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
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium text-gray-700">Service Type:</span>
              <div className="flex flex-wrap gap-2">
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
                    <option value="video_service">Video Service ($50)</option>
                    <option value="vip_full">VIP Full Package ($850)</option>
                    <option value="vip_fastest">VIP Fastest ($295)</option>
                    <option value="plastic_covering">Plastic Covering ($35)</option>
                    <option value="extra_photos">Extra Photos ($25)</option>
                    <option value="window_covering">Window Covering ($195)</option>
                    <option value="moisture_absorber">Moisture Control ($55)</option>
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
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting && <LoadingSpinner size="sm" className="mr-2" />}
                    {submitting ? 'Creating...' : 'Create Request'}
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
                              <div className="text-sm font-medium text-gray-900">
                                {getServiceTypeLabel(service.type)}
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
                              {service.vehicle?.vin || 'Unknown VIN'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={service.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(service.priceUSD)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {service.vehicle?.org?.name || 'Unknown Organization'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(service.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <Link
                                href={`/services/${service.id}`}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                View Details
                              </Link>
                              {canCancelService(service) && (
                                <button
                                  onClick={() => handleCancelService(service.id)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Cancel
                                </button>
                              )}
                              {canCreateClaim(service) && (
                                <button
                                  onClick={() => handleCreateClaim(service.id)}
                                  className="text-orange-600 hover:text-orange-900 font-medium"
                                >
                                  Create Claim
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.perPage) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.perPage, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </div>
                  
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.page === 1}
                        className="p-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        title="First page"
                      >
                        <ChevronFirst className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      
                      <div className="hidden sm:flex items-center space-x-1">
                        {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                          let page;
                          if (pagination.totalPages <= 7) {
                            page = i + 1;
                          } else if (pagination.page <= 4) {
                            page = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 3) {
                            page = pagination.totalPages - 6 + i;
                          } else {
                            page = pagination.page - 3 + i;
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm border rounded-lg ${
                                page === pagination.page
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="sm:hidden flex items-center">
                        <span className="text-sm text-gray-700">Page {pagination.page} of {pagination.totalPages}</span>
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.page === pagination.totalPages}
                        className="p-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        title="Last page"
                      >
                        <ChevronLast className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}