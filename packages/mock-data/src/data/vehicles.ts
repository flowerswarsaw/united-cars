import { Vehicle } from '../types';

export const vehicles: Vehicle[] = [
  // Admin org vehicles (for testing admin view)
  {
    id: 'vehicle-1',
    orgId: 'org-admin',
    vin: '1HGCM82633A123456',
    make: 'Honda',
    model: 'Accord',
    year: 2020,
    purchasePriceUSD: 15000,
    status: 'PURCHASED',
    currentStage: 'auction_purchased',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'vehicle-2',
    orgId: 'org-admin',
    vin: '2T1BURHE8JC123457',
    make: 'Toyota',
    model: 'Corolla',
    year: 2018,
    purchasePriceUSD: 12000,
    status: 'IN_TRANSIT',
    currentStage: 'towing',
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-05')
  },
  {
    id: 'vehicle-3',
    orgId: 'org-admin',
    vin: '3VWLL7AJ9BM053541',
    make: 'Volkswagen',
    model: 'Jetta',
    year: 2021,
    purchasePriceUSD: 18500,
    status: 'DELIVERED',
    currentStage: 'delivered',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  
  // Dealer 1 vehicles
  {
    id: 'vehicle-4',
    orgId: 'org-dealer-1',
    vin: '5YFBURHE8JP785241',
    make: 'Toyota',
    model: 'Camry',
    year: 2019,
    purchasePriceUSD: 22000,
    status: 'AT_PORT',
    currentStage: 'port_processing',
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-08')
  },
  {
    id: 'vehicle-5',
    orgId: 'org-dealer-1',
    vin: 'WBA8E9G59GNU18273',
    make: 'BMW',
    model: '328i',
    year: 2016,
    purchasePriceUSD: 25000,
    status: 'SHIPPED',
    currentStage: 'ocean_freight',
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-09')
  },
  {
    id: 'vehicle-6',
    orgId: 'org-dealer-1',
    vin: 'WAUFFAFL7BN021953',
    make: 'Audi',
    model: 'A4',
    year: 2022,
    purchasePriceUSD: 32000,
    status: 'PURCHASED',
    currentStage: 'auction_purchased',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10')
  },
  
  // Dealer 2 vehicles
  {
    id: 'vehicle-7',
    orgId: 'org-dealer-2',
    vin: '1C4RJFAG5FC123987',
    make: 'Jeep',
    model: 'Grand Cherokee',
    year: 2015,
    purchasePriceUSD: 19500,
    status: 'IN_TRANSIT',
    currentStage: 'title_processing',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-11')
  },
  {
    id: 'vehicle-8',
    orgId: 'org-dealer-2',
    vin: '5TDJKRFH4HS092837',
    make: 'Toyota',
    model: 'Highlander',
    year: 2017,
    purchasePriceUSD: 28000,
    status: 'AT_PORT',
    currentStage: 'customs_clearance',
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-12')
  },
  
  // Vehicles with various statuses for testing
  {
    id: 'vehicle-9',
    orgId: 'org-admin',
    vin: '1FTFW1ET5DFC48291',
    make: 'Ford',
    model: 'F-150',
    year: 2020,
    purchasePriceUSD: 35000,
    status: 'SOURCING',
    currentStage: 'auction_bidding',
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-11')
  },
  {
    id: 'vehicle-10',
    orgId: 'org-admin',
    vin: 'JM3KFBDM1J0392847',
    make: 'Mazda',
    model: 'CX-5',
    year: 2018,
    purchasePriceUSD: 21000,
    status: 'SHIPPED',
    currentStage: 'ocean_freight',
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-13')
  },
  {
    id: 'vehicle-11',
    orgId: 'org-admin',
    vin: 'KMHD84LF1HU283746',
    make: 'Hyundai',
    model: 'Sonata',
    year: 2019,
    purchasePriceUSD: 16500,
    status: 'DELIVERED',
    currentStage: 'delivered',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'vehicle-12',
    orgId: 'org-admin',
    vin: '2HGFC2F53JH579324',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    purchasePriceUSD: 23000,
    status: 'IN_TRANSIT',
    currentStage: 'port_departure',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-14')
  },
  
  // Luxury vehicles for variety
  {
    id: 'vehicle-13',
    orgId: 'org-dealer-3',
    vin: 'WBAJB9C55KB289472',
    make: 'BMW',
    model: 'M5',
    year: 2019,
    purchasePriceUSD: 65000,
    status: 'AT_PORT',
    currentStage: 'customs_clearance',
    createdAt: new Date('2024-03-09'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'vehicle-14',
    orgId: 'org-dealer-3',
    vin: 'WUAENAFG3HN003196',
    make: 'Audi',
    model: 'RS7',
    year: 2017,
    purchasePriceUSD: 72000,
    status: 'DELIVERED',
    currentStage: 'delivered',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-28')
  },
  {
    id: 'vehicle-15',
    orgId: 'org-dealer-3',
    vin: 'WDD2221821A329894',
    make: 'Mercedes-Benz',
    model: 'S-Class',
    year: 2020,
    purchasePriceUSD: 85000,
    status: 'SHIPPED',
    currentStage: 'ocean_freight',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-16')
  }
];