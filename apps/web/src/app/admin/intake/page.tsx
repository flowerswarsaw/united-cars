'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import { Car, Eye, Search, ChevronUp, ChevronDown, DollarSign, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface IntakeRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  auction: 'COPART' | 'IAA'
  auctionLot: string
  vin: string
  make: string | null
  model: string | null
  year: number | null
  purchasePriceUSD: number
  auctionLocationId: string
  destinationPort: string
  notes: string | null
  createdAt: string
  reviewedAt: string | null
  createdBy: {
    name: string
    org: {
      name: string
    }
  }
}

export default function AdminIntakePage() {
  const router = useRouter()
  const [intakes, setIntakes] = useState<IntakeRequest[]>([])
  const [filteredIntakes, setFilteredIntakes] = useState<IntakeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [auctionFilter, setAuctionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortField, setSortField] = useState<'id' | 'vehicle' | 'org' | 'auction' | 'status' | 'purchasePriceUSD' | 'createdAt'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/intake')
        return
      }
      fetchIntakes()
    }
  }, [user, sessionLoading])

  useEffect(() => {
    filterIntakes()
  }, [intakes, searchTerm, statusFilter, auctionFilter, dateFilter, sortField, sortDirection])

  const fetchIntakes = async () => {
    try {
      const response = await fetch('/api/intakes')
      const data = await response.json()
      
      if (response.ok) {
        setIntakes(data.intakes || [])
        // Calculate status counts
        const intakeList = data.intakes || []
        setStatusCounts({
          all: intakeList.length,
          PENDING: intakeList.filter((i: IntakeRequest) => i.status === 'PENDING').length,
          APPROVED: intakeList.filter((i: IntakeRequest) => i.status === 'APPROVED').length,
          REJECTED: intakeList.filter((i: IntakeRequest) => i.status === 'REJECTED').length,
        })
      } else {
        toast.error(`Failed to fetch intake requests: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error fetching intake requests')
      console.error('Error fetching intake requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterIntakes = () => {
    let filtered = [...intakes]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(intake => 
        intake.id.toLowerCase().includes(search) ||
        intake.vin.toLowerCase().includes(search) ||
        intake.make?.toLowerCase().includes(search) ||
        intake.model?.toLowerCase().includes(search) ||
        intake.createdBy?.org?.name?.toLowerCase().includes(search) ||
        intake.notes?.toLowerCase().includes(search) ||
        intake.auctionLot.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(intake => intake.status === statusFilter)
    }

    // Auction filter
    if (auctionFilter !== 'all') {
      filtered = filtered.filter(intake => intake.auction === auctionFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      
      filtered = filtered.filter(intake => {
        const intakeDate = new Date(intake.createdAt)
        
        switch (dateFilter) {
          case 'today':
            return intakeDate >= startOfDay
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7))
            return intakeDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
            return intakeDate >= monthAgo
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
          aValue = getVehicleDisplay(a)
          bValue = getVehicleDisplay(b)
          break
        case 'org':
          aValue = a.createdBy?.org?.name || ''
          bValue = b.createdBy?.org?.name || ''
          break
        case 'auction':
          aValue = a.auction
          bValue = b.auction
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'purchasePriceUSD':
          aValue = a.purchasePriceUSD || 0
          bValue = b.purchasePriceUSD || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (sortField === 'createdAt' || sortField === 'purchasePriceUSD') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        const comparison = String(aValue).localeCompare(String(bValue))
        return sortDirection === 'asc' ? comparison : -comparison
      }
    })

    setFilteredIntakes(sorted)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const handleViewIntake = (intakeId: string) => {
    router.push(`/admin/intake/${intakeId}`)
  }

  const getVehicleDisplay = (intake: IntakeRequest) => {
    if (intake.year && intake.make && intake.model) {
      return `${intake.year} ${intake.make} ${intake.model}`
    }
    return intake.vin || 'Vehicle Details TBD'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading intake requests..." />
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

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="🎯 Auction Win Approvals"
        description="Review dealer auction declarations. Approved wins create vehicles in the fleet."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Intake Approvals' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  placeholder="Search by VIN, vehicle, organization..."
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
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="PENDING">Pending ({statusCounts.PENDING})</option>
                <option value="APPROVED">Approved ({statusCounts.APPROVED})</option>
                <option value="REJECTED">Rejected ({statusCounts.REJECTED})</option>
              </select>
            </div>

            {/* Auction Filter */}
            <div>
              <label htmlFor="auction" className="sr-only">Auction</label>
              <select
                id="auction"
                value={auctionFilter}
                onChange={(e) => setAuctionFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="all">All Auctions</option>
                <option value="COPART">Copart</option>
                <option value="IAA">IAA</option>
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

        {/* Intakes Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          {filteredIntakes.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Car className="h-12 w-12" />}
                title="No intake requests found"
                description={searchTerm || statusFilter !== 'all' || auctionFilter !== 'all' || dateFilter !== 'all' 
                  ? "No intake requests match your filters. Try adjusting your search criteria."
                  : "No auction wins have been declared yet."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Intake ID</span>
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
                      onClick={() => handleSort('auction')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Auction</span>
                        {getSortIcon('auction')}
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
                      onClick={() => handleSort('purchasePriceUSD')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Purchase Price</span>
                        {getSortIcon('purchasePriceUSD')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Submitted Date</span>
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIntakes.map((intake) => (
                    <tr 
                      key={intake.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewIntake(intake.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{intake.id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getVehicleDisplay(intake)}</div>
                        <div className="text-xs text-gray-500 font-mono">{intake.vin}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{intake.auction}</div>
                        <div className="text-xs text-gray-500">Lot #{intake.auctionLot}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{intake.createdBy?.org?.name || 'N/A'}</div>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {intake.destinationPort}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={intake.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                          {intake.purchasePriceUSD?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(intake.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewIntake(intake.id)
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                        >
                          <span className="mr-1">Review</span>
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Results Summary */}
          {filteredIntakes.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredIntakes.length}</span> of{' '}
                <span className="font-medium">{intakes.length}</span> intake requests
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}