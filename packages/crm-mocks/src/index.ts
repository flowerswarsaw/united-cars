export * from './base-repository';
export * from './repositories/organisation-repository';
export * from './repositories/organisation-connection-repository';
export * from './repositories/contact-repository';
export * from './repositories/lead-repository';
export * from './repositories/deal-repository';
export * from './repositories/pipeline-repository';
export * from './repositories/task-repository';
export * from './repositories/custom-field-repository';
export * from './repositories/activity-repository';
export * from './repositories/change-log-repository';
export * from './change-tracker';
export * from './organization-scoped-repositories';
export * from './services/activity-service';
export * from './seeds';
export * from './persistence';

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
      seedData();
      console.log('CRM data seeded successfully');
      dataInitialized = true;
    }
  } catch (error) {
    console.warn('Failed to load persisted data synchronously, falling back to seed data:', error);
    seedData();
    dataInitialized = true;
  }
}

// Initialize data immediately on server-side
if (typeof window === 'undefined') {
  initializeData();
}

export { initializeData };