import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { EnhancedPersistenceManager } from '@united-cars/crm-mocks/src/persistence/enhanced-persistence';
import { 
  EnhancedOrganisationRepository,
  EnhancedContactRepository,
  EnhancedDealRepository,
  EnhancedLeadRepository,
  EnhancedTaskRepository,
  EnhancedPipelineRepository
} from '@united-cars/crm-mocks/src/repositories';
import { UniquenessManager } from '@united-cars/crm-core/src/uniqueness';
import { HistoryLogger } from '@united-cars/crm-core/src/history';
import TestDataFactory from '../test-utils/factories';
import { UserRole } from '@united-cars/crm-core';

// Global test configuration
export interface TestContext {
  tenantId: string;
  adminUserId: string;
  seniorManagerUserId: string;
  juniorManagerUserId: string;
  repositories: {
    organisations: EnhancedOrganisationRepository;
    contacts: EnhancedContactRepository;
    deals: EnhancedDealRepository;
    leads: EnhancedLeadRepository;
    tasks: EnhancedTaskRepository;
    pipelines: EnhancedPipelineRepository;
  };
  uniquenessManager: UniquenessManager;
  historyLogger: HistoryLogger;
  persistenceManager: EnhancedPersistenceManager;
}

// Global test context
let globalTestContext: TestContext;

// Test database cleanup utilities
export function clearTestData() {
  if (globalTestContext) {
    // Clear all repositories
    Object.values(globalTestContext.repositories).forEach(repo => {
      if (repo && typeof repo.clear === 'function') {
        repo.clear();
      }
    });
    
    // Clear uniqueness constraints
    globalTestContext.uniquenessManager.clear();
    
    // Clear history logs
    globalTestContext.historyLogger.clear();
  }
}

// Initialize test environment
export async function initializeTestEnvironment(): Promise<TestContext> {
  const tenantId = 'test-tenant';
  const adminUserId = 'test-admin-user';
  const seniorManagerUserId = 'test-senior-manager-user';
  const juniorManagerUserId = 'test-junior-manager-user';

  // Initialize core services
  const uniquenessManager = new UniquenessManager();
  const historyLogger = new HistoryLogger();
  const persistenceManager = new EnhancedPersistenceManager({
    filePath: null, // In-memory only for tests
    autoSave: false,
    loadOnInit: false
  });

  // Initialize repositories
  const organisations = new EnhancedOrganisationRepository(
    uniquenessManager,
    historyLogger,
    persistenceManager
  );

  const contacts = new EnhancedContactRepository(
    uniquenessManager,
    historyLogger,
    persistenceManager
  );

  const pipelines = new EnhancedPipelineRepository(
    uniquenessManager,
    historyLogger,
    persistenceManager
  );

  const deals = new EnhancedDealRepository(
    uniquenessManager,
    historyLogger,
    persistenceManager,
    pipelines
  );

  const leads = new EnhancedLeadRepository(
    uniquenessManager,
    historyLogger,
    persistenceManager
  );

  const tasks = new EnhancedTaskRepository(
    uniquenessManager,
    historyLogger,
    persistenceManager
  );

  const context: TestContext = {
    tenantId,
    adminUserId,
    seniorManagerUserId,
    juniorManagerUserId,
    repositories: {
      organisations,
      contacts,
      deals,
      leads,
      tasks,
      pipelines
    },
    uniquenessManager,
    historyLogger,
    persistenceManager
  };

  globalTestContext = context;
  return context;
}

// Seed test data with realistic scenarios
export async function seedTestData(context: TestContext) {
  const { repositories, tenantId, adminUserId, seniorManagerUserId, juniorManagerUserId } = context;

  // Create test pipelines first
  const dealerPipeline = TestDataFactory.createPipeline({
    tenantId,
    name: 'Dealer Pipeline',
    createdBy: adminUserId
  });

  const integrationPipeline = TestDataFactory.createPipeline({
    tenantId,
    name: 'Integration Pipeline',
    createdBy: adminUserId
  });

  await repositories.pipelines.create(dealerPipeline, {
    userRole: UserRole.ADMIN,
    userId: adminUserId,
    tenantId
  });

  await repositories.pipelines.create(integrationPipeline, {
    userRole: UserRole.ADMIN,
    userId: adminUserId,
    tenantId
  });

  // Create test organisations with different ownership
  const orgs = [
    TestDataFactory.createOrganisation({
      tenantId,
      name: 'Admin Corp',
      assignedUserId: adminUserId,
      createdBy: adminUserId,
      verified: true
    }),
    TestDataFactory.createOrganisation({
      tenantId,
      name: 'Senior Manager Corp',
      assignedUserId: seniorManagerUserId,
      createdBy: seniorManagerUserId,
      verified: true
    }),
    TestDataFactory.createOrganisation({
      tenantId,
      name: 'Junior Manager Corp',
      assignedUserId: juniorManagerUserId,
      createdBy: juniorManagerUserId,
      verified: false
    }),
    TestDataFactory.createOrganisation({
      tenantId,
      name: 'Shared Corp',
      assignedUserId: adminUserId,
      createdBy: seniorManagerUserId,
      verified: true
    })
  ];

  // Create organisations
  for (const org of orgs) {
    await repositories.organisations.create(org, {
      userRole: UserRole.ADMIN,
      userId: adminUserId,
      tenantId
    });
  }

  // Create contacts for each organisation
  for (const org of orgs) {
    const contacts = [
      TestDataFactory.createContact({
        tenantId,
        organisationId: org.id,
        assignedUserId: org.assignedUserId,
        createdBy: org.createdBy,
        verified: true
      }),
      TestDataFactory.createContact({
        tenantId,
        organisationId: org.id,
        assignedUserId: org.assignedUserId,
        createdBy: org.createdBy,
        verified: false
      })
    ];

    for (const contact of contacts) {
      await repositories.contacts.create(contact, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });
    }
  }

  // Create leads with different scenarios
  const leads = [
    TestDataFactory.createLead({
      tenantId,
      isTarget: true,
      assignedUserId: seniorManagerUserId,
      createdBy: seniorManagerUserId
    }),
    TestDataFactory.createLead({
      tenantId,
      isTarget: false,
      assignedUserId: juniorManagerUserId,
      createdBy: juniorManagerUserId
    })
  ];

  for (const lead of leads) {
    await repositories.leads.create(lead, {
      userRole: UserRole.ADMIN,
      userId: adminUserId,
      tenantId
    });
  }

  // Create deals in different pipeline stages
  const deals = [
    TestDataFactory.createDeal({
      tenantId,
      pipelineId: dealerPipeline.id,
      stageId: dealerPipeline.stages[0].id,
      organisationId: orgs[0].id,
      assignedUserId: seniorManagerUserId,
      createdBy: seniorManagerUserId,
      value: 50000,
      probability: 25
    }),
    TestDataFactory.createDeal({
      tenantId,
      pipelineId: integrationPipeline.id,
      stageId: integrationPipeline.stages[1].id,
      organisationId: orgs[1].id,
      assignedUserId: juniorManagerUserId,
      createdBy: juniorManagerUserId,
      value: 75000,
      probability: 50
    })
  ];

  for (const deal of deals) {
    await repositories.deals.create(deal, {
      userRole: UserRole.ADMIN,
      userId: adminUserId,
      tenantId
    });
  }

  // Create tasks related to entities
  const tasks = [
    TestDataFactory.createTask({
      tenantId,
      entityType: 'organisation',
      entityId: orgs[0].id,
      assignedUserId: adminUserId,
      createdBy: adminUserId
    }),
    TestDataFactory.createTask({
      tenantId,
      entityType: 'deal',
      entityId: deals[0].id,
      assignedUserId: seniorManagerUserId,
      createdBy: seniorManagerUserId
    })
  ];

  for (const task of tasks) {
    await repositories.tasks.create(task, {
      userRole: UserRole.ADMIN,
      userId: adminUserId,
      tenantId
    });
  }

  return {
    orgs,
    leads,
    deals,
    tasks,
    pipelines: [dealerPipeline, integrationPipeline]
  };
}

// Jest global setup
beforeAll(async () => {
  // Initialize test environment
  globalTestContext = await initializeTestEnvironment();
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.CRM_PERSISTENCE_TYPE = 'memory';
  
  console.log('Test environment initialized');
});

afterAll(async () => {
  // Cleanup global resources
  clearTestData();
  console.log('Test environment cleaned up');
});

beforeEach(async () => {
  // Clear data before each test
  clearTestData();
  
  // Seed fresh test data
  await seedTestData(globalTestContext);
});

afterEach(async () => {
  // Additional cleanup after each test
  // This ensures no test pollution
});

// Export test context for use in tests
export function getTestContext(): TestContext {
  if (!globalTestContext) {
    throw new Error('Test context not initialized. Make sure test setup is properly configured.');
  }
  return globalTestContext;
}

// Utility functions for common test scenarios
export class TestScenarios {
  static async createUniquenessConflictScenario(context: TestContext) {
    const { repositories, tenantId, adminUserId } = context;
    const sharedEmail = 'conflict@example.com';

    // Create first organisation with unique email
    const firstOrg = TestDataFactory.createOrganisation({
      tenantId,
      contactMethods: [
        TestDataFactory.createContactMethod({
          type: 'email' as any,
          value: sharedEmail,
          primary: true
        })
      ],
      createdBy: adminUserId,
      verified: true
    });

    await repositories.organisations.create(firstOrg, {
      userRole: UserRole.ADMIN,
      userId: adminUserId,
      tenantId
    });

    // Attempt to create second organisation with same email
    const secondOrg = TestDataFactory.createOrganisation({
      tenantId,
      contactMethods: [
        TestDataFactory.createContactMethod({
          type: 'email' as any,
          value: sharedEmail,
          primary: true
        })
      ],
      createdBy: adminUserId
    });

    return { firstOrg, secondOrg, sharedEmail };
  }

  static async createRoleBasedAccessScenario(context: TestContext) {
    const { repositories, tenantId, adminUserId, seniorManagerUserId, juniorManagerUserId } = context;

    const orgsByRole = {
      admin: TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      }),
      seniorManager: TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: seniorManagerUserId,
        createdBy: seniorManagerUserId
      }),
      juniorManager: TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: juniorManagerUserId,
        createdBy: juniorManagerUserId
      })
    };

    for (const org of Object.values(orgsByRole)) {
      await repositories.organisations.create(org, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });
    }

    return orgsByRole;
  }

  static async createLeadConversionScenario(context: TestContext) {
    const { repositories, tenantId, adminUserId } = context;

    // Get a pipeline for conversion
    const pipelinesResult = await repositories.pipelines.findAll({
      userRole: UserRole.ADMIN,
      userId: adminUserId,
      tenantId
    });

    const pipeline = pipelinesResult.data![0];

    // Create target lead ready for conversion
    const targetLead = TestDataFactory.createLead({
      tenantId,
      isTarget: true,
      status: 'qualified' as any,
      assignedUserId: adminUserId,
      createdBy: adminUserId
    });

    await repositories.leads.create(targetLead, {
      userRole: UserRole.ADMIN,
      userId: adminUserId,
      tenantId
    });

    return { targetLead, pipeline };
  }
}

export default {
  initializeTestEnvironment,
  seedTestData,
  clearTestData,
  getTestContext,
  TestScenarios
};