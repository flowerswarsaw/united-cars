import { ServiceRequest, InsuranceClaim, Title, VehicleIntake } from '../types';

export const serviceRequests: ServiceRequest[] = [
  {
    id: 'service-1',
    orgId: 'org-admin',
    vehicleId: 'vehicle-1',
    type: 'INSPECTION',
    status: 'pending',
    notes: 'Pre-purchase inspection needed',
    priceUSD: null,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    version: 0
  },
  {
    id: 'service-2',
    orgId: 'org-admin',
    vehicleId: 'vehicle-2',
    type: 'CLEANING',
    status: 'approved',
    notes: 'Interior and exterior detailing',
    priceUSD: 150,
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-03'),
    version: 1
  },
  {
    id: 'service-3',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-4',
    type: 'REPAIR',
    status: 'completed',
    notes: 'Front bumper repair and paint',
    priceUSD: 450,
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-08'),
    version: 2
  },
  {
    id: 'service-4',
    orgId: 'org-admin',
    vehicleId: 'vehicle-3',
    type: 'DOCUMENTATION',
    status: 'completed',
    notes: 'Title transfer and registration',
    priceUSD: 75,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-25'),
    version: 1
  }
];

export const insuranceClaims: InsuranceClaim[] = [
  {
    id: 'claim-1',
    orgId: 'org-admin',
    vehicleId: 'vehicle-2',
    status: 'new',
    incidentAt: new Date('2024-03-04'),
    description: 'Hail damage on roof and hood',
    photos: null,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    version: 0
  },
  {
    id: 'claim-2',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-5',
    status: 'approved',
    incidentAt: new Date('2024-03-06'),
    description: 'Windshield crack during transport',
    photos: ['photo1.jpg', 'photo2.jpg'],
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-09'),
    version: 2
  },
  {
    id: 'claim-3',
    orgId: 'org-admin',
    vehicleId: 'vehicle-11',
    status: 'rejected',
    incidentAt: new Date('2024-02-25'),
    description: 'Pre-existing damage claim',
    photos: null,
    createdAt: new Date('2024-02-26'),
    updatedAt: new Date('2024-02-28'),
    version: 1
  },
  {
    id: 'claim-4',
    orgId: 'org-dealer-2',
    vehicleId: 'vehicle-7',
    status: 'investigating',
    incidentAt: new Date('2024-03-10'),
    description: 'Side mirror damage during loading',
    photos: ['mirror1.jpg', 'mirror2.jpg', 'mirror3.jpg'],
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-12'),
    version: 1
  }
];

export const titles: Title[] = [
  {
    id: 'title-1',
    vehicleId: 'vehicle-1',
    status: 'pending',
    location: 'Auction location',
    packageId: null,
    notes: 'Waiting for title from auction',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'title-2',
    vehicleId: 'vehicle-2',
    status: 'received',
    location: 'Main office',
    packageId: null,
    notes: 'Title received and verified',
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-05')
  },
  {
    id: 'title-3',
    vehicleId: 'vehicle-3',
    status: 'delivered',
    location: 'Customer',
    packageId: 'pkg-001',
    notes: 'Delivered to customer with vehicle',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'title-4',
    vehicleId: 'vehicle-4',
    status: 'packed',
    location: 'Shipping department',
    packageId: 'pkg-002',
    notes: 'Packed for shipment to dealer',
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-07')
  }
];

export const vehicleIntakes: VehicleIntake[] = [
  {
    id: 'intake-1',
    orgId: 'org-dealer-1',
    createdById: 'user-dealer-1',
    status: 'PENDING',
    auction: 'COPART',
    auctionLot: '12345678',
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    purchasePriceUSD: 8500,
    auctionLocationId: 'copart-dallas',
    destinationPort: 'Rotterdam',
    notes: 'Clean title, minor damage on left side',
    createdAt: new Date('2024-03-14'),
    reviewedAt: null,
    reviewedById: null
  },
  {
    id: 'intake-2',
    orgId: 'org-dealer-2',
    createdById: 'user-dealer-1',
    status: 'APPROVED',
    auction: 'IAA',
    auctionLot: '87654321',
    vin: '1HGBH41JXMN556789',
    make: 'Honda',
    model: 'Accord',
    year: 2019,
    purchasePriceUSD: 12500,
    auctionLocationId: 'iaa-chicago',
    destinationPort: 'Hamburg',
    notes: 'Excellent condition, approved for processing',
    createdAt: new Date('2024-03-10'),
    reviewedAt: new Date('2024-03-11'),
    reviewedById: 'user-admin-1'
  },
  {
    id: 'intake-3',
    orgId: 'org-dealer-3',
    createdById: 'user-dealer-1',
    status: 'REJECTED',
    auction: 'COPART',
    auctionLot: '99887766',
    vin: '2C3CDXBG5CH234567',
    make: 'Dodge',
    model: 'Charger',
    year: 2012,
    purchasePriceUSD: 5500,
    auctionLocationId: 'copart-miami',
    destinationPort: 'Rotterdam',
    notes: 'Too much damage, not worth importing',
    createdAt: new Date('2024-03-08'),
    reviewedAt: new Date('2024-03-09'),
    reviewedById: 'user-admin-1'
  }
];