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
export * from './seeds';
export * from './persistence';

// Initialize with seed data on first import
import { seedData } from './seeds';
import { jsonPersistence } from './persistence';

// Force immediate seeding for now - we'll handle persistence later
if (typeof window === 'undefined') {
  console.log('Seeding CRM data...');
  seedData();
  console.log('CRM data seeded successfully');
}