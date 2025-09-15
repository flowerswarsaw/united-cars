// Enhanced CRM mock system - main entry point
export * from './repositories';
export * from './enhanced-base-repository';
export * from './enhanced-persistence';
export * from './enhanced-seeds';

// Re-export core types
export * from '@united-cars/crm-core/src/rbac';
export * from '@united-cars/crm-core/src/uniqueness';
export * from '@united-cars/crm-core/src/history';
export * from '@united-cars/crm-core/src/conflict-resolution';

// Repository instances
export {
  enhancedOrganisationRepository,
  enhancedContactRepository,
  enhancedDealRepository,
  enhancedLeadRepository
} from './repositories';

// Persistence and services
export { 
  enhancedJsonPersistence,
  enhancedLocalStorageAdapter
} from './enhanced-persistence';

// Global services
export { uniquenessManager } from '@united-cars/crm-core/src/uniqueness';
export { historyLogger } from '@united-cars/crm-core/src/history';

// Initialize enhanced system
export { 
  initializeEnhancedData,
  seedEnhancedData,
  testUniquenessConstraints,
  mockUsers,
  mockEnhancedData
} from './enhanced-seeds';

// Initialization function
let isInitialized = false;

export async function initializeEnhancedCRM(): Promise<void> {
  if (isInitialized) {
    console.log('Enhanced CRM system already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing Enhanced CRM System...');

    // Import persistence
    const { enhancedJsonPersistence } = await import('./enhanced-persistence');
    
    // Try to load existing data first
    const loaded = await enhancedJsonPersistence.load();
    
    if (!loaded) {
      console.log('📦 No existing data found, initializing with sample data...');
      
      // Initialize with sample data
      const { initializeEnhancedData } = await import('./enhanced-seeds');
      await initializeEnhancedData();
      
      // Save the initial data
      await enhancedJsonPersistence.save();
    } else {
      console.log('📁 Loaded existing enhanced CRM data');
    }

    // Validate data integrity
    const stats = await enhancedJsonPersistence.getDataStatistics();
    console.log('📊 Enhanced CRM Statistics:', stats);

    const integrity = await enhancedJsonPersistence.validateDataIntegrity();
    if (!integrity.isValid) {
      console.warn('⚠️ Data integrity issues detected:', integrity.errors);
    } else {
      console.log('✅ Data integrity validated successfully');
    }

    // Test uniqueness constraints in development
    if (process.env.NODE_ENV === 'development') {
      const { testUniquenessConstraints } = await import('./enhanced-seeds');
      await testUniquenessConstraints();
    }

    isInitialized = true;
    console.log('🎉 Enhanced CRM System initialized successfully!');

  } catch (error) {
    console.error('❌ Failed to initialize Enhanced CRM System:', error);
    throw error;
  }
}

// Auto-initialize in non-production environments
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Server-side initialization
  initializeEnhancedCRM().catch(error => {
    console.error('Failed to auto-initialize enhanced CRM:', error);
  });
}

// System health check
export async function checkEnhancedSystemHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
  }>;
}> {
  const checks = [];

  try {
    // Check repositories
    const orgCount = enhancedOrganisationRepository.toJSON().length;
    const contactCount = enhancedContactRepository.toJSON().length;
    const dealCount = enhancedDealRepository.toJSON().length;
    const leadCount = enhancedLeadRepository.toJSON().length;

    checks.push({
      name: 'Repository Data',
      status: (orgCount + contactCount + dealCount + leadCount) > 0 ? 'pass' : 'warning',
      message: `${orgCount + contactCount + dealCount + leadCount} total records`,
      details: { organisations: orgCount, contacts: contactCount, deals: dealCount, leads: leadCount }
    });

    // Check uniqueness constraints
    const constraintCount = uniquenessManager.getAllConstraints().length;
    checks.push({
      name: 'Uniqueness Constraints',
      status: constraintCount >= 0 ? 'pass' : 'fail',
      message: `${constraintCount} constraints tracked`,
      details: { constraintCount }
    });

    // Check history logging
    const historyStats = historyLogger.getStatistics();
    checks.push({
      name: 'History Logging',
      status: historyStats.totalEntries >= 0 ? 'pass' : 'fail',
      message: `${historyStats.totalEntries} history entries`,
      details: historyStats
    });

    // Check data integrity
    const { enhancedJsonPersistence } = await import('./enhanced-persistence');
    const integrity = await enhancedJsonPersistence.validateDataIntegrity();
    checks.push({
      name: 'Data Integrity',
      status: integrity.isValid ? 'pass' : (integrity.warnings.length > 0 ? 'warning' : 'fail'),
      message: integrity.isValid ? 'All data valid' : `${integrity.errors.length} errors, ${integrity.warnings.length} warnings`,
      details: integrity
    });

    // Determine overall status
    const hasErrors = checks.some(c => c.status === 'fail');
    const hasWarnings = checks.some(c => c.status === 'warning');
    const status = hasErrors ? 'error' : (hasWarnings ? 'warning' : 'healthy');

    return { status, checks };

  } catch (error) {
    checks.push({
      name: 'System Check',
      status: 'fail',
      message: `Health check failed: ${error}`,
      details: { error: String(error) }
    });

    return { status: 'error', checks };
  }
}

// Development utilities
export const enhancedCRMUtils = {
  async resetSystem(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('System reset not allowed in production');
    }

    console.log('🔄 Resetting Enhanced CRM System...');
    
    // Clear all repositories
    enhancedOrganisationRepository.clear();
    enhancedContactRepository.clear();
    enhancedDealRepository.clear();
    enhancedLeadRepository.clear();
    
    // Clear uniqueness manager
    uniquenessManager.clear();
    
    // Clear history
    historyLogger.clear();
    
    // Clear persistence
    const { enhancedJsonPersistence } = await import('./enhanced-persistence');
    await enhancedJsonPersistence.clear();
    
    // Reset initialization flag
    isInitialized = false;
    
    console.log('✅ Enhanced CRM System reset completed');
  },

  async exportData(): Promise<string> {
    const data = {
      organisations: enhancedOrganisationRepository.toJSON(),
      contacts: enhancedContactRepository.toJSON(),
      deals: enhancedDealRepository.toJSON(),
      leads: enhancedLeadRepository.toJSON(),
      uniquenessConstraints: uniquenessManager.toJSON(),
      historyEntries: historyLogger.toJSON(),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  },

  async importData(jsonData: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Data import not allowed in production');
    }

    const data = JSON.parse(jsonData);
    
    // Import repository data
    enhancedOrganisationRepository.fromJSON(data.organisations || []);
    enhancedContactRepository.fromJSON(data.contacts || []);
    enhancedDealRepository.fromJSON(data.deals || []);
    enhancedLeadRepository.fromJSON(data.leads || []);
    
    // Import uniqueness constraints
    if (data.uniquenessConstraints) {
      uniquenessManager.fromJSON(data.uniquenessConstraints);
    }
    
    // Import history
    if (data.historyEntries) {
      historyLogger.fromJSON(data.historyEntries);
    }

    console.log('📥 Enhanced CRM data imported successfully');
  }
};

// Export version info
export const enhancedCRMVersion = {
  version: '2.0.0',
  features: [
    'Role-based Access Control (RBAC)',
    'Uniqueness Constraint Management',
    'Conflict Resolution System',
    'Comprehensive History Logging',
    'Enhanced Data Persistence',
    'Business Rule Validation',
    'Advanced Search & Filtering',
    'Bulk Operations Support',
    'Data Integrity Validation',
    'Development Utilities'
  ],
  compatibility: {
    crmCore: '>=1.0.0',
    node: '>=18.0.0',
    nextjs: '>=14.0.0'
  }
};