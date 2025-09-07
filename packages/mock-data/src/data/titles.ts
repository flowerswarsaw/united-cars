import { Title } from '../types';
import { packages, packageStatusToTitleStatus } from './packages';

// Helper function to get title status based on packageId
const getTitleStatus = (packageId: string | null): Title['status'] => {
  if (!packageId) return 'pending';
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return 'pending';
  return packageStatusToTitleStatus(pkg.status) as Title['status'];
};

export const titles: Title[] = [
  // Admin org vehicles (vehicle-1 to vehicle-3, vehicle-9 to vehicle-12)
  {
    id: 'title-1',
    vehicleId: 'vehicle-1',
    status: getTitleStatus(null), // 'pending' - no package
    location: 'Copart Dallas Office',
    packageId: null,
    notes: 'Title received from auction, ready for processing',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-02')
  },
  {
    id: 'title-2',
    vehicleId: 'vehicle-2',
    status: getTitleStatus('pkg-002'), // 'packed' based on pkg-002 status
    location: 'Shipping Department - Savannah',
    packageId: 'pkg-002',
    notes: 'Title packaged for overseas shipment',
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-05')
  },
  {
    id: 'title-3',
    vehicleId: 'vehicle-3',
    status: getTitleStatus('pkg-001'), // 'delivered' based on pkg-001 status
    location: 'Amsterdam - Customer',
    packageId: 'pkg-001',
    notes: 'Title delivered to customer with completed vehicle',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'title-9',
    vehicleId: 'vehicle-9',
    status: getTitleStatus(null), // 'pending' - no package
    location: 'Auction site',
    packageId: null,
    notes: 'Awaiting title release from auction house',
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-11')
  },
  {
    id: 'title-10',
    vehicleId: 'vehicle-10',
    status: getTitleStatus('pkg-010'), // 'packed' based on pkg-010 status
    location: 'NY Port - Shipping',
    packageId: 'pkg-010',
    notes: 'Title ready for ocean freight shipment',
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-13')
  },
  {
    id: 'title-11',
    vehicleId: 'vehicle-11',
    status: getTitleStatus('pkg-011'), // 'delivered' based on pkg-011 status
    location: 'Final destination',
    packageId: 'pkg-011',
    notes: 'Title successfully delivered with vehicle',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'title-12',
    vehicleId: 'vehicle-12',
    status: getTitleStatus('pkg-012'), // 'packed' based on pkg-012 status
    location: 'Port Authority - Loading',
    packageId: 'pkg-012',
    notes: 'Title prepared for vessel loading',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-14')
  },

  // Dealer 1 vehicles (vehicle-from-intake-1, vehicle-4 to vehicle-6)
  {
    id: 'title-intake-1',
    vehicleId: 'vehicle-from-intake-1',
    status: getTitleStatus(null), // 'pending' - no package
    location: 'Copart Dallas',
    packageId: null,
    notes: 'Title processing for recently approved intake - Honda Civic',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-16')
  },
  {
    id: 'title-4',
    vehicleId: 'vehicle-4',
    status: getTitleStatus(null), // 'pending' - no package
    location: 'Savannah Port Office',
    packageId: null,
    notes: 'Title received at port, awaiting export clearance completion',
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-08')
  },
  {
    id: 'title-5',
    vehicleId: 'vehicle-5',
    status: getTitleStatus('pkg-005'), // 'sent' based on pkg-005 status
    location: 'Atlantic Ocean - In Transit',
    packageId: 'pkg-005',
    notes: 'Title traveling with vehicle documentation',
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-09')
  },
  {
    id: 'title-6',
    vehicleId: 'vehicle-6',
    status: getTitleStatus('pkg-006'), // 'sent' based on pkg-006 status
    location: 'Hamburg Customs',
    packageId: 'pkg-006',
    notes: 'Title submitted to customs for clearance',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12')
  },

  // Dealer 2 vehicles (vehicle-7, vehicle-8)
  {
    id: 'title-7',
    vehicleId: 'vehicle-7',
    status: getTitleStatus(null), // 'pending' - no package
    location: 'Ground Transport Office',
    packageId: null,
    notes: 'Title ready for ground transport coordination',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-11')
  },
  {
    id: 'title-8',
    vehicleId: 'vehicle-8',
    status: getTitleStatus('pkg-008'), // 'sent' based on pkg-008 status
    location: 'Destination Port Customs',
    packageId: 'pkg-008',
    notes: 'Title forwarded to destination customs office',
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-12')
  },

  // Dealer 3 vehicles (vehicle-13 to vehicle-15)
  {
    id: 'title-13',
    vehicleId: 'vehicle-13',
    status: getTitleStatus('pkg-013'), // 'sent' based on pkg-013 status
    location: 'European Customs',
    packageId: 'pkg-013',
    notes: 'BMW M5 title processing through customs',
    createdAt: new Date('2024-03-09'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'title-14',
    vehicleId: 'vehicle-14',
    status: getTitleStatus('pkg-014'), // 'delivered' based on pkg-014 status
    location: 'Customer - Germany',
    packageId: 'pkg-014',
    notes: 'Audi RS7 title delivered to customer',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-28')
  },
  {
    id: 'title-15',
    vehicleId: 'vehicle-15',
    status: getTitleStatus('pkg-015'), // 'packed' based on pkg-015 status
    location: 'Ocean Freight',
    packageId: 'pkg-015',
    notes: 'Mercedes S-Class title secured for ocean transport',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-16')
  }
];