'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { FileText, Calendar, MapPin, User, Building, Truck, AlertTriangle, CheckCircle, Clock, Edit3, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

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
  processing: {
    color: 'info',
    icon: Edit3,
    label: 'Processing'
  },
  pending_docs: {
    color: 'warning',
    icon: AlertTriangle,
    label: 'Pending Documents'
  },
  on_hold: {
    color: 'warning',
    icon: AlertTriangle,
    label: 'On Hold'
  },
  completed: {
    color: 'success',
    icon: CheckCircle,
    label: 'Completed'
  },
  cancelled: {
    color: 'error',
    icon: X,
    label: 'Cancelled'
  }
}

export default function AdminTitleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [title, setTitle] = useState<TitleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: sessionLoading } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    expectedCompletionDate: '',
    assignedTo: ''
  })

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('OPS')) {
        router.push('/titles')
        return
      }
      if (params.id) {
        fetchTitleDetail(params.id as string)
      }
    }
  }, [user, sessionLoading, params.id])

  const fetchTitleDetail = async (titleId: string) => {
    try {
      // Mock detailed title data
      const mockTitle: TitleDetail = {
        id: titleId,
        status: titleId === 'title-001' ? 'pending' : titleId === 'title-002' ? 'processing' : 'completed',
        titleType: titleId === 'title-001' ? 'clean' : titleId === 'title-002' ? 'salvage' : 'clean',
        titleNumber: titleId === 'title-001' ? 'TX-12345678' : titleId === 'title-002' ? 'CA-87654321' : 'FL-11223344',
        issuingState: titleId === 'title-001' ? 'TX' : titleId === 'title-002' ? 'CA' : 'FL',
        receivedDate: titleId === 'title-001' ? null : '2024-03-12T10:00:00Z',
        processedDate: titleId === 'title-003' ? '2024-03-01T09:30:00Z' : null,
        expectedCompletionDate: titleId === 'title-001' ? '2024-04-15T00:00:00Z' : titleId === 'title-002' ? '2024-04-20T00:00:00Z' : null,
        notes: titleId === 'title-001' 
          ? 'Waiting for original title from auction. Client requesting expedited processing.' 
          : titleId === 'title-002' 
          ? 'DMV inspection required for salvage title. Scheduled for next week.'
          : 'Title successfully transferred and mailed to dealer',
        createdAt: '2024-03-10T09:00:00Z',
        updatedAt: '2024-03-15T14:30:00Z',
        vehicle: {
          id: 'vehicle-1',
          vin: '1HGBH41JXMN109186',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          org: {
            name: 'Premium Auto Dealers'
          }
        },
        assignedTo: {
          name: 'Sarah Wilson',
          email: 'sarah@titleprocessing.com'
        },
        documents: [
          {
            id: 'doc-1',
            type: 'original_title',
            filename: 'original-title-scan.pdf',
            uploadedAt: '2024-03-12T10:00:00Z',
            uploadedBy: 'Sarah Wilson'
          },
          {
            id: 'doc-2',
            type: 'bill_of_sale',
            filename: 'bill-of-sale.pdf',
            uploadedAt: '2024-03-12T10:05:00Z',
            uploadedBy: 'Sarah Wilson'
          }
        ],
        statusHistory: [
          {
            status: 'pending',
            changedAt: '2024-03-10T09:00:00Z',
            changedBy: 'System',
            notes: 'Title processing request created'
          },
          {
            status: 'processing',
            changedAt: '2024-03-12T10:00:00Z',
            changedBy: 'Sarah Wilson',
            notes: 'Original title received from auction, beginning processing'
          }
        ]
      }
      
      setTitle(mockTitle)
      setEditForm({
        status: mockTitle.status,
        notes: mockTitle.notes || '',
        expectedCompletionDate: mockTitle.expectedCompletionDate || '',
        assignedTo: mockTitle.assignedTo?.email || ''
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
        status: editForm.status as TitleDetail['status'],
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

  const StatusIcon = statusConfig[title.status].icon

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
                  <StatusBadge status={statusConfig[title.status].color} />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="pending_docs">Pending Documents</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Completion</label>
                      <input
                        type="datetime-local"
                        value={editForm.expectedCompletionDate ? new Date(editForm.expectedCompletionDate).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, expectedCompletionDate: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
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
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Expected Completion</label>
                  <div className="flex items-center">
                    {isOverdue(title.expectedCompletionDate) ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                    ) : (
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    <p className={`text-sm ${isOverdue(title.expectedCompletionDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {formatDate(title.expectedCompletionDate)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date Received</label>
                  <p className="text-sm text-gray-900">{formatDate(title.receivedDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date Processed</label>
                  <p className="text-sm text-gray-900">{formatDate(title.processedDate)}</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Required Documents
              </h2>
              {title.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {title.documents.map((document) => (
                    <div key={document.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{document.filename}</p>
                        <p className="text-xs text-gray-500">
                          {getDocumentTypeLabel(document.type)} • {formatDate(document.uploadedAt)} • {document.uploadedBy}
                        </p>
                      </div>
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
    </AppLayout>
  )
}