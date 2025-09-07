'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Filter, Search, FileText, Download, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Title {
  id: string
  status: 'pending' | 'received' | 'packed' | 'sent'
  location: string | null
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

export default function TitlesPage() {
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
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
    pending: 0,
    received: 0,
    packed: 0,
    sent: 0
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    fetchTitles()
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

  const fetchTitles = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      })
      
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/titles?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setTitles(data.titles || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      } else {
        toast.error(`Failed to fetch titles: ${data.error}`)
      }
    } catch (error) {
      toast.error('Error fetching titles')
      console.error('Error fetching titles:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getVehicleDisplay = (vehicle: Title['vehicle']) => {
    if (vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return 'Unknown Vehicle'
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setShowExportDropdown(false)
      
      // Get all titles for export (remove pagination for export)
      const params = new URLSearchParams({
        perPage: '1000', // Large number to get all titles
      })
      
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/titles?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        toast.error('Failed to export titles')
        return
      }

      const exportTitles = data.titles || []
      
      if (exportTitles.length === 0) {
        toast.error('No titles to export')
        return
      }

      const timestamp = new Date().toISOString().split('T')[0]
      
      if (format === 'csv') {
        // Convert to CSV
        const headers = ['Vehicle', 'VIN', 'Status', 'Location', 'Organization', 'Notes', 'Created Date']
        const csvRows = [
          headers.join(','),
          ...exportTitles.map((title: Title) => [
            `"${getVehicleDisplay(title.vehicle)}"`,
            title.vehicle.vin,
            title.status,
            title.location || '',
            `"${title.vehicle.org.name}"`,
            `"${title.notes || ''}"`,
            formatDate(title.createdAt)
          ].join(','))
        ]

        // Create and download CSV file
        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        
        const filename = `titles-export-${timestamp}.csv`
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success(`Exported ${exportTitles.length} titles as CSV`)
      } else {
        // Convert to Excel
        const worksheetData = [
          ['Vehicle', 'VIN', 'Status', 'Location', 'Organization', 'Notes', 'Created Date'],
          ...exportTitles.map((title: Title) => [
            getVehicleDisplay(title.vehicle),
            title.vehicle.vin,
            title.status,
            title.location || '',
            title.vehicle.org.name,
            title.notes || '',
            formatDate(title.createdAt)
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

        XLSX.utils.book_append_sheet(wb, ws, 'Titles')
        
        // Generate and download Excel file
        const filename = `titles-export-${timestamp}.xlsx`
        XLSX.writeFile(wb, filename)
        
        toast.success(`Exported ${exportTitles.length} titles as Excel`)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export titles')
    }
  }

  const filterOptions = [
    { value: 'all', label: 'All Titles', count: statusCounts.all },
    { value: 'pending', label: 'Pending', count: statusCounts.pending },
    { value: 'received', label: 'Received', count: statusCounts.received },
    { value: 'packed', label: 'Packed', count: statusCounts.packed },
    { value: 'sent', label: 'Sent', count: statusCounts.sent },
  ]

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Title Manager"
        description="Track and manage vehicle titles through processing"
        breadcrumbs={[{ label: 'Operations' }, { label: 'Titles' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-text-tertiary" />
                <div className="flex items-center space-x-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter === option.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:text-foreground hover:bg-hover-overlay'
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search titles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Vehicle Titles {titles.length > 0 && `(${pagination.total})`}
              </h2>
              <div className="relative" ref={exportDropdownRef}>
                <button 
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="inline-flex items-center px-3 py-1 text-sm text-text-secondary hover:text-foreground"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
                
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-card rounded-lg shadow-lg border border-border z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport('csv')}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-hover-overlay"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-hover-overlay"
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
              <LoadingState text="Loading titles..." />
            ) : titles.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No titles found"
                description={
                  searchTerm 
                    ? `No titles match "${searchTerm}"`
                    : filter === 'all' 
                      ? 'No titles have been created yet.'
                      : `No titles with status "${filter}".`
                }
              />
            ) : (
              <>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          VIN
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {titles.map((title) => (
                        <tr key={title.id} className="hover:bg-hover-overlay transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {getVehicleDisplay(title.vehicle)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-text-secondary font-mono">
                              {title.vehicle.vin}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={title.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                            {title.location || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                            {title.vehicle.org.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                            {formatDate(title.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/titles/${title.id}`}
                              className="text-primary hover:text-primary/80 font-medium"
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
                    <div className="text-sm text-foreground">
                      Showing {((pagination.page - 1) * pagination.perPage) + 1} to{' '}
                      {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover-overlay"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm border rounded-lg ${
                            page === pagination.page
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:bg-hover-overlay'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover-overlay"
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