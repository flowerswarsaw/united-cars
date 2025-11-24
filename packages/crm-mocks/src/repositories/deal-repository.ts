import { 
  Deal,
  DealRepository as IDealRepository,
  DealStatus,
  LossReason,
  makeDealCurrentStage,
  makeDealStageHistory,
  makeActivity,
  ActivityType,
  EntityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { activityRepository } from './activity-repository';
import { pipelineRepository } from './pipeline-repository';
// import { dealValidator } from '../validators';

class DealRepositoryImpl extends BaseRepository<Deal> implements IDealRepository {
  constructor() {
    super();
    // this.setValidator(dealValidator);
    this.setEntityType(EntityType.DEAL);
  }

  async create(data: Omit<Deal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, createdBy?: string): Promise<Deal> {
    // Initialize currentStages array if pipelineId and stageId are provided
    const enhancedData = { ...data };

    // Check if we have pipelineId and stageId but no currentStages
    const hasPipelineAndStage = (data as any).pipelineId && (data as any).stageId;
    if (hasPipelineAndStage && (!data.currentStages || data.currentStages.length === 0)) {
      const currentStage = makeDealCurrentStage(
        '', // Will be set after creation
        (data as any).pipelineId,
        (data as any).stageId
      );
      enhancedData.currentStages = [currentStage];
    }

    const deal = await super.create(enhancedData, createdBy);

    // Update the currentStage dealId to match the created deal's ID
    if (deal.currentStages && deal.currentStages.length > 0) {
      deal.currentStages = deal.currentStages.map(cs => ({
        ...cs,
        dealId: deal.id
      }));
    }

    // Track deal creation - use a default user ID if none provided for testing
    const userId = createdBy || 'system';

    try {
      const { ChangeTracker } = await import('../change-tracker');
      await ChangeTracker.trackEntityChange(
        EntityType.DEAL,
        deal.id,
        null,
        deal,
        userId,
        ActivityType.CREATED,
        undefined,
        { userName: userId }
      );
    } catch (error) {
      console.warn('Failed to track deal creation:', error);
    }

    return deal;
  }

  async update(id: string, data: Partial<Omit<Deal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>, updatedBy?: string): Promise<Deal | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;

    // If pipelineId and stageId are being updated, also update currentStages
    const enhancedData = { ...data };
    const hasPipelineAndStage = (data as any).pipelineId && (data as any).stageId;

    if (hasPipelineAndStage) {
      // Update or create currentStages entry for this pipeline
      let updatedCurrentStages = existing.currentStages ? [...existing.currentStages] : [];
      const existingIndex = updatedCurrentStages.findIndex(cs => cs.pipelineId === (data as any).pipelineId);

      const newCurrentStage = makeDealCurrentStage(
        id,
        (data as any).pipelineId,
        (data as any).stageId
      );

      if (existingIndex >= 0) {
        updatedCurrentStages[existingIndex] = newCurrentStage;
      } else {
        updatedCurrentStages.push(newCurrentStage);
      }

      enhancedData.currentStages = updatedCurrentStages;
    }

    const updated = await super.update(id, enhancedData, updatedBy);

    // Track deal update
    if (updated && updatedBy) {
      try {
        const { ChangeTracker } = await import('../change-tracker');
        await ChangeTracker.trackEntityChange(
          EntityType.DEAL,
          id,
          existing,
          updated,
          updatedBy,
          ActivityType.UPDATED,
          undefined,
          { userName: updatedBy }
        );
      } catch (error) {
        console.warn('Failed to track deal update:', error);
      }
    }

    return updated;
  }
  async moveStage(
    dealId: string, 
    input: { 
      pipelineId: string; 
      toStageId: string; 
      targetIndex?: number;
      note?: string; 
      lossReason?: LossReason;
      movedBy?: string;
    }
  ): Promise<Deal | undefined> {
    const deal = await this.get(dealId);
    if (!deal) return undefined;

    const pipeline = await pipelineRepository.getWithStages(input.pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    const toStage = pipeline.stages?.find(s => s.id === input.toStageId);
    if (!toStage) throw new Error('Stage not found');

    // Get current stage for this pipeline
    const currentStage = deal.currentStages?.find(cs => cs.pipelineId === input.pipelineId);
    const fromStageId = currentStage?.stageId;

    // Create history entry
    const historyEntry = makeDealStageHistory(
      dealId,
      input.pipelineId,
      input.toStageId,
      {
        fromStageId,
        note: input.note,
        movedBy: input.movedBy
      }
    );

    // Update or create current stage
    let updatedCurrentStages = deal.currentStages || [];
    const existingIndex = updatedCurrentStages.findIndex(cs => cs.pipelineId === input.pipelineId);
    
    if (existingIndex >= 0) {
      updatedCurrentStages[existingIndex] = makeDealCurrentStage(
        dealId,
        input.pipelineId,
        input.toStageId
      );
    } else {
      updatedCurrentStages.push(makeDealCurrentStage(
        dealId,
        input.pipelineId,
        input.toStageId
      ));
    }

    // Update deal status based on stage properties
    let newStatus = deal.status;
    let integrationStageId: string | undefined;

    if (toStage.isClosing) {
      newStatus = DealStatus.WON;
      
      // If this is a Dealer pipeline, spawn Integration pipeline
      if (pipeline.name === 'Dealer') {
        const integrationPipelines = await pipelineRepository.list();
        const integrationPipeline = integrationPipelines.find(p => p.name === 'Integration');
        
        if (integrationPipeline) {
          const integrationStages = await pipelineRepository.getWithStages(integrationPipeline.id);
          if (integrationStages?.stages?.[0]) {
            // Add Integration pipeline current stage
            const integrationCurrentStage = makeDealCurrentStage(
              dealId,
              integrationPipeline.id,
              integrationStages.stages[0].id
            );
            
            // Check if not already added
            if (!updatedCurrentStages.find(cs => cs.pipelineId === integrationPipeline.id)) {
              updatedCurrentStages.push(integrationCurrentStage);
              integrationStageId = integrationStages.stages[0].id;
              
              // Add history for integration start
              const integrationHistory = makeDealStageHistory(
                dealId,
                integrationPipeline.id,
                integrationStages.stages[0].id,
                { note: 'Auto-spawned from Dealer close won' }
              );
              
              deal.stageHistory = [...(deal.stageHistory || []), integrationHistory];
            }
          }
        }
      }
    } else if (toStage.isLost) {
      if (!input.lossReason) throw new Error('Loss reason required for lost stage');
      newStatus = DealStatus.LOST;
    }

    // Update deal
    const updated = await this.update(dealId, {
      status: newStatus,
      currentStages: updatedCurrentStages,
      stageHistory: [...(deal.stageHistory || []), historyEntry],
      lossReason: input.lossReason || deal.lossReason
    }, input.movedBy);

    // Handle reordering within the target stage if targetIndex is specified
    if (updated && input.targetIndex !== undefined) {
      await this.reorderDealsInStage(input.pipelineId, input.toStageId, dealId, input.targetIndex);
    }

    // Log activity
    await activityRepository.log(
      makeActivity(
        EntityType.DEAL,
        dealId,
        ActivityType.STAGE_MOVED,
        `Deal moved from ${fromStageId || 'start'} to ${input.toStageId}`,
        { 
          fromStageId, 
          toStageId: input.toStageId,
          pipelineId: input.pipelineId,
          note: input.note,
          integrationStageId
        }
      )
    );

    if (newStatus === DealStatus.WON && deal.status !== DealStatus.WON) {
      await activityRepository.log(
        makeActivity(
          EntityType.DEAL,
          dealId,
          ActivityType.DEAL_WON,
          'Deal marked as won',
          { amount: deal.amount, currency: deal.currency }
        )
      );
    }

    if (newStatus === DealStatus.LOST && deal.status !== DealStatus.LOST) {
      await activityRepository.log(
        makeActivity(
          EntityType.DEAL,
          dealId,
          ActivityType.DEAL_LOST,
          `Deal marked as lost: ${input.lossReason}`,
          { lossReason: input.lossReason }
        )
      );
    }

    return updated;
  }

  async closeWon(dealId: string): Promise<Deal | undefined> {
    const deal = await this.get(dealId);
    if (!deal) return undefined;

    const updated = await this.update(dealId, {
      status: DealStatus.WON,
      closeDate: new Date()
    });

    await activityRepository.log(
      makeActivity(
        EntityType.DEAL,
        dealId,
        ActivityType.DEAL_WON,
        'Deal closed won',
        { amount: deal.amount, currency: deal.currency }
      )
    );

    return updated;
  }

  async markLost(dealId: string, reason: LossReason): Promise<Deal | undefined> {
    const deal = await this.get(dealId);
    if (!deal) return undefined;

    const updated = await this.update(dealId, {
      status: DealStatus.LOST,
      lossReason: reason,
      closeDate: new Date()
    });

    await activityRepository.log(
      makeActivity(
        EntityType.DEAL,
        dealId,
        ActivityType.DEAL_LOST,
        `Deal marked as lost: ${reason}`,
        { lossReason: reason }
      )
    );

    return updated;
  }

  async getByPipelineAndStage(pipelineId: string, stageId?: string): Promise<Deal[]> {
    const allDeals = await this.list();
    
    return allDeals.filter(deal => {
      const currentStage = deal.currentStages?.find(cs => cs.pipelineId === pipelineId);
      if (!currentStage) return false;
      if (stageId && currentStage.stageId !== stageId) return false;
      return true;
    });
  }

  /**
   * Reorder deals within a specific stage. This is a simple implementation
   * that updates the updatedAt timestamp to simulate proper ordering.
   * In a real database, you'd have an orderIndex field or use native ordering.
   */
  private async reorderDealsInStage(pipelineId: string, stageId: string, dealId: string, targetIndex: number): Promise<void> {
    try {
      // Get all deals in the target stage
      const stageDeals = await this.getByPipelineAndStage(pipelineId, stageId);
      
      // Find the deal being moved
      const dealToMove = stageDeals.find(d => d.id === dealId);
      if (!dealToMove) return;
      
      // Remove the deal being moved from its current position
      const otherDeals = stageDeals.filter(d => d.id !== dealId);
      
      // Insert the deal at the target position
      const reorderedDeals = [...otherDeals];
      const insertIndex = Math.min(targetIndex, reorderedDeals.length);
      reorderedDeals.splice(insertIndex, 0, dealToMove);
      
      // Update timestamps to reflect new order
      const baseTime = Date.now();
      for (let i = 0; i < reorderedDeals.length; i++) {
        const deal = reorderedDeals[i];
        // Use timestamp with microsecond precision to maintain order
        const newTimestamp = new Date(baseTime + i);
        
        // Directly update the timestamp in the items map
        const existingDeal = this.items.get(deal.id);
        if (existingDeal) {
          existingDeal.updatedAt = newTimestamp;
        }
      }
      
      console.log(`Reordered ${reorderedDeals.length} deals in stage ${stageId}, moved deal ${dealId} to position ${insertIndex}`);
    } catch (error) {
      console.warn('Failed to reorder deals:', error);
    }
  }
}

export class DealRepository extends DealRepositoryImpl {}
export const dealRepository = new DealRepositoryImpl();