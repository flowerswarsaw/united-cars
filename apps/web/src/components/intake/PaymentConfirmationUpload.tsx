'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentConfirmationUploadProps {
  intakeId: string
  onUpload: (intakeId: string) => void
}

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
}

export function PaymentConfirmationUpload({ intakeId, onUpload }: PaymentConfirmationUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadFile[] = []
    
    Array.from(selectedFiles).forEach(file => {
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        toast.error(`${file.name} is not a supported file type. Please use PDF or image files.`)
        return
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum file size is 10MB.`)
        return
      }

      newFiles.push({
        id: `${Date.now()}-${file.name}`,
        file,
        status: 'pending'
      })
    })

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ))

    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('type', 'payment_confirmation')

      const response = await fetch(`/api/intakes/${intakeId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ))
        toast.success(`${uploadFile.file.name} uploaded successfully`)
        
        // Refresh intake data
        onUpload(intakeId)
      } else {
        const error = await response.text()
        throw new Error(error)
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ))
      toast.error(`Failed to upload ${uploadFile.file.name}`)
    }
  }

  const uploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-blue-600 cursor-pointer">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          PDF files or images up to 10MB each
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Files to Upload ({files.length})
            </h4>
            {files.some(f => f.status === 'pending') && (
              <button
                onClick={uploadAll}
                disabled={files.some(f => f.status === 'uploading')}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Upload All
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadFile.file.size / 1024).toFixed(1)} KB
                  </p>
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadFile.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>

                <div className="ml-4 flex-shrink-0">
                  {uploadFile.status === 'pending' && (
                    <button
                      onClick={() => uploadFile(uploadFile)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                    >
                      Upload
                    </button>
                  )}
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="text-blue-600 text-sm mr-2">
                      Uploading...
                    </div>
                  )}
                  
                  {uploadFile.status === 'success' && (
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <button
                      onClick={() => uploadFile(uploadFile)}
                      className="text-red-600 hover:text-red-800 text-sm mr-2"
                    >
                      Retry
                    </button>
                  )}

                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={uploadFile.status === 'uploading'}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <p className="text-sm text-yellow-700">
          💡 Upload your payment confirmation documents (bank transfers, receipts, etc.) to help with processing.
        </p>
      </div>
    </div>
  )
}