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

class DealRepositoryImpl extends BaseRepository<Deal> implements IDealRepository<Deal> {
  async moveStage(
    dealId: string, 
    input: { 
      pipelineId: string; 
      toStageId: string; 
      note?: string; 
      lossReason?: LossReason 
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
        note: input.note
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
    });

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
}

export const dealRepository = new DealRepositoryImpl();