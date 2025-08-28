// Package Management System Mock Data
// Integrated with Enhanced Title Manager

import { EnhancedPackage, PackageStatus, PackagePriority, PackageDocument } from '@/types/title-enhanced'

// Generate comprehensive package mock data
export const generatePackageData = (): EnhancedPackage[] => {
  const packages: EnhancedPackage[] = []
  
  const packageScenarios = [
    {
      status: 'in_transit' as PackageStatus,
      priority: 'express' as PackagePriority,
      provider: 'FedEx',
      tracking: '7749123456789',
      titleIds: ['title-enhanced-001', 'title-enhanced-002'],
      senderOrg: { name: 'Copart Dallas', type: 'auction' as const },
      recipientOrg: { name: 'United Cars Processing', type: 'processor' as const },
      notes: 'Priority package with 2 clean titles from Dallas auction'
    },
    {
      status: 'delivered' as PackageStatus,
      priority: 'standard' as PackagePriority,
      provider: 'UPS',
      tracking: '1Z99999999999999999',
      titleIds: ['title-enhanced-003'],
      senderOrg: { name: 'United Cars Processing', type: 'processor' as const },
      recipientOrg: { name: 'Premium Auto Dealers', type: 'dealer' as const },
      notes: 'Successfully delivered processed title to dealer'
    },
    {
      status: 'prepared' as PackageStatus,
      priority: 'overnight' as PackagePriority,
      provider: 'DHL',
      tracking: null,
      titleIds: ['title-enhanced-004'],
      senderOrg: { name: 'United Cars Processing', type: 'processor' as const },
      recipientOrg: { name: 'Flood Title Specialists', type: 'dealer' as const },
      notes: 'Emergency overnight package for flood title processing'
    },
    {
      status: 'prepared' as PackageStatus,
      priority: 'express' as PackagePriority,
      provider: 'FedEx',
      tracking: '7749987654321',
      titleIds: ['title-enhanced-005', 'title-enhanced-006', 'title-enhanced-007'],
      senderOrg: { name: 'United Cars Processing', type: 'processor' as const },
      recipientOrg: { name: 'Gulf Coast Motors', type: 'dealer' as const },
      notes: 'Bulk shipment with 3 processed titles - salvage and rebuild'
    },
    {
      status: 'shipped' as PackageStatus,
      priority: 'same_day' as PackagePriority,
      provider: 'UPS',
      tracking: '1Z88888888888888888',
      titleIds: ['title-enhanced-008'],
      senderOrg: { name: 'United Cars Processing', type: 'processor' as const },
      recipientOrg: { name: 'Mountain View Auto', type: 'dealer' as const },
      notes: 'Same-day delivery for emergency title replacement'
    },
    {
      status: 'delivered' as PackageStatus,
      priority: 'standard' as PackagePriority,
      provider: 'USPS',
      tracking: '9114901123456789123456',
      titleIds: ['title-enhanced-009', 'title-enhanced-010'],
      senderOrg: { name: 'Manheim Auto Auction', type: 'auction' as const },
      recipientOrg: { name: 'United Cars Processing', type: 'processor' as const },
      notes: 'Standard delivery package with duplicate and lost title requests'
    },
    {
      status: 'exception' as PackageStatus,
      priority: 'express' as PackagePriority,
      provider: 'FedEx',
      tracking: '7749555666777',
      titleIds: ['title-enhanced-011'],
      senderOrg: { name: 'United Cars Processing', type: 'processor' as const },
      recipientOrg: { name: 'Pacific Coast Imports', type: 'dealer' as const },
      notes: 'Delivery exception - address correction needed. Customer contacted.'
    },
    {
      status: 'out_for_delivery' as PackageStatus,
      priority: 'express' as PackagePriority,
      provider: 'UPS',
      tracking: '1Z77777777777777777',
      titleIds: ['title-enhanced-012'],
      senderOrg: { name: 'Copart Phoenix', type: 'auction' as const },
      recipientOrg: { name: 'United Cars Processing', type: 'processor' as const },
      notes: 'Out for delivery - bonded title package expected today'
    }
  ]
  
  packageScenarios.forEach((scenario, index) => {
    const packageId = `package-enhanced-${String(index + 1).padStart(3, '0')}`
    const baseDate = new Date()
    const createdAt = new Date(baseDate.getTime() - (10 - index) * 24 * 60 * 60 * 1000)
    
    // Generate organization data with proper contact info
    
    const pkg: EnhancedPackage = {
      id: packageId,
      trackingNumber: scenario.tracking,
      provider: scenario.provider,
      estimatedDelivery: scenario.status === 'shipped' || scenario.status === 'in_transit' || scenario.status === 'out_for_delivery'
        ? new Date(baseDate.getTime() + Math.floor(Math.random() * 3 + 1) * 24 * 60 * 60 * 1000).toISOString()
        : null,
      actualDelivery: scenario.status === 'delivered'
        ? new Date(baseDate.getTime() - Math.floor(Math.random() * 2 + 1) * 24 * 60 * 60 * 1000).toISOString()
        : null,
      status: scenario.status,
      priority: scenario.priority,
      
      senderOrg: {
        id: `org-${scenario.senderOrg.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: scenario.senderOrg.name,
        type: scenario.senderOrg.type,
        email: scenario.senderOrg.name.toLowerCase().includes('copart') ? 'shipping@copart.com' :
               scenario.senderOrg.name.toLowerCase().includes('iaa') ? 'titles@iaai.com' :
               scenario.senderOrg.name.toLowerCase().includes('manheim') ? 'processing@manheim.com' :
               scenario.senderOrg.name.toLowerCase().includes('united') ? 'operations@unitedcars.com' :
               'info@' + scenario.senderOrg.name.toLowerCase().replace(/\s+/g, '') + '.com',
        phone: '(555) ' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000)
      },
      recipientOrg: {
        id: `org-${scenario.recipientOrg.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: scenario.recipientOrg.name,
        type: scenario.recipientOrg.type,
        email: scenario.recipientOrg.name.toLowerCase().includes('united') ? 'receiving@unitedcars.com' :
               'receiving@' + scenario.recipientOrg.name.toLowerCase().replace(/\s+/g, '') + '.com',
        phone: '(555) ' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000)
      },
      
      // Physical characteristics
      weight: Math.floor(Math.random() * 10 + 1), // 1-10 lbs
      dimensions: {
        length: Math.floor(Math.random() * 6 + 9), // 9-14 inches
        width: Math.floor(Math.random() * 4 + 6),  // 6-9 inches
        height: Math.floor(Math.random() * 2 + 1)  // 1-2 inches
      },
      insuranceValue: scenario.priority === 'overnight' || scenario.priority === 'same_day' 
        ? Math.floor(Math.random() * 5000 + 1000) 
        : Math.floor(Math.random() * 1000 + 100),
      
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + Math.floor(Math.random() * 48) * 60 * 60 * 1000).toISOString(),
      titles: scenario.titleIds,
      documents: generatePackageDocuments(packageId, scenario.type, scenario.status)
    }
    
    packages.push(pkg)
  })
  
  return packages
}

// Generate package documents
const generatePackageDocuments = (packageId: string, type: 'RECEIVING' | 'SENDING', status: PackageStatus): PackageDocument[] => {
  const documents: PackageDocument[] = []
  
  // Shipping label (always present for shipped packages)
  if (status !== 'pending') {
    documents.push({
      id: `doc-${packageId}-label`,
      packageId,
      type: 'shipping_label',
      filename: `shipping-label-${packageId}.pdf`,
      fileUrl: `/api/packages/${packageId}/documents/shipping-label`,
      uploadedAt: new Date().toISOString()
    })
  }
  
  // Packing list
  if (status !== 'pending') {
    documents.push({
      id: `doc-${packageId}-packing`,
      packageId,
      type: 'packing_list',
      filename: `packing-list-${packageId}.pdf`,
      fileUrl: `/api/packages/${packageId}/documents/packing-list`,
      uploadedAt: new Date().toISOString()
    })
  }
  
  // Customs form for international shipments
  if (Math.random() > 0.7) {
    documents.push({
      id: `doc-${packageId}-customs`,
      packageId,
      type: 'customs_form',
      filename: `customs-form-${packageId}.pdf`,
      fileUrl: `/api/packages/${packageId}/documents/customs-form`,
      uploadedAt: new Date().toISOString()
    })
  }
  
  // Receipt for delivered packages
  if (status === 'delivered') {
    documents.push({
      id: `doc-${packageId}-receipt`,
      packageId,
      type: 'receipt',
      filename: `delivery-receipt-${packageId}.pdf`,
      fileUrl: `/api/packages/${packageId}/documents/receipt`,
      uploadedAt: new Date().toISOString()
    })
  }
  
  // Tracking info
  documents.push({
    id: `doc-${packageId}-tracking`,
    packageId,
    type: 'tracking_info',
    filename: `tracking-${packageId}.json`,
    fileUrl: `/api/packages/${packageId}/documents/tracking`,
    uploadedAt: new Date().toISOString()
  })
  
  return documents
}

// Package status configuration for UI
export const packageStatusConfig = {
  pending: {
    label: 'Pending',
    color: 'warning',
    description: 'Package preparation pending'
  },
  prepared: {
    label: 'Prepared',
    color: 'primary',
    description: 'Package prepared for shipment'
  },
  shipped: {
    label: 'Shipped',
    color: 'primary',
    description: 'Package shipped and in carrier network'
  },
  in_transit: {
    label: 'In Transit',
    color: 'primary',
    description: 'Package in transit to destination'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'success',
    description: 'Package out for delivery today'
  },
  delivered: {
    label: 'Delivered',
    color: 'success',
    description: 'Package successfully delivered'
  },
  exception: {
    label: 'Exception',
    color: 'error',
    description: 'Delivery exception requiring attention'
  },
  returned: {
    label: 'Returned',
    color: 'error',
    description: 'Package returned to sender'
  }
} as const

// Package priority configuration
export const packagePriorityConfig = {
  standard: {
    label: 'Standard',
    color: 'text-gray-600',
    deliveryTime: '3-5 business days'
  },
  express: {
    label: 'Express',
    color: 'text-blue-600',
    deliveryTime: '1-2 business days'
  },
  overnight: {
    label: 'Overnight',
    color: 'text-orange-600',
    deliveryTime: 'Next business day'
  },
  same_day: {
    label: 'Same Day',
    color: 'text-red-600',
    deliveryTime: 'Same business day'
  }
} as const

// Utility functions for package management  
export const getOrganizationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'auction': 'Auction House',
    'dealer': 'Dealer',
    'processor': 'Processing Center'
  }
  return labels[type] || type
}

export const getProviderLabel = (provider: string | null): string => {
  return provider || 'Not assigned'
}

export const formatTrackingNumber = (trackingNumber: string | null): string => {
  if (!trackingNumber) return 'Not assigned'
  
  // Format based on carrier pattern
  if (trackingNumber.startsWith('1Z')) {
    // UPS format: 1Z 999 999 99 9999 999 9
    return trackingNumber.replace(/(.{2})(.{3})(.{3})(.{2})(.{4})(.{3})(.{1})/, '$1 $2 $3 $4 $5 $6 $7')
  } else if (trackingNumber.length === 12 && trackingNumber.startsWith('77')) {
    // FedEx format: 7749 1234 5678
    return trackingNumber.replace(/(.{4})(.{4})(.{4})/, '$1 $2 $3')
  } else if (trackingNumber.length === 22) {
    // USPS format: 9114 9011 2345 6789 1234 56
    return trackingNumber.replace(/(.{4})(.{4})(.{4})(.{4})(.{4})(.{2})/, '$1 $2 $3 $4 $5 $6')
  }
  
  return trackingNumber
}

export const calculateEstimatedDelivery = (
  createdAt: string,
  priority: PackagePriority
): string => {
  const created = new Date(createdAt)
  const deliveryDays = {
    standard: 5,
    express: 2,
    overnight: 1,
    same_day: 0
  }
  
  const estimatedDelivery = new Date(created.getTime() + deliveryDays[priority] * 24 * 60 * 60 * 1000)
  return estimatedDelivery.toISOString()
}

// Integration with titles
export const getPackageProgressPercentage = (status: PackageStatus): number => {
  const progressMap: Record<PackageStatus, number> = {
    pending: 10,
    prepared: 25,
    shipped: 40,
    in_transit: 60,
    out_for_delivery: 85,
    delivered: 100,
    exception: 75, // Stuck at 75% due to issue
    returned: 0    // Back to 0%
  }
  
  return progressMap[status] || 0
}

// Export singleton instances
export const mockPackageData = generatePackageData()

// Package analytics
export const getPackageMetrics = () => {
  const packages = mockPackageData
  
  return {
    totalPackages: packages.length,
    inboundPackages: packages.filter(p => p.recipientOrg.type === 'processor').length, // Coming to processing center
    outboundPackages: packages.filter(p => p.senderOrg.type === 'processor').length, // Going from processing center  
    inTransitPackages: packages.filter(p => ['shipped', 'in_transit', 'out_for_delivery'].includes(p.status)).length,
    deliveredPackages: packages.filter(p => p.status === 'delivered').length,
    exceptionPackages: packages.filter(p => p.status === 'exception').length,
    averageDeliveryTime: 2.3, // days
    onTimeDeliveryRate: 94.5 // percentage
  }
}