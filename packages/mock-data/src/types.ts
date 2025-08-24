// Mock data types that match our Prisma schema

export interface User {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  orgId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Org {
  id: string;
  name: string;
  type: 'DEALER' | 'ADMIN';
  parentOrgId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  orgId: string;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  purchasePriceUSD: number | null;
  status: 'SOURCING' | 'PURCHASED' | 'IN_TRANSIT' | 'AT_PORT' | 'SHIPPED' | 'DELIVERED';
  currentStage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  orgId: string;
  number: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  currency: string;
  issuedAt: Date | null;
  total: number;
  subtotal: number;
  vat: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  orgId: string;
  invoiceId: string | null;
  method: string;
  amount: number;
  currency: string;
  status: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  proofUrl: string | null;
  ref: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ServiceRequest {
  id: string;
  orgId: string;
  vehicleId: string;
  type: 'INSPECTION' | 'REPAIR' | 'CLEANING' | 'DOCUMENTATION' | 'OTHER';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes: string | null;
  priceUSD: number | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface InsuranceClaim {
  id: string;
  orgId: string;
  vehicleId: string;
  status: 'new' | 'investigating' | 'approved' | 'rejected' | 'paid';
  incidentAt: Date | null;
  description: string | null;
  photos: any | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface Title {
  id: string;
  vehicleId: string;
  status: 'pending' | 'received' | 'sent' | 'delivered' | 'packed';
  location: string | null;
  packageId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  orgId: string;
}

export interface Role {
  id: string;
  key: 'ADMIN' | 'DEALER' | 'OPS' | 'ACCOUNTANT';
}

export interface VehicleIntake {
  id: string;
  orgId: string;
  createdById: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  auction: 'COPART' | 'IAA';
  auctionLot: string | null;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  purchasePriceUSD: number | null;
  auctionLocationId: string | null;
  destinationPort: string;
  notes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedById: string | null;
}