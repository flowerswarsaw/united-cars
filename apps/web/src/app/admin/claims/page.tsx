'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import { Shield, Eye, Search, Filter, Calendar, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface InsuranceClaim {
  id: string
  status: 'new' | 'investigating' | 'under_review' | 'approved' | 'rejected' | 'settled' | 'paid' | 'closed'
  description: string | null
  incidentAt: string | null
  photos: any
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

export default function AdminClaimsPage() {
  const router = useRouter()
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [filteredClaims, setFilteredClaims] = useState<InsuranceClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortField, setSortField] = useState<'id' | 'vehicle' | 'org' | 'status' | 'createdAt'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    new: 0,
    investigating: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    settled: 0,
    paid: 0,
    closed: 0
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/claims')
        return
      }
      fetchClaims()
    }
  }, [user, sessionLoading])

  useEffect(() => {
    filterClaims()
  }, [claims, searchTerm, statusFilter, dateFilter, sortField, sortDirection])

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/claims')
      const data = await response.json()
      
      if (response.ok) {
        setClaims(data.claims || [])
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      } else {
        toast.error(`Failed to fetch claims: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error fetching claims')
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClaims = () => {
    let filtered = [...claims]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(claim => 
        claim.id.toLowerCase().includes(search) ||
        claim.vehicle?.vin?.toLowerCase().includes(search) ||
        claim.vehicle?.make?.toLowerCase().includes(search) ||
        claim.vehicle?.model?.toLowerCase().includes(search) ||
        claim.vehicle?.org?.name?.toLowerCase().includes(search) ||
        claim.description?.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      
      filtered = filtered.filter(claim => {
        const claimDate = new Date(claim.createdAt)
        
        switch (dateFilter) {
          case 'today':
            return claimDate >= startOfDay
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7))
            return claimDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
            return claimDate >= monthAgo
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

    setFilteredClaims(sorted)
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

  const getVehicleDisplay = (vehicle: InsuranceClaim['vehicle']) => {
    if (vehicle && vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return vehicle?.vin || 'Unknown Vehicle'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
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
          <LoadingState text="Loading claims..." />
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
        title="Insurance Claims"
        description="Review and manage all insurance claims"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Claims' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="new">New ({statusCounts.new})</option>
                <option value="investigating">Investigating ({statusCounts.investigating})</option>
                <option value="under_review">Under Review ({statusCounts.under_review})</option>
                <option value="approved">Approved ({statusCounts.approved})</option>
                <option value="rejected">Rejected ({statusCounts.rejected})</option>
                <option value="settled">Settled ({statusCounts.settled})</option>
                <option value="paid">Paid ({statusCounts.paid})</option>
                <option value="closed">Closed ({statusCounts.closed})</option>
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

        {/* Claims Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          {filteredClaims.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Shield className="h-12 w-12" />}
                title="No claims found"
                description={searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? "No claims match your filters. Try adjusting your search criteria."
                  : "No insurance claims have been filed yet."}
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
                        <span>Claim ID</span>
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
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Filed Date</span>
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClaims.map((claim) => (
                    <tr 
                      key={claim.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/claims/${claim.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{claim.id.substring(0, 8)}
                        </div>
                        {claim.photos && claim.photos.length > 0 && (
                          <div className="text-xs text-gray-500">
                            📷 {claim.photos.length} photo{claim.photos.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getVehicleDisplay(claim.vehicle)}</div>
                        <div className="text-xs text-gray-500 font-mono">{claim.vehicle?.vin}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{claim.vehicle?.org?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/claims/${claim.id}`)
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                        >
                          <span className="mr-1">View</span>
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
          {filteredClaims.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredClaims.length}</span> of{' '}
                <span className="font-medium">{claims.length}</span> claims
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}