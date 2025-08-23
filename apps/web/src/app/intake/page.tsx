'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm',
  APPROVED: 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm',
  REJECTED: 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm'
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
      } else {
        console.error('Failed to fetch intakes:', result.error)
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Vehicle Intakes</h1>
            <p className="text-gray-600">
              Track your vehicle intake requests and their approval status
            </p>
          </div>
          <Link
            href="/intake/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + New Intake Request
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-medium">Intake Requests {intakes.length > 0 && `(${pagination.total})`}</h2>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  placeholder="Search by VIN, make, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading intakes...</div>
            ) : intakes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  {statusFilter === 'all' 
                    ? 'No intake requests found. Create your first one!' 
                    : `No ${statusFilter.toLowerCase()} intake requests found.`
                  }
                </div>
                {statusFilter === 'all' && (
                  <Link
                    href="/intake/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    + Create First Intake
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Vehicle</th>
                        <th className="text-left py-3 px-4">VIN</th>
                        <th className="text-left py-3 px-4">Auction</th>
                        <th className="text-left py-3 px-4">Destination</th>
                        <th className="text-left py-3 px-4">Created</th>
                        <th className="text-left py-3 px-4">Files</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intakes.map((intake) => (
                        <tr key={intake.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className={statusColors[intake.status]}>
                              {intake.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {getVehicleDisplay(intake)}
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">
                            {intake.vin}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                              {intake.auction}
                            </span>
                          </td>
                          <td className="py-3 px-4">{intake.destinationPort}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {formatDate(intake.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {intake.attachments?.length || 0} files
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/intake/${intake.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
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
    </div>
  )
}