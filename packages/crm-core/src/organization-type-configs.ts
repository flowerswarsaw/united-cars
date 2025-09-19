import {
  OrganizationType,
  CustomFieldType,
  OrganizationTypeConfig,
  TypeSpecificFieldDef,
  OrganizationFeature,
  DealerConversionConfig
} from './types';

// Type-specific field definitions
export const DEALER_FIELDS: TypeSpecificFieldDef[] = [
  {
    key: 'baseConsolidation',
    name: 'Base Consolidation',
    type: CustomFieldType.SELECT,
    options: ['1/4', '1/3'],
    order: 1
  },
  {
    key: 'monthlyVolume',
    name: 'Monthly Volume',
    type: CustomFieldType.SELECT,
    options: ['1-5', '5-10', '10-20', '20-50', '50-100', '100+', '200+', '300+', '500+'],
    order: 2
  },
  {
    key: 'auctionsUsed',
    name: 'Auctions They Use',
    type: CustomFieldType.MULTISELECT,
    options: ['Copart', 'IAA', 'Manheim', 'NPA'],
    order: 3
  }
];

export const RETAIL_CLIENT_FIELDS: TypeSpecificFieldDef[] = [
  {
    key: 'budgetRange',
    name: 'Budget Range',
    type: CustomFieldType.SELECT,
    options: ['Under $20k', '$20k-50k', '$50k-100k', '$100k+'],
    order: 1
  },
  {
    key: 'vehiclePreferences',
    name: 'Vehicle Preferences',
    type: CustomFieldType.MULTISELECT,
    options: ['Sedan', 'SUV', 'Truck', 'Sports Car', 'Luxury', 'Hybrid/Electric'],
    order: 2
  },
  {
    key: 'financingType',
    name: 'Financing Type',
    type: CustomFieldType.SELECT,
    options: ['Cash', 'Bank Financing', 'Dealer Financing', 'Lease'],
    order: 3
  },
  {
    key: 'timeline',
    name: 'Purchase Timeline',
    type: CustomFieldType.SELECT,
    options: ['Immediate', '1-3 months', '3-6 months', '6+ months'],
    order: 4
  },
  {
    key: 'deliveryLocation',
    name: 'Delivery Location',
    type: CustomFieldType.TEXT,
    order: 5
  },
  {
    key: 'previousPurchases',
    name: 'Previous Purchases',
    type: CustomFieldType.NUMBER,
    order: 6
  }
];

export const SHIPPER_FIELDS: TypeSpecificFieldDef[] = [
  {
    key: 'shippingPorts',
    name: 'Shipping Ports',
    type: CustomFieldType.MULTISELECT,
    options: [
      'CA',
      'NJ',
      'TX',
      'GA',
      'IL',
      'WA',
      'FL',
      'MD',
      'SC',
      'VA'
    ],
    required: true,
    order: 1
  },
  {
    key: 'destinationPorts',
    name: 'Destination Ports',
    type: CustomFieldType.MULTISELECT,
    options: [
      'Klaipeda, LT',
      'Poti, GE',
      'Bremerhaven, DE',
      'Rotterdam, NL',
      'Jebel Ali, AE',
      'Lagos, NG'
    ],
    required: true,
    order: 2
  },
  {
    key: 'serviceTypes',
    name: 'Service Types',
    type: CustomFieldType.MULTISELECT,
    options: ['Container Shipping', 'RoRo Service', 'Breakbulk', 'Project Cargo'],
    required: true,
    order: 3
  },
  {
    key: 'transitTime',
    name: 'Average Transit Time (Days)',
    type: CustomFieldType.NUMBER,
    order: 4
  }
];

export const LOGISTICS_FIELDS: TypeSpecificFieldDef[] = [
  {
    key: 'serviceAreas',
    name: 'Service Areas',
    type: CustomFieldType.MULTISELECT,
    options: ['West Coast', 'East Coast', 'Midwest', 'South', 'International'],
    required: true,
    order: 1
  },
  {
    key: 'equipmentTypes',
    name: 'Equipment Types',
    type: CustomFieldType.MULTISELECT,
    options: ['Flatbed', 'Enclosed', 'Multi-car', 'Container', 'RoRo'],
    required: true,
    order: 2
  },
  {
    key: 'capacity',
    name: 'Daily Capacity',
    type: CustomFieldType.NUMBER,
    order: 3
  },
  {
    key: 'certifications',
    name: 'Certifications',
    type: CustomFieldType.MULTISELECT,
    options: ['FMCSA', 'DOT', 'IATA', 'ISO 9001', 'C-TPAT'],
    order: 4
  },
  {
    key: 'insuranceLimits',
    name: 'Insurance Coverage',
    type: CustomFieldType.TEXT,
    order: 5
  },
  {
    key: 'transitTimes',
    name: 'Typical Transit Times',
    type: CustomFieldType.JSON,
    order: 6
  },
  {
    key: 'specialServices',
    name: 'Special Services',
    type: CustomFieldType.MULTISELECT,
    options: ['White Glove', 'Expedited', 'Warehouse Storage', 'Customs Clearance'],
    order: 7
  }
];

export const AUCTION_FIELDS: TypeSpecificFieldDef[] = [
  {
    key: 'auctionType',
    name: 'Auction Type',
    type: CustomFieldType.SELECT,
    options: ['Insurance', 'Fleet', 'Dealer', 'Public'],
    required: true,
    order: 1
  },
  {
    key: 'apiAccess',
    name: 'API Access Available',
    type: CustomFieldType.BOOLEAN,
    order: 2
  },
  {
    key: 'volumePerWeek',
    name: 'Volume Per Week',
    type: CustomFieldType.NUMBER,
    order: 3
  },
  {
    key: 'specialtyCategories',
    name: 'Specialty Categories',
    type: CustomFieldType.MULTISELECT,
    options: ['Luxury', 'Classic', 'Exotic', 'Commercial', 'Salvage'],
    order: 4
  },
  {
    key: 'locations',
    name: 'Auction Locations',
    type: CustomFieldType.MULTISELECT,
    options: ['California', 'Texas', 'Florida', 'New York', 'Illinois'],
    order: 5
  }
];

export const PROCESSOR_FIELDS: TypeSpecificFieldDef[] = [
  {
    key: 'processingTypes',
    name: 'Processing Types',
    type: CustomFieldType.MULTISELECT,
    options: ['Title Transfer', 'Registration', 'Lien Release', 'Export Documentation'],
    required: true,
    order: 1
  },
  {
    key: 'statesCovered',
    name: 'States Covered',
    type: CustomFieldType.MULTISELECT,
    options: ['CA', 'TX', 'FL', 'NY', 'IL', 'OH', 'PA', 'MI', 'GA', 'NC'],
    order: 2
  },
  {
    key: 'turnaroundTime',
    name: 'Typical Turnaround Time',
    type: CustomFieldType.SELECT,
    options: ['1-3 days', '3-7 days', '1-2 weeks', '2-4 weeks'],
    order: 3
  },
  {
    key: 'capacity',
    name: 'Monthly Capacity',
    type: CustomFieldType.NUMBER,
    order: 4
  }
];

// Organization features by type
export const DEALER_FEATURES: OrganizationFeature[] = [
  { key: 'portal_access', name: 'Dealer Portal', description: 'Access to dealer portal for ordering and tracking', enabled: true },
  { key: 'credit_management', name: 'Credit Management', description: 'Credit limit and payment tracking', enabled: true },
  { key: 'inventory_alerts', name: 'Inventory Alerts', description: 'Notifications for new inventory', enabled: true },
  { key: 'bulk_ordering', name: 'Bulk Ordering', description: 'Ability to place bulk vehicle orders', enabled: false },
  { key: 'custom_pricing', name: 'Custom Pricing', description: 'Negotiated pricing tiers', enabled: false }
];

export const RETAIL_CLIENT_FEATURES: OrganizationFeature[] = [
  { key: 'vehicle_tracking', name: 'Vehicle Tracking', description: 'Track vehicle shipping status', enabled: true },
  { key: 'financing_assistance', name: 'Financing Assistance', description: 'Help with financing options', enabled: true },
  { key: 'concierge_service', name: 'Concierge Service', description: 'Personal service representative', enabled: false }
];

export const LOGISTICS_FEATURES: OrganizationFeature[] = [
  { key: 'route_optimization', name: 'Route Optimization', description: 'Optimized routing for efficiency', enabled: true },
  { key: 'real_time_tracking', name: 'Real-time Tracking', description: 'GPS tracking of shipments', enabled: true },
  { key: 'capacity_planning', name: 'Capacity Planning', description: 'Advanced capacity planning tools', enabled: false }
];

// Organization type configurations
export const ORGANIZATION_TYPE_CONFIGS: Record<OrganizationType, OrganizationTypeConfig> = {
  [OrganizationType.DEALER]: {
    type: OrganizationType.DEALER,
    displayName: 'Car Dealer',
    description: 'Car dealerships and automotive retailers',
    defaultPipelines: ['dealer-acquisition', 'dealer-integration'],
    customFields: DEALER_FIELDS,
    features: DEALER_FEATURES
  },
  [OrganizationType.BROKER]: {
    type: OrganizationType.BROKER,
    displayName: 'Broker',
    description: 'Vehicle brokers and intermediaries',
    defaultPipelines: ['dealer-acquisition', 'dealer-integration'],
    customFields: DEALER_FIELDS,
    features: DEALER_FEATURES
  },
  [OrganizationType.RETAIL_CLIENT]: {
    type: OrganizationType.RETAIL_CLIENT,
    displayName: 'Retail Client',
    description: 'Individual customers purchasing vehicles',
    defaultPipelines: ['retail-sales', 'retail-service'],
    customFields: RETAIL_CLIENT_FIELDS,
    features: RETAIL_CLIENT_FEATURES
  },
  [OrganizationType.EXPEDITOR]: {
    type: OrganizationType.EXPEDITOR,
    displayName: 'Expeditor',
    description: 'Logistics coordinators and freight forwarders',
    defaultPipelines: ['vendor-onboarding', 'active-vendor'],
    customFields: LOGISTICS_FIELDS,
    features: LOGISTICS_FEATURES
  },
  [OrganizationType.SHIPPER]: {
    type: OrganizationType.SHIPPER,
    displayName: 'Shipping Company',
    description: 'Ocean and air shipping companies',
    defaultPipelines: ['shipping-partner', 'active-shipper'],
    customFields: SHIPPER_FIELDS,
    features: LOGISTICS_FEATURES
  },
  [OrganizationType.TRANSPORTER]: {
    type: OrganizationType.TRANSPORTER,
    displayName: 'Transport Company',
    description: 'Trucking and ground transport companies',
    defaultPipelines: ['transport-partner', 'active-transport'],
    customFields: LOGISTICS_FIELDS,
    features: LOGISTICS_FEATURES
  },
  [OrganizationType.AUCTION]: {
    type: OrganizationType.AUCTION,
    displayName: 'Auction House',
    description: 'Vehicle auction companies (Copart, IAA, etc.)',
    defaultPipelines: ['auction-integration'],
    customFields: AUCTION_FIELDS,
    features: []
  },
  [OrganizationType.PROCESSOR]: {
    type: OrganizationType.PROCESSOR,
    displayName: 'Title Processor',
    description: 'Title and document processing centers',
    defaultPipelines: ['processor-partnership'],
    customFields: PROCESSOR_FIELDS,
    features: []
  }
};

// Pipeline definitions for each organization type
export const TYPE_SPECIFIC_PIPELINES = {
  // Dealer pipelines
  'dealer-acquisition': {
    name: 'Dealer Acquisition',
    description: 'Main dealer acquisition pipeline',
    applicableTypes: [OrganizationType.DEALER, OrganizationType.BROKER],
    stages: [
      { name: 'Investigation', order: 0, color: '#94A3B8' },
      { name: 'Contact Established', order: 1, color: '#64748B' },
      { name: 'Qualification', order: 2, color: '#475569' },
      { name: 'Meeting Set', order: 3, color: '#3B82F6' },
      { name: 'Meeting Confirmed', order: 4, color: '#2563EB' },
      { name: 'Negotiation', order: 5, color: '#1D4ED8' },
      { name: 'Contract Sent', order: 6, color: '#F59E0B' },
      { name: 'Contract Signed', order: 7, color: '#EF4444' },
      { name: 'Deposit Paid', order: 8, color: '#10B981' },
      { name: 'Close Won', order: 9, color: '#059669', isClosing: true },
      { name: 'Lost', order: 10, color: '#DC2626', isLost: true }
    ]
  },
  'dealer-integration': {
    name: 'Dealer Integration',
    description: 'Post-sale dealer integration pipeline',
    applicableTypes: [OrganizationType.DEALER, OrganizationType.BROKER],
    stages: [
      { name: 'Integration', order: 0, color: '#94A3B8' },
      { name: 'Support Created', order: 1, color: '#64748B' },
      { name: 'Instructions Provided', order: 2, color: '#3B82F6' },
      { name: 'First Car Won', order: 3, color: '#8B5CF6' },
      { name: 'Cabinet Created', order: 4, color: '#EC4899' },
      { name: 'Close Integrated', order: 5, color: '#10B981', isClosing: true }
    ]
  },

  // Retail client pipelines
  'retail-sales': {
    name: 'Retail Sales',
    description: 'Individual customer purchase pipeline',
    applicableTypes: [OrganizationType.RETAIL_CLIENT],
    stages: [
      { name: 'Inquiry', order: 0, color: '#94A3B8' },
      { name: 'Budget Qualification', order: 1, color: '#64748B' },
      { name: 'Vehicle Selection', order: 2, color: '#3B82F6' },
      { name: 'Financing', order: 3, color: '#8B5CF6' },
      { name: 'Purchase Agreement', order: 4, color: '#F59E0B' },
      { name: 'Payment Processing', order: 5, color: '#EF4444' },
      { name: 'Delivery Scheduled', order: 6, color: '#10B981' },
      { name: 'Delivered', order: 7, color: '#059669', isClosing: true },
      { name: 'Cancelled', order: 8, color: '#DC2626', isLost: true }
    ]
  },
  'retail-service': {
    name: 'Retail Service',
    description: 'Post-purchase support and repeat business',
    applicableTypes: [OrganizationType.RETAIL_CLIENT],
    stages: [
      { name: 'Follow-up', order: 0, color: '#94A3B8' },
      { name: 'Satisfaction Check', order: 1, color: '#64748B' },
      { name: 'Service Inquiry', order: 2, color: '#3B82F6' },
      { name: 'Service Scheduled', order: 3, color: '#8B5CF6' },
      { name: 'Service Complete', order: 4, color: '#10B981', isClosing: true }
    ]
  },

  // Logistics pipelines (shared by EXPEDITOR, SHIPPER, TRANSPORTER)
  'vendor-onboarding': {
    name: 'Vendor Onboarding',
    description: 'New logistics partner acquisition',
    applicableTypes: [OrganizationType.EXPEDITOR, OrganizationType.SHIPPER, OrganizationType.TRANSPORTER],
    stages: [
      { name: 'Inquiry', order: 0, color: '#94A3B8' },
      { name: 'Capability Review', order: 1, color: '#64748B' },
      { name: 'Compliance Check', order: 2, color: '#3B82F6' },
      { name: 'Rate Negotiation', order: 3, color: '#8B5CF6' },
      { name: 'Contract Review', order: 4, color: '#F59E0B' },
      { name: 'Contract Signed', order: 5, color: '#10B981' },
      { name: 'Active Partnership', order: 6, color: '#059669', isClosing: true },
      { name: 'Rejected', order: 7, color: '#DC2626', isLost: true }
    ]
  },
  'active-vendor': {
    name: 'Active Vendor Management',
    description: 'Ongoing logistics partner management',
    applicableTypes: [OrganizationType.EXPEDITOR, OrganizationType.SHIPPER, OrganizationType.TRANSPORTER],
    stages: [
      { name: 'Performance Review', order: 0, color: '#94A3B8' },
      { name: 'Rate Review', order: 1, color: '#64748B' },
      { name: 'Capacity Planning', order: 2, color: '#3B82F6' },
      { name: 'Contract Renewal', order: 3, color: '#8B5CF6' },
      { name: 'Partnership Renewed', order: 4, color: '#10B981', isClosing: true }
    ]
  },

  // Auction pipeline
  'auction-integration': {
    name: 'Auction Integration',
    description: 'API partnerships with auction houses',
    applicableTypes: [OrganizationType.AUCTION],
    stages: [
      { name: 'Partnership Inquiry', order: 0, color: '#94A3B8' },
      { name: 'Technical Assessment', order: 1, color: '#64748B' },
      { name: 'API Integration', order: 2, color: '#3B82F6' },
      { name: 'Testing Phase', order: 3, color: '#8B5CF6' },
      { name: 'Volume Agreement', order: 4, color: '#F59E0B' },
      { name: 'Live Integration', order: 5, color: '#10B981', isClosing: true },
      { name: 'Integration Failed', order: 6, color: '#DC2626', isLost: true }
    ]
  },

  // Processor pipeline
  'processor-partnership': {
    name: 'Processor Partnership',
    description: 'Title processing partnerships',
    applicableTypes: [OrganizationType.PROCESSOR],
    stages: [
      { name: 'Partnership Inquiry', order: 0, color: '#94A3B8' },
      { name: 'Capability Assessment', order: 1, color: '#64748B' },
      { name: 'Compliance Verification', order: 2, color: '#3B82F6' },
      { name: 'Trial Period', order: 3, color: '#8B5CF6' },
      { name: 'Performance Review', order: 4, color: '#F59E0B' },
      { name: 'Active Partnership', order: 5, color: '#10B981', isClosing: true },
      { name: 'Partnership Declined', order: 6, color: '#DC2626', isLost: true }
    ]
  }
};

// Dealer conversion configuration
export const DEALER_CONVERSION_CONFIG: DealerConversionConfig = {
  autoTriggerStages: ['Close Won', 'Active Partnership'],
  minimumDealValue: 10000,
  userRole: 'DEALER_USER',
  portalFeatures: [
    'vehicle_ordering',
    'shipment_tracking',
    'invoice_management',
    'payment_history',
    'support_tickets'
  ],
  onboardingSequence: [
    { day: 0, action: 'send_welcome_email_with_credentials', description: 'Send welcome email with login credentials' },
    { day: 1, action: 'send_portal_tutorial_video', description: 'Send portal tutorial and getting started guide' },
    { day: 3, action: 'schedule_onboarding_call', description: 'Schedule personal onboarding call' },
    { day: 7, action: 'check_first_login_status', description: 'Follow up if no login activity' },
    { day: 14, action: 'send_feature_highlights', description: 'Highlight advanced portal features' },
    { day: 30, action: 'collect_feedback_survey', description: 'Collect feedback on onboarding experience' }
  ]
};

// Utility functions
export function getOrganizationTypeConfig(type: OrganizationType): OrganizationTypeConfig {
  return ORGANIZATION_TYPE_CONFIGS[type];
}

export function getApplicablePipelines(type: OrganizationType): string[] {
  return ORGANIZATION_TYPE_CONFIGS[type].defaultPipelines;
}

export function getTypeSpecificFields(type: OrganizationType): TypeSpecificFieldDef[] {
  return ORGANIZATION_TYPE_CONFIGS[type].customFields;
}

export function isPipelineApplicableToType(pipelineId: string, organizationType: OrganizationType): boolean {
  // Client-safe fallback using static pipeline configurations
  const pipeline = TYPE_SPECIFIC_PIPELINES[pipelineId as keyof typeof TYPE_SPECIFIC_PIPELINES];
  return pipeline ? pipeline.applicableTypes.includes(organizationType) : false;
}

export function getAllPipelineIds(): string[] {
  // Client-safe fallback using static pipeline configurations
  return Object.keys(TYPE_SPECIFIC_PIPELINES);
}

export function getPipelinesForType(type: OrganizationType): string[] {
  // Client-safe fallback using static pipeline configurations
  return Object.entries(TYPE_SPECIFIC_PIPELINES)
    .filter(([_, pipeline]) => pipeline.applicableTypes.includes(type))
    .map(([id, _]) => id);
}