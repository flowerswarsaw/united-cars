// Application constants

export const APP_NAME = 'United Cars'
export const APP_VERSION = '1.0.0'

// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT', 
  OPS: 'OPS',
  DEALER: 'DEALER',
  SUBDEALER: 'SUBDEALER'
} as const

// Vehicle statuses
export const VEHICLE_STATUS = {
  SOURCING: 'SOURCING',
  PURCHASED: 'PURCHASED',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_PORT: 'AT_PORT',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  SOLD: 'SOLD'
} as const

// Invoice statuses
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED', 
  PAID: 'PAID',
  VOID: 'VOID'
} as const

// Payment statuses
export const PAYMENT_STATUS = {
  SUBMITTED: 'SUBMITTED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED'
} as const

// Auction sources
export const AUCTION_SOURCES = {
  COPART: 'COPART',
  IAA: 'IAA'
} as const

// Vehicle types
export const VEHICLE_TYPES = {
  SEDAN: 'SEDAN',
  SUV: 'SUV', 
  BIGSUV: 'BIGSUV',
  VAN: 'VAN',
  PICKUP: 'PICKUP'
} as const

// Calculation versions
export const CALC_VERSIONS = {
  AUCTION: '1.0.0',
  TOWING: '1.0.0',
  SHIPPING: '1.0.0',
  CUSTOMS: '1.0.0'
} as const

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/me'
  },
  VEHICLES: {
    LIST: '/api/vehicles',
    CREATE: '/api/vehicles',
    GET: (id: string) => `/api/vehicles/${id}`
  },
  CALC: {
    AUCTION: '/api/calc/auction',
    TOWING: '/api/calc/towing', 
    SHIPPING: '/api/calc/shipping',
    CUSTOMS: '/api/calc/customs'
  },
  INVOICES: {
    LIST: '/api/invoices',
    CREATE: '/api/invoices',
    GET: (id: string) => `/api/invoices/${id}`,
    PDF: (id: string) => `/api/invoices/${id}/pdf`
  },
  PAYMENTS: {
    INTENT: '/api/payments/intent',
    CONFIRM: (id: string) => `/api/payments/${id}/confirm`,
    REJECT: (id: string) => `/api/payments/${id}/reject`
  }
} as const

// File upload constants
export const MAX_FILES_PER_REQUEST = 10
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB