// Package mock data that titles reference
export interface Package {
  id: string;
  status: 'packed' | 'sent' | 'delivered';
  senderOrg: string;
  recipientOrg: string;
  trackingNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define package statuses that match the packageIds in titles.ts
export const packages: Package[] = [
  {
    id: 'pkg-001',
    status: 'delivered',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Amsterdam - Customer',
    trackingNumber: '1Z999AA1234567890',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'pkg-002',
    status: 'packed',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'European Dealer',
    trackingNumber: null,
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-05')
  },
  {
    id: 'pkg-005',
    status: 'sent',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Hamburg Dealer',
    trackingNumber: '1Z999BB2345678901',
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-09')
  },
  {
    id: 'pkg-006',
    status: 'sent',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Hamburg Customs',
    trackingNumber: '1Z999CC3456789012',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12')
  },
  {
    id: 'pkg-008',
    status: 'sent',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Destination Port Customs',
    trackingNumber: '1Z999DD4567890123',
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-12')
  },
  {
    id: 'pkg-010',
    status: 'packed',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'NY Port',
    trackingNumber: null,
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-13')
  },
  {
    id: 'pkg-011',
    status: 'delivered',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Final Customer',
    trackingNumber: '1Z999EE5678901234',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'pkg-012',
    status: 'packed',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Port Authority',
    trackingNumber: null,
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-14')
  },
  {
    id: 'pkg-013',
    status: 'sent',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'European Customs',
    trackingNumber: '1Z999FF6789012345',
    createdAt: new Date('2024-03-09'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'pkg-014',
    status: 'delivered',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Customer - Germany',
    trackingNumber: '1Z999GG7890123456',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-28')
  },
  {
    id: 'pkg-015',
    status: 'packed',
    senderOrg: 'United Cars Processing',
    recipientOrg: 'Ocean Freight',
    trackingNumber: null,
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-16')
  }
];

// Map package status to title status
export const packageStatusToTitleStatus = (packageStatus: Package['status']): string => {
  switch (packageStatus) {
    case 'packed':
      return 'packed';
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    default:
      return 'pending';
  }
};