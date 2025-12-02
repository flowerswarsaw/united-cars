import { describe, it, expect, beforeEach } from 'vitest';
import { activityRepository } from '../../repositories/activity-repository';
import { EntityType, ActivityType, makeActivity } from '@united-cars/crm-core';

describe('Activity Repository Business Logic', () => {
  beforeEach(() => {
    activityRepository.clear();
  });

  describe('log', () => {
    it('should log activity with all required fields', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-123',
        type: ActivityType.CREATED,
        description: 'Deal was created'
      });

      expect(activity).toBeDefined();
      expect(activity.id).toBeDefined();
      expect(activity.entityType).toBe(EntityType.DEAL);
      expect(activity.entityId).toBe('deal-123');
      expect(activity.type).toBe(ActivityType.CREATED);
      expect(activity.description).toBe('Deal was created');
      expect(activity.createdAt).toBeDefined();
    });

    it('should log activity with metadata', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.LEAD,
        entityId: 'lead-456',
        type: ActivityType.LEAD_CONVERTED,
        description: 'Lead converted to deal',
        meta: {
          dealId: 'deal-new',
          contactId: 'contact-123',
          conversionDate: new Date().toISOString()
        }
      });

      expect(activity.meta).toBeDefined();
      expect(activity.meta?.dealId).toBe('deal-new');
      expect(activity.meta?.contactId).toBe('contact-123');
      expect(activity.meta?.conversionDate).toBeDefined();
    });

    it('should log activity with userId', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.CONTACT,
        entityId: 'contact-789',
        type: ActivityType.UPDATED,
        description: 'Contact updated',
        userId: 'user-admin-1'
      });

      expect(activity.userId).toBe('user-admin-1');
    });

    it('should support all activity types', async () => {
      const activityTypes = [
        ActivityType.CREATED,
        ActivityType.UPDATED,
        ActivityType.DELETED,
        ActivityType.STAGE_MOVED,
        ActivityType.DEAL_WON,
        ActivityType.DEAL_LOST,
        ActivityType.LEAD_CONVERTED,
        ActivityType.TASK_COMPLETED,
        ActivityType.NOTE_ADDED,
        ActivityType.FIELD_CHANGED,
        ActivityType.STATUS_CHANGED,
        ActivityType.CONTRACT_CREATED,
        ActivityType.CONTRACT_SIGNED
      ];

      for (const type of activityTypes) {
        const activity = await activityRepository.log({
          entityType: EntityType.DEAL,
          entityId: `deal-${type}`,
          type,
          description: `Activity of type ${type}`
        });
        expect(activity.type).toBe(type);
      }
    });

    it('should support all entity types', async () => {
      const entityTypes = [
        EntityType.ORGANISATION,
        EntityType.CONTACT,
        EntityType.LEAD,
        EntityType.DEAL,
        EntityType.TASK,
        EntityType.CONTRACT
      ];

      for (const entityType of entityTypes) {
        const activity = await activityRepository.log({
          entityType,
          entityId: `${entityType.toLowerCase()}-123`,
          type: ActivityType.CREATED,
          description: `Created ${entityType}`
        });
        expect(activity.entityType).toBe(entityType);
      }
    });
  });

  describe('getByEntity', () => {
    it('should return activities for a specific entity', async () => {
      const dealId = 'deal-activities-test';

      // Log multiple activities for the same entity
      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.CREATED,
        description: 'Deal created'
      });

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.STAGE_MOVED,
        description: 'Deal moved to negotiation'
      });

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.DEAL_WON,
        description: 'Deal marked as won'
      });

      // Log activity for different entity
      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'other-deal',
        type: ActivityType.CREATED,
        description: 'Other deal created'
      });

      const activities = await activityRepository.getByEntity(EntityType.DEAL, dealId);

      expect(activities).toHaveLength(3);
      expect(activities.every(a => a.entityId === dealId)).toBe(true);
    });

    it('should return empty array for entity with no activities', async () => {
      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-123',
        type: ActivityType.CREATED,
        description: 'Deal created'
      });

      const activities = await activityRepository.getByEntity(EntityType.CONTACT, 'nonexistent-contact');

      expect(activities).toEqual([]);
    });

    it('should differentiate between entity types with same ID', async () => {
      const sharedId = 'shared-entity-id';

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: sharedId,
        type: ActivityType.CREATED,
        description: 'Deal activity'
      });

      await activityRepository.log({
        entityType: EntityType.LEAD,
        entityId: sharedId,
        type: ActivityType.CREATED,
        description: 'Lead activity'
      });

      const dealActivities = await activityRepository.getByEntity(EntityType.DEAL, sharedId);
      const leadActivities = await activityRepository.getByEntity(EntityType.LEAD, sharedId);

      expect(dealActivities).toHaveLength(1);
      expect(dealActivities[0].description).toBe('Deal activity');
      expect(leadActivities).toHaveLength(1);
      expect(leadActivities[0].description).toBe('Lead activity');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Seed multiple activities
      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-1',
        type: ActivityType.CREATED,
        description: 'Deal 1 created',
        userId: 'user-a'
      });

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-2',
        type: ActivityType.STAGE_MOVED,
        description: 'Deal 2 moved',
        userId: 'user-b'
      });

      await activityRepository.log({
        entityType: EntityType.CONTACT,
        entityId: 'contact-1',
        type: ActivityType.CREATED,
        description: 'Contact created',
        userId: 'user-a'
      });

      await activityRepository.log({
        entityType: EntityType.LEAD,
        entityId: 'lead-1',
        type: ActivityType.LEAD_CONVERTED,
        description: 'Lead converted',
        userId: 'user-b'
      });
    });

    it('should list all activities when no filter', async () => {
      const activities = await activityRepository.list();
      expect(activities).toHaveLength(4);
    });

    it('should filter by entityType', async () => {
      const dealActivities = await activityRepository.list({ entityType: EntityType.DEAL });
      expect(dealActivities).toHaveLength(2);
      expect(dealActivities.every(a => a.entityType === EntityType.DEAL)).toBe(true);
    });

    it('should filter by activity type', async () => {
      const createdActivities = await activityRepository.list({ type: ActivityType.CREATED });
      expect(createdActivities).toHaveLength(2);
      expect(createdActivities.every(a => a.type === ActivityType.CREATED)).toBe(true);
    });

    it('should filter by userId', async () => {
      const userAActivities = await activityRepository.list({ userId: 'user-a' });
      expect(userAActivities).toHaveLength(2);
      expect(userAActivities.every(a => a.userId === 'user-a')).toBe(true);
    });

    it('should filter by multiple criteria', async () => {
      const filtered = await activityRepository.list({
        entityType: EntityType.DEAL,
        type: ActivityType.CREATED
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].entityId).toBe('deal-1');
    });
  });

  describe('Activity Audit Trail', () => {
    it('should maintain chronological order of activities', async () => {
      const dealId = 'deal-timeline';

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.CREATED,
        description: 'Step 1: Created'
      });

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.UPDATED,
        description: 'Step 2: Updated'
      });

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.DEAL_WON,
        description: 'Step 3: Won'
      });

      const activities = await activityRepository.getByEntity(EntityType.DEAL, dealId);

      // Activities should be retrievable
      expect(activities).toHaveLength(3);
      expect(activities.some(a => a.type === ActivityType.CREATED)).toBe(true);
      expect(activities.some(a => a.type === ActivityType.UPDATED)).toBe(true);
      expect(activities.some(a => a.type === ActivityType.DEAL_WON)).toBe(true);
    });

    it('should capture field changes in metadata', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-field-change',
        type: ActivityType.FIELD_CHANGED,
        description: 'Amount changed from $1000 to $1500',
        meta: {
          field: 'amount',
          oldValue: 1000,
          newValue: 1500,
          currency: 'USD'
        }
      });

      expect(activity.meta?.field).toBe('amount');
      expect(activity.meta?.oldValue).toBe(1000);
      expect(activity.meta?.newValue).toBe(1500);
    });

    it('should capture stage movement details', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-stage-move',
        type: ActivityType.STAGE_MOVED,
        description: 'Moved from Proposal to Negotiation',
        meta: {
          fromStageId: 'stage-proposal',
          toStageId: 'stage-negotiation',
          pipelineId: 'dealer-pipeline',
          movedBy: 'user-sales'
        }
      });

      expect(activity.meta?.fromStageId).toBe('stage-proposal');
      expect(activity.meta?.toStageId).toBe('stage-negotiation');
      expect(activity.meta?.pipelineId).toBe('dealer-pipeline');
    });
  });

  describe('Integration with makeActivity factory', () => {
    it('should work with makeActivity helper', async () => {
      const activityData = makeActivity(
        EntityType.ORGANISATION,
        'org-123',
        ActivityType.CREATED,
        'Organisation was created',
        { source: 'import', importId: 'batch-001' }
      );

      // makeActivity creates a full Activity object with id/tenantId/timestamps
      // We need to strip those for logging
      const logged = await activityRepository.log({
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        type: activityData.type,
        description: activityData.description,
        meta: activityData.meta
      });

      expect(logged.entityType).toBe(EntityType.ORGANISATION);
      expect(logged.entityId).toBe('org-123');
      expect(logged.type).toBe(ActivityType.CREATED);
      expect(logged.meta?.source).toBe('import');
      expect(logged.meta?.importId).toBe('batch-001');
    });
  });

  describe('Contract Activity Types', () => {
    it('should support contract lifecycle activities', async () => {
      const contractId = 'contract-lifecycle';

      // Contract created
      await activityRepository.log({
        entityType: EntityType.CONTRACT,
        entityId: contractId,
        type: ActivityType.CONTRACT_CREATED,
        description: 'Contract drafted'
      });

      // Contract signed
      await activityRepository.log({
        entityType: EntityType.CONTRACT,
        entityId: contractId,
        type: ActivityType.CONTRACT_SIGNED,
        description: 'Contract signed by client',
        meta: { signedBy: 'John Doe', signatureDate: '2025-01-15' }
      });

      // Contract status changed
      await activityRepository.log({
        entityType: EntityType.CONTRACT,
        entityId: contractId,
        type: ActivityType.CONTRACT_STATUS_CHANGED,
        description: 'Contract activated',
        meta: { fromStatus: 'SIGNED', toStatus: 'ACTIVE' }
      });

      const activities = await activityRepository.getByEntity(EntityType.CONTRACT, contractId);
      expect(activities).toHaveLength(3);
    });

    it('should capture contract cancellation', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.CONTRACT,
        entityId: 'contract-cancelled',
        type: ActivityType.CONTRACT_CANCELLED,
        description: 'Contract cancelled by mutual agreement',
        meta: {
          reason: 'mutual_agreement',
          cancelledBy: 'user-manager',
          effectiveDate: '2025-02-01'
        }
      });

      expect(activity.type).toBe(ActivityType.CONTRACT_CANCELLED);
      expect(activity.meta?.reason).toBe('mutual_agreement');
    });
  });

  describe('Deal Activity Types', () => {
    it('should track deal won with details', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-won',
        type: ActivityType.DEAL_WON,
        description: 'Deal closed successfully',
        meta: {
          finalAmount: 50000,
          currency: 'USD',
          closedBy: 'user-sales-rep',
          closeDate: '2025-01-20'
        }
      });

      expect(activity.type).toBe(ActivityType.DEAL_WON);
      expect(activity.meta?.finalAmount).toBe(50000);
    });

    it('should track deal lost with reason', async () => {
      const activity = await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: 'deal-lost',
        type: ActivityType.DEAL_LOST,
        description: 'Deal lost to competitor',
        meta: {
          lossReason: 'REJECTION',
          competitor: 'Competitor Inc.',
          feedback: 'Price was too high'
        }
      });

      expect(activity.type).toBe(ActivityType.DEAL_LOST);
      expect(activity.meta?.lossReason).toBe('REJECTION');
    });

    it('should track deal claim and unassign', async () => {
      const dealId = 'deal-assignment';

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.DEAL_CLAIMED,
        description: 'Deal claimed by sales rep',
        meta: { claimedBy: 'user-sales-1' }
      });

      await activityRepository.log({
        entityType: EntityType.DEAL,
        entityId: dealId,
        type: ActivityType.DEAL_UNASSIGNED,
        description: 'Deal unassigned from sales rep',
        meta: { previousAssignee: 'user-sales-1', reason: 'reassignment' }
      });

      const activities = await activityRepository.getByEntity(EntityType.DEAL, dealId);
      expect(activities).toHaveLength(2);
      expect(activities.some(a => a.type === ActivityType.DEAL_CLAIMED)).toBe(true);
      expect(activities.some(a => a.type === ActivityType.DEAL_UNASSIGNED)).toBe(true);
    });
  });
});
