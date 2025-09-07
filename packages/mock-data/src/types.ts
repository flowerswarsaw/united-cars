// Mock data types that match our Prisma schema

export interface User {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  orgId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  balance?: number; // Account balance in USD (optional for migration)
  createdAt: Date;
  updatedAt: Date;
  version?: number; // Optional for migration
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
  status: 'SOURCING' | 'PICKUP' | 'GROUND_TRANSPORT' | 'PORT_PROCESSING' | 'OCEAN_SHIPPING' | 'DESTINATION_PORT' | 'DELIVERED';
  currentStage: 
    // SOURCING stages
    | 'auction_bidding' | 'auction_won' | 'payment_processing' | 'documentation_pending'
    // PICKUP stages  
    | 'pickup_scheduled' | 'pickup_confirmed' | 'picked_up' | 'damage_inspection'
    // GROUND_TRANSPORT stages
    | 'carrier_assigned' | 'in_transit_to_port' | 'arrived_at_warehouse'
    // PORT_PROCESSING stages
    | 'warehouse_inspection' | 'documentation_complete' | 'export_clearance' | 'loading_scheduled'
    // OCEAN_SHIPPING stages
    | 'loaded_on_vessel' | 'vessel_departed' | 'in_transit_ocean' | 'vessel_arriving'
    // DESTINATION_PORT stages
    | 'vessel_arrived' | 'customs_clearance' | 'container_unloading' | 'ready_for_pickup'
    // DELIVERED stages
    | 'pickup_scheduled_final' | 'in_final_delivery' | 'delivered_to_customer';
  statusHistory?: VehicleStatusUpdate[];
  estimatedDates?: {
    pickupDate?: Date | null;
    portArrivalDate?: Date | null;
    vesselDepartureDate?: Date | null;
    destinationArrivalDate?: Date | null;
    deliveryDate?: Date | null;
  };
  metadata?: any;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleStatusUpdate {
  id: string;
  status: Vehicle['status'];
  stage: Vehicle['currentStage'];
  updatedAt: Date;
  notes?: string | null;
  location?: string | null;
  updatedBy?: string | null;
}

export interface InvoiceLine {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  vehicleId?: string | null;
}

export interface Invoice {
  id: string;
  orgId: string;
  number: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';
  currency: string;
  issuedAt: Date | null;
  dueDate: Date | null; // For determining OVERDUE status
  total: number;
  subtotal: number;
  vat: number;
  paidAmount?: number; // Total amount paid towards this invoice (optional for migration)
  remainingAmount?: number; // Outstanding amount (optional for migration)  
  notes: string | null;
  cancelReason?: string | null; // Reason when admin cancels invoice
  canceledBy?: string | null; // User ID who canceled
  canceledAt?: Date | null; // When it was canceled
  lines: InvoiceLine[];
  createdAt: Date;
  updatedAt: Date;
  version?: number; // Optional for migration
}

export interface PaymentIntent {
  id: string;
  orgId: string;
  invoiceId: string | null;
  method: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELED';
  proofUrl: string | null;
  ref: string | null;
  senderName: string | null;
  transferDate: string | null;
  allocations: string | null; // JSON string of manual allocations
  totalAllocated: number | null;
  remainingAmount: number | null;
  balanceChange: number | null;
  declineReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ServiceStatusHistory {
  id: string;
  status: ServiceRequest['status'];
  changedAt: Date;
  changedBy: string;
  notes?: string | null;
}

export interface ServiceRequest {
  id: string;
  orgId: string;
  vehicleId: string;
  type: 'video_service' | 'vip_full' | 'plastic_covering' | 'vip_fastest' | 'extra_photos' | 'window_covering' | 'moisture_absorber';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  notes: string | null;
  priceUSD: number | null;
  
  // Simple status-specific fields
  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  
  statusHistory?: ServiceStatusHistory[];
  
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface InsuranceClaim {
  id: string;
  orgId: string;
  vehicleId: string;
  serviceRequestId?: string | null; // Link to service request if claim is about a service
  claimType: 'damage' | 'service_dispute' | 'quality_issue' | 'billing_dispute';
  status: 'new' | 'investigating' | 'under_review' | 'approved' | 'rejected' | 'settled' | 'paid' | 'closed';
  incidentAt: Date | null;
  description: string | null;
  photos: any | null;
  
  // Claim-specific fields
  disputeReason?: string | null;
  disputeEvidence?: string[] | null;
  disputedBy?: string | null;
  disputedAt?: Date | null;
  
  assignedTo?: string | null;
  reviewNotes?: string | null;
  reviewStartedAt?: Date | null;
  
  settlementAmount?: number | null;
  settlementReason?: string | null;
  processedBy?: string | null;
  settledAt?: Date | null;
  paidAt?: Date | null;
  
  claimHistory?: Array<{
    id: string;
    status: string;
    changedAt: Date;
    changedBy: string;
    notes?: string | null;
  }>;
  
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

export interface Package {
  id: string;
  status: 'packed' | 'sent' | 'delivered';
  senderOrg: string;
  recipientOrg: string;
  trackingNumber: string | null;
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
  key: 'ADMIN' | 'ACCOUNTING' | 'CLAIMS' | 'SUPPORT' | 'DEALER' | 'RETAIL' | 'DISPATCH' | 'OPS';
}

export interface VehicleIntake {
  id: string;
  orgId: string;
  createdById: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Auction Information
  auction: 'COPART' | 'IAA' | 'MANHEIM' | 'PRIVATE';
  auctionLot: string | null;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  purchasePriceUSD: number | null;
  auctionLocationId: string | null;
  
  // Shipping Information
  usPort: string; // Departure port (NY, GA, Los Angeles, New Jersey)
  destinationPort: string;
  insurance: string | null; // "1%", "2%", "no"
  
  // Payment Information
  paymentMethod: 'DIRECT_TO_AUCTION' | 'COMPANY_PAYS';
  paymentConfirmations: Array<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: Date;
  }>;
  
  // Private Location Fields (only when auction === 'PRIVATE')
  isPrivateLocation: boolean;
  pickupAddress: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  insuranceValue: number | null; // Car price for insurance purposes
  
  notes: string | null;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }> | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedById: string | null;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultInsurance: string; // "1%", "2%", "no"
  defaultUsPort: string | null;
  defaultDestinationPort: string | null;
  createdAt: Date;
  updatedAt: Date;
}