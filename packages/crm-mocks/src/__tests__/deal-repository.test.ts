import { describe, it, expect, beforeEach } from 'vitest';
import { dealRepository } from '../repositories/deal-repository';
import { pipelineRepository } from '../repositories/pipeline-repository';
import { activityRepository } from '../repositories/activity-repository';
import { 
  makeDeal, 
  makePipeline, 
  makeStage, 
  makeDealCurrentStage,
  DealStatus,
  LossReason
} from '@united-cars/crm-core';

describe('DealRepository', () => {
  beforeEach(() => {
    dealRepository.clear();
    pipelineRepository.clear();
    pipelineRepository.clearStages();
    activityRepository.clear();
    
    // Setup test pipelines
    const dealerPipeline = makePipeline({
      id: 'dealer_pipeline',
      name: 'Dealer'
    });
    
    const integrationPipeline = makePipeline({
      id: 'integration_pipeline',
      name: 'Integration'
    });
    
    pipelineRepository.seed([dealerPipeline, integrationPipeline]);
    
    // Setup stages
    const dealerStage1 = makeStage('dealer_pipeline', {
      id: 'dealer_stage_1',
      name: 'Stage 1',
      order: 0
    });
    
    const dealerClosingStage = makeStage('dealer_pipeline', {
      id: 'dealer_closing',
      name: 'Close Won',
      order: 1,
      isClosing: true
    });
    
    const dealerLostStage = makeStage('dealer_pipeline', {
      id: 'dealer_lost',
      name: 'Lost',
      order: 2,
      isLost: true
    });
    
    const integrationStage1 = makeStage('integration_pipeline', {
      id: 'integration_stage_1',
      name: 'Integration',
      order: 0
    });
    
    pipelineRepository.seedStages([
      dealerStage1, 
      dealerClosingStage, 
      dealerLostStage,
      integrationStage1
    ]);
  });

  it('should move deal to new stage', async () => {
    const deal = makeDeal({
      title: 'Test Deal',
      status: DealStatus.OPEN
    });
    deal.currentStages = [makeDealCurrentStage(deal.id, 'dealer_pipeline', 'dealer_stage_1')];
    
    dealRepository.seed([deal]);
    
    const updatedDeal = await dealRepository.moveStage(deal.id, {
      pipelineId: 'dealer_pipeline',
      toStageId: 'dealer_closing',
      note: 'Moving to close'
    });
    
    expect(updatedDeal?.status).toBe(DealStatus.WON);
    expect(updatedDeal?.currentStages).toHaveLength(2); // Should have dealer + integration
    expect(updatedDeal?.stageHistory).toHaveLength(2); // Original + move + integration start
  });

  it('should require loss reason for lost stage', async () => {
    const deal = makeDeal({
      title: 'Test Deal',
      status: DealStatus.OPEN
    });
    deal.currentStages = [makeDealCurrentStage(deal.id, 'dealer_pipeline', 'dealer_stage_1')];
    
    dealRepository.seed([deal]);
    
    await expect(
      dealRepository.moveStage(deal.id, {
        pipelineId: 'dealer_pipeline',
        toStageId: 'dealer_lost'
      })
    ).rejects.toThrow('Loss reason required for lost stage');
  });

  it('should mark deal as lost with reason', async () => {
    const deal = makeDeal({
      title: 'Test Deal',
      status: DealStatus.OPEN
    });
    
    dealRepository.seed([deal]);
    
    const updatedDeal = await dealRepository.markLost(deal.id, LossReason.REJECTION);
    
    expect(updatedDeal?.status).toBe(DealStatus.LOST);
    expect(updatedDeal?.lossReason).toBe(LossReason.REJECTION);
    expect(updatedDeal?.closeDate).toBeDefined();
  });

  it('should close deal as won', async () => {
    const deal = makeDeal({
      title: 'Test Deal',
      status: DealStatus.OPEN
    });
    
    dealRepository.seed([deal]);
    
    const updatedDeal = await dealRepository.closeWon(deal.id);
    
    expect(updatedDeal?.status).toBe(DealStatus.WON);
    expect(updatedDeal?.closeDate).toBeDefined();
  });

  it('should filter deals by pipeline and stage', async () => {
    const deal1 = makeDeal({ title: 'Deal 1' });
    deal1.currentStages = [makeDealCurrentStage(deal1.id, 'dealer_pipeline', 'dealer_stage_1')];
    
    const deal2 = makeDeal({ title: 'Deal 2' });
    deal2.currentStages = [makeDealCurrentStage(deal2.id, 'dealer_pipeline', 'dealer_closing')];
    
    const deal3 = makeDeal({ title: 'Deal 3' });
    deal3.currentStages = [makeDealCurrentStage(deal3.id, 'integration_pipeline', 'integration_stage_1')];
    
    dealRepository.seed([deal1, deal2, deal3]);
    
    const dealerDeals = await dealRepository.getByPipelineAndStage('dealer_pipeline');
    expect(dealerDeals).toHaveLength(2);
    
    const stageDeals = await dealRepository.getByPipelineAndStage('dealer_pipeline', 'dealer_stage_1');
    expect(stageDeals).toHaveLength(1);
    expect(stageDeals[0].title).toBe('Deal 1');
  });
});