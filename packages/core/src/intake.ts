import { z } from 'zod'

export const IntakeCreateInput = z.object({
  auction: z.enum(['COPART', 'IAA']),
  auctionLot: z.string().optional(),
  vin: z.string().min(11).max(20),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  purchasePriceUSD: z.number().positive().optional(),
  auctionLocationId: z.string().optional(),
  destinationPort: z.string().min(2), // default "Rotterdam" in UI
  notes: z.string().max(2000).optional()
})

export type IntakeCreateInput = z.infer<typeof IntakeCreateInput>

export const IntakeReviewInput = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(1000).optional()
})

export type IntakeReviewInput = z.infer<typeof IntakeReviewInput>

export const IntakeUploadInput = z.object({
  kind: z.enum(['invoice', 'photo', 'other'])
})

export type IntakeUploadInput = z.infer<typeof IntakeUploadInput>

// Response types
export const IntakeData = z.object({
  id: z.string(),
  orgId: z.string(),
  createdById: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  auction: z.enum(['COPART', 'IAA']),
  auctionLot: z.string().nullable(),
  vin: z.string(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  purchasePriceUSD: z.number().nullable(),
  auctionLocationId: z.string().nullable(),
  destinationPort: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  reviewedAt: z.date().nullable(),
  reviewedById: z.string().nullable(),
  // Relations can be expanded
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string()
  }).optional(),
  reviewedBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string()
  }).optional().nullable(),
  auctionLocation: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    state: z.string().nullable()
  }).optional().nullable(),
  attachments: z.array(z.object({
    id: z.string(),
    kind: z.enum(['INVOICE', 'PHOTO', 'OTHER']),
    url: z.string(),
    filename: z.string(),
    createdAt: z.date()
  })).optional()
})

export type IntakeData = z.infer<typeof IntakeData>