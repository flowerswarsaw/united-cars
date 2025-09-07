'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { useSession } from '@/hooks/useSession'
import { 
  FileText, 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Wrench,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ServiceRequest {
  id: string
  vehicleId: string
  vehicleInfo: {
    vin: string
    year: number
    make: string
    model: string
    location: string
  }
  requestType: 'video_service' | 'vip_full' | 'plastic_covering' | 'vip_fastest' | 'extra_photos' | 'window_covering' | 'moisture_absorber'
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  requestedBy: {
    id: string
    name: string
    email: string
    organization: string
  }
  assignedTo?: {
    id: string
    name: string
  }
  estimatedCost?: number
  actualCost?: number
  estimatedCompletion?: string
  actualCompletion?: string
  notes?: string
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  createdAt: string
  updatedAt: string
}

interface ServiceType {
  id: string
  type: 'video_service' | 'vip_full' | 'plastic_covering' | 'vip_fastest' | 'extra_photos' | 'window_covering' | 'moisture_absorber'
  name: string
  description: string
  basePrice: number
  estimatedDays: number
  active: boolean
  popular: boolean
  requirements?: string[]
}

const SERVICE_CATALOG_KEY = 'admin-service-catalog'
const CATALOG_VERSION = '1.1'

// Mock service requests data
const generateMockServiceRequests = (): ServiceRequest[] => {
  return [
    {
      id: 'req-001',
      vehicleId: 'vh-001',
      vehicleInfo: {
        vin: '1HGBH41JXMN109186',
        year: 2019,
        make: 'Honda',
        model: 'Civic',
        location: 'Copart Houston'
      },
      requestType: 'video_service',
      description: 'Need video inspection service for vehicle documentation',
      priority: 'medium',
      status: 'pending',
      requestedBy: {
        id: 'user-dealer-1',
        name: 'John Smith',
        email: 'john@dealership.com',
        organization: 'Smith Auto Sales'
      },
      estimatedCost: 50,
      createdAt: '2025-08-30T10:30:00Z',
      updatedAt: '2025-08-30T10:30:00Z'
    },
    {
      id: 'req-002',
      vehicleId: 'vh-002',
      vehicleInfo: {
        vin: '5NPE34AF4GH012345',
        year: 2020,
        make: 'Hyundai',
        model: 'Elantra',
        location: 'IAA Phoenix'
      },
      requestType: 'vip_full',
      description: 'VIP full package service needed for premium vehicle',
      priority: 'high',
      status: 'in_review',
      requestedBy: {
        id: 'user-dealer-2',
        name: 'Sarah Johnson',
        email: 'sarah@exportcars.com',
        organization: 'Global Auto Export'
      },
      assignedTo: {
        id: 'user-ops-1',
        name: 'Mike Wilson'
      },
      estimatedCost: 850,
      createdAt: '2025-08-29T14:20:00Z',
      updatedAt: '2025-08-30T09:15:00Z'
    },
    {
      id: 'req-003',
      vehicleId: 'vh-003',
      vehicleInfo: {
        vin: '1G1ZT51816F123456',
        year: 2018,
        make: 'Chevrolet',
        model: 'Malibu',
        location: 'Manheim Atlanta'
      },
      requestType: 'extra_photos',
      description: 'Need additional photos for vehicle documentation',
      priority: 'medium',
      status: 'approved',
      requestedBy: {
        id: 'user-dealer-3',
        name: 'Robert Chen',
        email: 'robert@autoworld.com',
        organization: 'Auto World LLC'
      },
      assignedTo: {
        id: 'user-ops-2',
        name: 'Lisa Garcia'
      },
      estimatedCost: 25,
      estimatedCompletion: '2025-09-02',
      createdAt: '2025-08-28T16:45:00Z',
      updatedAt: '2025-08-30T11:30:00Z'
    }
  ]
}

// Initial service catalog based on actual services from operations mock data
const generateInitialCatalog = (): ServiceType[] => {
  return [
    {
      id: 'srv-001',
      type: 'video_service',
      name: 'Video Service',
      description: 'Detailed video documentation with startup test. Shows exterior, interior, engine bay, and successful startup.',
      basePrice: 50,
      estimatedDays: 1,
      active: true,
      popular: true,
      requirements: ['Vehicle must be accessible', 'Keys required for startup']
    },
    {
      id: 'srv-002',
      type: 'vip_full',
      name: 'VIP Full Package',
      description: 'Complete VIP service including immediate payment (10 days to pay), detailed photos/video, damage sealing, absorbents, plastic covering, priority container loading. 1% daily rate.',
      basePrice: 850,
      estimatedDays: 2,
      active: true,
      popular: true,
      requirements: ['High-value vehicles', 'Priority scheduling', 'Advanced booking required']
    },
    {
      id: 'srv-003',
      type: 'vip_fastest',
      name: 'VIP Fastest',
      description: 'Priority container loading, 10-day guarantee, immediate payment option. 0.5% daily rate.',
      basePrice: 295,
      estimatedDays: 1,
      active: true,
      popular: false,
      requirements: ['Priority scheduling', 'Fast-track processing']
    },
    {
      id: 'srv-004',
      type: 'plastic_covering',
      name: 'Plastic Covering',
      description: 'Clear plastic covering applied for full vehicle protection from dirt and dust during container transport.',
      basePrice: 35,
      estimatedDays: 1,
      active: true,
      popular: false,
      requirements: ['Vehicle preparation required', 'Clean vehicle surface']
    },
    {
      id: 'srv-005',
      type: 'extra_photos',
      name: 'Extra Photos',
      description: 'Extra detailed photography including damage documentation and parts inventory photos.',
      basePrice: 25,
      estimatedDays: 1,
      active: true,
      popular: true,
      requirements: ['Good lighting conditions', 'Vehicle accessibility']
    },
    {
      id: 'srv-006',
      type: 'window_covering',
      name: 'Window Covering',
      description: 'Window covering with wrap film to prevent water ingress. Front windshield and side windows protected.',
      basePrice: 195,
      estimatedDays: 1,
      active: true,
      popular: false,
      requirements: ['Clean windows', 'Specialized wrap film materials']
    },
    {
      id: 'srv-007',
      type: 'moisture_absorber',
      name: 'Moisture Control',
      description: 'Moisture absorber package with hanging bags installed to prevent musty odors during ocean transport.',
      basePrice: 55,
      estimatedDays: 1,
      active: true,
      popular: false,
      requirements: ['Container shipping only', '3 hanging bags minimum']
    }
  ]
}

type ViewMode = 'requests' | 'catalog'

export default function AdminServicesPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('requests')
  
  // Service Requests State
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([])
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')
  const [requestTypeFilter, setRequestTypeFilter] = useState('all')
  const [requestSearchTerm, setRequestSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Service Catalog State
  const [services, setServices] = useState<ServiceType[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceType[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingService, setEditingService] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ServiceType>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [newService, setNewService] = useState<Partial<ServiceType>>({
    type: 'video_service',
    name: '',
    description: '',
    basePrice: 0,
    estimatedDays: 1,
    active: true,
    popular: false,
    requirements: []
  })
  
  const [loading, setLoading] = useState(true)
  
  const { user, loading: sessionLoading } = useSession()

  // Load data on mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Load service requests (mock data)
        const mockRequests = generateMockServiceRequests()
        setServiceRequests(mockRequests)
        
        // Load service catalog from localStorage
        const stored = localStorage.getItem(SERVICE_CATALOG_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.version === CATALOG_VERSION && parsed.services) {
            setServices(parsed.services)
          } else {
            // Version mismatch or invalid data, use initial catalog
            const initialCatalog = generateInitialCatalog()
            setServices(initialCatalog)
            saveToLocalStorage(initialCatalog)
          }
        } else {
          // No stored data, use initial catalog
          const initialCatalog = generateInitialCatalog()
          setServices(initialCatalog)
          saveToLocalStorage(initialCatalog)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        const initialCatalog = generateInitialCatalog()
        setServices(initialCatalog)
        saveToLocalStorage(initialCatalog)
      }
      setLoading(false)
    }

    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/services')
        return
      }
      loadData()
    }
  }, [user, sessionLoading, router])

  // Save to localStorage whenever services change
  const saveToLocalStorage = (servicesToSave: ServiceType[]) => {
    try {
      localStorage.setItem(SERVICE_CATALOG_KEY, JSON.stringify({
        version: CATALOG_VERSION,
        services: servicesToSave,
        updatedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Filter service requests
  useEffect(() => {
    let filtered = [...serviceRequests]

    // Status filter
    if (requestStatusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === requestStatusFilter)
    }

    // Type filter
    if (requestTypeFilter !== 'all') {
      filtered = filtered.filter(request => request.requestType === requestTypeFilter)
    }

    // Search filter
    if (requestSearchTerm) {
      const search = requestSearchTerm.toLowerCase()
      filtered = filtered.filter(request => 
        request.vehicleInfo.vin.toLowerCase().includes(search) ||
        request.vehicleInfo.make.toLowerCase().includes(search) ||
        request.vehicleInfo.model.toLowerCase().includes(search) ||
        request.description.toLowerCase().includes(search) ||
        request.requestedBy.name.toLowerCase().includes(search) ||
        request.requestedBy.organization.toLowerCase().includes(search)
      )
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredRequests(filtered)
  }, [serviceRequests, requestStatusFilter, requestTypeFilter, requestSearchTerm])

  // Filter services based on search and filters
  useEffect(() => {
    let filtered = [...services]

    // Type filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => service.type === categoryFilter)
    }

    // Active filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(service => service.active)
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(service => !service.active)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(search) ||
        service.description.toLowerCase().includes(search) ||
        service.type.toLowerCase().includes(search)
      )
    }

    // Sort by type, then by name
    filtered.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type)
      }
      return a.name.localeCompare(b.name)
    })

    setFilteredServices(filtered)
  }, [services, categoryFilter, activeFilter, searchTerm])

  const getServiceTypeLabel = (type: string) => {
    if (!type) return 'Unknown Service'
    
    const labels: Record<string, string> = {
      video_service: 'Video Service',
      vip_full: 'VIP Full Package',
      vip_fastest: 'VIP Fastest',
      plastic_covering: 'Plastic Covering',
      extra_photos: 'Extra Photos',
      window_covering: 'Window Covering',
      moisture_absorber: 'Moisture Control'
    }
    return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getServiceTypeColor = (type: string) => {
    if (!type) return 'bg-gray-100 text-gray-800'
    
    const colors: Record<string, string> = {
      video_service: 'bg-blue-100 text-blue-800',
      vip_full: 'bg-purple-100 text-purple-800',
      vip_fastest: 'bg-indigo-100 text-indigo-800',
      plastic_covering: 'bg-green-100 text-green-800',
      extra_photos: 'bg-cyan-100 text-cyan-800',
      window_covering: 'bg-orange-100 text-orange-800',
      moisture_absorber: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  // Edit and Create functions
  const handleEdit = (service: ServiceType) => {
    setEditingService(service.id)
    setEditForm({
      name: service.name,
      description: service.description,
      basePrice: service.basePrice,
      estimatedDays: service.estimatedDays,
      active: service.active,
      popular: service.popular,
      requirements: service.requirements || []
    })
  }

  const handleSaveEdit = (serviceId: string) => {
    const updatedServices = services.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          ...editForm
        }
      }
      return service
    })
    setServices(updatedServices)
    saveToLocalStorage(updatedServices)
    setEditingService(null)
    setEditForm({})
    toast.success('Service updated successfully')
  }

  const handleCancelEdit = () => {
    setEditingService(null)
    setEditForm({})
  }

  const handleDelete = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service? This cannot be undone.')) {
      const updatedServices = services.filter(s => s.id !== serviceId)
      setServices(updatedServices)
      saveToLocalStorage(updatedServices)
      toast.success('Service deleted successfully')
    }
  }

  const handleCreateService = () => {
    if (!newService.name || !newService.description) {
      toast.error('Please fill in all required fields')
      return
    }

    const newId = `srv-${Date.now().toString().slice(-6)}`
    const serviceToAdd: ServiceType = {
      id: newId,
      type: newService.type as ServiceType['type'],
      name: newService.name,
      description: newService.description,
      basePrice: newService.basePrice || 0,
      estimatedDays: newService.estimatedDays || 1,
      active: newService.active !== false,
      popular: newService.popular || false,
      requirements: newService.requirements || []
    }
    
    const updatedServices = [...services, serviceToAdd]
    setServices(updatedServices)
    saveToLocalStorage(updatedServices)
    setIsCreating(false)
    setNewService({
      type: 'video_service',
      name: '',
      description: '',
      basePrice: 0,
      estimatedDays: 1,
      active: true,
      popular: false,
      requirements: []
    })
    toast.success('Service created successfully')
  }

  const toggleServiceStatus = (serviceId: string) => {
    const updatedServices = services.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          active: !service.active
        }
      }
      return service
    })
    setServices(updatedServices)
    saveToLocalStorage(updatedServices)
    toast.success('Service status updated')
  }

  const updateRequestStatus = (requestId: string, newStatus: ServiceRequest['status']) => {
    const updatedRequests = serviceRequests.map(request => {
      if (request.id === requestId) {
        return {
          ...request,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      }
      return request
    })
    setServiceRequests(updatedRequests)
    toast.success(`Request ${newStatus}`)
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading service management..." />
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

  const tabs = [
    {
      id: 'requests' as ViewMode,
      name: 'Service Requests',
      icon: FileText,
      description: 'Review and manage incoming service requests',
      count: filteredRequests.length
    },
    {
      id: 'catalog' as ViewMode,
      name: 'Service Catalog',
      icon: Package,
      description: 'Manage service offerings and pricing',
      count: filteredServices.length
    }
  ]

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Service Management"
        description="Review service requests and manage service catalog"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Services' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                Service Configuration
              </h2>
            </div>
            
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setViewMode(tab.id)}
                      className={`
                        py-2 px-1 border-b-2 font-medium text-sm transition-colors
                        ${viewMode === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <TabIcon className="h-5 w-5" />
                        <span>{tab.name}</span>
                        <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
            
            {/* Tab Description */}
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {tabs.find(t => t.id === viewMode)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Service Requests Tab */}
        {viewMode === 'requests' && (
          <>
            {/* Request Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="request-search" className="sr-only">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="request-search"
                      value={requestSearchTerm}
                      onChange={(e) => setRequestSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Search requests..."
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="status-filter" className="sr-only">Status</label>
                  <select
                    id="status-filter"
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="type-filter" className="sr-only">Type</label>
                  <select
                    id="type-filter"
                    value={requestTypeFilter}
                    onChange={(e) => setRequestTypeFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="video_service">Video Service</option>
                    <option value="vip_full">VIP Full</option>
                    <option value="vip_fastest">VIP Fastest</option>
                    <option value="plastic_covering">Plastic Cover</option>
                    <option value="extra_photos">Extra Photos</option>
                    <option value="window_covering">Window Cover</option>
                    <option value="moisture_absorber">Moisture Control</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Service Requests Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Request Queue
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle & Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">{request.vehicleInfo.year} {request.vehicleInfo.make} {request.vehicleInfo.model}</div>
                            <div className="text-xs text-gray-500">VIN: {request.vehicleInfo.vin}</div>
                            <div className="text-xs text-gray-500">Location: {request.vehicleInfo.location}</div>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getServiceTypeColor(request.requestType)}`}>
                                {getServiceTypeLabel(request.requestType)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">{request.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">{request.requestedBy.name}</div>
                            <div className="text-xs text-gray-500">{request.requestedBy.email}</div>
                            <div className="text-xs text-gray-500">{request.requestedBy.organization}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.estimatedCost ? `$${request.estimatedCost}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {request.status === 'pending' && (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => updateRequestStatus(request.id, 'approved')}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          {request.status === 'in_review' && (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => updateRequestStatus(request.id, 'approved')}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          {request.status === 'approved' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              title="Start Progress"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          {request.status === 'in_progress' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'completed')}
                              className="text-gray-600 hover:text-gray-900 flex items-center"
                              title="Mark Complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRequests.length === 0 && (
                <div className="p-8">
                  <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="No service requests found"
                    description="Try adjusting your filters or search term"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Service Catalog Tab */}
        {viewMode === 'catalog' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Service Offerings
                </h2>
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </button>
              </div>
            </div>

            {/* Create New Service Form */}
            {isCreating && (
              <div className="p-6 bg-blue-50 border-b border-blue-200">
                <h4 className="font-medium text-gray-900 mb-4">Create New Service</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                    <select
                      value={newService.type}
                      onChange={(e) => setNewService({...newService, type: e.target.value as ServiceType['type']})}
                      className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                    >
                      <option value="video_service">Video Service</option>
                      <option value="vip_full">VIP Full Package</option>
                      <option value="vip_fastest">VIP Fastest</option>
                      <option value="plastic_covering">Plastic Covering</option>
                      <option value="extra_photos">Extra Photos</option>
                      <option value="window_covering">Window Covering</option>
                      <option value="moisture_absorber">Moisture Control</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                    <input
                      type="text"
                      value={newService.name || ''}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g., Oil Change Service"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={newService.description || ''}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={2}
                      placeholder="Describe the service..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                    <input
                      type="number"
                      value={newService.basePrice || ''}
                      onChange={(e) => setNewService({...newService, basePrice: parseFloat(e.target.value) || 0})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days</label>
                    <input
                      type="number"
                      value={newService.estimatedDays || ''}
                      onChange={(e) => setNewService({...newService, estimatedDays: parseInt(e.target.value) || 1})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="1"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newService.active !== false}
                        onChange={(e) => setNewService({...newService, active: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newService.popular || false}
                        onChange={(e) => setNewService({...newService, popular: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">Popular</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setNewService({
                        type: 'video_service',
                        name: '',
                        description: '',
                        basePrice: 0,
                        estimatedDays: 1,
                        active: true,
                        popular: false,
                        requirements: []
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateService}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Service
                  </button>
                </div>
              </div>
            )}

            {/* Services Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {editingService === service.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              placeholder="Service name"
                            />
                            <textarea
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              rows={2}
                              placeholder="Description"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getServiceTypeColor(service.type)}`}>
                          {getServiceTypeLabel(service.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingService === service.id ? (
                          <input
                            type="number"
                            value={editForm.basePrice || ''}
                            onChange={(e) => setEditForm({...editForm, basePrice: parseFloat(e.target.value) || 0})}
                            className="block w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">${service.basePrice}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingService === service.id ? (
                          <input
                            type="number"
                            value={editForm.estimatedDays || ''}
                            onChange={(e) => setEditForm({...editForm, estimatedDays: parseInt(e.target.value) || 1})}
                            className="block w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                            min="1"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{service.estimatedDays}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleServiceStatus(service.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            service.active ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                          title={service.active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              service.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                          <span className="sr-only">
                            {service.active ? 'Deactivate service' : 'Activate service'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {editingService === service.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleSaveEdit(service.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(service)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {services.length === 0 && (
              <div className="p-8">
                <EmptyState
                  icon={<Package className="h-12 w-12" />}
                  title="No services found"
                  description="Create your first service offering"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}