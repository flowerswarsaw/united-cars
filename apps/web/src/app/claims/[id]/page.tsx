'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, Clock, Eye, CheckCircle, XCircle, DollarSign, Camera, Upload, FileImage, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ClaimDetail {
  id: string
  status: 'new' | 'review' | 'approved' | 'rejected' | 'paid'
  description?: string
  incidentAt?: string
  photos?: Array<{
    filename: string
    originalName: string
    size: number
    type: string
    url: string
    uploadedAt: string
    note?: string
  }>
  createdAt: string
  updatedAt: string
  vehicle: {
    id: string
    vin: string
    make?: string
    model?: string
    year?: number
    status: string
    org: {
      id: string
      name: string
      type: string
    }
  }
  org: {
    id: string
    name: string
    type: string
  }
}

const statusConfig = {
  new: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Shield,
    label: 'New Claim',
    nextStatuses: ['review', 'rejected']
  },
  review: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Eye,
    label: 'Under Review',
    nextStatuses: ['approved', 'rejected']
  },
  approved: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Approved',
    nextStatuses: ['paid', 'rejected']
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Rejected',
    nextStatuses: []
  },
  paid: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: DollarSign,
    label: 'Paid',
    nextStatuses: []
  }
}

export default function ClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showStatusUpdate, setShowStatusUpdate] = useState<string | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    reviewNotes: '',
    payoutAmount: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [user] = useState({
    name: 'Admin User',
    email: 'admin@demo.com',
    roles: ['ADMIN'],
    orgName: 'United Cars Admin'
  })

  useEffect(() => {
    if (params.id) {
      fetchClaimDetail(params.id as string)
    }
  }, [params.id])

  const fetchClaimDetail = async (claimId: string) => {
    try {
      const response = await fetch(`/api/claims/${claimId}`)
      const result = await response.json()

      if (response.ok) {
        setClaim(result.claim)
      } else {
        toast.error(`Failed to load claim: ${result.error}`)
        router.push('/claims')
      }
    } catch (error) {
      console.error('Error fetching claim:', error)
      toast.error('Error loading claim details')
      router.push('/claims')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!claim) return

    setUpdating(true)
    try {
      const requestBody: any = {
        status: newStatus,
        reviewNotes: updateForm.reviewNotes || undefined
      }

      // Add payout amount for paid status
      if (newStatus === 'paid' && updateForm.payoutAmount) {
        requestBody.payoutAmount = parseFloat(updateForm.payoutAmount)
      }

      const response = await fetch(`/api/claims/${claim.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (response.ok) {
        const actionMsg = newStatus === 'paid' 
          ? `Claim ${newStatus} with payout of $${updateForm.payoutAmount}!` 
          : `Claim status updated to ${newStatus}!`
        toast.success(actionMsg)
        setClaim(result.claim)
        setShowStatusUpdate(null)
        setUpdateForm({ reviewNotes: '', payoutAmount: '' })
      } else {
        toast.error(`Failed to update status: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error updating status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePhotoUpload = async () => {
    if (!claim || !selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select photos to upload')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append(`photos_${i}`, selectedFiles[i])
      }

      const response = await fetch(`/api/claims/${claim.id}/photos`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`${result.uploadedPhotos} photos uploaded successfully!`)
        setClaim(result.claim)
        setShowPhotoUpload(false)
        setSelectedFiles(null)
      } else {
        toast.error(`Failed to upload photos: ${result.error}`)
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast.error('Error uploading photos')
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getVehicleDisplay = () => {
    if (!claim) return 'Unknown Vehicle'
    const parts = []
    if (claim.vehicle.year) parts.push(claim.vehicle.year.toString())
    if (claim.vehicle.make) parts.push(claim.vehicle.make)
    if (claim.vehicle.model) parts.push(claim.vehicle.model)
    return parts.join(' ') || 'Unknown Vehicle'
  }

  const canUpdateStatus = (user.roles.includes('ADMIN') || user.roles.includes('OPS')) && 
                          claim?.status !== 'paid' && claim?.status !== 'rejected'
  const canUploadPhotos = claim?.status === 'new' || claim?.status === 'review'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claim details...</p>
        </div>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Insurance claim not found</p>
          <Link href="/claims" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Claims
          </Link>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[claim.status].icon
  const nextStatuses = statusConfig[claim.status].nextStatuses

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/claims"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Claims
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-red-600" />
                Insurance Claim
              </h1>
              <p className="text-gray-600 mt-1">{getVehicleDisplay()} • VIN: {claim.vehicle.vin}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[claim.status].color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusConfig[claim.status].label}
              </span>
              {canUpdateStatus && nextStatuses.length > 0 && (
                <div className="flex space-x-2">
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setShowStatusUpdate(status)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        status === 'approved' 
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : status === 'rejected' 
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : status === 'paid'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Mark as {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Claim Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{statusConfig[claim.status].label}</p>
                </div>
                {claim.incidentAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Incident Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(claim.incidentAt)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Filed</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(claim.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(claim.updatedAt)}</p>
                </div>
              </div>
              
              {claim.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">Description & Notes</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {claim.description}
                  </div>
                </div>
              )}
            </div>

            {/* Photos Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Incident Photos</h2>
                {canUploadPhotos && (
                  <button
                    onClick={() => setShowPhotoUpload(true)}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Photos
                  </button>
                )}
              </div>
              
              {claim.photos && claim.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {claim.photos.map((photo, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <FileImage className="h-12 w-12 text-gray-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate" title={photo.originalName}>
                        {photo.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(photo.size)} • {formatDate(photo.uploadedAt)}
                      </p>
                      {photo.note && (
                        <p className="text-xs text-blue-600 mt-1">{photo.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No photos uploaded yet</p>
                  {canUploadPhotos && (
                    <button
                      onClick={() => setShowPhotoUpload(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Upload incident photos
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Photo Upload Modal */}
            {showPhotoUpload && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Upload Photos</h3>
                      <button
                        onClick={() => setShowPhotoUpload(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Photos (JPEG, PNG, WebP - Max 10MB each)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {selectedFiles && selectedFiles.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Selected files:</p>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {Array.from(selectedFiles).map((file, index) => (
                            <li key={index} className="flex justify-between">
                              <span className="truncate">{file.name}</span>
                              <span className="text-gray-500">{formatFileSize(file.size)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handlePhotoUpload}
                        disabled={uploading || !selectedFiles || selectedFiles.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload Photos'}
                      </button>
                      <button
                        onClick={() => setShowPhotoUpload(false)}
                        disabled={uploading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Update Modal */}
            {showStatusUpdate && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Update to {statusConfig[showStatusUpdate].label}
                      </h3>
                      <button
                        onClick={() => setShowStatusUpdate(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    
                    {showStatusUpdate === 'paid' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payout Amount (USD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={updateForm.payoutAmount}
                          onChange={(e) => setUpdateForm({ ...updateForm, payoutAmount: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 2500.00"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Notes {showStatusUpdate === 'rejected' ? '*' : '(optional)'}
                      </label>
                      <textarea
                        value={updateForm.reviewNotes}
                        onChange={(e) => setUpdateForm({ ...updateForm, reviewNotes: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add notes about your decision..."
                        required={showStatusUpdate === 'rejected'}
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStatusUpdate(showStatusUpdate)}
                        disabled={updating || 
                                 (showStatusUpdate === 'paid' && !updateForm.payoutAmount) ||
                                 (showStatusUpdate === 'rejected' && !updateForm.reviewNotes)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updating ? 'Updating...' : `Mark as ${statusConfig[showStatusUpdate].label}`}
                      </button>
                      <button
                        onClick={() => setShowStatusUpdate(null)}
                        disabled={updating}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h2>
              <div className="space-y-4">
                {Object.entries(statusConfig).map(([status, config], index) => {
                  const isActive = claim.status === status
                  const isPast = ['new', 'review', 'approved', 'paid'].indexOf(claim.status) > index
                  const Icon = config.icon

                  // Skip rejected in timeline unless it's the current status
                  if (status === 'rejected' && claim.status !== 'rejected') return null

                  return (
                    <div key={status} className="flex">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive || isPast ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isActive || isPast ? 'text-red-600' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-red-900' : isPast ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {config.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-red-600">Current Status</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle</h2>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{getVehicleDisplay()}</p>
                <p className="text-xs text-gray-500 font-mono">{claim.vehicle.vin}</p>
                <p className="text-xs text-gray-500">Status: {claim.vehicle.status}</p>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
              <p className="text-sm text-gray-900">{claim.vehicle.org.name}</p>
              <p className="text-xs text-gray-500 capitalize">{claim.vehicle.org.type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
