// Core domain types
export interface User {
  id: string
  email: string
  name?: string
  orgId: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export interface Org {
  id: string
  name: string
  type: 'DEALER' | 'ADMIN'
  parentOrgId?: string
}

export interface Vehicle {
  id: string
  orgId: string
  vin: string
  make?: string
  model?: string
  year?: number
  purchasePriceUSD?: number
  status: 'SOURCING' | 'PURCHASED' | 'IN_TRANSIT' | 'AT_PORT' | 'SHIPPED' | 'DELIVERED' | 'SOLD'
  currentStage?: string
}

export interface Invoice {
  id: string
  orgId: string
  number: string
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'
  currency: string
  issuedAt?: Date
  total: number
  subtotal: number
  vat: number
  notes?: string
}

export interface InvoiceLine {
  id: string
  invoiceId: string
  itemType: string
  description: string
  qty: number
  unitPrice: number
  vehicleId?: string
}

export interface PaymentIntent {
  id: string
  orgId: string
  invoiceId?: string
  method: string
  amount: number
  currency: string
  status: 'SUBMITTED' | 'CONFIRMED' | 'REJECTED'
  proofUrl?: string
  ref?: string
  createdByUserId: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  name?: string
  orgId: string
  roles: string[]
}

export interface Session {
  user: AuthUser
  expires: string
}