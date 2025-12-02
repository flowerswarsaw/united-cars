/**
 * Contracts Initialization
 *
 * Ensures contract seed data is loaded into repository.
 * This module is imported by the main index to guarantee initialization.
 *
 * If persisted data exists, contracts are loaded from there.
 * Otherwise, seed data is created.
 */

let initialized = false;

export async function initContracts() {
  if (initialized) return;

  try {
    const fs = require('fs');
    const path = require('path');
    const dataFile = path.join(process.cwd(), '.crm-data', 'data.json');

    // Check if we have persisted data with contracts
    if (fs.existsSync(dataFile)) {
      const dataStr = fs.readFileSync(dataFile, 'utf-8');
      const data = JSON.parse(dataStr);

      if (data.contracts && data.contracts.length > 0) {
        const { contractRepository } = require('./repositories');
        contractRepository.fromJSON(data.contracts);
        console.log(`[CRM-MOCKS] Loaded ${data.contracts.length} contracts from persisted data`);
        initialized = true;
        return;
      }
    }

    // No persisted contracts, seed fresh data
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
