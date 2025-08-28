'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import { 
  FileText, 
  Eye, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  Truck, 
  Layers,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  mockTitleData, 
  getTitleTypeLabel, 
  getPriorityLabel,
  getPriorityColor,
  isOverdue, 
  formatDate 
} from '@/lib/title-mock-data'
import { 
  mockPackageData,
  getOrganizationTypeLabel,
  getProviderLabel,
  formatTrackingNumber,
  packageStatusConfig,
  packagePriorityConfig
} from '@/lib/package-mock-data'
import type { EnhancedTitle, EnhancedPackage, TitleStatus } from '@/types/title-enhanced'

type ViewMode = 'titles' | 'packages'

export default function AdminTitlePackagesPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('titles')
  const [titles] = useState<EnhancedTitle[]>(mockTitleData)
  const [packages] = useState<EnhancedPackage[]>(mockPackageData)
  
  const [filteredTitles, setFilteredTitles] = useState<EnhancedTitle[]>([])
  const [filteredPackages, setFilteredPackages] = useState<EnhancedPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    titleType: 'clean',
    issuingState: 'TX',
    vin: '',
    make: '',
    model: '',
    year: '',
    priority: 'normal',
    notes: ''
  })
  
  const [titleStatusCounts, setTitleStatusCounts] = useState({
    all: 0,
    pending: 0,
    received: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    on_hold: 0,
    pending_docs: 0
  })
  
  const [packageStatusCounts, setPackageStatusCounts] = useState({
    all: 0,
    pending: 0,
    prepared: 0,
    shipped: 0,
    in_transit: 0,
    delivered: 0,
    exception: 0
  })
  
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (user && !sessionLoading) {
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/titles')
        return
      }
      fetchData()
    }
  }, [user, sessionLoading])

  useEffect(() => {
    if (viewMode === 'titles') {
      filterTitles()
    } else {
      filterPackages()
    }
  }, [viewMode, titles, packages, searchTerm, statusFilter, typeFilter, stateFilter, dateFilter, sortField, sortDirection])

  const fetchData = async () => {
    try {
      // Calculate title status counts
      setTitleStatusCounts({
        all: titles.length,
        pending: titles.filter(t => t.status === 'pending').length,
        received: titles.filter(t => t.status === 'received').length,
        processing: titles.filter(t => t.status === 'processing').length,
        completed: titles.filter(t => t.status === 'completed').length,
        cancelled: titles.filter(t => t.status === 'cancelled').length,
        on_hold: titles.filter(t => t.status === 'on_hold').length,
        pending_docs: titles.filter(t => t.status === 'pending_docs').length,
      })
      
      // Calculate package status counts
      setPackageStatusCounts({
        all: packages.length,
        pending: packages.filter(p => p.status === 'pending').length,
        prepared: packages.filter(p => p.status === 'prepared').length,
        shipped: packages.filter(p => p.status === 'shipped').length,
        in_transit: packages.filter(p => p.status === 'in_transit').length,
        delivered: packages.filter(p => p.status === 'delivered').length,
        exception: packages.filter(p => p.status === 'exception').length,
      })
    } catch (error) {
      toast.error('Error fetching data')
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTitles = () => {
    let filtered = [...titles]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(title => 
        title.id.toLowerCase().includes(search) ||
        title.vehicle?.vin?.toLowerCase().includes(search) ||
        title.vehicle?.make?.toLowerCase().includes(search) ||
        title.vehicle?.model?.toLowerCase().includes(search) ||
        title.vehicle?.org?.name?.toLowerCase().includes(search) ||
        title.titleNumber?.toLowerCase().includes(search) ||
        title.notes?.toLowerCase().includes(search) ||
        title.assignedTo?.name?.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(title => title.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(title => title.titleType === typeFilter)
    }

    // State filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(title => title.issuingState === stateFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      
      filtered = filtered.filter(title => {
        const titleDate = new Date(title.createdAt)
        
        switch (dateFilter) {
          case 'today':
            return titleDate >= startOfDay
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7))
            return titleDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
            return titleDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'id':
          aValue = a.id
          bValue = b.id
          break
        case 'vehicle':
          aValue = getVehicleDisplay(a.vehicle)
          bValue = getVehicleDisplay(b.vehicle)
          break
        case 'org':
          aValue = a.vehicle?.org?.name || ''
          bValue = b.vehicle?.org?.name || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'titleType':
          aValue = a.titleType
          bValue = b.titleType
          break
        case 'issuingState':
          aValue = a.issuingState
          bValue = b.issuingState
          break
        case 'expectedCompletionDate':
          aValue = a.expectedCompletionDate ? new Date(a.expectedCompletionDate).getTime() : 0
          bValue = b.expectedCompletionDate ? new Date(b.expectedCompletionDate).getTime() : 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (sortField === 'createdAt' || sortField === 'expectedCompletionDate') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        const comparison = String(aValue).localeCompare(String(bValue))
        return sortDirection === 'asc' ? comparison : -comparison
      }
    })

    setFilteredTitles(sorted)
  }

  const filterPackages = () => {
    let filtered = [...packages]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(pkg => 
        pkg.id.toLowerCase().includes(search) ||
        pkg.trackingNumber?.toLowerCase().includes(search) ||
        pkg.provider?.toLowerCase().includes(search) ||
        pkg.senderContact?.name?.toLowerCase().includes(search) ||
        pkg.recipientContact?.name?.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === statusFilter)
    }

    // Type filter (using type filter for package type)
    if (typeFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.type.toLowerCase() === typeFilter.toLowerCase())
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      
      filtered = filtered.filter(pkg => {
        const pkgDate = new Date(pkg.createdAt)
        
        switch (dateFilter) {
          case 'today':
            return pkgDate >= startOfDay
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7))
            return pkgDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
            return pkgDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Sort packages
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'id':
          aValue = a.id
          bValue = b.id
          break
        case 'trackingNumber':
          aValue = a.trackingNumber || ''
          bValue = b.trackingNumber || ''
          break
        case 'provider':
          aValue = a.provider || ''
          bValue = b.provider || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (sortField === 'createdAt') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        const comparison = String(aValue).localeCompare(String(bValue))
        return sortDirection === 'asc' ? comparison : -comparison
      }
    })

    setFilteredPackages(sorted)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleCreateNew = () => {
    if (viewMode === 'titles') {
      setShowCreateModal(true)
      toast.success('Opening new title form!')
      console.log('Creating new title...')
    } else {
      toast.success('Package creation - Coming soon!')
      console.log('Creating new package...')
    }
  }

  const handleCreateSubmit = () => {
    // Validate form
    if (!createForm.vin || !createForm.make || !createForm.model) {
      toast.error('Please fill in VIN, Make, and Model')
      return
    }

    // Create new title (in a real app, this would call an API)
    const newTitle = {
      id: `title-new-${Date.now()}`,
      titleNumber: null,
      titleType: createForm.titleType as any,
      issuingState: createForm.issuingState,
      issuingCountry: 'US',
      vehicle: {
        id: `vehicle-new-${Date.now()}`,
        vin: createForm.vin,
        make: createForm.make,
        model: createForm.model,
        year: createForm.year ? parseInt(createForm.year) : null,
        org: { id: 'org-dealer-1', name: 'New Customer' }
      },
      status: 'received' as any,
      priority: createForm.priority as any,
      receivedDate: new Date().toISOString(),
      processedDate: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      assignedTo: null,
      location: 'Receiving Dock',
      package: null,
      processingFee: 15.00,
      rushFee: null,
      notes: createForm.notes,
      internalNotes: null,
      tags: [],
      documents: [],
      statusHistory: [],
      activityLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: 'user-1', name: 'Admin User', email: 'admin@unitedcars.com' }
    }

    // In a real app, you would add this to the database/state
    toast.success(`New title created for ${createForm.make} ${createForm.model}!`)
    setShowCreateModal(false)
    setCreateForm({
      titleType: 'clean',
      issuingState: 'TX',
      vin: '',
      make: '',
      model: '',
      year: '',
      priority: 'normal',
      notes: ''
    })
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const handleViewTitle = (titleId: string) => {
    router.push(`/admin/titles/${titleId}`)
  }

  const handleViewPackage = (packageId: string) => {
    router.push(`/admin/packages/${packageId}`)
  }

  const getVehicleDisplay = (vehicle: EnhancedTitle['vehicle']) => {
    if (vehicle && vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return vehicle?.vin || 'Unknown Vehicle'
  }

  const getStatusColor = (status: string) => {
    // Title statuses
    const titleColors: Record<string, string> = {
      pending: 'warning',
      received: 'info', 
      processing: 'info',
      completed: 'success',
      cancelled: 'error',
      on_hold: 'warning',
      pending_docs: 'warning'
    }
    
    // Package statuses
    const packageColors: Record<string, string> = {
      pending: 'warning',
      prepared: 'info',
      shipped: 'info',
      in_transit: 'info', 
      delivered: 'success',
      exception: 'error'
    }
    
    return viewMode === 'titles' 
      ? (titleColors[status] || 'neutral')
      : (packageColors[status] || 'neutral')
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading data..." />
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

  const currentData = viewMode === 'titles' ? filteredTitles : filteredPackages
  const currentCounts = viewMode === 'titles' ? titleStatusCounts : packageStatusCounts

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={`📦 Title & Package Management`}
        description="Unified management of title processing and package shipments"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Titles & Packages' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('titles')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'titles'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Titles ({titleStatusCounts.all})
              </button>
              <button
                onClick={() => setViewMode('packages')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'packages'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Packages ({packageStatusCounts.all})
              </button>
            </div>
            
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {viewMode === 'titles' ? 'New Title' : 'New Package'}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={viewMode === 'titles' 
                    ? "Search by VIN, title #, vehicle, organization..." 
                    : "Search by tracking #, provider, contact..."}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="sr-only">Status</label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                {viewMode === 'titles' ? (
                  <>
                    <option value="all">All Status ({currentCounts.all})</option>
                    <option value="pending">Pending ({currentCounts.pending})</option>
                    <option value="received">Received ({currentCounts.received})</option>
                    <option value="processing">Processing ({currentCounts.processing})</option>
                    <option value="pending_docs">Pending Docs ({currentCounts.pending_docs})</option>
                    <option value="on_hold">On Hold ({currentCounts.on_hold})</option>
                    <option value="completed">Completed ({currentCounts.completed})</option>
                    <option value="cancelled">Cancelled ({currentCounts.cancelled})</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Status ({currentCounts.all})</option>
                    <option value="pending">Pending ({currentCounts.pending})</option>
                    <option value="prepared">Prepared ({currentCounts.prepared})</option>
                    <option value="shipped">Shipped ({currentCounts.shipped})</option>
                    <option value="in_transit">In Transit ({currentCounts.in_transit})</option>
                    <option value="delivered">Delivered ({currentCounts.delivered})</option>
                    <option value="exception">Exception ({currentCounts.exception})</option>
                  </>
                )}
              </select>
            </div>

            {/* Type/Priority Filter */}
            <div>
              <label htmlFor="type" className="sr-only">{viewMode === 'titles' ? 'Title Type' : 'Package Type'}</label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                {viewMode === 'titles' ? (
                  <>
                    <option value="all">All Types</option>
                    <option value="clean">Clean</option>
                    <option value="salvage">Salvage</option>
                    <option value="flood">Flood</option>
                    <option value="lemon">Lemon</option>
                    <option value="rebuilt">Rebuilt</option>
                    <option value="junk">Junk</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Types</option>
                    <option value="receiving">Receiving</option>
                    <option value="sending">Sending</option>
                  </>
                )}
              </select>
            </div>

            {/* State/Provider Filter */}
            <div>
              <label htmlFor="state" className="sr-only">{viewMode === 'titles' ? 'State' : 'Provider'}</label>
              <select
                id="state"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                {viewMode === 'titles' ? (
                  <>
                    <option value="all">All States</option>
                    <option value="TX">Texas</option>
                    <option value="CA">California</option>
                    <option value="FL">Florida</option>
                    <option value="NY">New York</option>
                    <option value="LA">Louisiana</option>
                    <option value="AZ">Arizona</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Providers</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="DHL">DHL</option>
                    <option value="USPS">USPS</option>
                  </>
                )}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label htmlFor="date" className="sr-only">Date Range</label>
              <select
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                {viewMode === 'titles' ? (
                  <>
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Title Processing Queue
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Package Management
                  </>
                )}
              </h2>
              <span className="text-sm text-gray-500">
                {currentData.length} {viewMode === 'titles' 
                  ? (currentData.length === 1 ? 'title' : 'titles')
                  : (currentData.length === 1 ? 'package' : 'packages')
                }
              </span>
            </div>
          </div>

          {currentData.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={viewMode === 'titles' ? <FileText className="h-12 w-12" /> : <Package className="h-12 w-12" />}
                title={`No ${viewMode} found`}
                description={searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || stateFilter !== 'all' || dateFilter !== 'all' 
                  ? `No ${viewMode} match your filters. Try adjusting your search criteria.`
                  : `No ${viewMode} have been created yet.`}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              {viewMode === 'titles' ? (
                // Titles Table
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Title ID</span>
                          {getSortIcon('id')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('vehicle')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Vehicle</span>
                          {getSortIcon('vehicle')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('titleType')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Title Type</span>
                          {getSortIcon('titleType')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('issuingState')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>State</span>
                          {getSortIcon('issuingState')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('org')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Organization</span>
                          {getSortIcon('org')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('expectedCompletionDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Expected Completion</span>
                          {getSortIcon('expectedCompletionDate')}
                        </div>
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTitles.map((title) => (
                      <tr 
                        key={title.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewTitle(title.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{title.id.substring(0, 8).toUpperCase()}
                          </div>
                          {title.titleNumber && (
                            <div className="text-xs text-gray-500 font-mono">
                              {title.titleNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getVehicleDisplay(title.vehicle)}</div>
                          <div className="text-xs text-gray-500 font-mono">{title.vehicle?.vin}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{getTitleTypeLabel(title.titleType)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{title.issuingState}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{title.vehicle?.org?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={getStatusColor(title.status)} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {isOverdue(title.expectedCompletionDate) ? (
                              <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                            ) : title.status === 'completed' ? (
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                            ) : (
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            )}
                            <span className={`text-sm ${isOverdue(title.expectedCompletionDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {formatDate(title.expectedCompletionDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewTitle(title.id)
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                          >
                            <span className="mr-1">Manage</span>
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                // Packages Table
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Package ID</span>
                          {getSortIcon('id')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('trackingNumber')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tracking</span>
                          {getSortIcon('trackingNumber')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('provider')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Provider</span>
                          {getSortIcon('provider')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Titles
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Titles
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPackages.map((pkg) => (
                      <tr 
                        key={pkg.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewPackage(pkg.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{pkg.id.substring(0, 8).toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(pkg.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {pkg.senderOrg.name} → {pkg.recipientOrg.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getOrganizationTypeLabel(pkg.senderOrg.type)} to {getOrganizationTypeLabel(pkg.recipientOrg.type)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {formatTrackingNumber(pkg.trackingNumber)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{getProviderLabel(pkg.provider)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {pkg.titles.length} title{pkg.titles.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={getStatusColor(pkg.status)} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {pkg.titles.length} title{pkg.titles.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewPackage(pkg.id)
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                          >
                            <span className="mr-1">Manage</span>
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          
          {/* Results Summary */}
          {currentData.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{currentData.length}</span> of{' '}
                <span className="font-medium">{viewMode === 'titles' ? titles.length : packages.length}</span> {viewMode}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Title Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Create New Title
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">VIN *</label>
                  <input
                    type="text"
                    value={createForm.vin}
                    onChange={(e) => setCreateForm({...createForm, vin: e.target.value.toUpperCase()})}
                    placeholder="17-character VIN"
                    maxLength={17}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Make *</label>
                    <input
                      type="text"
                      value={createForm.make}
                      onChange={(e) => setCreateForm({...createForm, make: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model *</label>
                    <input
                      type="text"
                      value={createForm.model}
                      onChange={(e) => setCreateForm({...createForm, model: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                      type="number"
                      value={createForm.year}
                      onChange={(e) => setCreateForm({...createForm, year: e.target.value})}
                      placeholder="2024"
                      min="1900"
                      max="2030"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <select
                      value={createForm.issuingState}
                      onChange={(e) => setCreateForm({...createForm, issuingState: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="TX">Texas</option>
                      <option value="CA">California</option>
                      <option value="FL">Florida</option>
                      <option value="NY">New York</option>
                      <option value="LA">Louisiana</option>
                      <option value="AZ">Arizona</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title Type</label>
                    <select
                      value={createForm.titleType}
                      onChange={(e) => setCreateForm({...createForm, titleType: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="clean">Clean</option>
                      <option value="salvage">Salvage</option>
                      <option value="flood">Flood</option>
                      <option value="rebuilt">Rebuilt</option>
                      <option value="lemon">Lemon</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({...createForm, priority: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="rush">Rush</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}