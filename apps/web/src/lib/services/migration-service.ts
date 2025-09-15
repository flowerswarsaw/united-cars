import { getAllDeals } from '../test-deals-data';
import { 
  EnhancedDeal, 
  LEGACY_STAGE_MAPPING,
  DEFAULT_PIPELINE,
  saveEnhancedDeals
} from '../pipeline-data';

export interface MigrationReport {
  totalDeals: number;
  migratedDeals: number;
  unmappedStages: Array<{
    dealId: string;
    dealTitle: string;
    originalStage: string;
    assignedStage: string;
  }>;
  timestamp: string;
}

export async function migrateLegacyDealsToEnhanced(): Promise<MigrationReport> {
  console.log('Starting legacy deals migration...');
  
  const legacyDeals = getAllDeals();
  const enhancedDeals = new Map<string, EnhancedDeal>();
  const unmappedStages: MigrationReport['unmappedStages'] = [];
  
  for (const legacyDeal of legacyDeals) {
    try {
      const currentStage = legacyDeal.currentStages?.[0];
      const originalStageId = currentStage?.stageId;
      
      // Map legacy stage to new canonical stage
      let newStageId = originalStageId ? LEGACY_STAGE_MAPPING[originalStageId] : null;
      
      // If no mapping found, default to investigation and log it
      if (!newStageId) {
        newStageId = 'stage-investigation';
        if (originalStageId) {
          unmappedStages.push({
            dealId: legacyDeal.id,
            dealTitle: legacyDeal.title,
            originalStage: originalStageId,
            assignedStage: newStageId
          });
        }
      }
      
      // Determine outcome based on legacy status
      let outcome: 'won' | 'lost' | null = null;
      let wonAt: string | undefined;
      let lostAt: string | undefined;
      let isFrozen = false;
      
      if (legacyDeal.status === 'WON') {
        outcome = 'won';
        wonAt = legacyDeal.updatedAt;
        newStageId = 'stage-closed-won';
        isFrozen = true;
      } else if (legacyDeal.status === 'LOST') {
        outcome = 'lost';
        lostAt = legacyDeal.updatedAt;
        newStageId = null; // Lost deals don't have a stage
      }
      
      // Create enhanced deal
      const enhancedDeal: EnhancedDeal = {
        id: legacyDeal.id,
        title: legacyDeal.title,
        description: legacyDeal.description,
        value: legacyDeal.value,
        currency: legacyDeal.currency,
        status: legacyDeal.status,
        contactId: legacyDeal.contactId,
        organisationId: legacyDeal.organisationId,
        
        // Enhanced pipeline fields
        pipelineId: DEFAULT_PIPELINE.id,
        stageId: newStageId,
        enteredStageAt: currentStage?.enteredAt || legacyDeal.updatedAt || legacyDeal.createdAt,
        
        // Terminal outcome tracking
        outcome,
        lostReasonId: undefined, // Will need to be set manually for existing lost deals
        lostNote: legacyDeal.lossReason || undefined,
        wonAt,
        lostAt,
        isFrozen,
        
        // Enhanced compatibility - always use correct pipeline/stage references
        currentStages: newStageId ? [{
          pipelineId: DEFAULT_PIPELINE.id,
          stageId: newStageId,
          enteredAt: currentStage?.enteredAt || legacyDeal.updatedAt || legacyDeal.createdAt
        }] : [],
        
        expectedCloseDate: legacyDeal.expectedCloseDate,
        lastActivityDate: legacyDeal.lastActivityDate,
        customFields: legacyDeal.customFields || {},
        createdAt: legacyDeal.createdAt,
        updatedAt: legacyDeal.updatedAt
      };
      
      enhancedDeals.set(enhancedDeal.id, enhancedDeal);
      
    } catch (error) {
      console.error(`Failed to migrate deal ${legacyDeal.id}:`, error);
      // Create a minimal enhanced deal for failed migrations
      const fallbackDeal: EnhancedDeal = {
        id: legacyDeal.id,
        title: legacyDeal.title,
        description: legacyDeal.description,
        value: legacyDeal.value,
        currency: legacyDeal.currency,
        status: 'ACTIVE',
        contactId: legacyDeal.contactId,
        organisationId: legacyDeal.organisationId,
        pipelineId: DEFAULT_PIPELINE.id,
        stageId: 'stage-investigation',
        enteredStageAt: new Date().toISOString(),
        outcome: null,
        isFrozen: false,
        currentStages: [{
          pipelineId: DEFAULT_PIPELINE.id,
          stageId: 'stage-investigation',
          enteredAt: new Date().toISOString()
        }],
        expectedCloseDate: legacyDeal.expectedCloseDate,
        lastActivityDate: legacyDeal.lastActivityDate,
        customFields: legacyDeal.customFields || {},
        createdAt: legacyDeal.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      enhancedDeals.set(fallbackDeal.id, fallbackDeal);
      
      unmappedStages.push({
        dealId: legacyDeal.id,
        dealTitle: legacyDeal.title,
        originalStage: 'ERROR',
        assignedStage: 'stage-investigation'
      });
    }
  }
  
  // Save enhanced deals to global store
  globalThis.__enhancedDealStore = enhancedDeals;
  saveEnhancedDeals(enhancedDeals);
  
  const report: MigrationReport = {
    totalDeals: legacyDeals.length,
    migratedDeals: enhancedDeals.size,
    unmappedStages,
    timestamp: new Date().toISOString()
  };
  
  // Save migration report
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(process.cwd(), '.pipeline-data', 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Migration completed: ${report.migratedDeals}/${report.totalDeals} deals migrated`);
  if (report.unmappedStages.length > 0) {
    console.log(`${report.unmappedStages.length} deals had unmapped stages and were assigned to investigation`);
  }
  
  return report;
}

export function generateMigrationCSV(report: MigrationReport): string {
  const headers = ['Deal ID', 'Deal Title', 'Original Stage', 'Assigned Stage'];
  const rows = report.unmappedStages.map(stage => [
    stage.dealId,
    `"${stage.dealTitle.replace(/"/g, '""')}"`, // Escape quotes in CSV
    stage.originalStage,
    stage.assignedStage
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

export async function ensureMigrationCompleted(): Promise<boolean> {
  try {
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), '.pipeline-data', 'migration-report.json');
    
    // Check if migration has already been completed
    if (fs.existsSync(reportPath)) {
      console.log('Migration already completed, skipping...');
      return true;
    }
    
    // Check if we have enhanced deals data
    const enhancedDealsPath = path.join(process.cwd(), '.pipeline-data', 'enhanced-deals.json');
    if (fs.existsSync(enhancedDealsPath)) {
      console.log('Enhanced deals data already exists, skipping migration...');
      return true;
    }
    
    // Run migration
    await migrateLegacyDealsToEnhanced();
    return true;
    
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Helper function to update global enhanced deal store
export function updateEnhancedDealStore(dealId: string, updates: Partial<EnhancedDeal>): EnhancedDeal | null {
  const store = globalThis.__enhancedDealStore;
  if (!store) return null;
  
  const deal = store.get(dealId);
  if (!deal) return null;
  
  const updatedDeal = {
    ...deal,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  store.set(dealId, updatedDeal);
  globalThis.__enhancedDealStore = store;
  saveEnhancedDeals(store);
  
  return updatedDeal;
}

// Helper function to create new enhanced deal
export function createEnhancedDeal(dealData: Omit<EnhancedDeal, 'id' | 'createdAt' | 'updatedAt'>): EnhancedDeal {
  const newDeal: EnhancedDeal = {
    ...dealData,
    id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const store = globalThis.__enhancedDealStore || new Map();
  store.set(newDeal.id, newDeal);
  globalThis.__enhancedDealStore = store;
  saveEnhancedDeals(store);
  
  return newDeal;
}