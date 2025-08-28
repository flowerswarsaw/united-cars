// Enhanced Title Management Mock Data System
// Inspired by title-tracker-2.0 reference project

import { 
  EnhancedTitle, 
  TitleStatus, 
  TitleType, 
  TitlePriority,
  TitleStatusHistory,
  TitleDocument,
  TitleActivityLog,
  TitleAction,
  EnhancedPackage,
  BulkImport,
  TitleMetrics,
  VinValidation,
  TitleStatusConfig
} from '@/types/title-enhanced'
import { 
  Clock, 
  CheckCircle, 
  Edit3, 
  AlertTriangle, 
  Package, 
  Send, 
  X, 
  Eye,
  FileText
} from 'lucide-react'

// VIN Validation System
export const validateVIN = (vin: string): VinValidation => {
  const cleanVin = vin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase()
  
  const errors: string[] = []
  const warnings: string[] = []
  
  // Basic validation
  if (cleanVin.length !== 17) {
    errors.push('VIN must be exactly 17 characters long')
  }
  
  if (/[IOQ]/.test(cleanVin)) {
    errors.push('VIN cannot contain letters I, O, or Q')
  }
  
  // Check digit validation would go here in production
  
  // Mock VIN decode (in production, would use actual VIN decoding service)
  const mockInfo = cleanVin.length === 17 ? {
    year: parseInt(cleanVin.charAt(9)) > 0 ? 2000 + parseInt(cleanVin.charAt(9)) : null,
    make: cleanVin.charAt(0) === '1' ? 'Honda' : cleanVin.charAt(0) === '2' ? 'Toyota' : 'Ford',
    model: 'Mock Model',
    bodyType: 'Sedan',
    engine: '2.0L I4'
  } : null
  
  return {
    vin: cleanVin,
    isValid: errors.length === 0,
    errors,
    warnings,
    info: mockInfo
  }
}

// Status Configuration for UI Components
export const titleStatusConfig: TitleStatusConfig = {
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: Clock,
    description: 'Waiting for title receipt from auction',
    nextStatuses: ['received', 'cancelled'],
    requiresConfirmation: false,
    adminOnly: false
  },
  received: {
    label: 'Received',
    color: 'primary',
    icon: CheckCircle,
    description: 'Physical title received, ready for processing',
    nextStatuses: ['processing', 'pending_docs', 'on_hold'],
    requiresConfirmation: false,
    adminOnly: false
  },
  processing: {
    label: 'Processing',
    color: 'primary',
    icon: Edit3,
    description: 'Currently being processed by DMV or staff',
    nextStatuses: ['quality_review', 'pending_docs', 'on_hold', 'packed'],
    requiresConfirmation: false,
    adminOnly: false
  },
  pending_docs: {
    label: 'Pending Docs',
    color: 'warning',
    icon: AlertTriangle,
    description: 'Waiting for additional required documentation',
    nextStatuses: ['processing', 'on_hold', 'rejected'],
    requiresConfirmation: false,
    adminOnly: false
  },
  on_hold: {
    label: 'On Hold',
    color: 'error',
    icon: AlertTriangle,
    description: 'Processing stopped due to legal or technical issues',
    nextStatuses: ['processing', 'cancelled', 'rejected'],
    requiresConfirmation: true,
    adminOnly: true
  },
  quality_review: {
    label: 'Quality Review',
    color: 'primary',
    icon: Eye,
    description: 'Final quality check before completion',
    nextStatuses: ['packed', 'processing'],
    requiresConfirmation: false,
    adminOnly: false
  },
  packed: {
    label: 'Packed',
    color: 'success',
    icon: Package,
    description: 'Packaged and ready for shipment',
    nextStatuses: ['sent'],
    requiresConfirmation: false,
    adminOnly: false
  },
  sent: {
    label: 'Sent',
    color: 'success',
    icon: Send,
    description: 'Shipped to final destination',
    nextStatuses: ['completed'],
    requiresConfirmation: false,
    adminOnly: false
  },
  completed: {
    label: 'Completed',
    color: 'success',
    icon: CheckCircle,
    description: 'Title processing fully completed',
    nextStatuses: [],
    requiresConfirmation: false,
    adminOnly: false
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    icon: X,
    description: 'Processing cancelled by request',
    nextStatuses: [],
    requiresConfirmation: true,
    adminOnly: true
  },
  rejected: {
    label: 'Rejected',
    color: 'error',
    icon: X,
    description: 'Rejected due to insurmountable issues',
    nextStatuses: [],
    requiresConfirmation: true,
    adminOnly: true
  }
}

// Generate realistic mock users
const mockUsers = [
  { id: 'user-admin-1', name: 'Sarah Wilson', email: 'sarah@admin.com' },
  { id: 'user-admin-2', name: 'Mike Rodriguez', email: 'mike@admin.com' },
  { id: 'user-admin-3', name: 'Lisa Chen', email: 'lisa@admin.com' },
  { id: 'user-admin-4', name: 'David Brown', email: 'david@admin.com' },
  { id: 'user-admin-5', name: 'Jennifer Garcia', email: 'jennifer@admin.com' }
]

// Generate realistic mock organizations
const mockOrgs = [
  { id: 'org-1', name: 'Premium Auto Dealers' },
  { id: 'org-2', name: 'Auto World LLC' },
  { id: 'org-3', name: 'Gulf Coast Motors' },
  { id: 'org-4', name: 'Mountain View Auto' },
  { id: 'org-5', name: 'Pacific Coast Imports' }
]

// Generate realistic VIN numbers
const generateVIN = (index: number): string => {
  const prefixes = ['1HGBH41JXMN', '2T1BURHE0JC', '1FTPW14V87K', '1G1ZT51826F', '3VWDP7AJ9CM', '1N4AL3AP8DC']
  const prefix = prefixes[index % prefixes.length]
  const suffix = (109186 + index).toString().padStart(6, '0')
  return prefix + suffix
}

// Generate status history for a title
const generateStatusHistory = (titleId: string, currentStatus: TitleStatus): TitleStatusHistory[] => {
  const history: TitleStatusHistory[] = []
  const statuses: TitleStatus[] = ['received']
  
  // Add progression based on current status
  const statusProgression: Record<TitleStatus, TitleStatus[]> = {
    received: ['received'],
    processing: ['received', 'processing'],
    pending_docs: ['received', 'processing', 'pending_docs'],
    on_hold: ['received', 'processing', 'on_hold'],
    quality_review: ['received', 'processing', 'quality_review'],
    ready_to_ship: ['received', 'processing', 'quality_review', 'ready_to_ship'],
    shipped: ['received', 'processing', 'quality_review', 'ready_to_ship', 'shipped'],
    completed: ['received', 'processing', 'quality_review', 'ready_to_ship', 'shipped', 'completed'],
    cancelled: ['received', 'cancelled'],
    rejected: ['received', 'rejected']
  }
  
  const progression = statusProgression[currentStatus] || ['received']
  let previousStatus: TitleStatus | null = null
  
  progression.forEach((status, index) => {
    const historyItem: TitleStatusHistory = {
      id: `history-${titleId}-${index}`,
      titleId,
      fromStatus: previousStatus,
      toStatus: status,
      changedAt: new Date(Date.now() - (progression.length - index) * 24 * 60 * 60 * 1000).toISOString(),
      changedBy: mockUsers[index % mockUsers.length],
      reason: index === 0 ? 'Title record created' : `Updated to ${status}`,
      notes: index === progression.length - 1 ? 'Current status' : null,
      automaticChange: index === 0
    }
    
    history.push(historyItem)
    previousStatus = status
  })
  
  return history
}

// Generate sample documents
const generateDocuments = (titleId: string): TitleDocument[] => {
  const docTypes = ['original_title', 'bill_of_sale', 'power_of_attorney', 'odometer_disclosure', 'photos']
  const documents: TitleDocument[] = []
  
  docTypes.slice(0, Math.floor(Math.random() * 4) + 1).forEach((type, index) => {
    documents.push({
      id: `doc-${titleId}-${index}`,
      titleId,
      type: type as any,
      filename: `${type.replace('_', '-')}-${titleId}.pdf`,
      originalName: `${type.replace('_', ' ')}.pdf`,
      mimeType: type === 'photos' ? 'image/jpeg' : 'application/pdf',
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
      fileUrl: `/api/documents/${titleId}/${type}`,
      thumbnailUrl: type === 'photos' ? `/api/documents/${titleId}/${type}/thumb` : null,
      description: `${type.replace('_', ' ')} document`,
      isRequired: ['original_title', 'bill_of_sale'].includes(type),
      isVerified: Math.random() > 0.3,
      verifiedAt: Math.random() > 0.3 ? new Date().toISOString() : null,
      verifiedBy: Math.random() > 0.3 ? mockUsers[0] : null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: mockUsers[Math.floor(Math.random() * mockUsers.length)]
    })
  })
  
  return documents
}

// Generate activity logs
const generateActivityLogs = (titleId: string): TitleActivityLog[] => {
  const actions: TitleAction[] = ['created', 'status_changed', 'document_uploaded', 'assigned', 'notes_updated']
  const logs: TitleActivityLog[] = []
  
  actions.forEach((action, index) => {
    logs.push({
      id: `log-${titleId}-${index}`,
      titleId,
      action,
      description: `Title ${action.replace('_', ' ')}`,
      metadata: { previousValue: null, newValue: action },
      performedAt: new Date(Date.now() - (actions.length - index) * 12 * 60 * 60 * 1000).toISOString(),
      performedBy: mockUsers[index % mockUsers.length],
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
  })
  
  return logs
}

// Generate comprehensive mock data
export const generateEnhancedTitleData = (): EnhancedTitle[] => {
  const titles: EnhancedTitle[] = []
  
  const scenarios = [
    {
      status: 'received' as TitleStatus,
      titleType: 'clean' as TitleType,
      priority: 'normal' as TitlePriority,
      notes: 'Original title received from Copart auction. High-value vehicle ready for processing.',
      expectedDays: 14
    },
    {
      status: 'processing' as TitleStatus,
      titleType: 'salvage' as TitleType,
      priority: 'high' as TitlePriority,
      notes: 'Salvage title requires DMV inspection before processing. Scheduled for next week.',
      expectedDays: 21
    },
    {
      status: 'completed' as TitleStatus,
      titleType: 'clean' as TitleType,
      priority: 'normal' as TitlePriority,
      notes: 'Title successfully processed and sent to dealer. Customer satisfaction: 5/5.',
      expectedDays: -5
    },
    {
      status: 'pending_docs' as TitleStatus,
      titleType: 'flood' as TitleType,
      priority: 'rush' as TitlePriority,
      notes: 'Missing power of attorney and odometer disclosure. Customer contacted.',
      expectedDays: 7
    },
    {
      status: 'on_hold' as TitleStatus,
      titleType: 'rebuilt' as TitleType,
      priority: 'low' as TitlePriority,
      notes: 'On hold pending legal review of rebuild documentation and compliance.',
      expectedDays: 30
    },
    {
      status: 'quality_review' as TitleStatus,
      titleType: 'clean' as TitleType,
      priority: 'high' as TitlePriority,
      notes: 'Final quality check in progress. All documentation verified.',
      expectedDays: 2
    },
    {
      status: 'packed' as TitleStatus,
      titleType: 'lemon' as TitleType,
      priority: 'normal' as TitlePriority,
      notes: 'Lemon buyback title processed and packaged for shipment to dealer.',
      expectedDays: 1
    },
    {
      status: 'sent' as TitleStatus,
      titleType: 'export' as TitleType,
      priority: 'rush' as TitlePriority,
      notes: 'Export title sent via overnight shipping. Tracking: 1Z9999W99999999999.',
      expectedDays: -1
    },
    {
      status: 'cancelled' as TitleStatus,
      titleType: 'clean' as TitleType,
      priority: 'normal' as TitlePriority,
      notes: 'Cancelled per dealer request - vehicle returned to auction.',
      expectedDays: 0
    },
    {
      status: 'rejected' as TitleStatus,
      titleType: 'junk' as TitleType,
      priority: 'low' as TitlePriority,
      notes: 'Rejected due to title brand mismatch. Vehicle not salvageable.',
      expectedDays: 0
    },
    // Additional scenarios for comprehensive testing
    {
      status: 'received' as TitleStatus,
      titleType: 'duplicate' as TitleType,
      priority: 'normal' as TitlePriority,
      notes: 'Duplicate title request received. Processing with state DMV.',
      expectedDays: 10
    },
    {
      status: 'processing' as TitleStatus,
      titleType: 'bonded' as TitleType,
      priority: 'high' as TitlePriority,
      notes: 'Bonded title processing requires additional verification steps.',
      expectedDays: 28
    },
    {
      status: 'processing' as TitleStatus,
      titleType: 'lost' as TitleType,
      priority: 'emergency' as TitlePriority,
      notes: 'Emergency lost title replacement for dealer. Processing expedited.',
      expectedDays: 3
    },
    {
      status: 'completed' as TitleStatus,
      titleType: 'repossessed' as TitleType,
      priority: 'normal' as TitlePriority,
      notes: 'Repo title processed successfully. Finance company notified.',
      expectedDays: -3
    },
    {
      status: 'processing' as TitleStatus,
      titleType: 'abandoned' as TitleType,
      priority: 'low' as TitlePriority,
      notes: 'Abandoned vehicle title processing with state authorities.',
      expectedDays: 45
    }
  ]
  
  scenarios.forEach((scenario, index) => {
    const titleId = `title-enhanced-${String(index + 1).padStart(3, '0')}`
    const vehicleIndex = index % 5
    const orgIndex = index % mockOrgs.length
    const assignedUser = index % 3 === 0 ? null : mockUsers[index % mockUsers.length]
    
    const baseDate = new Date()
    const createdAt = new Date(baseDate.getTime() - (15 - index) * 24 * 60 * 60 * 1000)
    const expectedCompletion = scenario.expectedDays > 0 
      ? new Date(baseDate.getTime() + scenario.expectedDays * 24 * 60 * 60 * 1000)
      : scenario.expectedDays < 0 
      ? new Date(baseDate.getTime() + scenario.expectedDays * 24 * 60 * 60 * 1000)
      : null
    
    const title: EnhancedTitle = {
      id: titleId,
      titleNumber: scenario.status === 'completed' || scenario.status === 'shipped' || scenario.status === 'ready_to_ship' ? `${['TX', 'CA', 'FL', 'NY', 'LA', 'AZ'][index % 6]}-${String(12345678 + index).padStart(8, '0')}` : null,
      titleType: scenario.titleType,
      issuingState: ['TX', 'CA', 'FL', 'NY', 'LA', 'AZ'][index % 6],
      issuingCountry: 'US',
      
      vehicle: {
        id: `vehicle-${vehicleIndex + 1}`,
        vin: generateVIN(index),
        make: ['Honda', 'Toyota', 'Ford', 'Chevrolet', 'Volkswagen', 'Nissan'][vehicleIndex],
        model: ['Civic', 'Corolla', 'F-150', 'Malibu', 'Jetta', 'Altima'][vehicleIndex],
        year: 2018 + (index % 7),
        org: mockOrgs[orgIndex]
      },
      
      status: scenario.status,
      priority: scenario.priority,
      
      receivedDate: ['received', 'processing', 'completed', 'quality_review', 'ready_to_ship', 'shipped'].includes(scenario.status) 
        ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString() 
        : null,
      processedDate: ['completed'].includes(scenario.status) 
        ? new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() 
        : null,
      expectedCompletionDate: expectedCompletion?.toISOString() || null,
      actualCompletionDate: ['completed', 'sent'].includes(scenario.status) 
        ? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() 
        : null,
      
      assignedTo: assignedUser,
      location: scenario.status === 'received' || scenario.status === 'processing' 
        ? ['Warehouse A-1', 'Processing Room 2', 'DMV Office', 'Storage B-3', 'Quality Control'][index % 5] 
        : null,
      
      package: ['ready_to_ship', 'shipped', 'completed'].includes(scenario.status) ? {
        id: `package-${titleId}`,
        trackingNumber: scenario.status === 'shipped' || scenario.status === 'completed' 
          ? `1Z999${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`
          : null,
        provider: ['FedEx', 'UPS', 'DHL', 'USPS'][index % 4],
        status: scenario.status === 'completed' ? 'delivered' : scenario.status === 'shipped' ? 'in_transit' : 'prepared'
      } : null,
      
      processingFee: scenario.priority === 'rush' || scenario.priority === 'emergency' ? 25.00 : 15.00,
      rushFee: scenario.priority === 'rush' ? 50.00 : scenario.priority === 'emergency' ? 100.00 : null,
      
      notes: scenario.notes,
      internalNotes: index % 3 === 0 ? 'Internal processing note for admin review.' : null,
      tags: [
        ...(scenario.priority === 'rush' || scenario.priority === 'emergency' ? ['priority'] : []),
        ...(scenario.titleType === 'salvage' || scenario.titleType === 'flood' ? ['branded'] : []),
        ...(index % 4 === 0 ? ['high-value'] : []),
        ...(assignedUser?.name.includes('Sarah') ? ['qa-reviewed'] : [])
      ],
      
      documents: generateDocuments(titleId),
      statusHistory: generateStatusHistory(titleId, scenario.status),
      activityLogs: generateActivityLogs(titleId),
      
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: mockUsers[0]
    }
    
    titles.push(title)
  })
  
  return titles
}

// Generate analytics data
export const generateTitleMetrics = (): TitleMetrics[] => {
  const metrics: TitleMetrics[] = []
  const today = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    
    metrics.push({
      date: date.toISOString().split('T')[0],
      pendingCount: Math.floor(Math.random() * 50) + 10,
      receivedCount: Math.floor(Math.random() * 30) + 5,
      processingCount: Math.floor(Math.random() * 40) + 15,
      completedCount: Math.floor(Math.random() * 25) + 8,
      averageProcessingDays: Math.random() * 10 + 5,
      overdueCount: Math.floor(Math.random() * 5),
      rushJobsCount: Math.floor(Math.random() * 8) + 2,
      slaCompliance: Math.random() * 20 + 80, // 80-100%
      customerSatisfaction: Math.random() * 1 + 4 // 4-5 stars
    })
  }
  
  return metrics
}

// Utility functions
export const getTitleTypeIcon = (type: TitleType): string => {
  const icons: Record<TitleType, string> = {
    clean: '✓',
    salvage: '⚠️',
    flood: '🌊',
    lemon: '🍋',
    rebuilt: '🔧',
    junk: '🗑️',
    export: '🚢',
    bonded: '🔒',
    duplicate: '📋',
    lost: '🔍',
    abandoned: '🚗',
    repossessed: '🏦'
  }
  return icons[type] || '📄'
}

export const getTitleTypeLabel = (type: TitleType): string => {
  const labels: Record<TitleType, string> = {
    clean: 'Clean',
    salvage: 'Salvage',
    flood: 'Flood',
    lemon: 'Lemon',
    rebuilt: 'Rebuilt',
    junk: 'Junk',
    export: 'Export',
    bonded: 'Bonded',
    duplicate: 'Duplicate',
    lost: 'Lost',
    abandoned: 'Abandoned',
    repossessed: 'Repossessed'
  }
  return labels[type] || type
}

export const getPriorityLabel = (priority: TitlePriority): string => {
  const labels: Record<TitlePriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    rush: 'Rush',
    emergency: 'Emergency'
  }
  return labels[priority]
}

export const getPriorityColor = (priority: TitlePriority): string => {
  const colors: Record<TitlePriority, string> = {
    low: 'text-gray-500',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    rush: 'text-red-600',
    emergency: 'text-red-800 font-bold'
  }
  return colors[priority]
}

export const isOverdue = (expectedDate: string | null): boolean => {
  if (!expectedDate) return false
  return new Date(expectedDate) < new Date()
}

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Export singleton instance
export const mockTitleData = generateEnhancedTitleData()
export const mockTitleMetrics = generateTitleMetrics()