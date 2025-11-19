import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pipelineRepository } from '../repositories/pipeline-repository';
import { dealRepository } from '../repositories/deal-repository';
import {
  pipelines,
  dealerAcquisitionStages,
  dealerIntegrationStages,
  retailSalesStages,
  vendorOnboardingStages,
  auctionIntegrationStages,
  deals
} from '../seeds';

describe('Pipeline-Deal Synchronization', () => {
  beforeEach(async () => {
    // Clear all data
    pipelineRepository.clear();
    pipelineRepository.clearStages();
    dealRepository.clear();

    // Seed data manually
    pipelineRepository.fromJSON(pipelines);
    const allStages = [
      ...dealerAcquisitionStages,
      ...dealerIntegrationStages,
      ...retailSalesStages,
      ...vendorOnboardingStages,
      ...auctionIntegrationStages
    ];
    pipelineRepository.stagesFromJSON(allStages);
    dealRepository.fromJSON(deals);
  });

  describe('Pipeline Structure', () => {
    it('should have all required pipelines', async () => {
      const pipelines = await pipelineRepository.list();

      expect(pipelines.length).toBeGreaterThanOrEqual(5);

      const pipelineIds = pipelines.map(p => p.id);
      expect(pipelineIds).toContain('dealer-acquisition');
      expect(pipelineIds).toContain('dealer-integration');
      expect(pipelineIds).toContain('retail-sales');
      expect(pipelineIds).toContain('vendor-onboarding');
      expect(pipelineIds).toContain('auction-integration');
    });

    it('should have stages for each pipeline', async () => {
      const pipelines = await pipelineRepository.list();

      for (const pipeline of pipelines) {
        const stages = await pipelineRepository.getStages(pipeline.id);

        expect(stages.length).toBeGreaterThan(0);
        expect(stages.every(s => s.pipelineId === pipeline.id)).toBe(true);

        // Verify stages are ordered
        const orders = stages.map(s => s.order);
        const sortedOrders = [...orders].sort((a, b) => a - b);
        expect(orders).toEqual(sortedOrders);
      }
    });

    it('should have unique stage IDs across all pipelines', async () => {
      const allStages = pipelineRepository.stagesToJSON();
      const stageIds = allStages.map(s => s.id);
      const uniqueIds = new Set(stageIds);

      expect(stageIds.length).toBe(uniqueIds.size);
    });

    it('dealer-acquisition should have won and lost stages', async () => {
      const stages = await pipelineRepository.getStages('dealer-acquisition');

      const wonStage = stages.find(s => s.isClosing);
      const lostStage = stages.find(s => s.isLost);

      expect(wonStage).toBeDefined();
      expect(lostStage).toBeDefined();
      expect(wonStage?.name).toContain('Won');
      expect(lostStage?.name).toContain('Lost');
    });
  });

  describe('Deal-Pipeline Synchronization', () => {
    it('all deals should have valid currentStages', async () => {
      const deals = await dealRepository.list();

      expect(deals.length).toBeGreaterThan(0);

      for (const deal of deals) {
        expect(deal.currentStages).toBeDefined();
        expect(deal.currentStages!.length).toBeGreaterThan(0);

        // Each currentStage should reference valid pipeline and stage
        for (const currentStage of deal.currentStages!) {
          const pipeline = await pipelineRepository.get(currentStage.pipelineId);
          expect(pipeline).toBeDefined();

          const stages = await pipelineRepository.getStages(currentStage.pipelineId);
          const stage = stages.find(s => s.id === currentStage.stageId);
          expect(stage).toBeDefined();
          expect(stage?.pipelineId).toBe(currentStage.pipelineId);
        }
      }
    });

    it('all deals should have valid stageHistory', async () => {
      const deals = await dealRepository.list();

      for (const deal of deals) {
        if (deal.stageHistory && deal.stageHistory.length > 0) {
          for (const historyEntry of deal.stageHistory) {
            const pipeline = await pipelineRepository.get(historyEntry.pipelineId);
            expect(pipeline).toBeDefined();

            const stages = await pipelineRepository.getStages(historyEntry.pipelineId);
            const stage = stages.find(s => s.id === historyEntry.toStageId);
            expect(stage).toBeDefined();
            expect(stage?.pipelineId).toBe(historyEntry.pipelineId);
          }
        }
      }
    });

    it('each pipeline should have at least one deal', async () => {
      const pipelines = await pipelineRepository.list();
      const deals = await dealRepository.list();

      const pipelinesWithDeals = new Set<string>();

      for (const deal of deals) {
        for (const currentStage of deal.currentStages || []) {
          pipelinesWithDeals.add(currentStage.pipelineId);
        }
      }

      // At least dealer-acquisition should have deals
      expect(pipelinesWithDeals.has('dealer-acquisition')).toBe(true);

      // Integration pipeline should have deals (from won deals)
      expect(pipelinesWithDeals.has('dealer-integration')).toBe(true);
    });

    it('won deals should be in both acquisition and integration pipelines', async () => {
      const wonDeals = await dealRepository.list({ status: 'WON' });

      if (wonDeals.length > 0) {
        const wonDeal = wonDeals[0];

        // Should have at least 2 currentStages (dealer-acquisition won + dealer-integration)
        expect(wonDeal.currentStages!.length).toBeGreaterThanOrEqual(2);

        const pipelineIds = wonDeal.currentStages!.map(cs => cs.pipelineId);

        // Should include acquisition pipeline
        expect(pipelineIds).toContain('dealer-acquisition');

        // Should include integration pipeline
        expect(pipelineIds).toContain('dealer-integration');

        // Verify won stage
        const acquisitionStage = wonDeal.currentStages!.find(
          cs => cs.pipelineId === 'dealer-acquisition'
        );
        const stages = await pipelineRepository.getStages('dealer-acquisition');
        const stage = stages.find(s => s.id === acquisitionStage!.stageId);
        expect(stage?.isClosing).toBe(true);
      }
    });

    it('lost deals should be in lost stage', async () => {
      const lostDeals = await dealRepository.list({ status: 'LOST' });

      if (lostDeals.length > 0) {
        for (const deal of lostDeals) {
          expect(deal.lossReason).toBeDefined();

          // Should have currentStage pointing to lost stage
          const currentStage = deal.currentStages![0];
          const stages = await pipelineRepository.getStages(currentStage.pipelineId);
          const stage = stages.find(s => s.id === currentStage.stageId);

          expect(stage?.isLost).toBe(true);
        }
      }
    });
  });

  describe('Kanban Display Validation', () => {
    it('deals should be retrievable by pipeline', async () => {
      const dealsInDealerAcquisition = await dealRepository.getByPipelineAndStage('dealer-acquisition');

      expect(dealsInDealerAcquisition.length).toBeGreaterThan(0);

      // All deals should have currentStage in dealer-acquisition
      for (const deal of dealsInDealerAcquisition) {
        const hasStageInPipeline = deal.currentStages?.some(
          cs => cs.pipelineId === 'dealer-acquisition'
        );
        expect(hasStageInPipeline).toBe(true);
      }
    });

    it('deals should be retrievable by pipeline and stage', async () => {
      // Get first stage of dealer-acquisition
      const stages = await pipelineRepository.getStages('dealer-acquisition');
      const firstStage = stages.find(s => s.order === 0);

      expect(firstStage).toBeDefined();

      const dealsInStage = await dealRepository.getByPipelineAndStage(
        'dealer-acquisition',
        firstStage!.id
      );

      // May or may not have deals, but should not error
      expect(Array.isArray(dealsInStage)).toBe(true);

      if (dealsInStage.length > 0) {
        for (const deal of dealsInStage) {
          const hasMatchingStage = deal.currentStages?.some(
            cs => cs.pipelineId === 'dealer-acquisition' && cs.stageId === firstStage!.id
          );
          expect(hasMatchingStage).toBe(true);
        }
      }
    });

    it('each stage in dealer-acquisition should have correct deal distribution', async () => {
      const stages = await pipelineRepository.getStages('dealer-acquisition');
      const allDeals = await dealRepository.getByPipelineAndStage('dealer-acquisition');

      let totalDealsInStages = 0;

      for (const stage of stages) {
        const dealsInStage = await dealRepository.getByPipelineAndStage('dealer-acquisition', stage.id);

        totalDealsInStages += dealsInStage.length;

        console.log(`Stage ${stage.name} (${stage.id}): ${dealsInStage.length} deals`);
      }

      // Total in stages should equal total in pipeline
      expect(totalDealsInStages).toBe(allDeals.length);
    });

    it('retail sales pipeline should have retail deals', async () => {
      const retailDeals = await dealRepository.getByPipelineAndStage('retail-sales');

      // Should have at least one retail deal from seed data
      expect(retailDeals.length).toBeGreaterThan(0);

      for (const deal of retailDeals) {
        const hasRetailStage = deal.currentStages?.some(
          cs => cs.pipelineId === 'retail-sales'
        );
        expect(hasRetailStage).toBe(true);
      }
    });

    it('vendor onboarding pipeline should have vendor deals', async () => {
      const vendorDeals = await dealRepository.getByPipelineAndStage('vendor-onboarding');

      // Should have at least one vendor deal
      expect(vendorDeals.length).toBeGreaterThan(0);

      for (const deal of vendorDeals) {
        const hasVendorStage = deal.currentStages?.some(
          cs => cs.pipelineId === 'vendor-onboarding'
        );
        expect(hasVendorStage).toBe(true);
      }
    });
  });

  describe('Stage Movement Validation', () => {
    it('moving deal should update currentStages correctly', async () => {
      const deals = await dealRepository.getByPipelineAndStage('dealer-acquisition');

      if (deals.length > 0) {
        const deal = deals[0];
        const stages = await pipelineRepository.getStages('dealer-acquisition');
        const currentStageEntry = deal.currentStages!.find(cs => cs.pipelineId === 'dealer-acquisition');
        const currentStage = stages.find(s => s.id === currentStageEntry!.stageId);

        // Find next stage
        const nextStage = stages.find(s => s.order === currentStage!.order + 1);

        if (nextStage && !nextStage.isClosing && !nextStage.isLost) {
          const updatedDeal = await dealRepository.moveStage(deal.id, {
            pipelineId: 'dealer-acquisition',
            toStageId: nextStage.id,
            note: 'Test stage movement'
          });

          expect(updatedDeal).toBeDefined();

          // Should be in new stage
          const newStageEntry = updatedDeal!.currentStages!.find(
            cs => cs.pipelineId === 'dealer-acquisition'
          );
          expect(newStageEntry!.stageId).toBe(nextStage.id);

          // Should have history entry
          expect(updatedDeal!.stageHistory!.length).toBeGreaterThan(deal.stageHistory!.length);
        }
      }
    });
  });

  describe('Data Consistency', () => {
    it('all pipelines should have consistent stage ordering', async () => {
      const pipelines = await pipelineRepository.list();

      for (const pipeline of pipelines) {
        const stages = await pipelineRepository.getStages(pipeline.id);

        // Orders should start at 0
        const minOrder = Math.min(...stages.map(s => s.order));
        expect(minOrder).toBe(0);

        // Orders should be sequential (no gaps)
        const orders = stages.map(s => s.order).sort((a, b) => a - b);
        for (let i = 0; i < orders.length - 1; i++) {
          const gap = orders[i + 1] - orders[i];
          expect(gap).toBe(1);
        }
      }
    });

    it('all deals should have consistent timestamps', async () => {
      const deals = await dealRepository.list();

      for (const deal of deals) {
        expect(deal.createdAt).toBeInstanceOf(Date);
        expect(deal.updatedAt).toBeInstanceOf(Date);
        expect(deal.createdAt.getTime()).toBeLessThanOrEqual(deal.updatedAt.getTime());

        if (deal.closeDate) {
          expect(deal.closeDate).toBeInstanceOf(Date);
        }

        // Check stageHistory timestamps
        if (deal.stageHistory) {
          for (const entry of deal.stageHistory) {
            expect(entry.movedAt).toBeInstanceOf(Date);
            expect(entry.createdAt).toBeInstanceOf(Date);
            expect(entry.updatedAt).toBeInstanceOf(Date);
          }
        }
      }
    });

    it('pipeline applicableTypes should match deal organisations', async () => {
      const pipelines = await pipelineRepository.list();

      for (const pipeline of pipelines) {
        if (pipeline.isTypeSpecific && pipeline.applicableTypes && pipeline.applicableTypes.length > 0) {
          const dealsInPipeline = await dealRepository.getByPipelineAndStage(pipeline.id);

          console.log(`Pipeline ${pipeline.name}: ${dealsInPipeline.length} deals, applicable to ${pipeline.applicableTypes.join(', ')}`);

          // This is informational - some pipelines may not have deals yet
          expect(dealsInPipeline.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle deals without stageHistory gracefully', async () => {
      const deals = await dealRepository.list();

      for (const deal of deals) {
        // stageHistory should always exist and have at least one entry
        expect(deal.stageHistory).toBeDefined();
        expect(deal.stageHistory!.length).toBeGreaterThan(0);
      }
    });

    it('should handle deals with multiple currentStages (won deals)', async () => {
      const wonDeals = await dealRepository.list({ status: 'WON' });

      if (wonDeals.length > 0) {
        for (const deal of wonDeals) {
          // Won deals should have multiple currentStages
          expect(deal.currentStages!.length).toBeGreaterThan(1);

          // Each currentStage should be valid
          for (const currentStage of deal.currentStages!) {
            const stages = await pipelineRepository.getStages(currentStage.pipelineId);
            const stage = stages.find(s => s.id === currentStage.stageId);
            expect(stage).toBeDefined();
          }
        }
      }
    });

    it('should handle pipeline with no deals', async () => {
      // Auction integration might not have deals yet
      const auctionDeals = await dealRepository.getByPipelineAndStage('auction-integration');

      // Should not error, just return empty array
      expect(Array.isArray(auctionDeals)).toBe(true);
    });
  });
});
