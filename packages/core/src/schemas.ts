import { z } from 'zod'

// Common validation schemas
export const EmailSchema = z.string().email()
export const VinSchema = z.string().length(17)
export const CurrencySchema = z.string().length(3).default('USD')

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().optional(),
  pages: z.number().optional()
})

// Login schema
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1)
})

// Vehicle schemas
export const CreateVehicleSchema = z.object({
  vin: VinSchema,
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  purchasePriceUSD: z.number().positive().optional()
})

// Invoice schemas
export const CreateInvoiceSchema = z.object({
  lines: z.array(z.object({
    itemType: z.string(),
    description: z.string(),
    qty: z.number().positive(),
    unitPrice: z.number(),
    vehicleId: z.string().optional()
  })),
  notes: z.string().optional()
})

// Payment schemas
export const CreatePaymentIntentSchema = z.object({
  invoiceId: z.string().optional(),
  method: z.string(),
  amount: z.number().positive(),
  currency: CurrencySchema,
  ref: z.string().optional()
})

// Title schemas
export const TitleStatusSchema = z.enum(['pending', 'received', 'packed', 'sent'])

export const UpdateTitleStatusSchema = z.object({
  status: TitleStatusSchema,
  notes: z.string().optional()
})

// Service Request schemas
export const ServiceTypeSchema = z.enum(['inspection', 'cleaning', 'repair', 'storage', 'titlework'])
export const ServiceStatusSchema = z.enum(['pending', 'approved', 'in_progress', 'completed', 'rejected'])

export const CreateServiceRequestSchema = z.object({
  vehicleId: z.string().cuid(),
  type: ServiceTypeSchema,
  notes: z.string().optional()
})

export const UpdateServiceRequestSchema = z.object({
  status: ServiceStatusSchema.optional(),
  priceUSD: z.number().positive().optional(),
  notes: z.string().optional()
})

// Insurance Claim schemas
export const ClaimStatusSchema = z.enum(['new', 'review', 'approved', 'rejected', 'paid'])

export const CreateInsuranceClaimSchema = z.object({
  vehicleId: z.string().cuid(),
  description: z.string().optional(),
  incidentAt: z.string().datetime().optional(),
  photos: z.array(z.object({
    filename: z.string(),
    url: z.string().url()
  })).optional()
})

export const UpdateInsuranceClaimSchema = z.object({
  status: ClaimStatusSchema.optional(),
  description: z.string().optional(),
  incidentAt: z.string().datetime().optional()
})