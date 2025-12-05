import { 
  Pipeline, 
  Stage, 
  LostReason, 
  EnhancedDeal,
  PipelineStats,
  getAllPipelines,
  getPipelineById,
  getDefaultPipeline,
  getAllLostReasons,
  getLostReasonById,
  getAllEnhancedDeals,
  getEnhancedDealById,
  calculateSlaBreachDays,
  isDeadlocked
} from '../pipeline-data';
import { ensureMigrationCompleted, updateEnhancedDealStore } from './migration-service';

export type PipelineUserRole = 'admin' | 'senior' | 'junior';

export interface User {
  id: string;
  role: PipelineUserRole;
  assignedDeals?: string[];
}

/**
 * Maps session user roles array to pipeline-service role
 * Session user has `roles: string[]`, pipeline service expects single role
 */
export function mapSessionUserToPipelineUser(sessionUser: { id?: string; roles?: string[] } | undefined): User {
  const roles = sessionUser?.roles?.map(r => r.toLowerCase()) ?? [];

  let role: PipelineUserRole = 'junior';
  if (roles.includes('admin') || roles.includes('super_admin')) {
    role = 'admin';
  } else if (roles.includes('senior') || roles.includes('senior_sales_manager')) {
    role = 'senior';
  }

  return {
    id: sessionUser?.id || 'anonymous',
    role
  };
}

export interface HistoryEntry {
  id: string;
  entityType: 'PIPELINE' | 'STAGE' | 'DEAL' | 'LOST_REASON';
  entityId: string;
  action: string;
  changes: Record<string, any>;
  actorId: string;
  timestamp: string;
}

export interface ReorderStageInput {
  pipelineId: string;
  items: Array<{
    stageId: string;
    order: number;
  }>;
}

export interface RemapTarget {
  targetStageId?: string;
  targetOutcome?: 'lost';
  lostReasonId?: string;
  lostNote?: string;
}

// History logging
const historyStore = new Map<string, HistoryEntry>();

function logHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  const historyEntry: HistoryEntry = {
    ...entry,
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  
  historyStore.set(historyEntry.id, historyEntry);
  console.log('History logged:', historyEntry);
  return historyEntry;
}

// RBAC helper functions
export function hasPermission(user: User, action: string, resourceId?: string): boolean {
  // TODO: Temporary dev mode - allow all authenticated users for testing
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return true;
  }
  
  switch (action) {
    case 'pipeline:create':
    case 'pipeline:update':
    case 'pipeline:delete':
    case 'pipeline:set-default':
    case 'stage:create':
    case 'stage:update':
    case 'stage:delete':
    case 'stage:reorder':
    case 'lost-reason:create':
    case 'lost-reason:update':
    case 'lost-reason:delete':
    case 'deal:unfinalize':
      return user.role === 'admin';
    
    case 'deal:move':
    case 'deal:mark-won':
    case 'deal:mark-lost':
      if (user.role === 'admin') return true;
      if (user.role === 'senior') return true;
      if (user.role === 'junior' && resourceId && user.assignedDeals?.includes(resourceId)) return true;
      return false;
    
    case 'pipeline:read':
    case 'stage:read':
    case 'lost-reason:read':
      return true; // All roles can read
    
    case 'deal:read':
      if (user.role === 'admin' || user.role === 'senior') return true;
      if (user.role === 'junior' && resourceId && user.assignedDeals?.includes(resourceId)) return true;
      return false;
    
    default:
      return false;
  }
}

// Pipeline Management Service
export class PipelineService {
  private async ensureInitialized(): Promise<void> {
    await ensureMigrationCompleted();
  }

  // Pipeline CRUD operations
  async createPipeline(user: User, pipelineData: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ pipeline: Pipeline; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'pipeline:create')) {
      throw new Error('Insufficient permissions to create pipeline');
    }

    await this.ensureInitialized();

    const pipeline: Pipeline = {
      ...pipelineData,
      id: `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const store = globalThis.__pipelineStore || new Map();
    store.set(pipeline.id, pipeline);
    globalThis.__pipelineStore = store;

    const historyEntry = logHistory({
      entityType: 'PIPELINE',
      entityId: pipeline.id,
      action: 'CREATED',
      changes: { pipeline },
      actorId: user.id
    });

    return { pipeline, historyEntry };
  }

  async updatePipeline(user: User, pipelineId: string, updates: Partial<Pipeline>): Promise<{ pipeline: Pipeline; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'pipeline:update')) {
      throw new Error('Insufficient permissions to update pipeline');
    }

    await this.ensureInitialized();

    const store = globalThis.__pipelineStore || new Map();
    const pipeline = store.get(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    const oldPipeline = { ...pipeline };
    const updatedPipeline = {
      ...pipeline,
      ...updates,
      id: pipelineId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    store.set(pipelineId, updatedPipeline);
    globalThis.__pipelineStore = store;

    const historyEntry = logHistory({
      entityType: 'PIPELINE',
      entityId: pipelineId,
      action: 'UPDATED',
      changes: { old: oldPipeline, new: updatedPipeline },
      actorId: user.id
    });

    return { pipeline: updatedPipeline, historyEntry };
  }

  async setDefaultPipeline(user: User, pipelineId: string): Promise<{ pipeline: Pipeline; previousDefaultId: string | null; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'pipeline:set-default')) {
      throw new Error('Insufficient permissions to set default pipeline');
    }

    await this.ensureInitialized();

    const store = globalThis.__pipelineStore || new Map();
    const pipeline = store.get(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    // Atomic operation: unset previous default and set new one
    let previousDefaultId: string | null = null;
    
    // Find and unset current default
    for (const [id, p] of store.entries()) {
      if (p.isDefault) {
        previousDefaultId = id;
        store.set(id, {
          ...p,
          isDefault: false,
          updatedAt: new Date().toISOString()
        });
        break;
      }
    }

    // Set new default
    const updatedPipeline = {
      ...pipeline,
      isDefault: true,
      updatedAt: new Date().toISOString()
    };
    store.set(pipelineId, updatedPipeline);
    globalThis.__pipelineStore = store;

    const historyEntry = logHistory({
      entityType: 'PIPELINE',
      entityId: pipelineId,
      action: 'SET_DEFAULT',
      changes: { 
        newDefault: pipelineId, 
        previousDefault: previousDefaultId 
      },
      actorId: user.id
    });

    return { pipeline: updatedPipeline, previousDefaultId, historyEntry };
  }

  async deletePipeline(user: User, pipelineId: string, remapTarget?: { targetPipelineId: string; targetStageId: string }): Promise<{ success: boolean; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'pipeline:delete')) {
      throw new Error('Insufficient permissions to delete pipeline');
    }

    await this.ensureInitialized();

    const store = globalThis.__pipelineStore || new Map();
    const pipeline = store.get(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    if (pipeline.isDefault && !remapTarget) {
      throw new Error('Cannot delete default pipeline without setting a new default first');
    }

    // Check for deals using this pipeline
    const deals = getAllEnhancedDeals().filter(d => d.pipelineId === pipelineId);
    if (deals.length > 0 && !remapTarget) {
      throw new Error(`Cannot delete pipeline with ${deals.length} active deals. Provide remap target.`);
    }

    // Remap deals if target provided
    if (deals.length > 0 && remapTarget) {
      const dealStore = globalThis.__enhancedDealStore || new Map();
      
      for (const deal of deals) {
        if (isDeadlocked(deal.outcome, deal.isFrozen)) {
          throw new Error(`Cannot remap frozen deal ${deal.id}`);
        }

        const updatedDeal = {
          ...deal,
          pipelineId: remapTarget.targetPipelineId,
          stageId: remapTarget.targetStageId,
          enteredStageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        dealStore.set(deal.id, updatedDeal);
      }
      
      globalThis.__enhancedDealStore = dealStore;
    }

    // Delete pipeline
    store.delete(pipelineId);
    globalThis.__pipelineStore = store;

    const historyEntry = logHistory({
      entityType: 'PIPELINE',
      entityId: pipelineId,
      action: 'DELETED',
      changes: { 
        deletedPipeline: pipeline,
        remappedDeals: deals.length,
        remapTarget 
      },
      actorId: user.id
    });

    return { success: true, historyEntry };
  }

  // Stage Management
  async reorderStages(user: User, input: ReorderStageInput): Promise<{ stages: Stage[]; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'stage:reorder')) {
      throw new Error('Insufficient permissions to reorder stages');
    }

    await this.ensureInitialized();

    const store = globalThis.__pipelineStore || new Map();
    const pipeline = store.get(input.pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    // Validate contiguous ordering
    const orders = input.items.map(item => item.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new Error('Stage orders must be contiguous starting from 1');
      }
    }

    // Update stage orders
    const updatedStages = pipeline.stages.map(stage => {
      const reorderItem = input.items.find(item => item.stageId === stage.id);
      if (reorderItem) {
        return {
          ...stage,
          order: reorderItem.order
        };
      }
      return stage;
    }).sort((a, b) => a.order - b.order);

    const updatedPipeline = {
      ...pipeline,
      stages: updatedStages,
      updatedAt: new Date().toISOString()
    };

    store.set(input.pipelineId, updatedPipeline);
    globalThis.__pipelineStore = store;

    const historyEntry = logHistory({
      entityType: 'STAGE',
      entityId: input.pipelineId,
      action: 'REORDERED',
      changes: { 
        pipelineId: input.pipelineId,
        reorderItems: input.items 
      },
      actorId: user.id
    });

    return { stages: updatedStages, historyEntry };
  }

  async addStage(user: User, pipelineId: string, stageData: { name: string; color?: string; isClosing?: boolean; isLost?: boolean; wipLimit?: number; slaTarget?: number; order?: number }): Promise<{ stage: Stage; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'pipeline:update')) {
      throw new Error('Insufficient permissions to add stage');
    }

    await this.ensureInitialized();

    const store = globalThis.__pipelineStore || new Map();
    const pipeline = store.get(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    // Generate stage ID
    const stageId = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine order - if not provided, add at the end
    const maxOrder = pipeline.stages.length > 0 ? Math.max(...pipeline.stages.map(s => s.order)) : 0;
    const order = stageData.order || (maxOrder + 1);

    const newStage: Stage = {
      id: stageId,
      label: stageData.name,
      color: stageData.color || '#6B7280',
      isClosing: stageData.isClosing || false,
      isLost: stageData.isLost || false,
      order: order,
      wipLimit: stageData.wipLimit,
      slaTarget: stageData.slaTarget
    };

    // Add stage to pipeline
    const updatedPipeline = {
      ...pipeline,
      stages: [...pipeline.stages, newStage],
      updatedAt: new Date().toISOString()
    };

    store.set(pipelineId, updatedPipeline);
    globalThis.__pipelineStore = store;

    const historyEntry = logHistory({
      entityType: 'STAGE',
      entityId: stageId,
      action: 'CREATED',
      changes: { 
        pipelineId: pipelineId,
        stage: newStage 
      },
      actorId: user.id
    });

    return { stage: newStage, historyEntry };
  }

  async updateStage(user: User, stageId: string, updates: { label?: string; color?: string; isClosing?: boolean; isLost?: boolean; wipLimit?: number; slaTarget?: number }): Promise<{ stage: Stage; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'pipeline:update')) {
      throw new Error('Insufficient permissions to update stage');
    }

    await this.ensureInitialized();

    // Find the stage and pipeline
    const pipelineStore = globalThis.__pipelineStore || new Map();
    let targetPipeline: Pipeline | null = null;
    let targetStage: Stage | null = null;

    for (const pipeline of pipelineStore.values()) {
      const stage = pipeline.stages.find(s => s.id === stageId);
      if (stage) {
        targetPipeline = pipeline;
        targetStage = stage;
        break;
      }
    }

    if (!targetPipeline || !targetStage) {
      throw new Error('Stage not found');
    }

    // Update the stage
    const updatedStage: Stage = {
      ...targetStage,
      ...updates
    };

    // Update the pipeline with the new stage
    const updatedPipeline = {
      ...targetPipeline,
      stages: targetPipeline.stages.map(s => s.id === stageId ? updatedStage : s),
      updatedAt: new Date().toISOString()
    };

    pipelineStore.set(targetPipeline.id, updatedPipeline);
    globalThis.__pipelineStore = pipelineStore;

    const historyEntry = logHistory({
      entityType: 'STAGE',
      entityId: stageId,
      action: 'UPDATED',
      changes: { 
        pipelineId: targetPipeline.id,
        old: targetStage,
        new: updatedStage
      },
      actorId: user.id
    });

    return { stage: updatedStage, historyEntry };
  }

  async stageHasDeals(stageId: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const dealStore = globalThis.__enhancedDealStore || new Map();
    const dealsInStage = Array.from(dealStore.values()).filter(d => d.stageId === stageId);
    
    return dealsInStage.length > 0;
  }

  async deleteStage(user: User, stageId: string, remapTarget: RemapTarget | null): Promise<{ success: boolean; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'stage:delete')) {
      throw new Error('Insufficient permissions to delete stage');
    }

    await this.ensureInitialized();

    // Find the stage and pipeline
    const pipelineStore = globalThis.__pipelineStore || new Map();
    let targetPipeline: Pipeline | null = null;
    let targetStage: Stage | null = null;

    for (const pipeline of pipelineStore.values()) {
      const stage = pipeline.stages.find(s => s.id === stageId);
      if (stage) {
        targetPipeline = pipeline;
        targetStage = stage;
        break;
      }
    }

    if (!targetPipeline || !targetStage) {
      throw new Error('Stage not found');
    }

    // Check for deals in this stage
    const dealStore = globalThis.__enhancedDealStore || new Map();
    const dealsInStage = Array.from(dealStore.values()).filter(d => d.stageId === stageId);

    if (dealsInStage.length > 0) {
      if (!remapTarget) {
        throw new Error('Remap target required for stage deletion because stage contains deals');
      }

      // Remap deals
      for (const deal of dealsInStage) {
        if (isDeadlocked(deal.outcome, deal.isFrozen)) {
          throw new Error(`Cannot remap frozen deal ${deal.id}`);
        }

        let updatedDeal: EnhancedDeal;

        if (remapTarget.targetOutcome === 'lost') {
          if (!remapTarget.lostReasonId) {
            throw new Error('Lost reason required for lost outcome');
          }

          updatedDeal = {
            ...deal,
            stageId: null,
            outcome: 'lost',
            lostReasonId: remapTarget.lostReasonId,
            lostNote: remapTarget.lostNote,
            lostAt: new Date().toISOString(),
            status: 'LOST',
            updatedAt: new Date().toISOString()
          };
        } else if (remapTarget.targetStageId) {
          updatedDeal = {
            ...deal,
            stageId: remapTarget.targetStageId,
            enteredStageAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          throw new Error('Either targetStageId or lost outcome must be provided');
        }

        dealStore.set(deal.id, updatedDeal);
      }

      globalThis.__enhancedDealStore = dealStore;
    }

    // Remove stage from pipeline
    const updatedStages = targetPipeline.stages.filter(s => s.id !== stageId);
    const updatedPipeline = {
      ...targetPipeline,
      stages: updatedStages,
      updatedAt: new Date().toISOString()
    };

    pipelineStore.set(targetPipeline.id, updatedPipeline);
    globalThis.__pipelineStore = pipelineStore;

    const historyEntry = logHistory({
      entityType: 'STAGE',
      entityId: stageId,
      action: 'DELETED',
      changes: { 
        deletedStage: targetStage,
        remappedDeals: dealsInStage.length,
        remapTarget 
      },
      actorId: user.id
    });

    return { success: true, historyEntry };
  }

  // Deal Operations
  async markDealWon(user: User, dealId: string): Promise<{ deal: EnhancedDeal; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'deal:mark-won', dealId)) {
      throw new Error('Insufficient permissions to mark deal as won');
    }

    await this.ensureInitialized();

    const deal = getEnhancedDealById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.outcome) {
      throw new Error('Deal already has a terminal outcome');
    }

    const updatedDeal = updateEnhancedDealStore(dealId, {
      outcome: 'won',
      wonAt: new Date().toISOString(),
      stageId: 'stage-closed-won', // Force to won stage
      isFrozen: true, // Freeze the deal
      status: 'WON'
    });

    if (!updatedDeal) {
      throw new Error('Failed to update deal');
    }

    const historyEntry = logHistory({
      entityType: 'DEAL',
      entityId: dealId,
      action: 'MARKED_WON',
      changes: { 
        outcome: 'won',
        wonAt: updatedDeal.wonAt,
        frozen: true 
      },
      actorId: user.id
    });

    return { deal: updatedDeal, historyEntry };
  }

  async markDealLost(user: User, dealId: string, lostReasonId: string, lostNote?: string): Promise<{ deal: EnhancedDeal; historyEntry: HistoryEntry }> {
    if (!hasPermission(user, 'deal:mark-lost', dealId)) {
      throw new Error('Insufficient permissions to mark deal as lost');
    }

    await this.ensureInitialized();

    const deal = getEnhancedDealById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.outcome) {
      throw new Error('Deal already has a terminal outcome');
    }

    const lostReason = getLostReasonById(lostReasonId);
    if (!lostReason || !lostReason.isActive) {
      throw new Error('Invalid or inactive lost reason');
    }

    const updatedDeal = updateEnhancedDealStore(dealId, {
      outcome: 'lost',
      lostReasonId,
      lostNote,
      lostAt: new Date().toISOString(),
      stageId: null, // Remove from stage
      status: 'LOST'
    });

    if (!updatedDeal) {
      throw new Error('Failed to update deal');
    }

    // Increment usage count for lost reason
    const reasonStore = globalThis.__lostReasonStore || new Map();
    const updatedReason = {
      ...lostReason,
      usageCount: lostReason.usageCount + 1
    };
    reasonStore.set(lostReasonId, updatedReason);
    globalThis.__lostReasonStore = reasonStore;

    const historyEntry = logHistory({
      entityType: 'DEAL',
      entityId: dealId,
      action: 'MARKED_LOST',
      changes: { 
        outcome: 'lost',
        lostReasonId,
        lostNote,
        lostAt: updatedDeal.lostAt 
      },
      actorId: user.id
    });

    return { deal: updatedDeal, historyEntry };
  }

  // Statistics
  async getPipelineStats(pipelineId: string): Promise<PipelineStats> {
    await this.ensureInitialized();

    const pipeline = getPipelineById(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    const deals = getAllEnhancedDeals().filter(d => d.pipelineId === pipelineId);
    const activeDeals = deals.filter(d => !d.outcome);
    const wonDeals = deals.filter(d => d.outcome === 'won');
    const lostDeals = deals.filter(d => d.outcome === 'lost');

    // Stage statistics
    const stageStats = pipeline.stages.map(stage => {
      const stageDeals = deals.filter(d => d.stageId === stage.id);
      const averageDaysInStage = stageDeals.length > 0 
        ? stageDeals.reduce((acc, deal) => {
            const days = Math.floor((new Date().getTime() - new Date(deal.enteredStageAt).getTime()) / (1000 * 60 * 60 * 24));
            return acc + days;
          }, 0) / stageDeals.length
        : 0;

      const slaBreachCount = stageDeals.filter(deal => {
        const breachDays = calculateSlaBreachDays(deal.enteredStageAt, stage.slaDays);
        return breachDays !== null && breachDays > 0;
      }).length;

      return {
        stageId: stage.id,
        stageName: stage.label,
        dealCount: stageDeals.length,
        averageDaysInStage: Math.round(averageDaysInStage),
        slaBreachCount
      };
    });

    // Loss reasons breakdown
    const lostReasonsMap = new Map<string, number>();
    lostDeals.forEach(deal => {
      if (deal.lostReasonId) {
        lostReasonsMap.set(deal.lostReasonId, (lostReasonsMap.get(deal.lostReasonId) || 0) + 1);
      }
    });

    const lossReasonBreakdown = Array.from(lostReasonsMap.entries()).map(([reasonId, count]) => {
      const reason = getLostReasonById(reasonId);
      return {
        reasonId,
        reasonLabel: reason?.label || 'Unknown',
        count,
        percentage: Math.round((count / lostDeals.length) * 100)
      };
    });

    return {
      pipelineId,
      stageStats,
      winRate: deals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) : 0,
      lossReasonBreakdown,
      totalDeals: deals.length,
      activeDeals: activeDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length
    };
  }
}