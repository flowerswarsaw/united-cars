// Enhanced Title Management System Types
// Inspired by title-tracker-2.0 reference project

import { type ComponentType } from 'react'

// Core Title Interface with Enhanced Fields
export interface EnhancedTitle {
  id: string
  
  // Basic Title Information
  titleNumber: string | null
  titleType: TitleType
  issuingState: string
  issuingCountry: string
  
  // Vehicle Connection
  vehicle: {
    id: string
    vin: string
    make: string | null
    model: string | null
    year: number | null
    org: {
      id: string
      name: string
    }
  }
  
  // Status and Workflow
  status: TitleStatus
  priority: TitlePriority
  
  // Dates
  receivedDate: string | null
  processedDate: string | null
  expectedCompletionDate: string | null
  actualCompletionDate: string | null
  
  // Assignment and Location
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
  location: string | null // Physical location of title
  
  // Package/Shipping Integration
  packageIds: string[] // IDs of packages this title is assigned to (many-to-many)
  packages: {
    id: string
    trackingNumber: string | null
    provider: string | null
    type: 'RECEIVING' | 'SENDING'
    status: string
  }[] // Array of packages this title is assigned to
  
  // Financial
  processingFee: number | null
  rushFee: number | null
  
  // Metadata
  notes: string | null
  internalNotes: string | null // Admin only
  tags: string[] // Searchable tags
  
  // Enhanced Features
  documents: TitleDocument[]
  statusHistory: TitleStatusHistory[]
  activityLogs: TitleActivityLog[]
  
  // System fields
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
}

// Dynamic Title Status based on latest package containing the title
export type TitleStatus = 
  | 'pending'           // Neutral status (no packages yet)
  | 'packed'            // Package packed with this title, title is also packed
  | 'sent_to'           // Title sent to recipient (latest package is sent)
  | 'received_by'       // Title received by recipient (latest package is delivered)

// Dynamic status calculation result
export interface DynamicTitleStatus {
  status: TitleStatus
  displayText: string      // e.g., "Packed", "Sent to Copart", "Received by United Cars"
  organizationName: string | null // The organization name for sent_to/received_by
  packageId: string | null // ID of the latest package that determined this status
  updatedAt: string | null // When the status was last updated (package update time)
}

// Comprehensive title types
export type TitleType = 
  | 'clean'             // Clear title
  | 'salvage'           // Salvage title
  | 'rebuilt'           // Rebuilt/Reconstructed
  | 'flood'             // Flood damaged
  | 'lemon'             // Lemon law buyback
  | 'junk'              // Junk/Scrap title
  | 'export'            // Export only
  | 'bonded'            // Bonded title
  | 'duplicate'         // Duplicate title request
  | 'lost'              // Lost title replacement
  | 'abandoned'         // Abandoned vehicle
  | 'repossessed'       // Repo title

export type TitlePriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'rush'
  | 'emergency'

// Organization Types
export type OrganizationType = 
  | 'auction'       // Copart, IAA, Manheim
  | 'dealer'        // Car dealerships  
  | 'processor'     // Title processing centers

// Status History Tracking
export interface TitleStatusHistory {
  id: string
  titleId: string
  fromStatus: TitleStatus | null
  toStatus: TitleStatus
  changedAt: string
  changedBy: {
    id: string
    name: string
    email: string
  }
  reason: string | null // Reason for status change
  notes: string | null // Additional notes
  automaticChange: boolean // Was this an automated change?
}

// Document Management System
export interface TitleDocument {
  id: string
  titleId: string
  type: TitleDocumentType
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  fileUrl: string
  thumbnailUrl: string | null
  description: string | null
  isRequired: boolean
  isVerified: boolean
  verifiedAt: string | null
  verifiedBy: {
    id: string
    name: string
    email: string
  } | null
  uploadedAt: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
}

export type TitleDocumentType = 
  | 'original_title'        // Original title document
  | 'title_application'     // Title application form
  | 'bill_of_sale'         // Bill of sale
  | 'power_of_attorney'    // POA document
  | 'odometer_disclosure'  // Odometer disclosure
  | 'lien_release'         // Lien release document
  | 'inspection_report'    // Vehicle inspection report
  | 'insurance_docs'       // Insurance documentation
  | 'dmv_forms'            // Various DMV forms
  | 'correspondence'       // Email/letter correspondence
  | 'photos'               // Title photos
  | 'scan'                 // Scanned document
  | 'other'                // Other supporting documents

// Activity Logging System
export interface TitleActivityLog {
  id: string
  titleId: string
  action: TitleAction
  description: string
  metadata: Record<string, any> | null // Flexible metadata for different action types
  performedAt: string
  performedBy: {
    id: string
    name: string
    email: string
  }
  ipAddress: string | null
  userAgent: string | null
}

export type TitleAction = 
  | 'created'           // Title record created
  | 'status_changed'    // Status updated
  | 'assigned'          // Assigned to user
  | 'unassigned'        // Unassigned from user
  | 'notes_updated'     // Notes modified
  | 'document_uploaded' // Document added
  | 'document_verified' // Document verified
  | 'package_assigned'  // Assigned to package
  | 'bulk_imported'     // Created via bulk import
  | 'priority_changed'  // Priority updated
  | 'dates_updated'     // Date fields updated
  | 'deleted'           // Title deleted
  | 'exported'          // Data exported

// Bulk Import System
export interface BulkImport {
  id: string
  filename: string
  totalRows: number
  successCount: number
  errorCount: number
  status: BulkImportStatus
  errors: BulkImportError[]
  warnings: BulkImportWarning[]
  createdAt: string
  processedAt: string | null
  createdBy: {
    id: string
    name: string
    email: string
  }
  createdTitles: string[] // Array of title IDs created
}

export type BulkImportStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface BulkImportError {
  row: number
  field: string
  value: string
  error: string
  suggestion: string | null
}

export interface BulkImportWarning {
  row: number
  field: string
  value: string
  warning: string
  correctedValue: string | null
}

// Analytics and Reporting
export interface TitleMetrics {
  date: string
  
  // Counts by status
  pendingCount: number
  receivedCount: number
  processingCount: number
  completedCount: number
  
  // Performance metrics
  averageProcessingDays: number | null
  overdueCount: number
  rushJobsCount: number
  
  // Efficiency metrics
  slaCompliance: number | null // Percentage
  customerSatisfaction: number | null
}

// Enhanced Package Integration
export interface EnhancedPackage {
  id: string
  trackingNumber: string | null
  provider: string | null
  estimatedDelivery: string | null
  actualDelivery: string | null
  status: PackageStatus
  priority: PackagePriority
  senderOrg: {
    id: string
    name: string
    type: OrganizationType
    email: string
    phone: string | null
  }
  recipientOrg: {
    id: string
    name: string
    type: OrganizationType
    email: string
    phone: string | null
  }
  weight: number | null
  dimensions: {
    length: number
    width: number
    height: number
  } | null
  insuranceValue: number | null
  createdAt: string
  updatedAt: string
  titles: EnhancedTitle[] // Array of title objects
  documents: PackageDocument[]
}

export type PackageStatus = 
  | 'packed'            // Package packed and ready to ship
  | 'sent'              // Package sent/shipped
  | 'delivered'         // Package successfully delivered

export type PackagePriority = 
  | 'standard'
  | 'express'
  | 'overnight'
  | 'same_day'

export interface PackageDocument {
  id: string
  packageId: string
  type: 'shipping_label' | 'packing_list' | 'customs_form' | 'receipt' | 'tracking_info' | 'scan'
  filename: string
  fileUrl: string
  uploadedAt: string
}

// Filtering and Search Types
export interface TitleFilters {
  search: string
  status: TitleStatus | 'all'
  titleType: TitleType | 'all'
  issuingState: string | 'all'
  assignedTo: string | 'all'
  priority: TitlePriority | 'all'
  dateRange: {
    start: string | null
    end: string | null
    field: 'createdAt' | 'receivedDate' | 'expectedCompletionDate' | 'processedDate'
  } | null
  tags: string[]
  hasDocuments: boolean | null
  isOverdue: boolean | null
}

// Table Configuration for Universal DataTable
export interface TitleTableConfig {
  columns: TitleTableColumn[]
  sortable: boolean
  filterable: boolean
  selectable: boolean
  inlineEditable: boolean
  pagination: {
    enabled: boolean
    pageSize: number
    pageSizeOptions: number[]
  }
  actions: {
    view: boolean
    edit: boolean
    delete: boolean
    bulk: string[]
  }
}

export interface TitleTableColumn {
  key: keyof EnhancedTitle | string
  label: string
  sortable: boolean
  filterable: boolean
  editable: boolean
  width: string | number | null
  align: 'left' | 'center' | 'right'
  render: 'text' | 'badge' | 'date' | 'currency' | 'custom'
  customRenderer?: (value: any, record: EnhancedTitle) => import('react').ReactNode
}

// VIN Validation
export interface VinValidation {
  vin: string
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: {
    year: number | null
    make: string | null
    model: string | null
    bodyType: string | null
    engine: string | null
  } | null
}

// Status Configuration for UI
export type TitleStatusConfig = {
  [K in TitleStatus]: {
    label: string
    color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    icon: ComponentType<{ className?: string }>
    description: string
    nextStatuses: TitleStatus[]
    requiresConfirmation: boolean
    adminOnly: boolean
  }
}

// Utility functions for dynamic status calculation
export interface DynamicStatusUtils {
  // Find the latest package for a title based on creation/update date
  findLatestPackage: (titleId: string, packages: EnhancedPackage[]) => EnhancedPackage | null
  
  // Calculate dynamic status based on latest package
  calculateDynamicStatus: (titleId: string, packages: EnhancedPackage[]) => DynamicTitleStatus
  
  // Get display text for a dynamic status
  getStatusDisplayText: (status: TitleStatus, organizationName?: string) => string
}

// Package status to title status mapping
export const PACKAGE_TO_TITLE_STATUS_MAP: Record<PackageStatus, TitleStatus> = {
  'packed': 'packed',
  'sent': 'sent_to', 
  'delivered': 'received_by'
}

// Status display configuration for dynamic statuses
export const DYNAMIC_STATUS_CONFIG: Record<TitleStatus, {
  label: string
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  description: string
}> = {
  pending: {
    label: 'Pending',
    color: 'default',
    description: 'Title not yet assigned to any package'
  },
  packed: {
    label: 'Packed',
    color: 'warning',
    description: 'Title packed in a package, ready to ship'
  },
  sent_to: {
    label: 'Sent',
    color: 'primary',
    description: 'Title sent to recipient organization'
  },
  received_by: {
    label: 'Received',
    color: 'success',
    description: 'Title received by recipient organization'
  }
}

// Export all types for easy importing
export * from './title-enhanced'