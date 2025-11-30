import {
  EnhancedOrganisation,
  EnhancedContact,
  EnhancedLead,
  EnhancedDeal,
  EnhancedPipeline,
  EnhancedStage,
  EnhancedTask,
  ContactMethod,
  SocialMediaLink,
  CustomField,
  Activity,
    DealStatus,
  LeadStatus,
  LeadSource,
  TaskStatus,
  TaskPriority,
  ContactMethodType,
  SocialPlatform,
  ActivityType,
  CustomFieldType,
  UserRole,
  OrganisationRelationType,
  // Factory functions
  makeOrganisation,
  makeContact,
  makeLead,
  makeDeal,
  makePipeline,
  makeStage,
  makeTask,
  makeContactMethod,
  makeActivity,
  makeCustomFieldDef,
  makeCustomFieldValue,
  makeDealCurrentStage,
  makeDealStageHistory,
  EntityType
} from '@united-cars/crm-core';
import {
  EnhancedOrganisationRepository,
  EnhancedContactRepository,
  EnhancedLeadRepository,
  EnhancedDealRepository,
  EnhancedPipelineRepository,
  EnhancedTaskRepository
} from './repositories';
import { EnhancedPersistenceManager } from './persistence/enhanced-persistence';
import { UniquenessManager } from '@united-cars/crm-core/src/uniqueness';
import { HistoryLogger } from '@united-cars/crm-core/src/history';
import dealsData from './deals-seed';
import { TEST_USERS } from './enhanced-seeds';

// Mock tenant ID for all seed data (matches platform orgId)
const DEFAULT_TENANT = 'united-cars';

// Seed data with organization types
const organisations = [
  // DEALER Organizations
  makeOrganisation({
    id: 'org_1',
    name: 'AutoMax Dealership',
    companyId: 'COMP-001',
    type: 'DEALER' as any,
    contactMethods: [
      {
        id: 'cm_1_1',
        type: ContactMethodType.EMAIL,
        value: 'info@automax.com',
        isPrimary: true,
        label: 'Main Office'
      },
      {
        id: 'cm_1_2',
        type: ContactMethodType.EMAIL,
        value: 'sales@automax.com',
        isPrimary: false,
        label: 'Sales Department'
      },
      {
        id: 'cm_1_3',
        type: ContactMethodType.PHONE,
        value: '+15550100',
        isPrimary: true,
        label: 'Main Office'
      },
      {
        id: 'cm_1_4',
        type: ContactMethodType.PHONE,
        value: '+15550199',
        isPrimary: false,
        label: 'Emergency Line'
      },
      {
        id: 'cm_1_5',
        type: ContactMethodType.PHONE,
        value: '+15550101',
        isPrimary: false,
        label: 'Fax'
      }
    ],
    socialMedia: [
      {
        id: 'sm_1_1',
        platform: SocialPlatform.FACEBOOK,
        url: 'https://facebook.com/automaxdealership',
        username: 'automaxdealership',
        isActive: true
      },
      {
        id: 'sm_1_2',
        platform: SocialPlatform.INSTAGRAM,
        url: 'https://instagram.com/automax_la',
        username: 'automax_la',
        isActive: true
      },
      {
        id: 'sm_1_3',
        platform: SocialPlatform.LINKEDIN,
        url: 'https://linkedin.com/company/automax-dealership',
        username: 'automax-dealership',
        isActive: true
      }
    ],
    website: 'https://automax.com',
    industry: 'Automotive',
    size: '50-100',
    city: 'Los Angeles',
    state: 'CA',
    country: 'US',
    typeSpecificData: {
      baseConsolidation: '1/4',
      monthlyVolume: '100+',
      auctionsUsed: ['Copart', 'IAA', 'Manheim']
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id
  }),
  makeOrganisation({
    id: 'org_2',
    name: 'Premier Motors',
    companyId: 'COMP-002',
    type: 'DEALER' as any,

    website: 'https://premiermotors.com',
    industry: 'Automotive',
    size: '100-500',
    city: 'New York',
    state: 'NY',
    country: 'US',
    typeSpecificData: {
      baseConsolidation: '1/3',
      monthlyVolume: '300+',
      auctionsUsed: ['Copart', 'Manheim']
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER_2.id,
    createdBy: TEST_USERS.SENIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER_2.id
  }),
  makeOrganisation({
    id: 'org_3',
    name: 'City Cars Direct',
    companyId: 'COMP-003',
    type: 'DEALER' as any,

    industry: 'Automotive',
    size: '10-50',
    city: 'Chicago',
    state: 'IL',
    country: 'US',
    typeSpecificData: {
      baseConsolidation: '1/4',
      monthlyVolume: '20-50',
      auctionsUsed: ['IAA', 'NPA']
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER.id
  }),

  // SHIPPER Organization
  makeOrganisation({
    id: 'org_4',
    name: 'Global Auto Imports',
    companyId: 'COMP-004',
    type: 'SHIPPER' as any,

    website: 'https://globalauto.com',
    industry: 'Import/Export',
    size: '100-500',
    city: 'Miami',
    state: 'FL',
    country: 'US',
    typeSpecificData: {
      shippingPorts: ['FL', 'GA', 'NJ'],
      destinationPorts: ['Klaipeda, LT', 'Poti, GE', 'Bremerhaven, DE'],
      serviceTypes: ['Container Shipping', 'RoRo Service'],
      transitTime: 21
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  
  // TRANSPORTER Organization
  makeOrganisation({
    id: 'org_5',
    name: 'Westside Auto Group',
    companyId: 'COMP-005',
    type: 'TRANSPORTER' as any,

    industry: 'Transportation',
    size: '20-50',
    city: 'Seattle',
    state: 'WA',
    country: 'US',
    typeSpecificData: {
      serviceAreas: ['West Coast'],
      equipmentTypes: ['Flatbed', 'Enclosed', 'Multi-car'],
      capacity: 50,
      certifications: ['FMCSA', 'DOT'],
      insuranceLimits: '$2M Cargo Insurance',
      specialServices: ['Expedited', 'White Glove']
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER_2.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER_2.id
  }),

  // RETAIL_CLIENT Organizations
  makeOrganisation({
    id: 'org_6',
    name: 'John Smith',
    companyId: 'COMP-006',
    type: 'RETAIL_CLIENT' as any,

    city: 'Denver',
    state: 'CO',
    country: 'US',
    typeSpecificData: {
      budgetRange: '$50k-100k',
      vehiclePreferences: ['Luxury', 'SUV'],
      financingType: 'Bank Financing',
      timeline: '1-3 months',
      deliveryLocation: 'Denver, CO',
      previousPurchases: 2
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.ADMIN.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id
  }),

  // AUCTION Organization
  makeOrganisation({
    id: 'org_7',
    name: 'Copart West Coast',
    companyId: 'COMP-007',
    type: 'AUCTION' as any,

    website: 'https://copart.com',
    industry: 'Vehicle Auctions',
    size: '500+',
    city: 'Sacramento',
    state: 'CA',
    country: 'US',
    typeSpecificData: {
      auctionType: 'Insurance',
      apiAccess: true,
      volumePerWeek: 5000,
      specialtyCategories: ['Salvage', 'Classic', 'Luxury'],
      locations: ['California', 'Nevada', 'Oregon', 'Washington']
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.ADMIN.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id
  }),

  // EXPEDITOR Organization
  makeOrganisation({
    id: 'org_8',
    name: 'Express Auto Logistics',
    companyId: 'COMP-008',
    type: 'EXPEDITOR' as any,

    website: 'https://expressauto.com',
    industry: 'Logistics',
    size: '50-100',
    city: 'Atlanta',
    state: 'GA',
    country: 'US',
    typeSpecificData: {
      serviceAreas: ['South', 'East Coast'],
      equipmentTypes: ['Multi-car', 'Enclosed'],
      capacity: 200,
      certifications: ['FMCSA', 'DOT', 'ISO 9001'],
      insuranceLimits: '$5M Combined',
      specialServices: ['Expedited', 'Warehouse Storage']
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),

  // PROCESSOR Organization
  makeOrganisation({
    id: 'org_9',
    name: 'National Title Services',
    companyId: 'COMP-009',
    type: 'PROCESSOR' as any,

    website: 'https://nationaltitle.com',
    industry: 'Document Processing',
    size: '100-500',
    city: 'Phoenix',
    state: 'AZ',
    country: 'US',
    typeSpecificData: {
      processingTypes: ['Title Transfer', 'Registration', 'Export Documentation'],
      statesCovered: ['CA', 'TX', 'FL', 'NY', 'IL', 'OH', 'PA', 'MI', 'GA', 'NC'],
      turnaroundTime: '3-7 days',
      capacity: 1000
    },
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER_2.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER_2.id
  })
];

// Organization Connections - realistic partnerships and relationships
const organisationConnections = [
  // Dealer-Shipper partnerships (common business relationships)
  {
    id: 'conn_1',
    tenantId: DEFAULT_TENANT,
    fromOrganisationId: 'org_1', // AutoMax Dealership
    toOrganisationId: 'org_4',   // FastShip Logistics (Shipper)
    type: OrganisationRelationType.SHIPPER_DEALER,
    description: 'Primary shipping partner for all vehicle deliveries to AutoMax',
    isActive: true,
    startDate: new Date('2024-01-15'),
    metadata: {
      shippingDiscount: '15%',
      preferredRoutes: ['CA-NV', 'CA-AZ', 'CA-TX'],
      averageDeliveryTime: '3-5 days'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  
  // Dealer-Auction partnerships
  {
    id: 'conn_2',
    tenantId: DEFAULT_TENANT,
    fromOrganisationId: 'org_2', // Premier Motors
    toOrganisationId: 'org_6',   // National Auto Auction
    type: OrganisationRelationType.AUCTION_DEALER,
    description: 'Preferred dealer status with exclusive access to pre-sale inspections',
    isActive: true,
    startDate: new Date('2023-08-01'),
    metadata: {
      dealerTier: 'Gold',
      bidLimit: 2000000,
      exclusivePreviewAccess: true,
      monthlyPurchaseVolume: 50
    },
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2024-09-01')
  },

  // Business partnership between similar organizations
  {
    id: 'conn_3',
    tenantId: DEFAULT_TENANT,
    fromOrganisationId: 'org_1', // AutoMax Dealership
    toOrganisationId: 'org_2',   // Premier Motors
    type: OrganisationRelationType.PARTNER,
    description: 'Cross-referral partnership for customers outside each others primary markets',
    isActive: true,
    startDate: new Date('2024-03-01'),
    metadata: {
      referralCommission: '2%',
      territoryAgreement: 'West Coast vs East Coast',
      monthlyReferrals: 5
    },
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  },

  // Vendor relationship
  {
    id: 'conn_4',
    tenantId: DEFAULT_TENANT,
    fromOrganisationId: 'org_3', // City Cars Direct
    toOrganisationId: 'org_5',   // Elite Expediting
    type: OrganisationRelationType.VENDOR,
    description: 'Title processing and expediting services',
    isActive: true,
    startDate: new Date('2024-02-15'),
    metadata: {
      serviceTypes: ['title processing', 'document expediting', 'DMV liaison'],
      averageTurnaroundTime: '2-4 days',
      monthlyVolume: 25
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },

  // Client relationship
  {
    id: 'conn_5',
    tenantId: DEFAULT_TENANT,
    fromOrganisationId: 'org_9', // TitleMax Processing
    toOrganisationId: 'org_1',   // AutoMax Dealership
    type: OrganisationRelationType.CLIENT,
    description: 'Title processing services for AutoMax inventory',
    isActive: true,
    startDate: new Date('2023-11-01'),
    metadata: {
      serviceLevel: 'Premium',
      monthlyRetainer: 2500,
      processingVolume: 100,
      turnaroundGuarantee: '48 hours'
    },
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-01-01')
  }
];

const contacts = [
  makeContact({
    id: 'contact_1',
    contactId: 'CNT-001',
    firstName: 'John',
    lastName: 'Smith',
    type: 'CEO' as any,
    contactMethods: [
      {
        id: 'cc_1_1',
        type: ContactMethodType.EMAIL,
        value: 'j.smith@automax.com',
        isPrimary: true,
        label: 'Work Email'
      },
      {
        id: 'cc_1_2',
        type: ContactMethodType.EMAIL,
        value: 'john.smith.personal@gmail.com',
        isPrimary: false,
        label: 'Personal Email'
      },
      {
        id: 'cc_1_3',
        type: ContactMethodType.PHONE,
        value: '+15550200',
        isPrimary: true,
        label: 'Office Direct'
      },
      {
        id: 'cc_1_4',
        type: ContactMethodType.PHONE,
        value: '+15550299',
        isPrimary: false,
        label: 'Mobile'
      }
    ],
    title: 'General Manager',
    organisationId: 'org_1',
    address: '123 Main Street, Suite 100',
    city: 'Los Angeles',
    state: 'CA',
    country: 'US',
    postalCode: '90210',
    notes: 'Key decision maker for luxury vehicle imports. Prefers BMW and Mercedes-Benz models. Very responsive to email communication.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.SENIOR_MANAGER.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  makeContact({
    id: 'contact_2',
    contactId: 'CNT-002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    type: 'SALES' as any,
    contactMethods: [
      {
        id: 'cc_2_1',
        type: ContactMethodType.EMAIL,
        value: 's.johnson@automax.com',
        isPrimary: true,
        label: 'Work Email'
      },
      {
        id: 'cc_2_2',
        type: ContactMethodType.PHONE,
        value: '+15550201',
        isPrimary: true,
        label: 'Office'
      }
    ],
    title: 'Sales Director',
    organisationId: 'org_1',
    address: '456 Oak Avenue',
    city: 'Beverly Hills',
    state: 'CA',
    country: 'US',
    postalCode: '90211',
    notes: 'Experienced sales professional specializing in high-volume dealer relationships. Excellent at coordinating complex multi-vehicle shipments and logistics.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  makeContact({
    id: 'contact_3',
    contactId: 'CNT-003',
    firstName: 'Michael',
    lastName: 'Brown',
    type: 'CEO' as any,
    contactMethods: [
      {
        id: 'cc_3_1',
        type: ContactMethodType.EMAIL,
        value: 'm.brown@premiermotors.com',
        isPrimary: true,
        label: 'Corporate Email'
      },
      {
        id: 'cc_3_2',
        type: ContactMethodType.PHONE,
        value: '+15550202',
        isPrimary: true,
        label: 'Direct Line'
      }
    ],
    title: 'CEO',
    organisationId: 'org_2',
    address: '789 Business Plaza, Floor 15',
    city: 'New York',
    state: 'NY',
    country: 'US',
    postalCode: '10001',
    notes: 'CEO of Premium Motors with 20+ years in luxury automotive. Focus on European imports and high-end collector vehicles. Prefers phone calls for urgent matters.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER_2.id,
    createdBy: TEST_USERS.SENIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER_2.id
  }),
  makeContact({
    id: 'contact_4',
    contactId: 'CNT-004',
    firstName: 'Emily',
    lastName: 'Davis',
    type: 'OPERATIONS' as any,
    contactMethods: [
      {
        id: 'cc_4_1',
        type: ContactMethodType.EMAIL,
        value: 'e.davis@citycarsdirect.com',
        isPrimary: true,
        label: 'Work Email'
      },
      {
        id: 'cc_4_2',
        type: ContactMethodType.PHONE,
        value: '+15550203',
        isPrimary: true,
        label: 'Office'
      }
    ],
    title: 'Operations Manager',
    organisationId: 'org_3',
    address: '321 Industrial Way',
    city: 'Chicago',
    state: 'IL',
    country: 'US',
    postalCode: '60601',
    notes: 'Detail-oriented operations manager handling inventory and logistics. Expertise in commercial vehicle procurement and fleet management solutions.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER.id
  }),
  makeContact({
    id: 'contact_5',
    contactId: 'CNT-005',
    firstName: 'Robert',
    lastName: 'Wilson',
    type: 'LOGISTICS' as any,
    contactMethods: [
      {
        id: 'cc_5_1',
        type: ContactMethodType.EMAIL,
        value: 'r.wilson@globalauto.com',
        isPrimary: true,
        label: 'Work Email'
      },
      {
        id: 'cc_5_2',
        type: ContactMethodType.PHONE,
        value: '+15550204',
        isPrimary: true,
        label: 'Office'
      }
    ],
    title: 'Import Specialist',
    organisationId: 'org_4',
    address: '555 Harbor Boulevard',
    city: 'Miami',
    state: 'FL',
    country: 'US',
    postalCode: '33101',
    notes: 'International shipping expert with extensive knowledge of customs regulations and documentation. Handles complex multi-country vehicle imports efficiently.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  makeContact({
    id: 'contact_6',
    contactId: 'CNT-006',
    firstName: 'Lisa',
    lastName: 'Anderson',
    type: 'PURCHASING' as any,
    contactMethods: [
      {
        id: 'cc_6_1',
        type: ContactMethodType.EMAIL,
        value: 'lisa.anderson@autodeals.com',
        isPrimary: true,
        label: 'Business Email'
      },
      {
        id: 'cc_6_2',
        type: ContactMethodType.PHONE,
        value: '+15550305',
        isPrimary: true,
        label: 'Mobile'
      }
    ],
    title: 'Independent Dealer',
    address: '777 Maple Street',
    city: 'Austin',
    state: 'TX',
    country: 'US',
    postalCode: '73301',
    notes: 'Independent dealer with a focus on affordable domestic vehicles. Strong relationships with auction houses and quick decision-making process.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER_2.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER_2.id
  }),
  makeContact({
    id: 'contact_7',
    contactId: 'CNT-007',
    firstName: 'James',
    lastName: 'Taylor',
    type: 'PURCHASING' as any,
    contactMethods: [
      {
        id: 'cc_7_1',
        type: ContactMethodType.EMAIL,
        value: 'j.taylor@westsideauto.com',
        isPrimary: true,
        label: 'Business Email'
      },
      {
        id: 'cc_7_2',
        type: ContactMethodType.PHONE,
        value: '+15550306',
        isPrimary: true,
        label: 'Office'
      }
    ],
    title: 'Purchasing Manager',
    organisationId: 'org_5',
    address: '888 Sunset Drive',
    city: 'Seattle',
    state: 'WA',
    country: 'US',
    postalCode: '98101',
    notes: 'Strategic purchasing manager focused on inventory optimization. Specializes in Japanese imports and hybrid vehicles for the Pacific Northwest market.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER_2.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER_2.id
  }),
  makeContact({
    id: 'contact_8',
    contactId: 'CNT-008',
    firstName: 'Patricia',
    lastName: 'Martinez',
    type: 'RETAIL_BUYER' as any,
    contactMethods: [
      {
        id: 'cc_8_1',
        type: ContactMethodType.EMAIL,
        value: 'p.martinez@classicautos.com',
        isPrimary: true,
        label: 'Business Email'
      },
      {
        id: 'cc_8_2',
        type: ContactMethodType.PHONE,
        value: '+15550307',
        isPrimary: true,
        label: 'Mobile'
      }
    ],
    title: 'Solo Trader',
    address: '999 Phoenix Plaza',
    city: 'Phoenix',
    state: 'AZ',
    country: 'US',
    postalCode: '85001',
    notes: 'Independent vehicle trader specializing in vintage and classic cars. Excellent network of collectors and restoration specialists throughout the Southwest.',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.ADMIN.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id
  })
];

// Type-specific pipelines
const dealerAcquisitionPipeline = makePipeline({
  id: 'dealer-acquisition',
  name: 'Dealer Acquisition',
  description: 'Main dealer acquisition pipeline',
  isDefault: true,
  order: 0,
  color: '#3B82F6',
  applicableTypes: ['DEALER' as any],
  isTypeSpecific: true
});

const dealerAcquisitionStages = [
  makeStage('dealer-acquisition', {
    id: 'stage_da_1',
    name: 'Investigation',
    order: 0,
    color: '#94A3B8'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_2',
    name: 'Contact Established',
    order: 1,
    color: '#64748B'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_3',
    name: 'Qualification',
    order: 2,
    color: '#475569'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_4',
    name: 'Meeting Set',
    order: 3,
    color: '#3B82F6'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_5',
    name: 'Meeting Confirmed',
    order: 4,
    color: '#2563EB'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_6',
    name: 'Negotiation',
    order: 5,
    color: '#1D4ED8'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_7',
    name: 'Contract Sent',
    order: 6,
    color: '#F59E0B'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_8',
    name: 'Contract Signed',
    order: 7,
    color: '#EF4444'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_9',
    name: 'Deposit Paid',
    order: 8,
    color: '#10B981'
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_10',
    name: 'Close Won',
    order: 9,
    color: '#059669',
    isClosing: true
  }),
  makeStage('dealer-acquisition', {
    id: 'stage_da_lost',
    name: 'Lost',
    order: 10,
    color: '#DC2626',
    isLost: true
  })
];

const dealerIntegrationPipeline = makePipeline({
  id: 'dealer-integration',
  name: 'Dealer Integration',
  description: 'Post-sale dealer integration pipeline',
  order: 1,
  color: '#10B981',
  applicableTypes: ['DEALER' as any],
  isTypeSpecific: true
});

const dealerIntegrationStages = [
  makeStage('dealer-integration', {
    id: 'stage_di_1',
    name: 'Integration',
    order: 0,
    color: '#94A3B8'
  }),
  makeStage('dealer-integration', {
    id: 'stage_di_2',
    name: 'Support Created',
    order: 1,
    color: '#64748B'
  }),
  makeStage('dealer-integration', {
    id: 'stage_di_3',
    name: 'Instructions Provided',
    order: 2,
    color: '#3B82F6'
  }),
  makeStage('dealer-integration', {
    id: 'stage_di_4',
    name: 'First Car Won',
    order: 3,
    color: '#8B5CF6'
  }),
  makeStage('dealer-integration', {
    id: 'stage_di_5',
    name: 'Cabinet Created',
    order: 4,
    color: '#EC4899'
  }),
  makeStage('dealer-integration', {
    id: 'stage_di_6',
    name: 'Close Integrated',
    order: 5,
    color: '#10B981',
    isClosing: true
  })
];

// Retail Sales Pipeline
const retailSalesPipeline = makePipeline({
  id: 'retail-sales',
  name: 'Retail Sales',
  description: 'Individual customer purchase pipeline',
  order: 2,
  color: '#8B5CF6',
  applicableTypes: ['RETAIL_CLIENT' as any],
  isTypeSpecific: true
});

const retailSalesStages = [
  makeStage('retail-sales', {
    id: 'stage_rs_1',
    name: 'Inquiry',
    order: 0,
    color: '#94A3B8'
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_2',
    name: 'Budget Qualification',
    order: 1,
    color: '#64748B'
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_3',
    name: 'Vehicle Selection',
    order: 2,
    color: '#3B82F6'
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_4',
    name: 'Financing',
    order: 3,
    color: '#8B5CF6'
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_5',
    name: 'Purchase Agreement',
    order: 4,
    color: '#F59E0B'
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_6',
    name: 'Payment Processing',
    order: 5,
    color: '#EF4444'
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_7',
    name: 'Delivery Scheduled',
    order: 6,
    color: '#10B981'
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_8',
    name: 'Delivered',
    order: 7,
    color: '#059669',
    isClosing: true
  }),
  makeStage('retail-sales', {
    id: 'stage_rs_lost',
    name: 'Cancelled',
    order: 8,
    color: '#DC2626',
    isLost: true
  })
];

// Vendor Onboarding Pipeline (for EXPEDITOR, SHIPPER, TRANSPORTER)
const vendorOnboardingPipeline = makePipeline({
  id: 'vendor-onboarding',
  name: 'Vendor Onboarding',
  description: 'New logistics partner acquisition',
  order: 3,
  color: '#F59E0B',
  applicableTypes: ['EXPEDITOR' as any, 'SHIPPER' as any, 'TRANSPORTER' as any],
  isTypeSpecific: true
});

const vendorOnboardingStages = [
  makeStage('vendor-onboarding', {
    id: 'stage_vo_1',
    name: 'Inquiry',
    order: 0,
    color: '#94A3B8'
  }),
  makeStage('vendor-onboarding', {
    id: 'stage_vo_2',
    name: 'Capability Review',
    order: 1,
    color: '#64748B'
  }),
  makeStage('vendor-onboarding', {
    id: 'stage_vo_3',
    name: 'Compliance Check',
    order: 2,
    color: '#3B82F6'
  }),
  makeStage('vendor-onboarding', {
    id: 'stage_vo_4',
    name: 'Rate Negotiation',
    order: 3,
    color: '#8B5CF6'
  }),
  makeStage('vendor-onboarding', {
    id: 'stage_vo_5',
    name: 'Contract Review',
    order: 4,
    color: '#F59E0B'
  }),
  makeStage('vendor-onboarding', {
    id: 'stage_vo_6',
    name: 'Contract Signed',
    order: 5,
    color: '#10B981'
  }),
  makeStage('vendor-onboarding', {
    id: 'stage_vo_7',
    name: 'Active Partnership',
    order: 6,
    color: '#059669',
    isClosing: true
  }),
  makeStage('vendor-onboarding', {
    id: 'stage_vo_lost',
    name: 'Rejected',
    order: 7,
    color: '#DC2626',
    isLost: true
  })
];

// Auction Integration Pipeline
const auctionIntegrationPipeline = makePipeline({
  id: 'auction-integration',
  name: 'Auction Integration',
  description: 'API partnerships with auction houses',
  order: 4,
  color: '#EC4899',
  applicableTypes: ['AUCTION' as any],
  isTypeSpecific: true
});

const auctionIntegrationStages = [
  makeStage('auction-integration', {
    id: 'stage_ai_1',
    name: 'Partnership Inquiry',
    order: 0,
    color: '#94A3B8'
  }),
  makeStage('auction-integration', {
    id: 'stage_ai_2',
    name: 'Technical Assessment',
    order: 1,
    color: '#64748B'
  }),
  makeStage('auction-integration', {
    id: 'stage_ai_3',
    name: 'API Integration',
    order: 2,
    color: '#3B82F6'
  }),
  makeStage('auction-integration', {
    id: 'stage_ai_4',
    name: 'Testing Phase',
    order: 3,
    color: '#8B5CF6'
  }),
  makeStage('auction-integration', {
    id: 'stage_ai_5',
    name: 'Volume Agreement',
    order: 4,
    color: '#F59E0B'
  }),
  makeStage('auction-integration', {
    id: 'stage_ai_6',
    name: 'Live Integration',
    order: 5,
    color: '#10B981',
    isClosing: true
  }),
  makeStage('auction-integration', {
    id: 'stage_ai_lost',
    name: 'Integration Failed',
    order: 6,
    color: '#DC2626',
    isLost: true
  })
];

const leads = [
  makeLead({
    id: 'lead_1',
    title: 'Luxury Auto Dealers - Expansion',
    source: 'Website',
    organisationId: 'org_1',
    isTarget: true,
    score: 85,
    country: 'US',
    state: 'CA',
    city: 'Los Angeles',
    zipCode: '90001',
    notes: 'Looking to expand their inventory with imported vehicles',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.SENIOR_MANAGER.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  makeLead({
    id: 'lead_2',
    title: 'East Coast Motors Interest',
    source: 'Referral',
    contactId: 'contact_6',
    isTarget: true,
    score: 70,
    country: 'US',
    state: 'NY',
    city: 'New York',
    zipCode: '10001',
    notes: 'Referred by existing client, high potential',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER_2.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER_2.id
  }),
  makeLead({
    id: 'lead_3',
    title: 'Small Dealer Inquiry',
    source: 'Cold Call',
    organisationId: 'org_3',
    isTarget: false,
    score: 30,
    country: 'US',
    state: 'TX',
    city: 'Austin',
    zipCode: '78701',
    notes: 'Not ready yet, follow up in 6 months',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER.id
  }),
  makeLead({
    id: 'lead_4',
    title: 'Premium Imports Partnership',
    source: 'Trade Show',
    organisationId: 'org_4',
    isTarget: true,
    score: 90,
    country: 'US',
    state: 'FL',
    city: 'Miami',
    zipCode: '33101',
    notes: 'Met at auto trade show, very interested',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  makeLead({
    id: 'lead_5',
    title: 'Individual Buyer',
    source: 'Website',
    contactId: 'contact_8',
    isTarget: false,
    score: 20,
    country: 'US',
    state: 'IL',
    city: 'Chicago',
    zipCode: '60601',
    notes: 'Individual buyer, not our target market',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.ADMIN.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id
  }),
  makeLead({
    id: 'lead_6',
    title: 'Regional Dealer Network',
    source: 'LinkedIn',
    organisationId: 'org_5',
    isTarget: false,
    score: 45,
    country: 'US',
    state: 'WA',
    city: 'Seattle',
    zipCode: '98101',
    notes: 'Interested but needs more information',
    tenantId: DEFAULT_TENANT,
    responsibleUserId: TEST_USERS.JUNIOR_MANAGER_2.id,
    createdBy: TEST_USERS.SENIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER_2.id
  })
];

// Use the clean deals with proper pipeline assignments from the imported file
const deals = dealsData;

// Old deals array replaced with clean version
/*
const deals_old = [
  makeDeal({
    id: 'deal_1_old',
    title: 'AutoMax Fleet Expansion',
    amount: 250000,
    currency: 'USD',
    organisationId: 'org_1',
    status: DealStatus.OPEN,
    probability: 60,
    notes: 'Q1 target deal, multiple vehicle imports'
  }),
  makeDeal({
    id: 'deal_2',
    title: 'Premier Motors Luxury Line',
    amount: 450000,
    currency: 'USD',
    organisationId: 'org_2',
    status: DealStatus.OPEN,
    probability: 75,
    notes: 'High-value luxury vehicle imports'
  }),
  makeDeal({
    id: 'deal_3',
    title: 'City Cars Compact Fleet',
    amount: 150000,
    currency: 'USD',
    organisationId: 'org_3',
    status: DealStatus.OPEN,
    probability: 40,
    notes: 'Focus on compact and economy vehicles'
  }),
  makeDeal({
    id: 'deal_4',
    title: 'Global Auto Strategic Partnership',
    amount: 750000,
    currency: 'USD',
    organisationId: 'org_4',
    status: DealStatus.WON,
    probability: 100,
    closeDate: new Date('2024-01-15'),
    notes: 'Long-term partnership agreement signed'
  }),
  makeDeal({
    id: 'deal_5',
    title: 'Independent Dealer Package',
    amount: 50000,
    currency: 'USD',
    contactId: 'contact_6',
    status: DealStatus.OPEN,
    probability: 30,
    notes: 'Small volume but high margin opportunity'
  }),
  makeDeal({
    id: 'deal_6',
    title: 'John Smith BMW X5 Purchase',
    amount: 85000,
    currency: 'USD',
    organisationId: 'org_6',
    status: DealStatus.OPEN,
    probability: 70,
    notes: 'Retail client looking for luxury SUV import from Germany'
  }),
  makeDeal({
    id: 'deal_7',
    title: 'Global Auto Shipping Partnership',
    amount: 125000,
    currency: 'USD',
    organisationId: 'org_4',
    status: DealStatus.OPEN,
    probability: 55,
    notes: 'New shipping route partnership proposal'
  })
*/

// The deals array now comes with stages already assigned from deals-seed.ts

const tasks = [
  makeTask(EntityType.DEAL, 'deal_1', {
    id: 'task_1',
    title: 'Prepare import documentation',
    description: 'Gather all necessary import documents for AutoMax',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2024-02-15'),
    tenantId: DEFAULT_TENANT,
    createdBy: TEST_USERS.SENIOR_MANAGER.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  }),
  makeTask(EntityType.DEAL, 'deal_2', {
    id: 'task_2',
    title: 'Schedule negotiation meeting',
    description: 'Set up final negotiation meeting with Premier Motors',
    status: TaskStatus.TODO,
    priority: TaskPriority.URGENT,
    dueDate: new Date('2024-02-10'),
    tenantId: DEFAULT_TENANT,
    createdBy: TEST_USERS.SENIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER_2.id
  }),
  makeTask(EntityType.ORGANISATION, 'org_3', {
    id: 'task_3',
    title: 'Send company brochure',
    description: 'Email updated company brochure to City Cars',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    completedAt: new Date('2024-01-25'),
    tenantId: DEFAULT_TENANT,
    createdBy: TEST_USERS.JUNIOR_MANAGER.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER.id
  }),
  makeTask(EntityType.CONTACT, 'contact_6', {
    id: 'task_4',
    title: 'Follow up call',
    description: 'Check in on their interest level',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: new Date('2024-02-20'),
    tenantId: DEFAULT_TENANT,
    createdBy: TEST_USERS.JUNIOR_MANAGER_2.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER_2.id
  }),
  makeTask(EntityType.DEAL, 'deal_4', {
    id: 'task_5',
    title: 'Onboarding checklist',
    description: 'Complete onboarding process for Global Auto',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    tenantId: DEFAULT_TENANT,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id
  })
];

const customFieldDefs = [
  makeCustomFieldDef(EntityType.ORGANISATION, {
    id: 'field_def_1',
    name: 'Annual Revenue',
    fieldKey: 'annual_revenue',
    type: CustomFieldType.NUMBER,
    order: 0
  }),
  makeCustomFieldDef(EntityType.ORGANISATION, {
    id: 'field_def_2',
    name: 'Preferred Communication',
    fieldKey: 'preferred_comm',
    type: CustomFieldType.SELECT,
    options: ['Email', 'Phone', 'SMS', 'WhatsApp'],
    order: 1
  }),
  makeCustomFieldDef(EntityType.CONTACT, {
    id: 'field_def_3',
    name: 'Birthday',
    fieldKey: 'birthday',
    type: CustomFieldType.DATE,
    order: 0
  }),
  makeCustomFieldDef(EntityType.DEAL, {
    id: 'field_def_4',
    name: 'Competitor',
    fieldKey: 'competitor',
    type: CustomFieldType.TEXT,
    order: 0
  }),
  makeCustomFieldDef(EntityType.DEAL, {
    id: 'field_def_5',
    name: 'Decision Criteria',
    fieldKey: 'decision_criteria',
    type: CustomFieldType.MULTISELECT,
    options: ['Price', 'Quality', 'Service', 'Delivery Time', 'Payment Terms'],
    order: 1
  })
];

const customFieldValues = [
  makeCustomFieldValue('field_def_1', 'org_1', 5000000),
  makeCustomFieldValue('field_def_1', 'org_2', 12000000),
  makeCustomFieldValue('field_def_2', 'org_1', 'Email'),
  makeCustomFieldValue('field_def_2', 'org_2', 'Phone'),
  makeCustomFieldValue('field_def_3', 'contact_1', '1975-03-15'),
  makeCustomFieldValue('field_def_3', 'contact_3', '1968-09-22'),
  makeCustomFieldValue('field_def_4', 'deal_1', 'CompetitorX'),
  makeCustomFieldValue('field_def_4', 'deal_2', 'ImportCo'),
  makeCustomFieldValue('field_def_5', 'deal_1', ['Price', 'Service']),
  makeCustomFieldValue('field_def_5', 'deal_2', ['Quality', 'Delivery Time', 'Service'])
];

// Collect all pipelines
const pipelines = [
  dealerAcquisitionPipeline,
  dealerIntegrationPipeline,
  retailSalesPipeline,
  vendorOnboardingPipeline,
  auctionIntegrationPipeline
];

// Repository instances for compatibility
import { OrganisationRepository } from './repositories/organisation-repository';
import { OrganisationConnectionRepository } from './repositories/organisation-connection-repository';
import { ContactRepository } from './repositories/contact-repository';
import { LeadRepository } from './repositories/lead-repository';
import { DealRepository } from './repositories/deal-repository';
import { PipelineRepository } from './repositories/pipeline-repository';
import { TaskRepository } from './repositories/task-repository';
import { CustomFieldRepository } from './repositories/custom-field-repository';
import { ActivityRepository } from './repositories/activity-repository';

// Create repository instances
export const organisationRepository = new OrganisationRepository();
export const organisationConnectionRepository = new OrganisationConnectionRepository();
export const contactRepository = new ContactRepository();
export const leadRepository = new LeadRepository();
export const dealRepository = new DealRepository();
export const pipelineRepository = new PipelineRepository();
export const taskRepository = new TaskRepository();
export const customFieldRepository = new CustomFieldRepository();
export const activityRepository = new ActivityRepository();

// Export seed data arrays
export {
  organisations,
  organisationConnections,
  contacts,
  leads,
  deals,
  tasks,
  customFieldDefs,
  customFieldValues,
  pipelines,
  dealerAcquisitionStages,
  dealerIntegrationStages,
  retailSalesStages,
  vendorOnboardingStages,
  auctionIntegrationStages
};

// Legacy seed functions - deprecated in favor of enhanced system
export function seedData() {
  console.warn('Legacy seedData() is deprecated. Use enhanced seeding system instead.');
}

export function resetSeeds() {
  console.warn('Legacy resetSeeds() is deprecated. Use enhanced seeding system instead.');
}

// Export enhanced seed data for use by the enhanced system
export * from './enhanced-seeds';