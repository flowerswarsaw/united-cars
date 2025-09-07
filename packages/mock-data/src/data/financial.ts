import { Invoice, PaymentIntent } from '../types';

export const invoices: Invoice[] = [
  // Admin org vehicles comprehensive billing
  {
    id: 'invoice-1',
    orgId: 'org-admin',
    number: 'INV-2024-001',
    status: 'PAID',
    currency: 'USD',
    issuedAt: new Date('2024-03-01'),
    dueDate: new Date('2024-04-01'),
    total: 17850,
    subtotal: 17000,
    vat: 850,
    notes: 'Complete logistics package - Honda Accord 2020 (VIN: 1HGCM82633A123456)',
    lines: [
      {
        id: 'line-1-1',
        description: 'Honda Accord 2020 - Vehicle Purchase',
        qty: 1,
        unitPrice: 15000,
        vehicleId: 'vehicle-1'
      },
      {
        id: 'line-1-2',
        description: 'Ground Transport - Copart to Port',
        qty: 1,
        unitPrice: 450,
        vehicleId: 'vehicle-1'
      },
      {
        id: 'line-1-3',
        description: 'Port Processing & Export Clearance',
        qty: 1,
        unitPrice: 350,
        vehicleId: 'vehicle-1'
      },
      {
        id: 'line-1-4',
        description: 'Title Processing & Documentation',
        qty: 1,
        unitPrice: 275,
        vehicleId: 'vehicle-1'
      },
      {
        id: 'line-1-5',
        description: 'Insurance Coverage (1%)',
        qty: 1,
        unitPrice: 150,
        vehicleId: 'vehicle-1'
      },
      {
        id: 'line-1-6',
        description: 'Administrative & Processing Fees',
        qty: 1,
        unitPrice: 775,
        vehicleId: 'vehicle-1'
      }
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-02')
  },
  {
    id: 'invoice-2',
    orgId: 'org-admin',
    number: 'INV-2024-002',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-02'),
    dueDate: new Date('2024-04-02'),
    total: 14280,
    subtotal: 13600,
    vat: 680,
    notes: 'Complete logistics package - Toyota Corolla 2018 (VIN: 2T1BURHE8JC123457)',
    lines: [
      {
        id: 'line-2-1',
        description: 'Toyota Corolla 2018 - Vehicle Purchase',
        qty: 1,
        unitPrice: 12000,
        vehicleId: 'vehicle-2'
      },
      {
        id: 'line-2-2',
        description: 'Ground Transport - IAA to Savannah Port',
        qty: 1,
        unitPrice: 520,
        vehicleId: 'vehicle-2'
      },
      {
        id: 'line-2-3',
        description: 'Ocean Shipping - Savannah to Europe',
        qty: 1,
        unitPrice: 680,
        vehicleId: 'vehicle-2'
      },
      {
        id: 'line-2-4',
        description: 'Title Processing & Packaging',
        qty: 1,
        unitPrice: 225,
        vehicleId: 'vehicle-2'
      },
      {
        id: 'line-2-5',
        description: 'Administrative & Handling Fees',
        qty: 1,
        unitPrice: 175,
        vehicleId: 'vehicle-2'
      }
    ],
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-05')
  },
  {
    id: 'invoice-3',
    orgId: 'org-admin',
    number: 'INV-2024-003',
    status: 'PAID',
    currency: 'USD',
    issuedAt: new Date('2024-02-15'),
    dueDate: new Date('2024-03-15'),
    total: 22040,
    subtotal: 21000,
    vat: 1040,
    notes: 'DELIVERED - Complete service package - VW Jetta 2021 (VIN: 3VWLL7AJ9BM053541)',
    lines: [
      {
        id: 'line-3-1',
        description: 'Volkswagen Jetta 2021 - Vehicle Purchase',
        qty: 1,
        unitPrice: 18500,
        vehicleId: 'vehicle-3'
      },
      {
        id: 'line-3-2',
        description: 'Full Logistics Chain - NY to Rotterdam',
        qty: 1,
        unitPrice: 1200,
        vehicleId: 'vehicle-3'
      },
      {
        id: 'line-3-3',
        description: 'Customs Clearance & Final Delivery',
        qty: 1,
        unitPrice: 650,
        vehicleId: 'vehicle-3'
      },
      {
        id: 'line-3-4',
        description: 'Title Delivery & Final Documentation',
        qty: 1,
        unitPrice: 350,
        vehicleId: 'vehicle-3'
      },
      {
        id: 'line-3-5',
        description: 'Complete Service Management Fee',
        qty: 1,
        unitPrice: 300,
        vehicleId: 'vehicle-3'
      }
    ],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'invoice-9',
    orgId: 'org-admin',
    number: 'INV-2024-009',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: null,
    dueDate: null,
    total: 39725,
    subtotal: 37850,
    vat: 1875,
    notes: 'SOURCING - Initial charges - Ford F-150 2020 (VIN: 1FTFW1ET5DFC48291)',
    lines: [
      {
        id: 'line-9-1',
        description: 'Ford F-150 2020 - Vehicle Purchase',
        qty: 1,
        unitPrice: 35000,
        vehicleId: 'vehicle-9'
      },
      {
        id: 'line-9-2',
        description: 'Auction Bidding & Acquisition Services',
        qty: 1,
        unitPrice: 875,
        vehicleId: 'vehicle-9'
      },
      {
        id: 'line-9-3',
        description: 'Initial Documentation & Processing',
        qty: 1,
        unitPrice: 450,
        vehicleId: 'vehicle-9'
      },
      {
        id: 'line-9-4',
        description: 'Logistics Planning & Coordination',
        qty: 1,
        unitPrice: 325,
        vehicleId: 'vehicle-9'
      },
      {
        id: 'line-9-5',
        description: 'Title Processing Setup',
        qty: 1,
        unitPrice: 200,
        vehicleId: 'vehicle-9'
      },
      {
        id: 'line-9-6',
        description: 'Administrative Setup Fee',
        qty: 1,
        unitPrice: 1000,
        vehicleId: 'vehicle-9'
      }
    ],
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-11')
  },
  {
    id: 'invoice-10',
    orgId: 'org-admin',
    number: 'INV-2024-010',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-07'),
    dueDate: new Date('2024-04-07'),
    total: 24570,
    subtotal: 23400,
    vat: 1170,
    notes: 'OCEAN SHIPPING - Mazda CX-5 2018 (VIN: JM3KFBDM1J0392847)',
    lines: [
      {
        id: 'line-10-1',
        description: 'Mazda CX-5 2018 - Vehicle Purchase',
        qty: 1,
        unitPrice: 21000,
        vehicleId: 'vehicle-10'
      },
      {
        id: 'line-10-2',
        description: 'Ground Transport to NY Port',
        qty: 1,
        unitPrice: 580,
        vehicleId: 'vehicle-10'
      },
      {
        id: 'line-10-3',
        description: 'Port Processing & Container Loading',
        qty: 1,
        unitPrice: 420,
        vehicleId: 'vehicle-10'
      },
      {
        id: 'line-10-4',
        description: 'Ocean Freight - Trans Atlantic',
        qty: 1,
        unitPrice: 750,
        vehicleId: 'vehicle-10'
      },
      {
        id: 'line-10-5',
        description: 'Title Shipping & Documentation',
        qty: 1,
        unitPrice: 275,
        vehicleId: 'vehicle-10'
      },
      {
        id: 'line-10-6',
        description: 'Insurance & Risk Management',
        qty: 1,
        unitPrice: 375,
        vehicleId: 'vehicle-10'
      }
    ],
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-13')
  },
  {
    id: 'invoice-11',
    orgId: 'org-admin',
    number: 'INV-2024-011',
    status: 'PAID',
    currency: 'USD',
    issuedAt: new Date('2024-02-20'),
    dueDate: new Date('2024-03-20'),
    total: 19635,
    subtotal: 18700,
    vat: 935,
    notes: 'DELIVERED - Complete service - Hyundai Sonata 2019 (VIN: KMHD84LF1HU283746)',
    lines: [
      {
        id: 'line-11-1',
        description: 'Hyundai Sonata 2019 - Vehicle Purchase',
        qty: 1,
        unitPrice: 16500,
        vehicleId: 'vehicle-11'
      },
      {
        id: 'line-11-2',
        description: 'Complete Logistics Package',
        qty: 1,
        unitPrice: 1250,
        vehicleId: 'vehicle-11'
      },
      {
        id: 'line-11-3',
        description: 'Final Delivery Services',
        qty: 1,
        unitPrice: 450,
        vehicleId: 'vehicle-11'
      },
      {
        id: 'line-11-4',
        description: 'Title & Documentation Completion',
        qty: 1,
        unitPrice: 325,
        vehicleId: 'vehicle-11'
      },
      {
        id: 'line-11-5',
        description: 'Service Management & Support',
        qty: 1,
        unitPrice: 175,
        vehicleId: 'vehicle-11'
      }
    ],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'invoice-12',
    orgId: 'org-admin',
    number: 'INV-2024-012',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-08'),
    dueDate: new Date('2024-04-08'),
    total: 26565,
    subtotal: 25300,
    vat: 1265,
    notes: 'OCEAN SHIPPING - Honda Civic 2021 (VIN: 2HGFC2F53JH579324)',
    lines: [
      {
        id: 'line-12-1',
        description: 'Honda Civic 2021 - Vehicle Purchase',
        qty: 1,
        unitPrice: 23000,
        vehicleId: 'vehicle-12'
      },
      {
        id: 'line-12-2',
        description: 'Port Loading & Vessel Coordination',
        qty: 1,
        unitPrice: 650,
        vehicleId: 'vehicle-12'
      },
      {
        id: 'line-12-3',
        description: 'Ocean Transit & Monitoring',
        qty: 1,
        unitPrice: 580,
        vehicleId: 'vehicle-12'
      },
      {
        id: 'line-12-4',
        description: 'Title Processing & Packaging',
        qty: 1,
        unitPrice: 320,
        vehicleId: 'vehicle-12'
      },
      {
        id: 'line-12-5',
        description: 'Logistics Coordination Fee',
        qty: 1,
        unitPrice: 750,
        vehicleId: 'vehicle-12'
      }
    ],
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-14')
  },

  // Dealer 1 vehicles comprehensive billing  
  {
    id: 'invoice-101',
    orgId: 'org-dealer-1',
    number: 'INV-2024-101',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-15'),
    dueDate: new Date('2024-04-15'),
    total: 10710,
    subtotal: 10200,
    vat: 510,
    notes: 'SOURCING - Honda Civic 2018 from approved intake (VIN: 1HGBH41JXMN109186)',
    lines: [
      {
        id: 'line-101-1',
        description: 'Honda Civic 2018 - Vehicle Purchase',
        qty: 1,
        unitPrice: 8500,
        vehicleId: 'vehicle-from-intake-1'
      },
      {
        id: 'line-101-2',
        description: 'Copart Auction Services & Coordination',
        qty: 1,
        unitPrice: 425,
        vehicleId: 'vehicle-from-intake-1'
      },
      {
        id: 'line-101-3',
        description: 'Initial Documentation & Title Setup',
        qty: 1,
        unitPrice: 350,
        vehicleId: 'vehicle-from-intake-1'
      },
      {
        id: 'line-101-4',
        description: 'Payment Processing & Verification',
        qty: 1,
        unitPrice: 275,
        vehicleId: 'vehicle-from-intake-1'
      },
      {
        id: 'line-101-5',
        description: 'Intake Approval & Processing Fee',
        qty: 1,
        unitPrice: 650,
        vehicleId: 'vehicle-from-intake-1'
      }
    ],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-16')
  },
  {
    id: 'invoice-4',
    orgId: 'org-dealer-1',
    number: 'INV-2024-102',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-03'),
    dueDate: new Date('2024-04-03'),
    total: 26180,
    subtotal: 24940,
    vat: 1240,
    notes: 'PORT PROCESSING - Toyota Camry 2019 (VIN: 5YFBURHE8JP785241)',
    lines: [
      {
        id: 'line-4-1',
        description: 'Toyota Camry 2019 - Vehicle Purchase',
        qty: 1,
        unitPrice: 22000,
        vehicleId: 'vehicle-4'
      },
      {
        id: 'line-4-2',
        description: 'Ground Transport - Manheim to Savannah',
        qty: 1,
        unitPrice: 680,
        vehicleId: 'vehicle-4'
      },
      {
        id: 'line-4-3',
        description: 'Port Warehouse Storage & Processing',
        qty: 1,
        unitPrice: 420,
        vehicleId: 'vehicle-4'
      },
      {
        id: 'line-4-4',
        description: 'Export Documentation & Clearance',
        qty: 1,
        unitPrice: 590,
        vehicleId: 'vehicle-4'
      },
      {
        id: 'line-4-5',
        description: 'Title Processing & Office Handling',
        qty: 1,
        unitPrice: 325,
        vehicleId: 'vehicle-4'
      },
      {
        id: 'line-4-6',
        description: 'Port Processing Management Fee',
        qty: 1,
        unitPrice: 925,
        vehicleId: 'vehicle-4'
      }
    ],
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-08')
  },
  {
    id: 'invoice-5',
    orgId: 'org-dealer-1',
    number: 'INV-2024-103',
    status: 'PAID',
    currency: 'USD',
    issuedAt: new Date('2024-03-04'),
    dueDate: new Date('2024-04-04'),
    total: 29750,
    subtotal: 28350,
    vat: 1400,
    notes: 'OCEAN SHIPPING - BMW 328i 2016 (VIN: WBA8E9G59GNU18273)',
    lines: [
      {
        id: 'line-5-1',
        description: 'BMW 328i 2016 - Vehicle Purchase',
        qty: 1,
        unitPrice: 25000,
        vehicleId: 'vehicle-5'
      },
      {
        id: 'line-5-2',
        description: 'Port Loading & Container Services',
        qty: 1,
        unitPrice: 750,
        vehicleId: 'vehicle-5'
      },
      {
        id: 'line-5-3',
        description: 'Ocean Freight - Atlantic Crossing',
        qty: 1,
        unitPrice: 980,
        vehicleId: 'vehicle-5'
      },
      {
        id: 'line-5-4',
        description: 'Marine Insurance & Protection',
        qty: 1,
        unitPrice: 500,
        vehicleId: 'vehicle-5'
      },
      {
        id: 'line-5-5',
        description: 'Title Secured Shipping',
        qty: 1,
        unitPrice: 375,
        vehicleId: 'vehicle-5'
      },
      {
        id: 'line-5-6',
        description: 'Ocean Transit Management',
        qty: 1,
        unitPrice: 745,
        vehicleId: 'vehicle-5'
      }
    ],
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-09')
  },
  {
    id: 'invoice-6',
    orgId: 'org-dealer-1',
    number: 'INV-2024-104',
    status: 'OVERDUE',
    currency: 'USD',
    issuedAt: new Date('2024-03-10'),
    dueDate: new Date('2024-03-25'),
    total: 38080,
    subtotal: 36270,
    vat: 1810,
    notes: 'DESTINATION PORT - Audi A4 2022 (VIN: WAUFFAFL7BN021953)',
    lines: [
      {
        id: 'line-6-1',
        description: 'Audi A4 2022 - Vehicle Purchase',
        qty: 1,
        unitPrice: 32000,
        vehicleId: 'vehicle-6'
      },
      {
        id: 'line-6-2',
        description: 'Hamburg Port Arrival & Unloading',
        qty: 1,
        unitPrice: 850,
        vehicleId: 'vehicle-6'
      },
      {
        id: 'line-6-3',
        description: 'European Customs Clearance',
        qty: 1,
        unitPrice: 1250,
        vehicleId: 'vehicle-6'
      },
      {
        id: 'line-6-4',
        description: 'Local Transport & Handling',
        qty: 1,
        unitPrice: 680,
        vehicleId: 'vehicle-6'
      },
      {
        id: 'line-6-5',
        description: 'Title Customs Processing',
        qty: 1,
        unitPrice: 420,
        vehicleId: 'vehicle-6'
      },
      {
        id: 'line-6-6',
        description: 'Destination Services Management',
        qty: 1,
        unitPrice: 1070,
        vehicleId: 'vehicle-6'
      }
    ],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12')
  },

  // Dealer 2 vehicles comprehensive billing
  {
    id: 'invoice-7',
    orgId: 'org-dealer-2',
    number: 'INV-2024-201',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: null,
    dueDate: null,
    total: 23310,
    subtotal: 22200,
    vat: 1110,
    notes: 'GROUND TRANSPORT - Jeep Grand Cherokee 2015 (VIN: 1C4RJFAG5FC123987)',
    lines: [
      {
        id: 'line-7-1',
        description: 'Jeep Grand Cherokee 2015 - Vehicle Purchase',
        qty: 1,
        unitPrice: 19500,
        vehicleId: 'vehicle-7'
      },
      {
        id: 'line-7-2',
        description: 'Carrier Assignment & Coordination',
        qty: 1,
        unitPrice: 450,
        vehicleId: 'vehicle-7'
      },
      {
        id: 'line-7-3',
        description: 'Ground Transport Services',
        qty: 1,
        unitPrice: 850,
        vehicleId: 'vehicle-7'
      },
      {
        id: 'line-7-4',
        description: 'Route Planning & Monitoring',
        qty: 1,
        unitPrice: 320,
        vehicleId: 'vehicle-7'
      },
      {
        id: 'line-7-5',
        description: 'Title Processing & Transport Prep',
        qty: 1,
        unitPrice: 275,
        vehicleId: 'vehicle-7'
      },
      {
        id: 'line-7-6',
        description: 'Ground Transport Management',
        qty: 1,
        unitPrice: 805,
        vehicleId: 'vehicle-7'
      }
    ],
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-11')
  },
  {
    id: 'invoice-8',
    orgId: 'org-dealer-2',
    number: 'INV-2024-202',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-06'),
    dueDate: new Date('2024-04-06'),
    total: 33320,
    subtotal: 31740,
    vat: 1580,
    notes: 'DESTINATION PORT - Toyota Highlander 2017 (VIN: 5TDJKRFH4HS092837)',
    lines: [
      {
        id: 'line-8-1',
        description: 'Toyota Highlander 2017 - Vehicle Purchase',
        qty: 1,
        unitPrice: 28000,
        vehicleId: 'vehicle-8'
      },
      {
        id: 'line-8-2',
        description: 'Port Arrival & Vehicle Processing',
        qty: 1,
        unitPrice: 720,
        vehicleId: 'vehicle-8'
      },
      {
        id: 'line-8-3',
        description: 'Customs Documentation & Clearance',
        qty: 1,
        unitPrice: 980,
        vehicleId: 'vehicle-8'
      },
      {
        id: 'line-8-4',
        description: 'Port Storage & Handling',
        qty: 1,
        unitPrice: 450,
        vehicleId: 'vehicle-8'
      },
      {
        id: 'line-8-5',
        description: 'Title Forwarding Services',
        qty: 1,
        unitPrice: 380,
        vehicleId: 'vehicle-8'
      },
      {
        id: 'line-8-6',
        description: 'Destination Port Management',
        qty: 1,
        unitPrice: 1210,
        vehicleId: 'vehicle-8'
      }
    ],
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-12')
  },

  // Dealer 3 vehicles comprehensive billing (luxury vehicles - higher fees)
  {
    id: 'invoice-13',
    orgId: 'org-dealer-3',
    number: 'INV-2024-301',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-09'),
    dueDate: new Date('2024-04-09'),
    total: 77350,
    subtotal: 73670,
    vat: 3680,
    notes: 'DESTINATION PORT - BMW M5 2019 (VIN: WBAJB9C55KB289472) - Premium Service',
    lines: [
      {
        id: 'line-13-1',
        description: 'BMW M5 2019 - Vehicle Purchase',
        qty: 1,
        unitPrice: 65000,
        vehicleId: 'vehicle-13'
      },
      {
        id: 'line-13-2',
        description: 'Premium Customs Processing',
        qty: 1,
        unitPrice: 1850,
        vehicleId: 'vehicle-13'
      },
      {
        id: 'line-13-3',
        description: 'White Glove Vehicle Handling',
        qty: 1,
        unitPrice: 1200,
        vehicleId: 'vehicle-13'
      },
      {
        id: 'line-13-4',
        description: 'Premium Storage & Climate Control',
        qty: 1,
        unitPrice: 950,
        vehicleId: 'vehicle-13'
      },
      {
        id: 'line-13-5',
        description: 'Expedited Title Processing',
        qty: 1,
        unitPrice: 720,
        vehicleId: 'vehicle-13'
      },
      {
        id: 'line-13-6',
        description: 'Luxury Vehicle Management Premium',
        qty: 1,
        unitPrice: 3950,
        vehicleId: 'vehicle-13'
      }
    ],
    createdAt: new Date('2024-03-09'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'invoice-14',
    orgId: 'org-dealer-3',
    number: 'INV-2024-302',
    status: 'PAID',
    currency: 'USD',
    issuedAt: new Date('2024-02-10'),
    dueDate: new Date('2024-03-10'),
    total: 85680,
    subtotal: 81600,
    vat: 4080,
    notes: 'DELIVERED - Premium Complete Service - Audi RS7 2017 (VIN: WUAENAFG3HN003196)',
    lines: [
      {
        id: 'line-14-1',
        description: 'Audi RS7 2017 - Vehicle Purchase',
        qty: 1,
        unitPrice: 72000,
        vehicleId: 'vehicle-14'
      },
      {
        id: 'line-14-2',
        description: 'Full Premium Logistics Chain',
        qty: 1,
        unitPrice: 3500,
        vehicleId: 'vehicle-14'
      },
      {
        id: 'line-14-3',
        description: 'VIP Delivery Service',
        qty: 1,
        unitPrice: 1800,
        vehicleId: 'vehicle-14'
      },
      {
        id: 'line-14-4',
        description: 'Complete Documentation Package',
        qty: 1,
        unitPrice: 950,
        vehicleId: 'vehicle-14'
      },
      {
        id: 'line-14-5',
        description: 'Concierge Service Management',
        qty: 1,
        unitPrice: 1250,
        vehicleId: 'vehicle-14'
      },
      {
        id: 'line-14-6',
        description: 'Luxury Vehicle Premium Service',
        qty: 1,
        unitPrice: 2100,
        vehicleId: 'vehicle-14'
      }
    ],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-28')
  },
  {
    id: 'invoice-15',
    orgId: 'org-dealer-3',
    number: 'INV-2024-303',
    status: 'PENDING',
    currency: 'USD',
    issuedAt: new Date('2024-03-12'),
    dueDate: new Date('2024-04-12'),
    total: 101150,
    subtotal: 96330,
    vat: 4820,
    notes: 'OCEAN SHIPPING - Mercedes S-Class 2020 (VIN: WDD2221821A329894) - Ultra Premium',
    lines: [
      {
        id: 'line-15-1',
        description: 'Mercedes-Benz S-Class 2020 - Vehicle Purchase',
        qty: 1,
        unitPrice: 85000,
        vehicleId: 'vehicle-15'
      },
      {
        id: 'line-15-2',
        description: 'Ultra Premium Ocean Transit',
        qty: 1,
        unitPrice: 2850,
        vehicleId: 'vehicle-15'
      },
      {
        id: 'line-15-3',
        description: 'Climate Controlled Container',
        qty: 1,
        unitPrice: 1680,
        vehicleId: 'vehicle-15'
      },
      {
        id: 'line-15-4',
        description: 'Premium Insurance Coverage (2%)',
        qty: 1,
        unitPrice: 1700,
        vehicleId: 'vehicle-15'
      },
      {
        id: 'line-15-5',
        description: 'Secured Title Courier Service',
        qty: 1,
        unitPrice: 950,
        vehicleId: 'vehicle-15'
      },
      {
        id: 'line-15-6',
        description: 'Ultra Premium Service Management',
        qty: 1,
        unitPrice: 4150,
        vehicleId: 'vehicle-15'
      }
    ],
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-16')
  }
];

export const paymentIntents: PaymentIntent[] = [
  {
    id: 'payment-1',
    orgId: 'org-dealer-1',
    invoiceId: 'invoice-2',
    method: 'bank_transfer',
    amount: 23100,
    currency: 'USD',
    status: 'APPROVED',
    proofUrl: '/uploads/payment-proofs/wire-001.pdf',
    ref: 'TXN-2024030501',
    senderName: 'Dealer One LLC',
    transferDate: '2024-03-05',
    allocations: '{"invoice-2": 23100}',
    totalAllocated: 23100,
    remainingAmount: 0,
    balanceChange: 0,
    declineReason: null,
    reviewedBy: 'user-admin-1',
    reviewedAt: new Date('2024-03-05T14:30:00'),
    createdByUserId: 'user-dealer-1',
    createdAt: new Date('2024-03-05T10:15:00'),
    updatedAt: new Date('2024-03-05T14:30:00'),
    version: 1
  },
  {
    id: 'payment-2',
    orgId: 'org-admin',
    invoiceId: 'invoice-1',
    method: 'balance',
    amount: 15750,
    currency: 'USD',
    status: 'APPROVED',
    proofUrl: null,
    ref: null,
    senderName: null,
    transferDate: null,
    allocations: '{"invoice-1": 15750}',
    totalAllocated: 15750,
    remainingAmount: 0,
    balanceChange: -15750,
    declineReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdByUserId: 'user-admin-1',
    createdAt: new Date('2024-03-10T09:20:00'),
    updatedAt: new Date('2024-03-10T09:20:00'),
    version: 0
  },
  {
    id: 'payment-3',
    orgId: 'org-dealer-3',
    invoiceId: null,
    method: 'bank_transfer',
    amount: 12000,
    currency: 'USD',
    status: 'PENDING',
    proofUrl: '/uploads/payment-proofs/pending-001.pdf',
    ref: 'TXN-2024031201',
    senderName: 'Auto Dealer Group Inc',
    transferDate: '2024-03-12',
    allocations: '{"invoice-5": 10000}',
    totalAllocated: 10000,
    remainingAmount: 2000,
    balanceChange: 2000,
    declineReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdByUserId: 'user-dealer-3',
    createdAt: new Date('2024-03-12T16:45:00'),
    updatedAt: new Date('2024-03-12T16:45:00'),
    version: 1
  },
  {
    id: 'payment-4',
    orgId: 'org-dealer-2',
    invoiceId: 'invoice-3',
    method: 'bank_transfer',
    amount: 8500,
    currency: 'USD',
    status: 'DECLINED',
    proofUrl: '/uploads/payment-proofs/declined-001.pdf',
    ref: 'TXN-2024031101',
    senderName: 'Best Cars LLC',
    transferDate: '2024-03-11',
    allocations: '{"invoice-3": 8500}',
    totalAllocated: 8500,
    remainingAmount: 0,
    balanceChange: 0,
    declineReason: 'Insufficient documentation - bank statement does not match transfer date',
    reviewedBy: 'user-admin-1',
    reviewedAt: new Date('2024-03-11T15:20:00'),
    createdByUserId: 'user-dealer-2',
    createdAt: new Date('2024-03-11T11:30:00'),
    updatedAt: new Date('2024-03-11T15:20:00'),
    version: 1
  },
  {
    id: 'payment-5',
    orgId: 'org-dealer-1',
    invoiceId: null,
    method: 'bank_transfer',
    amount: 5000,
    currency: 'USD',
    status: 'CANCELED',
    proofUrl: '/uploads/payment-proofs/canceled-001.pdf',
    ref: 'TXN-2024031001',
    senderName: 'Dealer One LLC',
    transferDate: '2024-03-10',
    allocations: '{}',
    totalAllocated: 0,
    remainingAmount: 5000,
    balanceChange: 5000,
    declineReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdByUserId: 'user-dealer-1',
    createdAt: new Date('2024-03-10T14:15:00'),
    updatedAt: new Date('2024-03-10T16:45:00'),
    version: 1
  },
  {
    id: 'payment-6',
    orgId: 'org-dealer-2',
    invoiceId: null,
    method: 'bank_transfer',
    amount: 25000,
    currency: 'USD',
    status: 'PENDING',
    proofUrl: '/uploads/payment-proofs/pending-002.pdf',
    ref: 'TXN-2024031401',
    senderName: 'Best Cars LLC',
    transferDate: '2024-03-14',
    allocations: '{"invoice-6": 15000, "invoice-7": 8000}',
    totalAllocated: 23000,
    remainingAmount: 2000,
    balanceChange: 2000,
    declineReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdByUserId: 'user-dealer-2',
    createdAt: new Date('2024-03-14T10:30:00'),
    updatedAt: new Date('2024-03-14T10:30:00'),
    version: 1
  },
  {
    id: 'payment-7',
    orgId: 'org-dealer-3',
    invoiceId: 'invoice-8',
    method: 'credit_card',
    amount: 3200,
    currency: 'USD',
    status: 'DECLINED',
    proofUrl: null,
    ref: 'CC-2024031501',
    senderName: null,
    transferDate: null,
    allocations: '{"invoice-8": 3200}',
    totalAllocated: 3200,
    remainingAmount: 0,
    balanceChange: 0,
    declineReason: 'Credit card payment failed - card declined by issuing bank. Please try alternative payment method.',
    reviewedBy: 'user-admin-2',
    reviewedAt: new Date('2024-03-15T09:45:00'),
    createdByUserId: 'user-dealer-3',
    createdAt: new Date('2024-03-15T08:15:00'),
    updatedAt: new Date('2024-03-15T09:45:00'),
    version: 1
  },
  {
    id: 'payment-8',
    orgId: 'org-dealer-1',
    invoiceId: null,
    method: 'balance',
    amount: 18750,
    currency: 'USD',
    status: 'APPROVED',
    proofUrl: null,
    ref: null,
    senderName: null,
    transferDate: null,
    allocations: '{"invoice-9": 12000, "invoice-10": 6750}',
    totalAllocated: 18750,
    remainingAmount: 0,
    balanceChange: -18750,
    declineReason: null,
    reviewedBy: 'user-admin-1',
    reviewedAt: new Date('2024-03-16T11:20:00'),
    createdByUserId: 'user-dealer-1',
    createdAt: new Date('2024-03-16T10:45:00'),
    updatedAt: new Date('2024-03-16T11:20:00'),
    version: 1
  },
  {
    id: 'payment-9',
    orgId: 'org-dealer-4',
    invoiceId: null,
    method: 'bank_transfer',
    amount: 7500,
    currency: 'USD',
    status: 'PENDING',
    proofUrl: '/uploads/payment-proofs/pending-003.pdf',
    ref: 'TXN-2024031701',
    senderName: 'Premier Auto Sales',
    transferDate: '2024-03-17',
    allocations: '{}',
    totalAllocated: 0,
    remainingAmount: 7500,
    balanceChange: 7500,
    declineReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdByUserId: 'user-dealer-4',
    createdAt: new Date('2024-03-17T15:30:00'),
    updatedAt: new Date('2024-03-17T15:30:00'),
    version: 1
  }
];