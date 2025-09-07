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
  mockTitleDatabase,
  getTitleTypeLabel, 
  getPriorityLabel,
  getPriorityColor,
  formatDate 
} from '@/lib/title-mock-data'
import { 
  mockPackageData,
  mockPackageDatabase,
  getOrganizationTypeLabel,
  getProviderLabel,
  formatTrackingNumber,
  packageStatusConfig,
  packagePriorityConfig
} from '@/lib/package-mock-data'
import type { 
  EnhancedTitle, 
  EnhancedPackage, 
  TitleStatus,
  DynamicTitleStatus
} from '@/types/title-enhanced'
import { DYNAMIC_STATUS_CONFIG } from '@/types/title-enhanced'

type ViewMode = 'titles' | 'packages'

// Available organizations for title assignment
const availableOrganizations = [
  // Internal United Cars Organizations
  { id: 'org-united-cars-main', name: 'United Cars - Main Office', type: 'processor' },
  { id: 'org-united-cars-processing', name: 'United Cars - Processing Center', type: 'processor' },
  { id: 'org-united-cars-warehouse', name: 'United Cars - Warehouse Houston', type: 'processor' },
  { id: 'org-united-cars-shipping', name: 'United Cars - Shipping Dept', type: 'processor' },
  
  // External Dealers
  { id: 'org-dealer-1', name: 'Premium Auto Dealers', type: 'dealer' },
  { id: 'org-dealer-2', name: 'Gulf Coast Motors', type: 'dealer' },
  { id: 'org-dealer-3', name: 'Mountain View Auto', type: 'dealer' },
  { id: 'org-dealer-4', name: 'Pacific Coast Imports', type: 'dealer' },
  { id: 'org-dealer-5', name: 'Texas Auto Group', type: 'dealer' },
  { id: 'org-dealer-6', name: 'Florida Motor Exchange', type: 'dealer' },
  { id: 'org-dealer-7', name: 'California Auto Sales', type: 'dealer' },
  
  // External Auction Houses
  { id: 'org-auction-1', name: 'Copart Dallas', type: 'auction' },
  { id: 'org-auction-2', name: 'IAA Seattle', type: 'auction' },
  { id: 'org-auction-3', name: 'Manheim Auto Auction', type: 'auction' }
]

export default function AdminTitlePackagesPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('titles')
  const [titles] = useState<(EnhancedTitle & { dynamicStatus: DynamicTitleStatus })[]>(mockTitleDatabase.getAllWithDynamicStatus())
  const [packages] = useState<EnhancedPackage[]>(mockPackageData)
  
  const [filteredTitles, setFilteredTitles] = useState<(EnhancedTitle & { dynamicStatus: DynamicTitleStatus })[]>([])
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
  const [showCreatePackageModal, setShowCreatePackageModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    vin: '',
    orgId: 'org-dealer-1',
    orgName: 'Premium Auto Dealers',
    notes: ''
  })
  const [createPackageForm, setCreatePackageForm] = useState({
    senderOrgId: availableOrganizations[11].id,    // Copart Dallas (auction)
    senderOrgName: availableOrganizations[11].name,
    recipientOrgId: availableOrganizations[0].id,   // United Cars - Main Office
    recipientOrgName: availableOrganizations[0].name,
    trackingNumber: '',
    carrier: '',
    notes: ''
  })
  const [packageTitleSelection, setPackageTitleSelection] = useState({
    selectedTitleIds: new Set<string>(),
    titleFilter: {
      orgFilter: availableOrganizations[11].id, // Default to sender org (Copart Dallas)
      statusFilter: 'all',
      search: ''
    }
  })
  
  const [titleStatusCounts, setTitleStatusCounts] = useState({
    all: 0,
    pending: 0,
    packed: 0,
    sent_to: 0,
    received_by: 0
  })
  
  const [packageStatusCounts, setPackageStatusCounts] = useState({
    all: 0,
    packed: 0,
    sent: 0,
    delivered: 0
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
        pending: titles.filter(t => t.dynamicStatus.status === 'pending').length,
        packed: titles.filter(t => t.dynamicStatus.status === 'packed').length,
        sent_to: titles.filter(t => t.dynamicStatus.status === 'sent_to').length,
        received_by: titles.filter(t => t.dynamicStatus.status === 'received_by').length,
      })
      
      // Calculate package status counts
      setPackageStatusCounts({
        all: packages.length,
        packed: packages.filter(p => p.status === 'packed').length,
        sent: packages.filter(p => p.status === 'sent').length,
        delivered: packages.filter(p => p.status === 'delivered').length
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
      filtered = filtered.filter(title => title.dynamicStatus.status === statusFilter)
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

    // Note: No type filter for packages since they don't have types anymore

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
      console.log('Creating new title...')
    } else {
      setShowCreatePackageModal(true)
      console.log('Creating new package...')
    }
  }

  const handleCreateSubmit = () => {
    // Validate form
    if (!createForm.vin || createForm.vin.length !== 17) {
      toast.error('Please enter a valid 17-character VIN')
      return
    }

    // Mock API call to decode VIN and get vehicle data
    const mockVehicleData = {
      make: 'Toyota', // Would come from VIN decoding API
      model: 'Camry', // Would come from VIN decoding API  
      year: 2020,     // Would come from VIN decoding API
      titleType: 'clean' // Would come from auction API
    }

    // Create new title (in a real app, this would call an API)
    const newTitle = {
      id: `title-new-${Date.now()}`,
      titleNumber: null,
      titleType: mockVehicleData.titleType as any,
      issuingState: 'TX', // Would come from auction API
      issuingCountry: 'US',
      vehicle: {
        id: `vehicle-new-${Date.now()}`,
        vin: createForm.vin,
        make: mockVehicleData.make,
        model: mockVehicleData.model,
        year: mockVehicleData.year,
        org: { id: createForm.orgId, name: createForm.orgName }
      },
      status: 'received' as any,
      priority: 'normal' as any, // Default priority
      assignedTo: null,
      location: 'Receiving Dock',
      packageIds: [],
      packages: [],
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
    toast.success(`New title created for ${mockVehicleData.year} ${mockVehicleData.make} ${mockVehicleData.model} - assigned to ${createForm.orgName}!`)
    setShowCreateModal(false)
    setCreateForm({
      vin: '',
      orgId: 'org-dealer-1',
      orgName: 'Premium Auto Dealers',
      notes: ''
    })
  }

  // Helper functions for package title selection
  const getAvailableTitlesForPackage = () => {
    const filters = packageTitleSelection.titleFilter
    console.log('🔍 Filter Debug:', {
      orgFilter: filters.orgFilter,
      statusFilter: filters.statusFilter,
      search: filters.search,
      totalTitles: titles.length
    })

    const filtered = titles.filter(title => {
      // Only show titles that aren't already in a package
      const isUnassigned = !title.packageIds || title.packageIds.length === 0

      // Filter by organization
      const orgMatch = filters.orgFilter === 'all' || 
                      (title.vehicle?.org?.id === filters.orgFilter)

      // Filter by status using dynamic status
      const statusMatch = filters.statusFilter === 'all' || 
                         (title.dynamicStatus.status === filters.statusFilter)

      // Filter by search (VIN or vehicle info) - with safe string handling
      let searchMatch = true
      if (filters.search !== '') {
        const searchTerm = filters.search.toLowerCase()
        const vin = (title.vehicle?.vin || '').toLowerCase()
        const vehicleInfo = `${title.vehicle?.year || ''} ${title.vehicle?.make || ''} ${title.vehicle?.model || ''}`.toLowerCase()
        const titleType = (title.titleType || '').toLowerCase()
        
        searchMatch = vin.includes(searchTerm) || 
                     vehicleInfo.includes(searchTerm) || 
                     titleType.includes(searchTerm)
      }

      const matches = isUnassigned && orgMatch && statusMatch && searchMatch
      
      // Debug individual title matching
      if (filters.orgFilter !== 'all' || filters.statusFilter !== 'all' || filters.search !== '') {
        console.log(`📋 Title ${title.id}:`, {
          org: title.vehicle?.org?.id,
          orgName: title.vehicle?.org?.name,
          status: title.dynamicStatus.status,
          statusDisplay: title.dynamicStatus.displayText,
          vin: title.vehicle?.vin,
          isUnassigned,
          orgMatch,
          statusMatch,
          searchMatch,
          finalMatch: matches
        })
      }

      return matches
    })

    console.log(`✅ Filtered Results: ${filtered.length} titles match filters`)
    return filtered
  }

  const handleTitleSelect = (titleId: string, selected: boolean) => {
    const newSelectedIds = new Set(packageTitleSelection.selectedTitleIds)
    if (selected) {
      newSelectedIds.add(titleId)
    } else {
      newSelectedIds.delete(titleId)
    }
    setPackageTitleSelection(prev => ({
      ...prev,
      selectedTitleIds: newSelectedIds
    }))
  }

  const handleSelectAllTitles = () => {
    const availableTitles = getAvailableTitlesForPackage()
    const filteredIds = new Set(availableTitles.map(title => title.id))
    console.log(`🎯 Select All: Selecting ${filteredIds.size} titles that match current filters:`, 
      Array.from(filteredIds))
    setPackageTitleSelection(prev => ({
      ...prev,
      selectedTitleIds: filteredIds
    }))
  }

  const handleClearAllTitles = () => {
    console.log('Clearing all title selections')
    setPackageTitleSelection(prev => ({
      ...prev,
      selectedTitleIds: new Set()
    }))
  }

  const handleCreatePackageSubmit = () => {
    // Validate required fields
    if (!createPackageForm.trackingNumber || createPackageForm.trackingNumber.trim() === '') {
      toast.error('Tracking number is required')
      return
    }

    if (!createPackageForm.carrier || createPackageForm.carrier.trim() === '') {
      toast.error('Carrier is required')
      return
    }

    if (packageTitleSelection.selectedTitleIds.size === 0) {
      toast.error('Please select at least one title for the package')
      return
    }

    // Create the package in mock database
    const newPackageId = `package-enhanced-${String(Date.now()).slice(-6)}`
    const selectedTitleIds = Array.from(packageTitleSelection.selectedTitleIds)
    
    // Find sender and recipient organizations
    const senderOrg = availableOrganizations.find(org => org.id === createPackageForm.senderOrgId)
    const recipientOrg = availableOrganizations.find(org => org.id === createPackageForm.recipientOrgId)
    
    if (!senderOrg || !recipientOrg) {
      toast.error('Invalid organization selection')
      return
    }
    
    // Create package object
    const newPackage = {
      id: newPackageId,
      trackingNumber: createPackageForm.trackingNumber,
      provider: createPackageForm.carrier,
      estimatedDelivery: null,
      actualDelivery: null,
      status: 'packed' as const,
      priority: 'standard' as const,
      senderOrg: {
        id: senderOrg.id,
        name: senderOrg.name,
        type: senderOrg.type as any,
        email: `contact@${senderOrg.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: null
      },
      recipientOrg: {
        id: recipientOrg.id,
        name: recipientOrg.name,
        type: recipientOrg.type as any,
        email: `contact@${recipientOrg.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: null
      },
      weight: null,
      dimensions: null,
      insuranceValue: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      titles: [], // Will be populated by title database
      documents: []
    }
    
    // Add package to package database
    mockPackageDatabase.addPackage(newPackage)
    
    // Connect selected titles to the package
    selectedTitleIds.forEach(titleId => {
      mockTitleDatabase.addTitleToPackage(titleId, newPackageId)
    })

    toast.success(`Package ${newPackageId} created successfully with ${selectedTitleIds.length} titles!`)
    setShowCreatePackageModal(false)
    
    // Refresh data to show new package and updated title statuses
    setTimeout(() => {
      window.location.reload()
    }, 500)
    
    // Reset form
    setCreatePackageForm({
      senderOrgId: availableOrganizations[11].id,    // Copart Dallas (auction)
      senderOrgName: availableOrganizations[11].name,
      recipientOrgId: availableOrganizations[0].id,   // United Cars - Main Office
      recipientOrgName: availableOrganizations[0].name,
      trackingNumber: '',
      carrier: '',
      notes: ''
    })
    setPackageTitleSelection({
      selectedTitleIds: new Set(),
      titleFilter: {
        orgFilter: availableOrganizations[7].id,
        statusFilter: 'all',
        search: ''
      }
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
      packed: 'warning',
      sent: 'primary',
      delivered: 'success'
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
            <p className="mt-2 text-text-secondary">You need admin privileges to view this page.</p>
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
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex bg-surface-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('titles')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'titles'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-secondary hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Titles ({titleStatusCounts.all})
              </button>
              <button
                onClick={() => setViewMode('packages')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'packages'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-secondary hover:text-foreground'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Packages ({packageStatusCounts.all})
              </button>
            </div>
            
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {viewMode === 'titles' ? 'New Title' : 'New Package'}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-text-tertiary" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-white placeholder-text-tertiary focus:outline-none focus:placeholder-text-secondary focus:ring-1 focus:ring-primary focus:border-primary text-sm"
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
                className="block w-full pl-3 pr-10 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary rounded-md"
              >
                {viewMode === 'titles' ? (
                  <>
                    <option value="all">All Status ({currentCounts.all})</option>
                    <option value="pending">Pending ({currentCounts.pending})</option>
                    <option value="packed">Packed ({currentCounts.packed})</option>
                    <option value="sent_to">Sent To Org ({currentCounts.sent_to})</option>
                    <option value="received_by">Received By Org ({currentCounts.received_by})</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Status ({currentCounts.all})</option>
                    <option value="packed">Packed ({currentCounts.packed})</option>
                    <option value="sent">Sent ({currentCounts.sent})</option>
                    <option value="delivered">Delivered ({currentCounts.delivered})</option>
                  </>
                )}
              </select>
            </div>

            {/* Type Filter (only for titles) */}
            {viewMode === 'titles' && (
              <div>
                <label htmlFor="type" className="sr-only">Title Type</label>
                <select
                  id="type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="clean">Clean</option>
                  <option value="salvage">Salvage</option>
                  <option value="flood">Flood</option>
                  <option value="lemon">Lemon</option>
                  <option value="rebuilt">Rebuilt</option>
                  <option value="junk">Junk</option>
                </select>
              </div>
            )}

            {/* State/Provider Filter */}
            <div>
              <label htmlFor="state" className="sr-only">{viewMode === 'titles' ? 'State' : 'Provider'}</label>
              <select
                id="state"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary rounded-md"
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
                className="block w-full pl-3 pr-10 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary rounded-md"
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Title ID</span>
                          {getSortIcon('id')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('vehicle')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Vehicle</span>
                          {getSortIcon('vehicle')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('titleType')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Title Type</span>
                          {getSortIcon('titleType')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('issuingState')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>State</span>
                          {getSortIcon('issuingState')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('org')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Organization</span>
                          {getSortIcon('org')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
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
                          <StatusBadge 
                            status={title.dynamicStatus.status} 
                            label={title.dynamicStatus.displayText}
                          />
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('trackingNumber')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tracking</span>
                          {getSortIcon('trackingNumber')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
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
                          <StatusBadge status={pkg.status} />
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
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Create New Title
              </h3>
              <p className="text-sm text-text-secondary text-center mb-4">
                Enter VIN and assign to organization. Vehicle details will be fetched automatically.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">VIN *</label>
                  <input
                    type="text"
                    value={createForm.vin}
                    onChange={(e) => setCreateForm({...createForm, vin: e.target.value.toUpperCase()})}
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
                    className="mt-1 block w-full border border-border rounded-md px-3 py-2 font-mono"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Vehicle details will be automatically retrieved from auction API
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign to Organization *</label>
                  <select
                    value={createForm.orgId}
                    onChange={(e) => {
                      const selectedOrg = availableOrganizations.find(org => org.id === e.target.value)
                      setCreateForm({
                        ...createForm, 
                        orgId: e.target.value,
                        orgName: selectedOrg?.name || ''
                      })
                    }}
                    className="mt-1 block w-full border border-border rounded-md px-3 py-2"
                  >
                    <optgroup label="Dealers">
                      {availableOrganizations.filter(org => org.type === 'dealer').map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Auction Houses">
                      {availableOrganizations.filter(org => org.type === 'auction').map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    This title will be processed for the selected organization
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-border rounded-md px-3 py-2"
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
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Create Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showCreatePackageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Create New Package
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Create a new package for title shipping
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Organization</label>
                    <select
                      value={createPackageForm.senderOrgId}
                      onChange={(e) => {
                        const selectedOrg = e.target.value
                        const orgName = e.target.options[e.target.selectedIndex].text
                        setCreatePackageForm({...createPackageForm, senderOrgId: selectedOrg, senderOrgName: orgName})
                        // Auto-update title filter to show titles from sender org
                        setPackageTitleSelection(prev => ({
                          ...prev,
                          titleFilter: { ...prev.titleFilter, orgFilter: selectedOrg },
                          selectedTitleIds: new Set() // Clear selections when org changes
                        }))
                      }}
                      className="mt-1 block w-full border border-border rounded-md px-3 py-2"
                    >
                      {availableOrganizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.type.charAt(0).toUpperCase() + org.type.slice(1)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To Organization</label>
                    <select
                      value={createPackageForm.recipientOrgId}
                      onChange={(e) => {
                        const selectedOrg = e.target.value
                        const orgName = e.target.options[e.target.selectedIndex].text
                        setCreatePackageForm({...createPackageForm, recipientOrgId: selectedOrg, recipientOrgName: orgName})
                      }}
                      className="mt-1 block w-full border border-border rounded-md px-3 py-2"
                    >
                      {availableOrganizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.type.charAt(0).toUpperCase() + org.type.slice(1)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tracking Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createPackageForm.trackingNumber}
                      onChange={(e) => setCreatePackageForm({...createPackageForm, trackingNumber: e.target.value})}
                      className="mt-1 block w-full border border-border rounded-md px-3 py-2 font-mono"
                      placeholder="Enter tracking number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Carrier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createPackageForm.carrier}
                      onChange={(e) => setCreatePackageForm({...createPackageForm, carrier: e.target.value})}
                      className="mt-1 block w-full border border-border rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select carrier...</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="DHL">DHL</option>
                      <option value="USPS">USPS</option>
                      <option value="OnTrac">OnTrac</option>
                      <option value="Lasership">Lasership</option>
                      <option value="Amazon Logistics">Amazon Logistics</option>
                      <option value="Purolator">Purolator</option>
                      <option value="Canada Post">Canada Post</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Title Selection Section */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Select Titles for Package
                        {packageTitleSelection.selectedTitleIds.size > 0 && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {packageTitleSelection.selectedTitleIds.size} selected
                          </span>
                        )}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleSelectAllTitles}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllTitles}
                          className="text-xs text-text-secondary hover:text-gray-800"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    
                    {/* Title Filters */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div>
                        <select
                          value={packageTitleSelection.titleFilter.orgFilter}
                          onChange={(e) => setPackageTitleSelection(prev => ({
                            ...prev,
                            titleFilter: { ...prev.titleFilter, orgFilter: e.target.value }
                          }))}
                          className="w-full text-xs border border-border rounded px-2 py-1"
                        >
                          <option value="all">All Organizations</option>
                          <option value="org-auction-1">Copart Dallas</option>
                          <option value="org-auction-2">Manheim Austin</option>
                          <option value="org-auction-3">IAAI Houston</option>
                          <option value="org-dealer-1">Premium Auto Dealers</option>
                          <option value="org-dealer-2">Elite Car Sales</option>
                          <option value="org-processing-1">United Cars Processing</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={packageTitleSelection.titleFilter.statusFilter}
                          onChange={(e) => setPackageTitleSelection(prev => ({
                            ...prev,
                            titleFilter: { ...prev.titleFilter, statusFilter: e.target.value }
                          }))}
                          className="w-full text-xs border border-border rounded px-2 py-1"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="packed">Packed</option>
                          <option value="sent_to">Sent To Org</option>
                          <option value="received_by">Received By Org</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Search VIN, make, model..."
                          value={packageTitleSelection.titleFilter.search}
                          onChange={(e) => setPackageTitleSelection(prev => ({
                            ...prev,
                            titleFilter: { ...prev.titleFilter, search: e.target.value }
                          }))}
                          className="w-full text-xs border border-border rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    
                    {/* Title List */}
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded bg-white">
                      {getAvailableTitlesForPackage().length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {getAvailableTitlesForPackage().map(title => (
                            <div key={title.id} className="p-3 hover:bg-gray-50">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={packageTitleSelection.selectedTitleIds.has(title.id)}
                                  onChange={(e) => handleTitleSelect(title.id, e.target.checked)}
                                  className="h-4 w-4 text-blue-600 rounded border-border focus:ring-primary"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        VIN: {title.vehicle?.vin || 'N/A'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {title.vehicle?.year} {title.vehicle?.make} {title.vehicle?.model}
                                      </p>
                                      <p className="text-xs text-text-tertiary">
                                        {title.vehicle?.org?.name} • {title.titleType}
                                      </p>
                                    </div>
                                    <StatusBadge 
                                      status={title.dynamicStatus.status} 
                                      label={title.dynamicStatus.displayText}
                                      size="sm" 
                                    />
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No unassigned titles match your filters
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={createPackageForm.notes}
                      onChange={(e) => setCreatePackageForm({...createPackageForm, notes: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border border-border rounded-md px-3 py-2"
                      placeholder="Package handling instructions..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreatePackageModal(false)
                    // Reset title selection when canceling
                    setPackageTitleSelection({
                      selectedTitleIds: new Set(),
                      titleFilter: {
                        orgFilter: createPackageForm.senderOrgId,
                        statusFilter: 'all',
                        search: ''
                      }
                    })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePackageSubmit}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Create Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}