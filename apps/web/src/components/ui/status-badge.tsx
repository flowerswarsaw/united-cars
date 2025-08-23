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
  
  // Title statuses
  received: { variant: 'info', label: 'Received' },
  packed: { variant: 'info', label: 'Packed' },
  sent: { variant: 'info', label: 'Sent' },
  
  // Service statuses
  in_progress: { variant: 'warning', label: 'In Progress' },
  
  // Claim statuses
  new: { variant: 'info', label: 'New' },
  review: { variant: 'warning', label: 'Under Review' },
  paid: { variant: 'success', label: 'Paid' },
  
  // Invoice statuses
  DRAFT: { variant: 'neutral', label: 'Draft' },
  ISSUED: { variant: 'warning', label: 'Issued' },
  PAID: { variant: 'success', label: 'Paid' },
  VOID: { variant: 'neutral', label: 'Void' },
  
  // Payment statuses
  SUBMITTED: { variant: 'warning', label: 'Submitted' },
  CONFIRMED: { variant: 'success', label: 'Confirmed' },
  REJECTED: { variant: 'error', label: 'Rejected' },
  
  // Intake statuses
  PENDING: { variant: 'warning', label: 'Pending' },
  APPROVED: { variant: 'success', label: 'Approved' },
  
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
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const config = statusMap[status] || { 
    variant: 'neutral' as StatusVariant, 
    label: status.replace(/_/g, ' ').toLowerCase() 
  }
  
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
      {config.label}
    </span>
  )
}