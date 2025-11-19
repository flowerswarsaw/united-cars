export * from './base-repository';
export * from './change-tracker';
export * from './organization-scoped-repositories';
export * from './services/activity-service';
export * from './persistence';

// Export repository classes (not instances)
export { OrganisationRepository } from './repositories/organisation-repository';
export { OrganisationConnectionRepository } from './repositories/organisation-connection-repository';
export { ContactRepository } from './repositories/contact-repository';
export { LeadRepository } from './repositories/lead-repository';
export { DealRepository } from './repositories/deal-repository';
export { PipelineRepository } from './repositories/pipeline-repository';
export { TaskRepository } from './repositories/task-repository';
export { CustomFieldRepository } from './repositories/custom-field-repository';
export { ActivityRepository } from './repositories/activity-repository';

// Export specific seeded repository instances and functions from seeds
export {
  organisationRepository,
  organisationConnectionRepository,
  contactRepository,
  leadRepository,
  dealRepository,
  pipelineRepository,
  taskRepository,
  customFieldRepository,
  activityRepository,
  seedData,
  resetSeeds
} from './seeds';

// Export enhanced seeds exports
export * from './enhanced-seeds';

// Initialize with seed data on first import
import { seedData } from './seeds';
import { jsonPersistence } from './persistence';

// Initialize data synchronously to avoid race conditions
let dataInitialized = false;

// Synchronous initialization function
function initializeData() {
  if (dataInitialized) return;
  
  try {
    // Try to load persisted data synchronously using fs
    const fs = require('fs');
    const path = require('path');
    const dataFile = path.join(process.cwd(), '.crm-data', 'data.json');
    
    if (fs.existsSync(dataFile)) {
      const dataStr = fs.readFileSync(dataFile, 'utf-8');
      const data = JSON.parse(dataStr);
      
      // Load data into repositories synchronously
      const { 
        organisationRepository,
        organisationConnectionRepository,
        contactRepository,
        leadRepository,
        dealRepository,
        pipelineRepository,
        taskRepository,
        customFieldRepository,
        activityRepository
      } = require('./seeds');
      const { changeLogRepository } = require('./repositories/change-log-repository');
      
      organisationRepository.fromJSON(data.organisations || []);
      organisationConnectionRepository.fromJSON(data.organisationConnections || []);
      contactRepository.fromJSON(data.contacts || []);
      leadRepository.fromJSON(data.leads || []);
      dealRepository.fromJSON(data.deals || []);
      pipelineRepository.fromJSON(data.pipelines || []);
      pipelineRepository.stagesFromJSON(data.stages || []);
      taskRepository.fromJSON(data.tasks || []);
      customFieldRepository.fromJSON(data.customFields || { fieldDefs: [], fieldValues: [] });
      activityRepository.fromJSON(data.activities || []);
      changeLogRepository.fromJSON(data.changeLogs || []);
      
      console.log('Loaded persisted CRM data synchronously');
      dataInitialized = true;
    } else {
      console.log('No persisted data found, seeding CRM data synchronously...');

      // Load actual seed data and repositories
      const seedsModule = require('./seeds');
      const {
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
        auctionIntegrationStages,
        organisationRepository: orgRepo,
        organisationConnectionRepository: orgConnRepo,
        contactRepository: contactRepo,
        leadRepository: leadRepo,
        dealRepository: dealRepo,
        pipelineRepository: pipelineRepo,
        taskRepository: taskRepo,
        customFieldRepository: customFieldRepo
      } = seedsModule;

      // Load organizations and connections
      orgRepo.fromJSON(organisations || []);
      orgConnRepo.fromJSON(organisationConnections || []);

      // Load contacts and leads
      contactRepo.fromJSON(contacts || []);
      leadRepo.fromJSON(leads || []);

      // Load deals and tasks
      dealRepo.fromJSON(deals || []);
      taskRepo.fromJSON(tasks || []);

      // Load pipelines
      pipelineRepo.fromJSON(pipelines || []);

      // Load custom fields
      customFieldRepo.fromJSON({ fieldDefs: customFieldDefs || [], fieldValues: customFieldValues || [] });

      // Load pipeline stages
      const allStages = [
        ...(dealerAcquisitionStages || []),
        ...(dealerIntegrationStages || []),
        ...(retailSalesStages || []),
        ...(vendorOnboardingStages || []),
        ...(auctionIntegrationStages || [])
      ];
      pipelineRepo.stagesFromJSON(allStages);

      console.log('CRM data seeded successfully');
      dataInitialized = true;
    }
  } catch (error) {
    console.warn('Failed to load persisted data synchronously, falling back to seed data:', error);

    // Load actual seed data and repositories
    const seedsModule = require('./seeds');
    const {
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
      auctionIntegrationStages,
      organisationRepository: orgRepo,
      organisationConnectionRepository: orgConnRepo,
      contactRepository: contactRepo,
      leadRepository: leadRepo,
      dealRepository: dealRepo,
      pipelineRepository: pipelineRepo,
      taskRepository: taskRepo,
      customFieldRepository: customFieldRepo
    } = seedsModule;

    // Load organizations and connections
    orgRepo.fromJSON(organisations || []);
    orgConnRepo.fromJSON(organisationConnections || []);

    // Load contacts and leads
    contactRepo.fromJSON(contacts || []);
    leadRepo.fromJSON(leads || []);

    // Load deals and tasks
    dealRepo.fromJSON(deals || []);
    taskRepo.fromJSON(tasks || []);

    // Load pipelines
    pipelineRepo.fromJSON(pipelines || []);

    // Load custom fields
    customFieldRepo.fromJSON({ fieldDefs: customFieldDefs || [], fieldValues: customFieldValues || [] });

    // Load pipeline stages
    const allStages = [
      ...(dealerAcquisitionStages || []),
      ...(dealerIntegrationStages || []),
      ...(retailSalesStages || []),
      ...(vendorOnboardingStages || []),
      ...(auctionIntegrationStages || [])
    ];
    pipelineRepo.stagesFromJSON(allStages);

    dataInitialized = true;
  }
}

// Initialize data immediately on server-side
if (typeof window === 'undefined') {
  initializeData();
}

export { initializeData };