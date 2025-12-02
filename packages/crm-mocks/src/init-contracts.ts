/**
 * Contracts Initialization
 *
 * Ensures contract seed data is loaded into repository.
 * This module is imported by the main index to guarantee initialization.
 */

let initialized = false;

export async function initContracts() {
  if (initialized) return;

  try {
    const { seedContracts } = require('./contracts-seeds');
    await seedContracts();
    initialized = true;
  } catch (error) {
    console.error('[CRM-MOCKS] Failed to initialize contracts:', error);
    // Don't throw - contracts are optional, system should still work
  }
}

// Auto-initialize on server-side
if (typeof window === 'undefined') {
  initContracts();
}
