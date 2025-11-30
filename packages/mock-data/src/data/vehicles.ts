import { Vehicle } from '../types';

export const vehicles: Vehicle[] = [
  // Admin org vehicles (for testing admin view)
  {
    id: 'vehicle-1',
    orgId: 'united-cars',
    vin: '1HGCM82633A123456',
    make: 'Honda',
    model: 'Accord',
    year: 2020,
    purchasePriceUSD: 15000,
    status: 'PICKUP',
    currentStage: 'pickup_confirmed',
    statusHistory: [
      {
        id: 'status-1-1',
        status: 'SOURCING',
        stage: 'auction_won',
        updatedAt: new Date('2024-03-01'),
        location: 'Copart Dallas'
      },
      {
        id: 'status-1-2',
        status: 'PICKUP',
        stage: 'pickup_confirmed',
        updatedAt: new Date('2024-03-02'),
        location: 'Copart Dallas'
      }
    ],
    estimatedDates: {
      pickupDate: new Date('2024-03-03'),
      portArrivalDate: new Date('2024-03-07'),
      vesselDepartureDate: new Date('2024-03-15')
    },
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-02')
  },
  {
    id: 'vehicle-2',
    orgId: 'united-cars',
    vin: '2T1BURHE8JC123457',
    make: 'Toyota',
    model: 'Corolla',
    year: 2018,
    purchasePriceUSD: 12000,
    status: 'GROUND_TRANSPORT',
    currentStage: 'in_transit_to_port',
    statusHistory: [
      {
        id: 'status-2-1',
        status: 'SOURCING',
        stage: 'auction_won',
        updatedAt: new Date('2024-03-02'),
        location: 'IAA Atlanta'
      },
      {
        id: 'status-2-2',
        status: 'PICKUP',
        stage: 'picked_up',
        updatedAt: new Date('2024-03-04'),
        location: 'IAA Atlanta'
      },
      {
        id: 'status-2-3',
        status: 'GROUND_TRANSPORT',
        stage: 'in_transit_to_port',
        updatedAt: new Date('2024-03-05'),
        location: 'En route to Savannah Port'
      }
    ],
    estimatedDates: {
      pickupDate: new Date('2024-03-04'),
      portArrivalDate: new Date('2024-03-06'),
      vesselDepartureDate: new Date('2024-03-12')
    },
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-05')
  },
  {
    id: 'vehicle-3',
    orgId: 'united-cars',
    vin: '3VWLL7AJ9BM053541',
    make: 'Volkswagen',
    model: 'Jetta',
    year: 2021,
    purchasePriceUSD: 18500,
    status: 'DELIVERED',
    currentStage: 'delivered_to_customer',
    statusHistory: [
      {
        id: 'status-3-1',
        status: 'SOURCING',
        stage: 'auction_won',
        updatedAt: new Date('2024-02-15'),
        location: 'Manheim New York'
      },
      {
        id: 'status-3-2',
        status: 'OCEAN_SHIPPING',
        stage: 'vessel_departed',
        updatedAt: new Date('2024-02-25'),
        location: 'NY Port'
      },
      {
        id: 'status-3-3',
        status: 'DESTINATION_PORT',
        stage: 'vessel_arrived',
        updatedAt: new Date('2024-03-08'),
        location: 'Rotterdam Port'
      },
      {
        id: 'status-3-4',
        status: 'DELIVERED',
        stage: 'delivered_to_customer',
        updatedAt: new Date('2024-03-10'),
        location: 'Amsterdam'
      }
    ],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  
  // Dealer 1 vehicles
  {
    id: 'vehicle-from-intake-1',
    orgId: 'org-dealer-1',
    vin: '1HGBH41JXMN109186', // Honda Civic from approved intake-1
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    purchasePriceUSD: 8500,
    status: 'SOURCING',
    currentStage: 'documentation_pending',
    statusHistory: [
      {
        id: 'status-honda-1',
        status: 'SOURCING',
        stage: 'auction_won',
        updatedAt: new Date('2024-03-14'),
        location: 'Copart Dallas',
        notes: 'Intake approved by admin'
      },
      {
        id: 'status-honda-2',
        status: 'SOURCING',
        stage: 'payment_processing',
        updatedAt: new Date('2024-03-15'),
        location: 'Copart Dallas',
        notes: 'Payment confirmation verified'
      },
      {
        id: 'status-honda-3',
        status: 'SOURCING',
        stage: 'documentation_pending',
        updatedAt: new Date('2024-03-16'),
        location: 'Copart Dallas',
        notes: 'Waiting for title and documentation'
      }
    ],
    estimatedDates: {
      pickupDate: new Date('2024-03-18'),
      portArrivalDate: new Date('2024-03-22'),
      vesselDepartureDate: new Date('2024-03-28'),
      destinationArrivalDate: new Date('2024-04-15'),
      deliveryDate: new Date('2024-04-18')
    },
    createdAt: new Date('2024-03-15'), // Created after intake approval
    updatedAt: new Date('2024-03-16')
  },
  {
    id: 'vehicle-4',
    orgId: 'org-dealer-1',
    vin: '5YFBURHE8JP785241',
    make: 'Toyota',
    model: 'Camry',
    year: 2019,
    purchasePriceUSD: 22000,
    status: 'PORT_PROCESSING',
    currentStage: 'export_clearance',
    statusHistory: [
      {
        id: 'status-4-1',
        status: 'PICKUP',
        stage: 'picked_up',
        updatedAt: new Date('2024-03-03'),
        location: 'Manheim Atlanta'
      },
      {
        id: 'status-4-2',
        status: 'GROUND_TRANSPORT',
        stage: 'arrived_at_warehouse',
        updatedAt: new Date('2024-03-05'),
        location: 'Savannah Port Warehouse'
      },
      {
        id: 'status-4-3',
        status: 'PORT_PROCESSING',
        stage: 'export_clearance',
        updatedAt: new Date('2024-03-08'),
        location: 'Savannah Port'
      }
    ],
    estimatedDates: {
      vesselDepartureDate: new Date('2024-03-12'),
      destinationArrivalDate: new Date('2024-04-05'),
      deliveryDate: new Date('2024-04-08')
    },
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
    status: 'OCEAN_SHIPPING',
    currentStage: 'in_transit_ocean',
    statusHistory: [
      {
        id: 'status-5-1',
        status: 'PORT_PROCESSING',
        stage: 'loaded_on_vessel',
        updatedAt: new Date('2024-03-04'),
        location: 'NY Port'
      },
      {
        id: 'status-5-2',
        status: 'OCEAN_SHIPPING',
        stage: 'vessel_departed',
        updatedAt: new Date('2024-03-06'),
        location: 'Atlantic Ocean'
      },
      {
        id: 'status-5-3',
        status: 'OCEAN_SHIPPING',
        stage: 'in_transit_ocean',
        updatedAt: new Date('2024-03-09'),
        location: 'Mid-Atlantic'
      }
    ],
    estimatedDates: {
      destinationArrivalDate: new Date('2024-03-18'),
      deliveryDate: new Date('2024-03-22')
    },
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
    status: 'DESTINATION_PORT',
    currentStage: 'customs_clearance',
    statusHistory: [
      {
        id: 'status-6-1',
        status: 'OCEAN_SHIPPING',
        stage: 'vessel_arriving',
        updatedAt: new Date('2024-03-08'),
        location: 'Approaching Hamburg Port'
      },
      {
        id: 'status-6-2',
        status: 'DESTINATION_PORT',
        stage: 'vessel_arrived',
        updatedAt: new Date('2024-03-10'),
        location: 'Hamburg Port'
      },
      {
        id: 'status-6-3',
        status: 'DESTINATION_PORT',
        stage: 'customs_clearance',
        updatedAt: new Date('2024-03-12'),
        location: 'Hamburg Customs'
      }
    ],
    estimatedDates: {
      deliveryDate: new Date('2024-03-15')
    },
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12')
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
    status: 'GROUND_TRANSPORT',
    currentStage: 'carrier_assigned',
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
    status: 'DESTINATION_PORT',
    currentStage: 'customs_clearance',
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-12')
  },
  
  // Vehicles with various statuses for testing
  {
    id: 'vehicle-9',
    orgId: 'united-cars',
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
    orgId: 'united-cars',
    vin: 'JM3KFBDM1J0392847',
    make: 'Mazda',
    model: 'CX-5',
    year: 2018,
    purchasePriceUSD: 21000,
    status: 'OCEAN_SHIPPING',
    currentStage: 'vessel_departed',
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-13')
  },
  {
    id: 'vehicle-11',
    orgId: 'united-cars',
    vin: 'KMHD84LF1HU283746',
    make: 'Hyundai',
    model: 'Sonata',
    year: 2019,
    purchasePriceUSD: 16500,
    status: 'DELIVERED',
    currentStage: 'delivered_to_customer',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'vehicle-12',
    orgId: 'united-cars',
    vin: '2HGFC2F53JH579324',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    purchasePriceUSD: 23000,
    status: 'OCEAN_SHIPPING',
    currentStage: 'loaded_on_vessel',
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
    status: 'DESTINATION_PORT',
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
    currentStage: 'delivered_to_customer',
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
    status: 'OCEAN_SHIPPING',
    currentStage: 'in_transit_ocean',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-16')
  }
];