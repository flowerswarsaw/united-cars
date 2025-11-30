/**
 * Tests for User Deactivation and Entity Reassignment
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { crmUserRepository, dealRepository, leadRepository, activityRepository } from '@united-cars/crm-mocks';
import { CRMUserStatus, DealStatus } from '@united-cars/crm-core';

describe('User Deactivation and Entity Reassignment', () => {
  const TENANT_ID = 'tenant-test-001';
  const ADMIN_USER_ID = 'admin-user-001';
  const TARGET_USER_ID = 'target-user-001';

  beforeEach(async () => {
    // Clear all data
    const users = await crmUserRepository.list();
    for (const user of users) {
      await crmUserRepository.delete(user.id);
    }

    const deals = await dealRepository.list();
    for (const deal of deals) {
      await dealRepository.delete(deal.id);
    }

    const leads = await leadRepository.list();
    for (const lead of leads) {
      await leadRepository.delete(lead.id);
    }

    // Create test users
    await crmUserRepository.create({
      platformUserId: ADMIN_USER_ID,
      displayName: 'Admin User',
      email: 'admin@test.com',
      customRoleId: 'role-admin',
      teamIds: [],
      status: CRMUserStatus.ACTIVE,
      isActive: true,
      tenantId: TENANT_ID
    });

    await crmUserRepository.create({
      platformUserId: TARGET_USER_ID,
      displayName: 'Target User',
      email: 'target@test.com',
      customRoleId: 'role-sales',
      teamIds: [],
      status: CRMUserStatus.ACTIVE,
      isActive: true,
      tenantId: TENANT_ID
    });
  });

  it('should deactivate user and unassign deals', async () => {
    // Create test deals assigned to target user
    const deal1 = await dealRepository.create({
      title: 'Test Deal 1',
      status: DealStatus.OPEN,
      responsibleUserId: TARGET_USER_ID,
      tenantId: TENANT_ID
    });

    const deal2 = await dealRepository.create({
      title: 'Test Deal 2',
      status: DealStatus.OPEN,
      responsibleUserId: TARGET_USER_ID,
      tenantId: TENANT_ID
    });

    // Deactivate user
    const result = await crmUserRepository.deactivate(TARGET_USER_ID, ADMIN_USER_ID);

    // Verify user is deactivated
    expect(result.user.isActive).toBe(false);
    expect(result.user.status).toBe(CRMUserStatus.INACTIVE);

    // Verify deals are unassigned
    expect(result.dealsUnassigned).toBe(2);

    const updatedDeal1 = await dealRepository.get(deal1.id);
    const updatedDeal2 = await dealRepository.get(deal2.id);

    expect(updatedDeal1?.responsibleUserId).toBeUndefined();
    expect(updatedDeal2?.responsibleUserId).toBeUndefined();
    expect(updatedDeal1?.unassignedAt).toBeDefined();
    expect(updatedDeal2?.unassignedAt).toBeDefined();
    expect(updatedDeal1?.unassignedReason).toBe('user_deactivated');
    expect(updatedDeal2?.unassignedReason).toBe('user_deactivated');
  });

  it('should deactivate user and unassign leads', async () => {
    // Create test leads assigned to target user
    const lead1 = await leadRepository.create({
      title: 'Test Lead 1',
      source: 'Website',
      isTarget: true,
      responsibleUserId: TARGET_USER_ID,
      tenantId: TENANT_ID,
      isArchived: false
    });

    const lead2 = await leadRepository.create({
      title: 'Test Lead 2',
      source: 'Referral',
      isTarget: false,
      responsibleUserId: TARGET_USER_ID,
      tenantId: TENANT_ID,
      isArchived: false
    });

    // Deactivate user
    const result = await crmUserRepository.deactivate(TARGET_USER_ID, ADMIN_USER_ID);

    // Verify leads are unassigned
    expect(result.leadsUnassigned).toBe(2);

    const updatedLead1 = await leadRepository.get(lead1.id);
    const updatedLead2 = await leadRepository.get(lead2.id);

    expect(updatedLead1?.responsibleUserId).toBeUndefined();
    expect(updatedLead2?.responsibleUserId).toBeUndefined();
  });

  it('should create activity logs for deactivation', async () => {
    // Create test deal
    const deal = await dealRepository.create({
      title: 'Test Deal',
      status: DealStatus.OPEN,
      responsibleUserId: TARGET_USER_ID,
      tenantId: TENANT_ID
    });

    // Count activities before
    const activitiesBefore = await activityRepository.list();
    const beforeCount = activitiesBefore.length;

    // Deactivate user
    await crmUserRepository.deactivate(TARGET_USER_ID, ADMIN_USER_ID);

    // Count activities after
    const activitiesAfter = await activityRepository.list();
    const afterCount = activitiesAfter.length;

    // Should have created at least 2 activities: deal unassignment + user deactivation
    expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 2);

    // Verify deal unassignment activity exists
    const dealActivities = activitiesAfter.filter(a => a.entityId === deal.id);
    const unassignActivity = dealActivities.find(a => a.type === 'DEAL_UNASSIGNED');
    expect(unassignActivity).toBeDefined();
    expect(unassignActivity?.meta?.previousUserId).toBe(TARGET_USER_ID);
  });

  it('should throw error when deactivating already inactive user', async () => {
    // Deactivate user once
    await crmUserRepository.deactivate(TARGET_USER_ID, ADMIN_USER_ID);

    // Try to deactivate again
    await expect(
      crmUserRepository.deactivate(TARGET_USER_ID, ADMIN_USER_ID)
    ).rejects.toThrow('already inactive');
  });

  it('should throw error when deactivating non-existent user', async () => {
    await expect(
      crmUserRepository.deactivate('non-existent-user', ADMIN_USER_ID)
    ).rejects.toThrow('not found');
  });

  it('should handle user with no assigned entities', async () => {
    // Deactivate user with no deals or leads
    const result = await crmUserRepository.deactivate(TARGET_USER_ID, ADMIN_USER_ID);

    expect(result.user.isActive).toBe(false);
    expect(result.dealsUnassigned).toBe(0);
    expect(result.leadsUnassigned).toBe(0);
  });
});
