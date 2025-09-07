'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Shield, Camera, AlertCircle, CheckCircle, FileImage, Download, ChevronFirst, ChevronLast, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'
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

export default function ClaimsPage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [sortField, setSortField] = useState<'createdAt' | 'incidentAt' | 'status' | 'vehicle' | 'organization'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0
  })
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
  const [newClaim, setNewClaim] = useState({
    vehicleId: '',
    description: '',
    photos: [] as Array<{ filename: string; url: string; file?: File }>
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    fetchClaims()
    fetchVehicles()
  }, [filter, pagination.page, searchTerm, sortField, sortDirection])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showExportDropdown && !target.closest('.relative')) {
        setShowExportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportDropdown])

  const fetchClaims = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      })
      
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/claims?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        const sortedClaims = sortClaims(data.claims || [])
        setClaims(sortedClaims)
        if (data.pagination) {
          setPagination(data.pagination)
        }
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

  const exportData = (format: 'csv' | 'excel') => {
    if (claims.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Vehicle', 'VIN', 'Status', 'Incident Date', 'Organization', 'Filed Date']
    const rows = claims.map(claim => [
      getVehicleDisplay(claim.vehicle),
      claim.vehicle?.vin || 'N/A',
      claim.status,
      formatDate(claim.incidentAt),
      claim.vehicle?.org?.name || 'N/A',
      formatDate(claim.createdAt)
    ])

    if (format === 'csv') {
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `claims-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Claims data exported to CSV')
    } else if (format === 'excel') {
      // Create Excel content using HTML table format
      const excelContent = `
        <table>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </table>
      `
      
      const blob = new Blob([excelContent], { 
        type: 'application/vnd.ms-excel;charset=utf-8;' 
      })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `claims-${new Date().toISOString().split('T')[0]}.xls`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Claims data exported to Excel')
    }
    
    setShowExportDropdown(false)
  }

  const handlePhotoUpload = (files: File[]) => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return false
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Create preview URLs for the files
    const newPhotos = validFiles.map(file => ({
      filename: file.name,
      url: URL.createObjectURL(file),
      file: file
    }))

    setNewClaim(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }))

    toast.success(`${validFiles.length} photo(s) uploaded successfully`)
  }

  const removePhoto = (index: number) => {
    const photoToRemove = newClaim.photos[index]
    URL.revokeObjectURL(photoToRemove.url) // Clean up object URL
    
    setNewClaim(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required photos
    if (!newClaim.photos || newClaim.photos.length === 0) {
      toast.error('Photos are required to file a claim')
      return
    }
    
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClaim)
      })

      const data = await response.json()
      
      if (response.ok) {
        setClaims([data.claim, ...claims])
        setShowNewForm(false)
        // Clean up photo URLs before resetting
        newClaim.photos.forEach(photo => URL.revokeObjectURL(photo.url))
        setNewClaim({ vehicleId: '', description: '', photos: [] })
        toast.success('Insurance claim submitted successfully!')
      } else {
        toast.error(`Failed to create claim: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating claim:', error)
      toast.error('Error creating claim')
    } finally {
      setSubmitting(false)
    }
  }

  const getVehicleDisplay = (vehicle: InsuranceClaim['vehicle']) => {
    if (vehicle && vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return 'Unknown Vehicle'
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when sorting
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const sortClaims = (claimsToSort: InsuranceClaim[]) => {
    return [...claimsToSort].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'createdAt':
        case 'incidentAt':
          aValue = new Date(a[sortField] || 0).getTime()
          bValue = new Date(b[sortField] || 0).getTime()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'vehicle':
          aValue = getVehicleDisplay(a.vehicle).toLowerCase()
          bValue = getVehicleDisplay(b.vehicle).toLowerCase()
          break
        case 'organization':
          aValue = (a.vehicle?.org?.name || '').toLowerCase()
          bValue = (b.vehicle?.org?.name || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const filterOptions = [
    { value: 'all', label: 'All Claims', count: statusCounts.all },
    { value: 'new', label: 'New', count: statusCounts.new },
    { value: 'investigating', label: 'Investigating', count: statusCounts.investigating },
    { value: 'under_review', label: 'Under Review', count: statusCounts.under_review },
    { value: 'approved', label: 'Approved', count: statusCounts.approved },
    { value: 'rejected', label: 'Rejected', count: statusCounts.rejected },
    { value: 'settled', label: 'Settled', count: statusCounts.settled },
    { value: 'paid', label: 'Paid', count: statusCounts.paid },
    { value: 'closed', label: 'Closed', count: statusCounts.closed }
  ]

  const canCreateClaim = user?.roles.includes('DEALER') || user?.roles.includes('ADMIN')

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Insurance Claims"
        description="File and track insurance claims for vehicle incidents"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Claims' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex items-center flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter === option.value
                          ? 'bg-red-100 text-red-700'
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
                    placeholder="Search by VIN, make, model, or year..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                    {showExportDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => exportData('csv')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as CSV
                          </button>
                          <button
                            onClick={() => exportData('excel')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as Excel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {canCreateClaim && (
                    <button
                      onClick={() => setShowNewForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      File Claim
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Claim Form Modal */}
        {showNewForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-lg bg-white">
              <form onSubmit={handleCreateClaim} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">File Insurance Claim</h3>
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
                    value={newClaim.vehicleId}
                    onChange={(e) => setNewClaim({ ...newClaim, vehicleId: e.target.value })}
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
                    Description *
                  </label>
                  <textarea
                    value={newClaim.description}
                    onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the incident and damage in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos *
                  </label>
                  <div className="space-y-4">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const files = Array.from(e.dataTransfer.files)
                        handlePhotoUpload(files)
                      }}
                    >
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Upload incident photos</p>
                      <p className="text-xs text-gray-400 mt-1">Drag and drop photos or click to browse</p>
                    </div>
                    
                    <input
                      id="photo-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handlePhotoUpload(Array.from(e.target.files))}
                      className="hidden"
                    />

                    {/* Display uploaded photos */}
                    {newClaim.photos.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Uploaded Photos:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {newClaim.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo.url}
                                alt={photo.filename}
                                className="w-full h-24 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                              <p className="text-xs text-gray-500 mt-1 truncate">{photo.filename}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting && <LoadingSpinner size="sm" className="mr-2" />}
                    {submitting ? 'Submitting...' : 'Submit Claim'}
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
                Insurance Claims {claims.length > 0 && `(${pagination.total})`}
              </h2>
            </div>
          </div>

          <div className="p-6">
            {loading || sessionLoading ? (
              <LoadingState text="Loading insurance claims..." />
            ) : claims.length === 0 ? (
              <EmptyState
                icon={<Shield className="h-12 w-12" />}
                title="No insurance claims found"
                description={
                  searchTerm 
                    ? `No claims match "${searchTerm}"`
                    : filter === 'all'
                      ? 'No insurance claims have been filed yet.'
                      : `No claims with status "${filter}".`
                }
              />
            ) : (
              <>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('vehicle')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Vehicle</span>
                            {getSortIcon('vehicle')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VIN
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
                          onClick={() => handleSort('incidentAt')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Incident Date</span>
                            {getSortIcon('incidentAt')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('organization')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Organization</span>
                            {getSortIcon('organization')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Filed</span>
                            {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {claims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getVehicleDisplay(claim.vehicle)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 font-mono">
                              {claim.vehicle?.vin || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={claim.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(claim.incidentAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {claim.vehicle?.org?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(claim.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/claims/${claim.id}`}
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