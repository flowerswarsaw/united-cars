import { clsx } from 'clsx'

type StatusVariant = 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'error' 
  | 'neutral'

interface StatusConfig {
  variant: StatusVariant
  label: string
}

const statusMap: Record<string, StatusConfig> = {
  // Universal statuses
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  completed: { variant: 'success', label: 'Completed' },
  rejected: { variant: 'error', label: 'Rejected' },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
  
  // Vehicle statuses
  SOURCING: { variant: 'warning', label: 'Sourcing' },
  PURCHASED: { variant: 'info', label: 'Purchased' },
  IN_TRANSIT: { variant: 'info', label: 'In Transit' },
  AT_PORT: { variant: 'info', label: 'At Port' },
  SHIPPED: { variant: 'info', label: 'Shipped' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  SOLD: { variant: 'success', label: 'Sold' },
  
  // Dynamic Title statuses
  packed: { variant: 'warning', label: 'Packed' },
  sent_to: { variant: 'info', label: 'Sent' },
  received_by: { variant: 'success', label: 'Received' },
  
  // Package statuses
  prepared: { variant: 'warning', label: 'Prepared' },
  in_transit: { variant: 'info', label: 'In Transit' },
  out_for_delivery: { variant: 'info', label: 'Out for Delivery' },
  delivered: { variant: 'success', label: 'Delivered' },
  exception: { variant: 'error', label: 'Exception' },
  
  // Service statuses
  in_progress: { variant: 'warning', label: 'In Progress' },
  
  // Claim statuses
  new: { variant: 'warning', label: 'New' },
  investigating: { variant: 'info', label: 'Investigating' },
  under_review: { variant: 'warning', label: 'Under Review' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'error', label: 'Rejected' },
  settled: { variant: 'success', label: 'Settled' },
  paid: { variant: 'success', label: 'Paid' },
  closed: { variant: 'neutral', label: 'Closed' },
  
  // Invoice statuses
  DRAFT: { variant: 'neutral', label: 'Draft' },
  ISSUED: { variant: 'warning', label: 'Issued' },
  PAID: { variant: 'success', label: 'Paid' },
  VOID: { variant: 'neutral', label: 'Void' },
  
  // Payment statuses
  PENDING: { variant: 'warning', label: 'Pending Review' },
  APPROVED: { variant: 'success', label: 'Approved' },
  DECLINED: { variant: 'error', label: 'Declined' },
  CANCELED: { variant: 'neutral', label: 'Canceled' },
  
  // Intake statuses (using INTAKE_ prefix to avoid conflicts)
  INTAKE_PENDING: { variant: 'warning', label: 'Pending' },
  INTAKE_APPROVED: { variant: 'success', label: 'Approved' },
  
  // User statuses
  ACTIVE: { variant: 'success', label: 'Active' },
  INACTIVE: { variant: 'neutral', label: 'Inactive' },
  SUSPENDED: { variant: 'error', label: 'Suspended' },
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
}

interface StatusBadgeProps {
  status: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string  // Optional custom label override
}

export function StatusBadge({ status, className, size = 'md', label }: StatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    )
  }

  const config = statusMap[status] || { 
    variant: 'neutral' as StatusVariant, 
    label: status.replace(/_/g, ' ').toLowerCase() 
  }
  
  // Use custom label if provided, otherwise use config label
  const displayLabel = label || config.label
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }
  
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        variantStyles[config.variant],
        sizeClasses[size],
        className
      )}
    >
      {displayLabel}
    </span>
  )
}