import { describe, it, expect, beforeEach } from 'vitest';
import { leadRepository } from '../repositories/lead-repository';
import { dealRepository } from '../repositories/deal-repository';
import { pipelineRepository } from '../repositories/pipeline-repository';
import { makeLead, makePipeline, makeStage, DealStatus } from '@united-cars/crm-core';

describe('LeadRepository', () => {
  beforeEach(() => {
    leadRepository.clear();
    dealRepository.clear();
    pipelineRepository.clear();
    pipelineRepository.clearStages();
    
    // Setup test pipeline
    const pipeline = makePipeline({
      id: 'test_pipeline',
      name: 'Test Pipeline',
      isDefault: true
    });
    pipelineRepository.seed([pipeline]);
    
    const stage = makeStage('test_pipeline', {
      id: 'test_stage',
      name: 'Test Stage',
      order: 0
    });
    pipelineRepository.seedStages([stage]);
  });

  it('should convert target lead to deal', async () => {
    const lead = makeLead({
      title: 'Test Lead',
      isTarget: true,
      organisationId: 'org_1'
    });
    
    leadRepository.seed([lead]);
    
    const deal = await leadRepository.convertToDeal(lead.id, {
      title: 'Test Deal',
      amount: 1000
    });
    
    expect(deal.title).toBe('Test Deal');
    expect(deal.amount).toBe(1000);
    expect(deal.organisationId).toBe('org_1');
    expect(deal.status).toBe(DealStatus.OPEN);
    expect(deal.currentStages).toHaveLength(1);
    expect(deal.stageHistory).toHaveLength(1);
  });

  it('should throw error when converting non-target lead', async () => {
    const lead = makeLead({
      title: 'Test Lead',
      isTarget: false
    });
    
    leadRepository.seed([lead]);
    
    await expect(
      leadRepository.convertToDeal(lead.id, { title: 'Test Deal' })
    ).rejects.toThrow('Only target leads can be converted to deals');
  });

  it('should throw error when lead not found', async () => {
    await expect(
      leadRepository.convertToDeal('nonexistent', { title: 'Test Deal' })
    ).rejects.toThrow('Lead not found');
  });
});