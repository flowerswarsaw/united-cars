'use client'

import { useState, useEffect, useRef } from 'react'
import { Filter, Search, Car, Download, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Vehicle {
  id: string
  vin: string
  make: string | null
  model: string | null
  year: number | null
  status: 'SOURCING' | 'PURCHASED' | 'IN_TRANSIT' | 'AT_PORT' | 'SHIPPED' | 'DELIVERED'
  priceUSD: number | null
  purchasedAt: string | null
  createdAt: string
  org: {
    name: string
  }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0
  })
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    SOURCING: 0,
    PICKUP: 0,
    GROUND_TRANSPORT: 0,
    PORT_PROCESSING: 0,
    OCEAN_SHIPPING: 0,
    DESTINATION_PORT: 0,
    DELIVERED: 0
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    fetchVehicles()
  }, [filter, pagination.page, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      })
      
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/vehicles?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setVehicles(data.vehicles || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      } else {
        toast.error(`Failed to fetch vehicles: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error fetching vehicles')
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVehicleDisplay = (vehicle: Vehicle) => {
    if (vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return 'Unknown Vehicle'
  }

  // No need for client-side filtering as API handles it
  const filteredVehicles = vehicles

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setShowExportDropdown(false)
      
      // Get all vehicles for export (remove pagination for export)
      const params = new URLSearchParams({
        perPage: '1000', // Large number to get all vehicles
      })
      
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/vehicles?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        toast.error('Failed to export vehicles')
        return
      }

      const exportVehicles = data.vehicles || []
      
      if (exportVehicles.length === 0) {
        toast.error('No vehicles to export')
        return
      }

      const timestamp = new Date().toISOString().split('T')[0]
      
      if (format === 'csv') {
        // Convert to CSV
        const headers = ['VIN', 'Vehicle', 'Status', 'Price (USD)', 'Organization', 'Created Date']
        const csvRows = [
          headers.join(','),
          ...exportVehicles.map((vehicle: Vehicle) => [
            vehicle.vin,
            `"${getVehicleDisplay(vehicle)}"`,
            vehicle.status,
            vehicle.priceUSD || '',
            `"${vehicle.org.name}"`,
            formatDate(vehicle.createdAt)
          ].join(','))
        ]

        // Create and download CSV file
        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        
        const filename = `vehicles-export-${timestamp}.csv`
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success(`Exported ${exportVehicles.length} vehicles as CSV`)
      } else {
        // Convert to Excel
        const worksheetData = [
          ['VIN', 'Vehicle', 'Status', 'Price (USD)', 'Organization', 'Created Date'],
          ...exportVehicles.map((vehicle: Vehicle) => [
            vehicle.vin,
            getVehicleDisplay(vehicle),
            vehicle.status,
            vehicle.priceUSD || '',
            vehicle.org.name,
            formatDate(vehicle.createdAt)
          ])
        ]

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(worksheetData)
        
        // Auto-size columns
        const colWidths = worksheetData[0].map((_, colIndex) => {
          const maxLength = Math.max(
            ...worksheetData.map(row => String(row[colIndex] || '').length)
          )
          return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
        })
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Vehicles')
        
        // Generate and download Excel file
        const filename = `vehicles-export-${timestamp}.xlsx`
        XLSX.writeFile(wb, filename)
        
        toast.success(`Exported ${exportVehicles.length} vehicles as Excel`)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export vehicles')
    }
  }

  const filterOptions = [
    { value: 'all', label: 'All Vehicles', count: statusCounts.all },
    { value: 'SOURCING', label: 'Sourcing', count: statusCounts.SOURCING },
    { value: 'PICKUP', label: 'Pickup', count: statusCounts.PICKUP },
    { value: 'GROUND_TRANSPORT', label: 'Ground Transport', count: statusCounts.GROUND_TRANSPORT },
    { value: 'PORT_PROCESSING', label: 'Port Processing', count: statusCounts.PORT_PROCESSING },
    { value: 'OCEAN_SHIPPING', label: 'Ocean Shipping', count: statusCounts.OCEAN_SHIPPING },
    { value: 'DESTINATION_PORT', label: 'Destination Port', count: statusCounts.DESTINATION_PORT },
    { value: 'DELIVERED', label: 'Delivered', count: statusCounts.DELIVERED },
  ]

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Vehicle Inventory"
        description="Track vehicles from sourcing to delivery"
        breadcrumbs={[{ label: 'Main' }, { label: 'Vehicles' }]}
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
                      onClick={() => setFilter(option.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter === option.value
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
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Vehicles {filteredVehicles.length > 0 && `(${pagination.total})`}
              </h2>
              <div className="relative" ref={exportDropdownRef}>
                <button 
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
                
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport('csv')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading || sessionLoading ? (
              <LoadingState text="Loading vehicles..." />
            ) : filteredVehicles.length === 0 ? (
              <EmptyState
                icon={<Car className="h-12 w-12" />}
                title="No vehicles found"
                description={
                  searchTerm 
                    ? `No vehicles match "${searchTerm}"`
                    : filter === 'all'
                      ? 'No vehicles have been added yet.'
                      : `No vehicles with status "${filter}".`
                }
              />
            ) : (
              <>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                          Purchased
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredVehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getVehicleDisplay(vehicle)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 font-mono">
                              {vehicle.vin}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={vehicle.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(vehicle.priceUSD)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.org.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(vehicle.purchasedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/vehicles/${vehicle.id}`}
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