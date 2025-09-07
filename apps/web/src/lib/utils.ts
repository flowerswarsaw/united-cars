import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Robust date conversion utilities for API handling
export function parseDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  
  try {
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function sanitizeDateFields(obj: Record<string, any>, dateFields: string[]): Record<string, any> {
  const sanitized = { ...obj };
  
  dateFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      const parsed = parseDate(sanitized[field]);
      if (parsed) {
        sanitized[field] = parsed;
      } else {
        delete sanitized[field]; // Remove invalid date fields
      }
    }
  });
  
  return sanitized;
}

export function serializeDateFields(obj: Record<string, any>, dateFields: string[]): Record<string, any> {
  const serialized = { ...obj };
  
  dateFields.forEach(field => {
    if (serialized[field] instanceof Date) {
      serialized[field] = serialized[field].toISOString();
    }
  });
  
  return serialized;
}

// Theme-aware utility functions for consistent styling across the application
export const themeAware = {
  // Status colors - use semantic color tokens for different states
  status: {
    success: 'bg-success text-success-foreground',
    error: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning text-warning-foreground',
    info: 'bg-info text-info-foreground',
    pending: 'bg-warning/20 text-warning border-warning/20',
    processing: 'bg-info/20 text-info border-info/20',
    completed: 'bg-success/20 text-success border-success/20',
    cancelled: 'bg-destructive/20 text-destructive border-destructive/20'
  },

  // Surface colors for different background levels
  surface: {
    base: 'bg-background text-foreground',
    elevated: 'bg-card text-card-foreground border-border',
    overlay: 'bg-surface-100 text-foreground',
    muted: 'bg-muted text-muted-foreground',
    accent: 'bg-accent text-accent-foreground'
  },

  // Interactive states for buttons, links, and hoverable elements
  interactive: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-hover-overlay hover:text-foreground',
    outline: 'border-border hover:bg-hover-overlay hover:text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    link: 'text-primary hover:text-primary/80 underline-offset-4 hover:underline'
  },

  // Text hierarchy for consistent typography
  text: {
    primary: 'text-foreground',
    secondary: 'text-text-secondary',
    tertiary: 'text-text-tertiary',
    inverse: 'text-text-inverse',
    link: 'text-text-link hover:text-text-link-hover',
    muted: 'text-muted-foreground'
  },

  // Border variations
  border: {
    default: 'border-border',
    subtle: 'border-border-subtle',
    strong: 'border-border-strong',
    focus: 'border-primary ring-2 ring-primary/20'
  },

  // Chart and data visualization colors
  chart: {
    1: 'fill-chart-1 stroke-chart-1',
    2: 'fill-chart-2 stroke-chart-2',
    3: 'fill-chart-3 stroke-chart-3',
    4: 'fill-chart-4 stroke-chart-4',
    5: 'fill-chart-5 stroke-chart-5',
    6: 'fill-chart-6 stroke-chart-6'
  }
}

// Helper function to get status-specific styling
export function getStatusStyle(status: string): string {
  const statusMap: Record<string, string> = {
    'success': themeAware.status.success,
    'completed': themeAware.status.completed,
    'error': themeAware.status.error,
    'cancelled': themeAware.status.cancelled,
    'warning': themeAware.status.warning,
    'pending': themeAware.status.pending,
    'info': themeAware.status.info,
    'processing': themeAware.status.processing,
    'in_progress': themeAware.status.processing,
    'received': themeAware.status.info,
    'shipped': themeAware.status.info,
    'delivered': themeAware.status.completed
  }
  
  return statusMap[status.toLowerCase()] || themeAware.surface.muted
}

// Helper function to create consistent card styling
export function getCardStyle(variant: 'default' | 'elevated' | 'bordered' = 'default'): string {
  const base = 'rounded-lg'
  
  switch (variant) {
    case 'elevated':
      return `${base} ${themeAware.surface.elevated} shadow-sm`
    case 'bordered':
      return `${base} ${themeAware.surface.elevated} border`
    default:
      return `${base} ${themeAware.surface.base}`
  }
}

// Helper function for consistent button styling
export function getButtonStyle(variant: keyof typeof themeAware.interactive = 'primary', size: 'sm' | 'default' | 'lg' = 'default'): string {
  const baseStyle = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
  
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-9 px-4 py-2 text-sm',
    lg: 'h-10 px-8 text-base'
  }
  
  const variantStyle = themeAware.interactive[variant] || themeAware.interactive.primary
  
  return `${baseStyle} ${sizeStyles[size]} ${variantStyle}`
}