'use client';

import * as React from 'react';
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
  settled: { variant: 'success', label: 'Settled' },
  // Note: approved, rejected, closed, paid are defined in Universal statuses above
  
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

  // Ticket statuses
  OPEN: { variant: 'info', label: 'Open' },
  IN_PROGRESS: { variant: 'warning', label: 'In Progress' },
  WAITING: { variant: 'neutral', label: 'Waiting' },
  RESOLVED: { variant: 'success', label: 'Resolved' },

  // Task statuses
  TODO: { variant: 'neutral', label: 'To Do' },
  DONE: { variant: 'success', label: 'Done' },
  CANCELLED: { variant: 'neutral', label: 'Cancelled' },
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

/**
 * ClickableStatusBadge - Status badge with dropdown to change status
 */
interface ClickableStatusBadgeProps {
  status: string
  options: { value: string; label: string }[]
  onStatusChange: (newStatus: string) => void | Promise<void>
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function ClickableStatusBadge({
  status,
  options,
  onStatusChange,
  className,
  size = 'md',
  disabled = false,
}: ClickableStatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isChanging, setIsChanging] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      await onStatusChange(newStatus);
      setIsOpen(false);
    } finally {
      setIsChanging(false);
    }
  };

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
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isChanging}
        className={clsx(
          'inline-flex items-center font-medium rounded-full border cursor-pointer transition-all',
          variantStyles[config.variant],
          sizeClasses[size],
          !disabled && 'hover:ring-2 hover:ring-offset-1 hover:ring-current/20',
          disabled && 'opacity-50 cursor-not-allowed',
          isChanging && 'animate-pulse',
          className
        )}
      >
        {config.label}
        {!disabled && (
          <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[120px] rounded-md border bg-popover shadow-lg">
          <div className="p-1">
            {options.map((option) => {
              const optionConfig = statusMap[option.value] || {
                variant: 'neutral' as StatusVariant,
                label: option.label
              };
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={clsx(
                    'w-full text-left px-2 py-1.5 text-sm rounded transition-colors',
                    option.value === status
                      ? 'bg-accent font-medium'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className={clsx(
                    'inline-block w-2 h-2 rounded-full mr-2',
                    optionConfig.variant === 'success' && 'bg-green-500',
                    optionConfig.variant === 'warning' && 'bg-yellow-500',
                    optionConfig.variant === 'error' && 'bg-red-500',
                    optionConfig.variant === 'info' && 'bg-blue-500',
                    optionConfig.variant === 'neutral' && 'bg-gray-500',
                  )} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}