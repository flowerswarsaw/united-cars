'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { 
  ArrowLeft,
  Package,
  FileText,
  X,
  Trash2,
  Plus,
  Check,
  Square,
  Upload,
  Scan
} from 'lucide-react'
import toast from 'react-hot-toast'
import { mockPackageData, mockPackageDatabase, getOrganizationTypeLabel, formatTrackingNumber, packageStatusConfig, packagePriorityConfig } from '@/lib/package-mock-data'
import { formatDate, mockTitleData, mockTitleDatabase } from '@/lib/title-mock-data'
import type { EnhancedPackage, EnhancedTitle, TitleDocument, PackageDocument } from '@/types/title-enhanced'

interface PackageDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Helper function to generate organization ID like the mock data does
const generateOrgId = (name: string) => `org-${name.toLowerCase().replace(/\s+/g, '-')}`

// Available organizations for route editing - IDs generated to match the package mock data logic
const availableOrganizations = [
  { id: generateOrgId('Premium Auto Dealers'), name: 'Premium Auto Dealers', type: 'dealer', email: 'contact@premiumauto.com', phone: '(555) 123-4567' },
  { id: generateOrgId('Gulf Coast Motors'), name: 'Gulf Coast Motors', type: 'dealer', email: 'info@gulfcoast.com', phone: '(555) 234-5678' },
  { id: generateOrgId('Mountain View Auto'), name: 'Mountain View Auto', type: 'dealer', email: 'sales@mountainview.com', phone: '(555) 345-6789' },
  { id: generateOrgId('Flood Title Specialists'), name: 'Flood Title Specialists', type: 'dealer', email: 'flood@specialists.com', phone: '(555) 987-6543' },
  { id: generateOrgId('Pacific Coast Imports'), name: 'Pacific Coast Imports', type: 'dealer', email: 'imports@pacific.com', phone: '(555) 876-5432' },
  { id: generateOrgId('Copart Dallas'), name: 'Copart Dallas', type: 'auction', email: 'dallas@copart.com', phone: '(555) 456-7890' },
  { id: generateOrgId('Copart Phoenix'), name: 'Copart Phoenix', type: 'auction', email: 'phoenix@copart.com', phone: '(555) 654-3210' },
  { id: generateOrgId('Manheim Auto Auction'), name: 'Manheim Auto Auction', type: 'auction', email: 'info@manheim.com', phone: '(555) 678-9012' },
  { id: generateOrgId('United Cars Processing'), name: 'United Cars Processing', type: 'processor', email: 'ops@unitedcars.com', phone: '(555) 789-0123' }
]

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState<EnhancedPackage | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  
  // Title management state - simplified
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set())
  const [showAddTitlesModal, setShowAddTitlesModal] = useState(false)
  const [connectTitlesFilter, setConnectTitlesFilter] = useState({
    orgFilter: 'all',
    statusFilter: 'all',
    search: ''
  })
  const [connectModalSelectedTitles, setConnectModalSelectedTitles] = useState<Set<string>>(new Set())
  
  // Upload/Scan functionality state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<{type: 'package' | 'title', id: string} | null>(null)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('scan')
  
  // Unwrap params promise
  const { id } = use(params)

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      fetchPackageData()
    }
  }, [user, sessionLoading, id])

  const fetchPackageData = async () => {
    try {
      setLoading(true)
      
      // Find package in mock database
      const foundPackage = mockPackageDatabase.findById(id)
      
      if (!foundPackage) {
        toast.error('Package not found')
        router.push('/admin/titles')
        return
      }
      
      // Get all titles assigned to this package using the many-to-many relationship
      const assignedTitles = mockTitleDatabase.getTitlesByPackage(id)
      
      // Update package with current title assignments
      const packageWithTitles = {
        ...foundPackage,
        titles: assignedTitles
      }
      
      setPkg(packageWithTitles)
      
      // Initialize edit form
      const initialFormData = {
        status: foundPackage.status,
        provider: foundPackage.provider || '',
        trackingNumber: foundPackage.trackingNumber || '',
        notes: foundPackage.notes || '',
        senderOrgId: foundPackage.senderOrg.id,
        recipientOrgId: foundPackage.recipientOrg.id
      }
      
      setEditForm(initialFormData)
    } catch (error) {
      toast.error('Error fetching package data')
      console.error('Error fetching package:', error)
    } finally {
      setLoading(false)
    }
  }

  // Simplified title-package connection handlers
  const handleRemoveTitleFromPackage = (titleId: string) => {
    if (!pkg) return
    
    const titleToRemove = pkg.titles.find(t => t.id === titleId)
    if (!titleToRemove) return

    if (!confirm(`Disconnect title ${titleToRemove.vehicle?.vin} from this package?`)) {
      return
    }

    toast.success('Title disconnected from package!')
    
    const updatedPkg = {
      ...pkg,
      titles: pkg.titles.filter(title => title.id !== titleId)
    }
    setPkg(updatedPkg)
    
    // Update the mock package database to persist changes
    mockPackageDatabase.updatePackage(id, updatedPkg)
    
    // Remove the package from the title's package list
    mockTitleDatabase.removeTitleFromPackage(titleId, id)

    setSelectedTitles(prev => {
      const newSet = new Set(prev)
      newSet.delete(titleId)
      return newSet
    })
  }

  const handleBulkRemoveTitles = () => {
    if (selectedTitles.size === 0) {
      toast.error('No titles selected')
      return
    }

    if (!confirm(`Disconnect ${selectedTitles.size} selected titles from this package?`)) {
      return
    }

    toast.success(`${selectedTitles.size} titles disconnected from package!`)
    
    if (pkg) {
      const disconnectedTitleIds = Array.from(selectedTitles)
      const updatedPkg = {
        ...pkg,
        titles: pkg.titles.filter(title => !selectedTitles.has(title.id))
      }
      setPkg(updatedPkg)
      
      // Update the mock package database to persist changes
      mockPackageDatabase.updatePackage(id, updatedPkg)
      
      // Remove the package from all disconnected titles
      disconnectedTitleIds.forEach(titleId => {
        mockTitleDatabase.removeTitleFromPackage(titleId, id)
      })
    }

    setSelectedTitles(new Set())
  }

  const getAvailableTitlesToAdd = () => {
    return mockTitleDatabase.getAvailableTitles().filter(title => {
      // DUPLICATE PREVENTION: Exclude titles already assigned to this specific package
      // Note: titles can be assigned to multiple packages, just not the same package twice
      const notInCurrentPackage = !pkg?.titles.some(pkgTitle => pkgTitle.id === title.id)
      
      // Apply filters
      const orgMatch = connectTitlesFilter.orgFilter === 'all' || 
                      (title.vehicle?.org?.id === connectTitlesFilter.orgFilter)
      
      const statusMatch = connectTitlesFilter.statusFilter === 'all' || 
                         (title.status === connectTitlesFilter.statusFilter)
      
      let searchMatch = true
      if (connectTitlesFilter.search !== '') {
        const searchTerm = connectTitlesFilter.search.toLowerCase()
        const vin = (title.vehicle?.vin || '').toLowerCase()
        const orgName = (title.vehicle?.org?.name || '').toLowerCase()
        searchMatch = vin.includes(searchTerm) || orgName.includes(searchTerm)
      }
      
      return notInCurrentPackage && orgMatch && statusMatch && searchMatch
    })
  }

  const handleAddTitlesToPackage = () => {
    if (connectModalSelectedTitles.size === 0) {
      toast.error('No titles selected')
      return
    }

    if (!pkg) return

    const titleIdsToAdd = Array.from(connectModalSelectedTitles)
    
    // Check for duplicates - prevent adding titles already in this package
    const existingTitleIds = new Set(pkg.titles.map(title => title.id))
    const duplicateIds = titleIdsToAdd.filter(id => existingTitleIds.has(id))
    
    if (duplicateIds.length > 0) {
      const duplicateVins = mockTitleData
        .filter(title => duplicateIds.includes(title.id))
        .map(title => title.vehicle?.vin || title.id)
        .join(', ')
      
      toast.error(`Cannot add duplicate titles: ${duplicateVins}`)
      return
    }
    
    // Get titles that are actually available to add
    const titlesToAdd = mockTitleData.filter(title => 
      titleIdsToAdd.includes(title.id) && !existingTitleIds.has(title.id)
    )
    
    if (titlesToAdd.length === 0) {
      toast.error('No valid titles to add')
      return
    }
    
    toast.success(`${titlesToAdd.length} titles connected to package!`)
    
    const updatedPkg = {
      ...pkg,
      titles: [...pkg.titles, ...titlesToAdd]
    }
    setPkg(updatedPkg)
    
    // Update the mock package database to persist changes
    mockPackageDatabase.updatePackage(id, updatedPkg)
    
    // Add the package to the connected titles
    titlesToAdd.forEach(title => {
      mockTitleDatabase.addTitleToPackage(title.id, id)
    })

    setShowAddTitlesModal(false)
    // Clear selections after successful connection
    setConnectModalSelectedTitles(new Set())
    // Reset filters for next time
    setConnectTitlesFilter({
      orgFilter: 'all',
      statusFilter: 'all',
      search: ''
    })
  }

  const handleCancelConnectModal = () => {
    setShowAddTitlesModal(false)
    // Keep selections when canceling (don't clear connectModalSelectedTitles)
    // Reset filters when canceling
    setConnectTitlesFilter({
      orgFilter: 'all',
      statusFilter: 'all',
      search: ''
    })
  }

  // Upload/Scan functionality handlers
  const handleUploadScan = (type: 'package' | 'title', id: string) => {
    setUploadTarget({ type, id })
    setShowUploadModal(true)
  }

  // Helper function to get document type labels
  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'shipping_label': 'Shipping Label',
      'packing_list': 'Packing List', 
      'customs_form': 'Customs Form',
      'receipt': 'Receipt',
      'tracking_info': 'Tracking Info',
      'scan': 'Scan'
    }
    return labels[type] || type
  }

  const handleScanDocument = () => {
    if (!uploadTarget || !user) return
    
    // Mock scanning functionality
    toast.success(`Adding ${getDocumentTypeLabel(selectedDocumentType)} document...`)
    
    setTimeout(() => {
      const documentId = `doc-${Date.now()}-${selectedDocumentType}`
      const timestamp = new Date().toISOString()
      
      if (uploadTarget.type === 'title') {
        // Create title document
        const document: TitleDocument = {
          id: documentId,
          titleId: uploadTarget.id,
          type: selectedDocumentType as any,
          filename: `${selectedDocumentType}-${uploadTarget.id}-${Date.now()}.pdf`,
          originalName: `${getDocumentTypeLabel(selectedDocumentType)} - ${uploadTarget.id}.pdf`,
          mimeType: 'application/pdf',
          fileSize: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
          fileUrl: `/api/titles/${uploadTarget.id}/documents/${documentId}`,
          thumbnailUrl: `/api/titles/${uploadTarget.id}/documents/${documentId}/thumbnail`,
          description: `${getDocumentTypeLabel(selectedDocumentType)} document`,
          isRequired: false,
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
          uploadedAt: timestamp,
          uploadedBy: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        }
        
        // Add to title
        mockTitleDatabase.addDocumentToTitle(uploadTarget.id, document)
      } else {
        // Create package document
        const document: PackageDocument = {
          id: documentId,
          packageId: uploadTarget.id,
          type: selectedDocumentType as any,
          filename: `${selectedDocumentType}-${uploadTarget.id}-${Date.now()}.pdf`,
          fileUrl: `/api/packages/${uploadTarget.id}/documents/${documentId}`,
          uploadedAt: timestamp
        }
        
        // Add to package
        mockPackageDatabase.addDocumentToPackage(uploadTarget.id, document)
      }
      
      toast.success(`${getDocumentTypeLabel(selectedDocumentType)} document added successfully!`)
      setShowUploadModal(false)
      setUploadTarget(null)
      setSelectedDocumentType('scan') // Reset to default
      
      // Refresh the page data to show the new document
      fetchPackageData()
    }, 2000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadTarget || !user) return
    
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      toast.error('Please upload a PDF or image file')
      return
    }
    
    // Mock file upload
    toast.success(`Uploading ${file.name} for ${uploadTarget.type}...`)
    
    setTimeout(() => {
      const documentId = `doc-${Date.now()}-upload`
      const timestamp = new Date().toISOString()
      
      if (uploadTarget.type === 'title') {
        // Create title document
        const document: TitleDocument = {
          id: documentId,
          titleId: uploadTarget.id,
          type: 'scan', // Using 'scan' type for uploaded files too
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          fileUrl: `/api/titles/${uploadTarget.id}/documents/${documentId}`,
          thumbnailUrl: file.type.startsWith('image/') ? `/api/titles/${uploadTarget.id}/documents/${documentId}/thumbnail` : null,
          description: `Uploaded file: ${file.name}`,
          isRequired: false,
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
          uploadedAt: timestamp,
          uploadedBy: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        }
        
        // Add to title
        mockTitleDatabase.addDocumentToTitle(uploadTarget.id, document)
      } else {
        // Create package document
        const document: PackageDocument = {
          id: documentId,
          packageId: uploadTarget.id,
          type: 'scan',
          filename: file.name,
          fileUrl: `/api/packages/${uploadTarget.id}/documents/${documentId}`,
          uploadedAt: timestamp
        }
        
        // Add to package
        mockPackageDatabase.addDocumentToPackage(uploadTarget.id, document)
      }
      
      toast.success(`File uploaded successfully for ${uploadTarget.type} ${uploadTarget.id}`)
      setShowUploadModal(false)
      setUploadTarget(null)
      
      // Refresh the page data to show the new document
      fetchPackageData()
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    const config = packageStatusConfig[status as keyof typeof packageStatusConfig]
    return config?.color || 'default'
  }

  const handleSaveChanges = () => {
    // Validate required fields
    if (!editForm.trackingNumber || editForm.trackingNumber.trim() === '') {
      toast.error('Tracking number is required')
      return
    }

    if (!editForm.provider || editForm.provider.trim() === '') {
      toast.error('Carrier is required')
      return
    }

    if (!editForm.senderOrgId) {
      toast.error('Sender organization is required')
      return
    }

    if (!editForm.recipientOrgId) {
      toast.error('Recipient organization is required')
      return
    }

    if (editForm.senderOrgId === editForm.recipientOrgId) {
      toast.error('Sender and recipient must be different organizations')
      return
    }

    // Find the selected organizations
    const senderOrg = availableOrganizations.find(org => org.id === editForm.senderOrgId)
    const recipientOrg = availableOrganizations.find(org => org.id === editForm.recipientOrgId)

    if (!senderOrg || !recipientOrg) {
      toast.error('Invalid organization selection')
      return
    }

    // In a real app, you would call an API to save changes
    toast.success('Package details updated successfully!')
    setIsEditing(false)
    
    // Update the package state with new values (for mock purposes)
    if (pkg) {
      const updatedPkg = {
        ...pkg,
        status: editForm.status,
        provider: editForm.provider,
        trackingNumber: editForm.trackingNumber,
        notes: editForm.notes,
        senderOrg: {
          id: senderOrg.id,
          name: senderOrg.name,
          type: senderOrg.type as any,
          email: senderOrg.email,
          phone: senderOrg.phone
        },
        recipientOrg: {
          id: recipientOrg.id,
          name: recipientOrg.name,
          type: recipientOrg.type as any,
          email: recipientOrg.email,
          phone: recipientOrg.phone
        }
      }
      setPkg(updatedPkg)
      
      // Update the mock package database to persist changes
      mockPackageDatabase.updatePackage(id, updatedPkg)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (pkg) {
      // Reset form to original values
      setEditForm({
        status: pkg.status,
        provider: pkg.provider || '',
        trackingNumber: pkg.trackingNumber || '',
        notes: pkg.notes || '',
        senderOrgId: pkg.senderOrg.id,
        recipientOrgId: pkg.recipientOrg.id
      })
    }
  }

  if (sessionLoading || loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading package details..." />
      </AppLayout>
    )
  }

  if (!pkg) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Package not found</h3>
            <p className="mt-1 text-sm text-gray-500">The requested package could not be found.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={`📦 Package ${pkg.id}`}
        description="Package details and tracking information"
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Titles & Packages', href: '/admin/titles' },
          { label: `Package ${pkg.id}` }
        ]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Status & Actions Card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Package className="h-6 w-6 mr-3 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Package Status</h2>
                    <p className="text-sm text-gray-600">Current shipping status and management</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusBadge status={pkg.status} />
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit Package
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4">Package Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package ID</label>
                  <p className="text-sm text-gray-900 font-mono">{pkg.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="text-sm border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="packed">Packed</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  ) : (
                    <StatusBadge status={pkg.status} />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.trackingNumber || ''}
                      onChange={(e) => setEditForm({...editForm, trackingNumber: e.target.value})}
                      className="text-sm border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="Enter tracking number"
                      required
                    />
                  ) : (
                    <p className="text-sm text-gray-900 font-mono">{formatTrackingNumber(pkg.trackingNumber)}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carrier <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.provider || ''}
                      onChange={(e) => setEditForm({...editForm, provider: e.target.value})}
                      className="text-sm border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  ) : (
                    <p className="text-sm text-gray-900">{pkg.provider || 'Not assigned'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(pkg.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Route Information Card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
                  {isEditing ? (
                    <select
                      value={editForm.senderOrgId || ''}
                      onChange={(e) => setEditForm({...editForm, senderOrgId: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select sender...</option>
                      {availableOrganizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({getOrganizationTypeLabel(org.type)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="font-medium text-gray-900">{pkg.senderOrg.name}</p>
                      <p className="text-sm text-gray-500">{getOrganizationTypeLabel(pkg.senderOrg.type)}</p>
                      <p className="text-sm text-gray-600 mt-1">{pkg.senderOrg.email}</p>
                      <p className="text-sm text-gray-600">{pkg.senderOrg.phone}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                  {isEditing ? (
                    <select
                      value={editForm.recipientOrgId || ''}
                      onChange={(e) => setEditForm({...editForm, recipientOrgId: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select recipient...</option>
                      {availableOrganizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({getOrganizationTypeLabel(org.type)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="font-medium text-gray-900">{pkg.recipientOrg.name}</p>
                      <p className="text-sm text-gray-500">{getOrganizationTypeLabel(pkg.recipientOrg.type)}</p>
                      <p className="text-sm text-gray-600 mt-1">{pkg.recipientOrg.email}</p>
                      <p className="text-sm text-gray-600">{pkg.recipientOrg.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Titles in Package */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Titles ({pkg.titles.length})
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedTitles.size > 0 && (
                    <button
                      onClick={handleBulkRemoveTitles}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Disconnect ({selectedTitles.size})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowAddTitlesModal(true)
                      // Optional: Clear previous selections when opening modal
                      // setConnectModalSelectedTitles(new Set())
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Connect Titles
                  </button>
                </div>
              </div>
              
              {pkg.titles.length > 0 ? (
                <div className="space-y-3">
                  {pkg.titles.map((title, index) => {
                    const isSelected = selectedTitles.has(title.id)
                    
                    return (
                      <div key={`title-${title.id || index}`} className="p-3 rounded-lg border bg-gray-50 border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                const newSelected = new Set(selectedTitles)
                                if (isSelected) {
                                  newSelected.delete(title.id)
                                } else {
                                  newSelected.add(title.id)
                                }
                                setSelectedTitles(newSelected)
                              }}
                              className="flex-shrink-0"
                            >
                              {isSelected ? (
                                <Check className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                VIN: {title.vehicle?.vin || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {title.vehicle?.org?.name}
                              </div>
                              {title.packageIds && title.packageIds.length > 1 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Also in {title.packageIds.length - 1} other package{title.packageIds.length > 2 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={title.status} size="sm" />
                            <button
                              onClick={() => handleUploadScan('title', title.id)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Scan title document"
                            >
                              <Scan className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveTitleFromPackage(title.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Disconnect from package"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No titles assigned yet</p>
                  <button
                    onClick={() => {
                      setShowAddTitlesModal(true)
                      // Optional: Clear previous selections when opening modal
                      // setConnectModalSelectedTitles(new Set())
                    }}
                    className="mt-2 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Connect Titles
                  </button>
                </div>
              )}
            </div>

            {/* Package Documents */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Documents ({pkg.documents.length})
                  </h3>
                </div>
                <button
                  onClick={() => handleUploadScan('package', pkg.id)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Document
                </button>
              </div>
              
              {pkg.documents.length > 0 ? (
                <div className="space-y-3">
                  {pkg.documents.map((doc, index) => (
                    <div key={doc.id} className="p-3 rounded-lg border bg-gray-50 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                // Mock document viewing
                                toast.success(`Opening document: ${doc.filename}`)
                              }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {doc.filename}
                            </button>
                            <div className="text-xs text-gray-500">
                              {doc.type} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              toast.success(`Downloading: ${doc.filename}`)
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Download document"
                          >
                            <FileText className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No documents added yet</p>
                  <button
                    onClick={() => handleUploadScan('package', pkg.id)}
                    className="mt-2 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload/Scan Modal */}
      {showUploadModal && uploadTarget && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Document - {uploadTarget.type.charAt(0).toUpperCase() + uploadTarget.type.slice(1)}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadTarget(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Add a document for {uploadTarget.type} {uploadTarget.id}
              </div>
              
              {uploadTarget.type === 'package' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="scan">Scan</option>
                    <option value="shipping_label">Shipping Label</option>
                    <option value="packing_list">Packing List</option>
                    <option value="customs_form">Customs Form</option>
                    <option value="receipt">Receipt</option>
                    <option value="tracking_info">Tracking Info</option>
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleScanDocument}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Add {getDocumentTypeLabel(selectedDocumentType)}</span>
                  <span className="text-xs text-gray-500 mt-1">Create document record</span>
                </button>
                
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Upload File</span>
                  <span className="text-xs text-gray-500 mt-1">PDF or Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/*"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              
              <div className="text-xs text-gray-500 text-center mt-4">
                Supported formats: PDF, JPG, PNG, GIF
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connect Titles to Package Modal */}
      {showAddTitlesModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Connect Titles to Package</h3>
              <button
                onClick={handleCancelConnectModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <ConnectTitlesModal 
              availableTitles={getAvailableTitlesToAdd()}
              filter={connectTitlesFilter}
              onFilterChange={setConnectTitlesFilter}
              selectedTitleIds={connectModalSelectedTitles}
              onSelectionChange={setConnectModalSelectedTitles}
              onConnectTitles={handleAddTitlesToPackage}
              onCancel={handleCancelConnectModal}
            />
          </div>
        </div>
      )}
    </AppLayout>
  )
}

// Connect Titles Modal Component with Filtering
interface ConnectTitlesModalProps {
  availableTitles: EnhancedTitle[]
  filter: {
    orgFilter: string
    statusFilter: string
    search: string
  }
  onFilterChange: (filter: any) => void
  selectedTitleIds: Set<string>
  onSelectionChange: (selectedIds: Set<string>) => void
  onConnectTitles: () => void
  onCancel: () => void
}

function ConnectTitlesModal({ availableTitles, filter, onFilterChange, selectedTitleIds, onSelectionChange, onConnectTitles, onCancel }: ConnectTitlesModalProps) {

  const handleSelectAll = () => {
    onSelectionChange(new Set(availableTitles.map(title => title.id)))
  }

  const handleClearAll = () => {
    onSelectionChange(new Set())
  }

  const handleConnectSelected = () => {
    onConnectTitles()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Organization</label>
          <select
            value={filter.orgFilter}
            onChange={(e) => onFilterChange({ ...filter, orgFilter: e.target.value })}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Organizations</option>
            <option value="org-auction-1">Copart Dallas</option>
            <option value="org-auction-2">Copart Phoenix</option>
            <option value="org-auction-3">IAAI Houston</option>
            <option value="org-dealer-1">Premium Auto Dealers</option>
            <option value="org-dealer-2">Elite Car Sales</option>
            <option value="org-processing-1">United Cars Processing</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filter.statusFilter}
            onChange={(e) => onFilterChange({ ...filter, statusFilter: e.target.value })}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Statuses</option>
            <option value="received">Received</option>
            <option value="processing">Processing</option>
            <option value="pending_docs">Pending Docs</option>
            <option value="on_hold">On Hold</option>
            <option value="quality_review">Quality Review</option>
            <option value="ready_to_ship">Ready to Ship</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search VIN, organization..."
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {availableTitles.length} titles available • {selectedTitleIds.size} selected
        </div>
        <div className="space-x-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
          >
            Select All ({availableTitles.length})
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Title List */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
        {availableTitles.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {availableTitles.map(title => (
              <div key={title.id} className="p-3 hover:bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTitleIds.has(title.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedTitleIds)
                      if (e.target.checked) {
                        newSelected.add(title.id)
                      } else {
                        newSelected.delete(title.id)
                      }
                      onSelectionChange(newSelected)
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          VIN: {title.vehicle?.vin || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {title.vehicle?.org?.name}
                        </p>
                      </div>
                      <StatusBadge status={title.status} size="sm" />
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            No titles available to connect
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleConnectSelected}
          disabled={selectedTitleIds.size === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Connect {selectedTitleIds.size} Titles
        </button>
      </div>
    </div>
  )
}