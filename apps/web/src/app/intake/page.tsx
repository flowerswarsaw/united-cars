'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Filter, Search, FileText, Car } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import toast from 'react-hot-toast'

interface IntakeData {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  auction: 'COPART' | 'IAA'
  vin: string
  make?: string
  model?: string
  year?: number
  destinationPort: string
  createdAt: string
  reviewedAt?: string
  attachments?: Array<{ id: string; kind: string; filename: string }>
}

export default function IntakeListPage() {
  const router = useRouter()
  const [intakes, setIntakes] = useState<IntakeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0
  })
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    fetchIntakes()
  }, [statusFilter, pagination.page, searchTerm])

  const fetchIntakes = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/intakes?${params}`)
      const result = await response.json()

      if (response.ok) {
        setIntakes(result.intakes || [])
        if (result.pagination) {
          setPagination(result.pagination)
        }
        if (result.statusCounts) {
          setStatusCounts(result.statusCounts)
        }
      } else {
        toast.error(`Failed to fetch intakes: ${result.error}`)
      }
    } catch (error) {
      toast.error('Error fetching intakes')
      console.error('Error fetching intakes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVehicleDisplay = (intake: IntakeData) => {
    const parts = []
    if (intake.year) parts.push(intake.year.toString())
    if (intake.make) parts.push(intake.make)
    if (intake.model) parts.push(intake.model)
    return parts.join(' ') || 'Unknown Vehicle'
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const filterOptions = [
    { value: 'all', label: 'All Declarations', count: statusCounts.all },
    { value: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
    { value: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
    { value: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED }
  ]

  if (isLoading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading intakes..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="🎯 Auction Declarations"
        description="Declare your auction wins and track admin approval status. Approved vehicles appear in your fleet."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Declarations' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex items-center space-x-2 flex-wrap">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        statusFilter === option.value
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
                    placeholder="Search by VIN, make, or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <Link
                  href="/intake/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Auction Declarations {intakes.length > 0 && `(${pagination.total})`}
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading || sessionLoading ? (
              <LoadingState text="Loading auction declarations..." />
            ) : intakes.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No auction declarations found"
                description={
                  searchTerm 
                    ? `No declarations match "${searchTerm}"`
                    : statusFilter === 'all'
                      ? 'No auction declarations have been submitted yet.'
                      : `No declarations with status "${statusFilter.toLowerCase()}".`
                }
              />
            ) : (
              <>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VIN
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Auction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Destination
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Files
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {intakes.map((intake) => (
                        <tr key={intake.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={intake.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getVehicleDisplay(intake)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 font-mono">
                              {intake.vin}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                              {intake.auction}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {intake.destinationPort}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(intake.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {intake.attachments?.length || 0} files
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/intake/${intake.id}`}
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