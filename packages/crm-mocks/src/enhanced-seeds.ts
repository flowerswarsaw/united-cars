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
  DealStatus,
  LeadStatus,
  LeadSource,
  TaskStatus,
  TaskPriority,
  ContactMethodType,
  SocialPlatform,
  UserRole
} from '@united-cars/crm-core';

// Enterprise Test Users for RBAC Testing
export const TEST_USERS = {
  ADMIN: {
    id: 'admin-user-001',
    name: 'System Administrator',
    email: 'admin@unitedcars.com',
    role: UserRole.ADMIN
  },
  SENIOR_MANAGER: {
    id: 'senior-mgr-001',
    name: 'Sarah Johnson',
    email: 'sarah.j@unitedcars.com',
    role: UserRole.SENIOR_SALES_MANAGER
  },
  SENIOR_MANAGER_2: {
    id: 'senior-mgr-002',
    name: 'Michael Chen',
    email: 'michael.c@unitedcars.com',
    role: UserRole.SENIOR_SALES_MANAGER
  },
  JUNIOR_MANAGER: {
    id: 'junior-mgr-001',
    name: 'David Wilson',
    email: 'david.w@unitedcars.com',
    role: UserRole.JUNIOR_SALES_MANAGER
  },
  JUNIOR_MANAGER_2: {
    id: 'junior-mgr-002',
    name: 'Emma Rodriguez',
    email: 'emma.r@unitedcars.com',
    role: UserRole.JUNIOR_SALES_MANAGER
  }
};

// Enhanced Organizations with Enterprise Features
export const enhancedOrganisations: EnhancedOrganisation[] = [
  // Admin-owned verified organization
  {
    id: 'org-admin-001',
    tenantId: 'default-tenant',
    name: 'AutoMax Luxury Dealership',
    type: 'DEALER' as any,
    description: 'Premier luxury vehicle dealership specializing in European imports',
    website: 'https://automaxluxury.com',
    address: '123 Luxury Auto Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
    contactMethods: [
      {
        id: 'cm-admin-001-1',
        type: ContactMethodType.EMAIL_WORK,
        value: 'info@automaxluxury.com',
        primary: true,
        verified: true,
        verifiedAt: new Date('2024-01-15T10:00:00Z'),
        label: 'Main Contact'
      },
      {
        id: 'cm-admin-001-2',
        type: ContactMethodType.PHONE_WORK,
        value: '+1-555-LUXURY',
        primary: true,
        verified: true,
        verifiedAt: new Date('2024-01-15T10:00:00Z'),
        label: 'Main Line'
      }
    ],
    socialMediaLinks: [
      {
        id: 'sm-admin-001-1',
        platform: SocialPlatform.INSTAGRAM,
        url: 'https://instagram.com/automaxluxury',
        username: 'automaxluxury',
        verified: true,
        verifiedAt: new Date('2024-01-15T10:00:00Z')
      }
    ],
    customFields: {
      annual_revenue: 15000000,
      specialty: 'Luxury European Vehicles',
      dealer_license: 'CA-DL-2024-001'
    },
    verified: true,
    verifiedAt: new Date('2024-01-15T10:00:00Z'),
    verifiedBy: TEST_USERS.ADMIN.id,
    assignedUserId: TEST_USERS.ADMIN.id,
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },

  // Senior Manager organization
  {
    id: 'org-senior-001',
    tenantId: 'default-tenant',
    name: 'Premier Motors East Coast',
    type: 'DEALER' as any,
    description: 'High-volume dealership serving the East Coast market',
    website: 'https://premiermotorsec.com',
    address: '456 Auto Plaza Drive',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    contactMethods: [
      {
        id: 'cm-senior-001-1',
        type: ContactMethodType.EMAIL_WORK,
        value: 'contact@premiermotorsec.com',
        primary: true,
        verified: true,
        verifiedAt: new Date('2024-01-20T14:30:00Z'),
        label: 'General Contact'
      }
    ],
    socialMediaLinks: [],
    customFields: {
      annual_revenue: 8500000,
      specialty: 'Domestic and Import Vehicles'
    },
    verified: true,
    verifiedAt: new Date('2024-01-20T14:30:00Z'),
    verifiedBy: TEST_USERS.SENIOR_MANAGER.id,
    assignedUserId: TEST_USERS.SENIOR_MANAGER.id,
    createdBy: TEST_USERS.SENIOR_MANAGER.id,
    updatedBy: TEST_USERS.SENIOR_MANAGER.id,
    createdAt: new Date('2024-01-20T14:30:00Z'),
    updatedAt: new Date('2024-01-20T14:30:00Z')
  },

  // Junior Manager organization - unverified for testing
  {
    id: 'org-junior-001',
    tenantId: 'default-tenant',
    name: 'City Cars Direct',
    type: 'DEALER' as any,
    description: 'Small volume dealer focusing on pre-owned vehicles',
    website: 'https://citycarsdirect.com',
    address: '789 Commerce Street',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    contactMethods: [
      {
        id: 'cm-junior-001-1',
        type: ContactMethodType.EMAIL_WORK,
        value: 'info@citycarsdirect.com',
        primary: true,
        verified: false,
        verifiedAt: null,
        label: 'Business Email'
      }
    ],
    socialMediaLinks: [],
    customFields: {
      annual_revenue: 1200000,
      specialty: 'Pre-owned Vehicles'
    },
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
    assignedUserId: TEST_USERS.JUNIOR_MANAGER.id,
    createdBy: TEST_USERS.JUNIOR_MANAGER.id,
    updatedBy: TEST_USERS.JUNIOR_MANAGER.id,
    createdAt: new Date('2024-02-01T09:00:00Z'),
    updatedAt: new Date('2024-02-01T09:00:00Z')
  }
];

// Enhanced Pipelines
export const enhancedPipelines: EnhancedPipeline[] = [
  {
    id: 'pipeline-dealer-acquisition',
    tenantId: 'default-tenant',
    name: 'Dealer Acquisition Pipeline',
    description: 'Main pipeline for acquiring new dealer partners',
    isActive: true,
    stages: [
      {
        id: 'stage-da-prospect',
        tenantId: 'default-tenant',
        pipelineId: 'pipeline-dealer-acquisition',
        name: 'Prospecting',
        description: 'Initial prospect identification',
        probability: 10,
        order: 0,
        color: '#6B7280',
        isActive: true,
        customFields: {},
        createdBy: TEST_USERS.ADMIN.id,
        updatedBy: TEST_USERS.ADMIN.id,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 'stage-da-won',
        tenantId: 'default-tenant',
        pipelineId: 'pipeline-dealer-acquisition',
        name: 'Closed Won',
        description: 'Deal successfully closed',
        probability: 100,
        order: 4,
        color: '#10B981',
        isActive: true,
        customFields: {},
        createdBy: TEST_USERS.ADMIN.id,
        updatedBy: TEST_USERS.ADMIN.id,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      }
    ],
    customFields: {},
    createdBy: TEST_USERS.ADMIN.id,
    updatedBy: TEST_USERS.ADMIN.id,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

// Test scenarios for business logic validation
export function createTestScenarios() {
  return {
    // Uniqueness conflict scenario
    uniquenessConflict: {
      conflictOrg: {
        ...enhancedOrganisations[0],
        id: 'org-conflict-test',
        name: 'Conflict Test Corp',
        contactMethods: [
          {
            id: 'conflict-email',
            type: ContactMethodType.EMAIL_WORK,
            value: 'info@automaxluxury.com', // Same as existing org
            primary: true,
            verified: false,
            verifiedAt: null,
            label: 'Conflicting Email'
          }
        ]
      }
    },

    // RBAC scenarios
    rbacScenarios: {
      adminCanSeeAll: enhancedOrganisations,
      seniorManagerAssigned: enhancedOrganisations.filter(org => 
        org.assignedUserId === TEST_USERS.SENIOR_MANAGER.id
      ),
      juniorManagerAssigned: enhancedOrganisations.filter(org => 
        org.assignedUserId === TEST_USERS.JUNIOR_MANAGER.id
      )
    }
  };
}

