'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { FileText, Calendar, MapPin, User, Building, Truck, AlertTriangle, CheckCircle, Clock, Edit3, Save, X, Scan, Upload, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { mockTitleDatabase } from '@/lib/title-mock-data'
import type { EnhancedTitle, TitleDocument, DynamicTitleStatus } from '@/types/title-enhanced'
import { DYNAMIC_STATUS_CONFIG } from '@/types/title-enhanced'

interface TitleDetail {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'on_hold' | 'pending_docs'
  titleType: 'clean' | 'salvage' | 'lemon' | 'flood' | 'rebuilt' | 'junk'
  titleNumber: string | null
  issuingState: string
  receivedDate: string | null
  processedDate: string | null
  expectedCompletionDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  dynamicStatus: DynamicTitleStatus
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
  assignedTo: {
    name: string
    email: string
  } | null
  documents: Array<{
    id: string
    type: 'original_title' | 'bill_of_sale' | 'power_of_attorney' | 'inspection_report' | 'other'
    filename: string
    uploadedAt: string
    uploadedBy: string
  }>
  statusHistory: Array<{
    status: string
    changedAt: string
    changedBy: string
    notes: string | null
  }>
}

const statusConfig = {
  pending: {
    color: 'warning',
    icon: Clock,
    label: 'Pending'
  },
  packed: {
    color: 'warning',
    icon: Package,
    label: 'Packed'
  },
  sent_to: {
    color: 'info',
    icon: Truck,
    label: 'Sent'
  },
  received_by: {
    color: 'success',
    icon: CheckCircle,
    label: 'Received'
  }
}

interface AdminTitleDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function AdminTitleDetailPage({ params }: AdminTitleDetailPageProps) {
  const router = useRouter()
  
  // Unwrap params promise
  const { id } = use(params)
  const [title, setTitle] = useState<TitleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: sessionLoading } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    notes: '',
    expectedCompletionDate: '',
    assignedTo: ''
  })
  
  // Upload/Scan functionality state
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/titles')
        return
      }
      fetchTitleDetail(id)
    }
  }, [user, sessionLoading, id, router])

  const fetchTitleDetail = async (titleId: string) => {
    try {
      // Get title from enhanced database
      const enhancedTitle = mockTitleDatabase.getTitleWithDynamicStatus(titleId)
      
      if (!enhancedTitle) {
        toast.error('Title not found')
        router.push('/admin/titles')
        return
      }

      // Convert enhanced title to TitleDetail format
      const titleDetail: TitleDetail = {
        id: enhancedTitle.id,
        status: enhancedTitle.status as TitleDetail['status'],
        titleType: enhancedTitle.titleType as TitleDetail['titleType'],
        titleNumber: enhancedTitle.titleNumber,
        issuingState: enhancedTitle.issuingState,
        receivedDate: enhancedTitle.receivedDate,
        processedDate: enhancedTitle.processedDate,
        expectedCompletionDate: enhancedTitle.expectedCompletionDate,
        notes: enhancedTitle.notes,
        createdAt: enhancedTitle.createdAt,
        updatedAt: enhancedTitle.updatedAt,
        dynamicStatus: enhancedTitle.dynamicStatus,
        vehicle: {
          id: enhancedTitle.vehicle.id,
          vin: enhancedTitle.vehicle.vin,
          make: enhancedTitle.vehicle.make,
          model: enhancedTitle.vehicle.model,
          year: enhancedTitle.vehicle.year,
          org: {
            name: enhancedTitle.vehicle.org.name
          }
        },
        assignedTo: enhancedTitle.assignedTo ? {
          name: enhancedTitle.assignedTo.name,
          email: enhancedTitle.assignedTo.email
        } : null,
        documents: enhancedTitle.documents?.map(doc => ({
          id: doc.id,
          type: doc.type as TitleDetail['documents'][0]['type'],
          filename: doc.filename,
          uploadedAt: doc.uploadedAt,
          uploadedBy: doc.uploadedBy?.name || 'Unknown'
        })) || [],
        statusHistory: enhancedTitle.statusHistory?.map(history => ({
          status: history.toStatus,
          changedAt: history.changedAt,
          changedBy: history.changedBy.name,
          notes: history.notes
        })) || []
      }
      
      setTitle(titleDetail)
      setEditForm({
        notes: titleDetail.notes || '',
        expectedCompletionDate: titleDetail.expectedCompletionDate || '',
        assignedTo: titleDetail.assignedTo?.email || ''
      })
    } catch (error) {
      toast.error('Error fetching title details')
      console.error('Error fetching title:', error)
      router.push('/admin/titles')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title) return

    try {
      // In production, this would call the API
      const updatedTitle = {
        ...title,
        notes: editForm.notes,
        expectedCompletionDate: editForm.expectedCompletionDate || null,
        updatedAt: new Date().toISOString()
      }
      
      setTitle(updatedTitle)
      setIsEditing(false)
      toast.success('Title updated successfully!')
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Error updating title')
    }
  }

  // Upload/Scan functionality handlers
  const handleScanDocument = () => {
    if (!title || !user) return
    
    // Mock scanning functionality
    toast.success(`Scanning document for title...`)
    
    setTimeout(() => {
      const documentId = `doc-${Date.now()}-scan`
      const timestamp = new Date().toISOString()
      
      // Create enhanced title document
      const enhancedDocument: TitleDocument = {
        id: documentId,
        titleId: title.id,
        type: 'scan',
        filename: `scan-${title.id}-${Date.now()}.pdf`,
        originalName: `Title Scan - ${title.id}.pdf`,
        mimeType: 'application/pdf',
        fileSize: Math.floor(Math.random() * 500000) + 100000,
        fileUrl: `/api/titles/${title.id}/documents/${documentId}`,
        thumbnailUrl: `/api/titles/${title.id}/documents/${documentId}/thumbnail`,
        description: 'Scanned title document',
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
      
      // Add to enhanced database
      mockTitleDatabase.addDocumentToTitle(title.id, enhancedDocument)
      
      // Update local state
      const newLocalDocument = {
        id: documentId,
        type: 'other' as const,
        filename: enhancedDocument.filename,
        uploadedAt: timestamp,
        uploadedBy: user.name
      }
      
      const updatedTitle = {
        ...title,
        documents: [...title.documents, newLocalDocument]
      }
      
      setTitle(updatedTitle)
      toast.success(`Document scan completed`)
      setShowUploadModal(false)
    }, 2000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!title || !user) return
    
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      toast.error('Please upload a PDF or image file')
      return
    }
    
    // Mock file upload
    toast.success(`Uploading ${file.name}...`)
    
    setTimeout(() => {
      const documentId = `doc-${Date.now()}-upload`
      const timestamp = new Date().toISOString()
      
      // Create enhanced title document
      const enhancedDocument: TitleDocument = {
        id: documentId,
        titleId: title.id,
        type: 'scan',
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileUrl: `/api/titles/${title.id}/documents/${documentId}`,
        thumbnailUrl: file.type.startsWith('image/') ? `/api/titles/${title.id}/documents/${documentId}/thumbnail` : null,
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
      
      // Add to enhanced database
      mockTitleDatabase.addDocumentToTitle(title.id, enhancedDocument)
      
      // Update local state
      const newLocalDocument = {
        id: documentId,
        type: 'other' as const,
        filename: file.name,
        uploadedAt: timestamp,
        uploadedBy: user.name
      }
      
      const updatedTitle = {
        ...title,
        documents: [...title.documents, newLocalDocument]
      }
      
      setTitle(updatedTitle)
      toast.success(`File uploaded successfully`)
      setShowUploadModal(false)
    }, 1000)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVehicleDisplay = () => {
    if (!title) return 'Unknown Vehicle'
    const parts = []
    if (title.vehicle.year) parts.push(title.vehicle.year.toString())
    if (title.vehicle.make) parts.push(title.vehicle.make)
    if (title.vehicle.model) parts.push(title.vehicle.model)
    return parts.join(' ') || 'Unknown Vehicle'
  }

  const getTitleTypeIcon = (type: string) => {
    switch (type) {
      case 'clean': return '✓'
      case 'salvage': return '⚠️'
      case 'flood': return '🌊'
      case 'lemon': return '🍋'
      case 'rebuilt': return '🔧'
      case 'junk': return '🗑️'
      default: return '📄'
    }
  }

  const getTitleTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getDocumentTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const isOverdue = (expectedDate: string | null) => {
    if (!expectedDate) return false
    return new Date(expectedDate) < new Date()
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading title details..." />
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

  if (!title) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Title Not Found</h2>
            <p className="mt-2 text-gray-600">The requested title could not be found.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const StatusIcon = statusConfig[title.dynamicStatus.status].icon

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={`${getVehicleDisplay()} - Title Management`}
        description={`Manage title processing for #${title.id.toUpperCase()}`}
        breadcrumbs={[
          { label: 'Admin' }, 
          { label: 'Titles', href: '/admin/titles' }, 
          { label: `#${title.id.toUpperCase()}` }
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions Card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <StatusIcon className="h-6 w-6 mr-3 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Title Status</h2>
                    <p className="text-sm text-gray-600">Current processing status and management</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusBadge 
                    status={title.dynamicStatus.status} 
                    label={title.dynamicStatus.displayText}
                  />
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isOverdue(title.expectedCompletionDate) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-800">This title processing is overdue and requires immediate attention.</p>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Title status is automatically managed through package operations. 
                        Use the package system to update title status when shipping or receiving titles.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Completion Date</label>
                      <input
                        type="date"
                        value={editForm.expectedCompletionDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, expectedCompletionDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Processing Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add processing notes, updates, or issues..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {title.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Processing Notes</label>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-900">{title.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title Information */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Title Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Title Type</label>
                  <div className="flex items-center">
                    <span className="mr-2">{getTitleTypeIcon(title.titleType)}</span>
                    <p className="text-sm text-gray-900">{getTitleTypeLabel(title.titleType)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Title Number</label>
                  <p className="text-sm text-gray-900 font-mono">{title.titleNumber || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Issuing State</label>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-blue-600 mr-1" />
                    <p className="text-sm text-gray-900">{title.issuingState}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Vehicle</label>
                  <p className="text-sm text-gray-900 font-medium">{getVehicleDisplay()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">VIN</label>
                  <p className="text-sm text-gray-900 font-mono">{title.vehicle.vin}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Required Documents ({title.documents.length})
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowUploadModal(true)
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Upload/Scan
                </button>
              </div>
              {title.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {title.documents.map((document) => (
                    <div key={document.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <button
                          onClick={() => {
                            // Mock document viewing - in production would open actual document
                            toast.success(`Opening document: ${document.filename}`)
                          }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {document.filename}
                        </button>
                        <p className="text-xs text-gray-500">
                          {getDocumentTypeLabel(document.type)} • {formatDate(document.uploadedAt)} • {document.uploadedBy}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          toast.success(`Downloading: ${document.filename}`)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Download document"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Organization
              </h3>
              <p className="text-sm text-gray-900 font-medium">{title.vehicle.org.name}</p>
            </div>

            {/* Assignment */}
            {title.assignedTo && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Assigned Processor
                </h3>
                <p className="text-sm text-gray-900 font-medium">{title.assignedTo.name}</p>
                <p className="text-xs text-gray-500">{title.assignedTo.email}</p>
              </div>
            )}

            {/* Status History */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Status History
              </h3>
              <div className="space-y-4">
                {title.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {entry.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(entry.changedAt)}</p>
                      <p className="text-xs text-gray-500">by {entry.changedBy}</p>
                      {entry.notes && (
                        <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload/Scan Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50" style={{zIndex: 9999}}>
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload/Scan Document - Title
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Upload or scan a document for title {title?.id}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleScanDocument}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Scan className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Scan Document</span>
                  <span className="text-xs text-gray-500 mt-1">Use camera/scanner</span>
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
    </AppLayout>
  )
}