/**
 * Tests for Deal Claiming and Recovery (UPDATE-based implementation)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { dealRepository, activityRepository, pipelineRepository } from '@united-cars/crm-mocks';
import { DealStatus, ActivityType } from '@united-cars/crm-core';

describe('Deal Claiming and Recovery', () => {
  const TENANT_ID = 'tenant-test-001';
  const ORIGINAL_USER_ID = 'original-user-001';
  const CLAIMING_USER_ID = 'claiming-user-001';
  const PIPELINE_ID = 'pipeline-001';
  const STAGE_ID = 'stage-001';

  beforeEach(async () => {
    // Clear all deals
    const deals = await dealRepository.list();
    for (const deal of deals) {
      await dealRepository.delete(deal.id);
    }

    // Ensure pipeline exists for claiming tests
    const existingPipeline = await pipelineRepository.get(PIPELINE_ID);
    if (!existingPipeline) {
      await pipelineRepository.create({
        id: PIPELINE_ID,
        name: 'Test Pipeline',
        stages: [{ id: STAGE_ID, name: 'Test Stage', order: 0, color: '#000000' }],
        tenantId: TENANT_ID
      });
    }
  });

  describe('Claiming Unassigned Deals', () => {
    it('should claim unassigned deal by updating existing deal', async () => {
      // Create unassigned deal
      const deal = await dealRepository.create({
        title: 'Unassigned Deal',
        status: DealStatus.OPEN,
        amount: 10000,
        currency: 'USD',
        organisationId: 'org-001',
        contactId: 'contact-001',
        responsibleUserId: undefined,
        unassignedAt: new Date(),
        unassignedReason: 'user_deactivated',
        tenantId: TENANT_ID
      });

      const dealId = deal.id;

      // Simulate claiming (UPDATE the same deal)
      await dealRepository.update(dealId, {
        responsibleUserId: CLAIMING_USER_ID,
        status: DealStatus.OPEN,
        unassignedAt: undefined,
        unassignedReason: undefined
      }, CLAIMING_USER_ID);

      // Move to pipeline/stage
      await dealRepository.moveStage(dealId, {
        pipelineId: PIPELINE_ID,
        toStageId: STAGE_ID,
        note: 'Deal claimed from unassigned status',
        movedBy: CLAIMING_USER_ID
      });

      // Verify the SAME deal was updated
      const updatedDeal = await dealRepository.get(dealId);
      expect(updatedDeal).toBeDefined();
      expect(updatedDeal?.id).toBe(dealId); // Same ID
      expect(updatedDeal?.responsibleUserId).toBe(CLAIMING_USER_ID);
      expect(updatedDeal?.status).toBe(DealStatus.OPEN);
      expect(updatedDeal?.unassignedAt).toBeUndefined();
      expect(updatedDeal?.unassignedReason).toBeUndefined();

      // Verify original data preserved
      expect(updatedDeal?.title).toBe('Unassigned Deal');
      expect(updatedDeal?.amount).toBe(10000);
      expect(updatedDeal?.organisationId).toBe('org-001');
    });

    it('should preserve all fields when claiming', async () => {
      const deal = await dealRepository.create({
        title: 'Test Deal',
        status: DealStatus.OPEN,
        amount: 50000,
        currency: 'EUR',
        organisationId: 'org-002',
        contactId: 'contact-002',
        notes: 'Important client notes',
        tags: ['hot-lead', 'enterprise'],
        probability: 75,
        responsibleUserId: undefined,
        tenantId: TENANT_ID
      });

      const dealId = deal.id;

      // Claim the deal (UPDATE)
      await dealRepository.update(dealId, {
        responsibleUserId: CLAIMING_USER_ID,
        status: DealStatus.OPEN,
        unassignedAt: undefined,
        unassignedReason: undefined
      }, CLAIMING_USER_ID);

      // Verify all original fields preserved
      const updatedDeal = await dealRepository.get(dealId);
      expect(updatedDeal?.title).toBe('Test Deal');
      expect(updatedDeal?.amount).toBe(50000);
      expect(updatedDeal?.currency).toBe('EUR');
      expect(updatedDeal?.notes).toBe('Important client notes');
      expect(updatedDeal?.tags).toEqual(['hot-lead', 'enterprise']);
      expect(updatedDeal?.probability).toBe(75); // Preserved (can be reset by endpoint if needed)
      expect(updatedDeal?.organisationId).toBe('org-002');
      expect(updatedDeal?.contactId).toBe('contact-002');
    });

    it('should clear unassignment fields when claiming', async () => {
      const deal = await dealRepository.create({
        title: 'Unassigned Deal',
        status: DealStatus.OPEN,
        responsibleUserId: undefined,
        unassignedAt: new Date(),
        unassignedReason: 'user_deactivated',
        tenantId: TENANT_ID
      });

      const dealId = deal.id;

      // Claim (UPDATE)
      await dealRepository.update(dealId, {
        responsibleUserId: CLAIMING_USER_ID,
        unassignedAt: undefined,
        unassignedReason: undefined
      }, CLAIMING_USER_ID);

      const updatedDeal = await dealRepository.get(dealId);
      expect(updatedDeal?.unassignedAt).toBeUndefined();
      expect(updatedDeal?.unassignedReason).toBeUndefined();
      expect(updatedDeal?.responsibleUserId).toBe(CLAIMING_USER_ID);
    });
  });

  describe('Claiming Lost Deals', () => {
    it('should claim lost deal by updating existing deal', async () => {
      // Create lost deal
      const deal = await dealRepository.create({
        title: 'Lost Deal',
        status: DealStatus.LOST,
        amount: 25000,
        lossReason: 'REJECTION',
        closeDate: new Date(),
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      const dealId = deal.id;

      // Claim the lost deal (UPDATE to OPEN)
      await dealRepository.update(dealId, {
        status: DealStatus.OPEN,
        responsibleUserId: CLAIMING_USER_ID,
        lossReason: undefined,
        closeDate: undefined,
        probability: 50 // Reset probability
      }, CLAIMING_USER_ID);

      // Move to pipeline/stage
      await dealRepository.moveStage(dealId, {
        pipelineId: PIPELINE_ID,
        toStageId: STAGE_ID,
        note: 'Deal claimed from lost status',
        movedBy: CLAIMING_USER_ID
      });

      // Verify the SAME deal was updated
      const updatedDeal = await dealRepository.get(dealId);
      expect(updatedDeal?.id).toBe(dealId); // Same ID
      expect(updatedDeal?.status).toBe(DealStatus.OPEN); // Changed to OPEN
      expect(updatedDeal?.lossReason).toBeUndefined(); // Cleared
      expect(updatedDeal?.closeDate).toBeUndefined(); // Cleared
      expect(updatedDeal?.responsibleUserId).toBe(CLAIMING_USER_ID); // New owner

      // Verify original data preserved
      expect(updatedDeal?.title).toBe('Lost Deal');
      expect(updatedDeal?.amount).toBe(25000);
    });

    it('should preserve deal history for audit', async () => {
      const deal = await dealRepository.create({
        title: 'Audit Test Deal',
        status: DealStatus.LOST,
        amount: 100000,
        lossReason: 'COULD_NOT_REACH_DM',
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID,
        createdAt: new Date('2024-01-01')
      });

      const dealId = deal.id;
      const originalCreatedAt = deal.createdAt;

      // Claim deal (UPDATE)
      await dealRepository.update(dealId, {
        status: DealStatus.OPEN,
        responsibleUserId: CLAIMING_USER_ID,
        lossReason: undefined,
        closeDate: undefined
      }, CLAIMING_USER_ID);

      // Log claim activity for audit trail
      await activityRepository.create({
        entityType: 'DEAL' as any,
        entityId: dealId,
        type: ActivityType.DEAL_CLAIMED,
        description: `Deal claimed by user ${CLAIMING_USER_ID}`,
        userId: CLAIMING_USER_ID,
        meta: {
          previousStatus: DealStatus.LOST,
          previousOwner: ORIGINAL_USER_ID,
          claimType: 'lost'
        },
        tenantId: TENANT_ID
      });

      // Verify deal history preserved (same deal, original createdAt)
      const updatedDeal = await dealRepository.get(dealId);
      expect(updatedDeal).toBeDefined();
      expect(updatedDeal?.id).toBe(dealId); // SAME deal ID
      expect(updatedDeal?.createdAt).toEqual(originalCreatedAt); // Original creation date preserved

      // Verify activity logged
      const activities = await activityRepository.getByEntity('DEAL' as any, dealId);
      const claimActivity = activities.find(a => a.type === ActivityType.DEAL_CLAIMED);
      expect(claimActivity).toBeDefined();
      expect(claimActivity?.meta?.previousStatus).toBe(DealStatus.LOST);
      expect(claimActivity?.meta?.previousOwner).toBe(ORIGINAL_USER_ID);
    });

    it('should track multiple claim attempts on same deal', async () => {
      // Create lost deal
      const deal = await dealRepository.create({
        title: 'Multi-claim Deal',
        status: DealStatus.LOST,
        lossReason: 'REJECTION',
        tenantId: TENANT_ID
      });

      const dealId = deal.id;

      // First claim
      await dealRepository.update(dealId, {
        status: DealStatus.OPEN,
        responsibleUserId: 'user-001',
        lossReason: undefined
      }, 'user-001');

      await activityRepository.create({
        entityType: 'DEAL' as any,
        entityId: dealId,
        type: ActivityType.DEAL_CLAIMED,
        description: 'First claim',
        userId: 'user-001',
        tenantId: TENANT_ID
      });

      // Deal is lost again
      await dealRepository.update(dealId, {
        status: DealStatus.LOST,
        lossReason: 'STOPPED_WORKING',
        closeDate: new Date()
      }, 'user-001');

      // Second claim (by different user)
      await dealRepository.update(dealId, {
        status: DealStatus.OPEN,
        responsibleUserId: 'user-002',
        lossReason: undefined,
        closeDate: undefined
      }, 'user-002');

      await activityRepository.create({
        entityType: 'DEAL' as any,
        entityId: dealId,
        type: ActivityType.DEAL_CLAIMED,
        description: 'Second claim',
        userId: 'user-002',
        tenantId: TENANT_ID
      });

      // Verify SAME deal has been claimed twice (visible in history)
      const updatedDeal = await dealRepository.get(dealId);
      expect(updatedDeal?.id).toBe(dealId); // SAME deal

      const activities = await activityRepository.getByEntity('DEAL' as any, dealId);
      const claimActivities = activities.filter(a => a.type === ActivityType.DEAL_CLAIMED);
      expect(claimActivities.length).toBe(2); // Two claim attempts logged
    });
  });

  describe('Deal Filtering', () => {
    it('should filter unassigned deals correctly', async () => {
      // Create mix of deals
      await dealRepository.create({
        title: 'Assigned Deal',
        status: DealStatus.OPEN,
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Unassigned Deal 1',
        status: DealStatus.OPEN,
        responsibleUserId: undefined,
        unassignedAt: new Date(),
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Unassigned Deal 2',
        status: DealStatus.OPEN,
        responsibleUserId: undefined,
        unassignedAt: new Date(),
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Lost Deal',
        status: DealStatus.LOST,
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      // Get unassigned deals
      const allDeals = await dealRepository.list();
      const unassignedDeals = allDeals.filter(d =>
        d.tenantId === TENANT_ID && !d.responsibleUserId
      );

      expect(unassignedDeals.length).toBe(2);
      expect(unassignedDeals.every(d => d.unassignedAt !== undefined)).toBe(true);
    });

    it('should filter lost deals correctly', async () => {
      // Create mix of deals
      await dealRepository.create({
        title: 'Open Deal',
        status: DealStatus.OPEN,
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Won Deal',
        status: DealStatus.WON,
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Lost Deal 1',
        status: DealStatus.LOST,
        lossReason: 'REJECTION',
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Lost Deal 2',
        status: DealStatus.LOST,
        lossReason: 'STOPPED_WORKING',
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      // Get lost deals
      const allDeals = await dealRepository.list();
      const lostDeals = allDeals.filter(d =>
        d.tenantId === TENANT_ID && d.status === DealStatus.LOST
      );

      expect(lostDeals.length).toBe(2);
      expect(lostDeals.every(d => d.status === DealStatus.LOST)).toBe(true);
    });

    it('should filter recoverable deals (unassigned OR lost)', async () => {
      // Create mix of deals
      await dealRepository.create({
        title: 'Assigned Deal',
        status: DealStatus.OPEN,
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Unassigned Deal',
        status: DealStatus.OPEN,
        responsibleUserId: undefined,
        unassignedAt: new Date(),
        tenantId: TENANT_ID
      });

      await dealRepository.create({
        title: 'Lost Deal',
        status: DealStatus.LOST,
        lossReason: 'REJECTION',
        responsibleUserId: ORIGINAL_USER_ID,
        tenantId: TENANT_ID
      });

      // Get recoverable deals (unassigned OR lost)
      const allDeals = await dealRepository.list();
      const recoverableDeals = allDeals.filter(d =>
        d.tenantId === TENANT_ID && (!d.responsibleUserId || d.status === DealStatus.LOST)
      );

      expect(recoverableDeals.length).toBe(2); // 1 unassigned + 1 lost
    });
  });
});
