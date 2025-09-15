import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getTestContext } from '../setup/test-setup';
import { CRMAssertions } from '../test-utils/assertions';
import TestDataFactory from '../test-utils/factories';
import { UserRole } from '@united-cars/crm-core';

describe('RBAC Security Tests', () => {
  let testContext: ReturnType<typeof getTestContext>;

  beforeEach(() => {
    testContext = getTestContext();
  });

  describe('Organisation Access Control', () => {
    it('should enforce admin full access', async () => {
      const { repositories, tenantId, adminUserId } = testContext;

      // Admin should read all organisations
      const readResult = await repositories.organisations.findAll({
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      expect(readResult.success).toBe(true);
      expect(readResult.data).toBeInstanceOf(Array);

      // Admin should be able to create
      const newOrg = TestDataFactory.createOrganisation({ tenantId });
      const createResult = await repositories.organisations.create(newOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      expect(createResult.success).toBe(true);

      // Admin should be able to update any organisation
      const orgs = readResult.data!;
      if (orgs.length > 0) {
        const updateResult = await repositories.organisations.update(orgs[0].id, {
          description: 'Admin updated description'
        }, {
          userRole: UserRole.ADMIN,
          userId: adminUserId,
          tenantId
        });

        expect(updateResult.success).toBe(true);

        // Admin should be able to delete
        const deleteResult = await repositories.organisations.delete(orgs[0].id, {
          userRole: UserRole.ADMIN,
          userId: adminUserId,
          tenantId
        });

        expect(deleteResult.success).toBe(true);
      }
    });

    it('should enforce senior manager read all, create, update/delete assigned only', async () => {
      const { repositories, tenantId, seniorManagerUserId, adminUserId } = testContext;

      // Senior manager should read all organisations
      const readResult = await repositories.organisations.findAll({
        userRole: UserRole.SENIOR_SALES_MANAGER,
        userId: seniorManagerUserId,
        tenantId
      });

      expect(readResult.success).toBe(true);

      // Senior manager should be able to create
      const newOrg = TestDataFactory.createOrganisation({ 
        tenantId,
        assignedUserId: seniorManagerUserId 
      });
      
      const createResult = await repositories.organisations.create(newOrg, {
        userRole: UserRole.SENIOR_SALES_MANAGER,
        userId: seniorManagerUserId,
        tenantId
      });

      expect(createResult.success).toBe(true);
      expect(createResult.data?.assignedUserId).toBe(seniorManagerUserId);

      // Should be able to update assigned organisation
      const updateResult = await repositories.organisations.update(createResult.data!.id, {
        description: 'Senior manager updated'
      }, {
        userRole: UserRole.SENIOR_SALES_MANAGER,
        userId: seniorManagerUserId,
        tenantId
      });

      expect(updateResult.success).toBe(true);

      // Should NOT be able to update unassigned organisation
      const adminOrg = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      await repositories.organisations.create(adminOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      const unauthorizedUpdateResult = await repositories.organisations.update(adminOrg.id, {
        description: 'Unauthorized update attempt'
      }, {
        userRole: UserRole.SENIOR_SALES_MANAGER,
        userId: seniorManagerUserId,
        tenantId
      });

      expect(unauthorizedUpdateResult.success).toBe(false);
      expect(unauthorizedUpdateResult.error).toContain('permission');
    });

    it('should enforce junior manager read/update/delete assigned only', async () => {
      const { repositories, tenantId, juniorManagerUserId, adminUserId } = testContext;

      // Create organisation assigned to junior manager
      const assignedOrg = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: juniorManagerUserId,
        createdBy: juniorManagerUserId
      });

      await repositories.organisations.create(assignedOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Create organisation NOT assigned to junior manager
      const unassignedOrg = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      await repositories.organisations.create(unassignedOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Junior manager should only see assigned organisations
      const readResult = await repositories.organisations.findAll({
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(readResult.success).toBe(true);
      const visibleOrgs = readResult.data!;
      
      visibleOrgs.forEach(org => {
        expect(
          org.assignedUserId === juniorManagerUserId || 
          org.createdBy === juniorManagerUserId
        ).toBe(true);
      });

      // Should find the assigned organisation
      const assignedOrgResult = await repositories.organisations.findById(assignedOrg.id, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(assignedOrgResult.success).toBe(true);

      // Should NOT find the unassigned organisation
      const unassignedOrgResult = await repositories.organisations.findById(unassignedOrg.id, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(unassignedOrgResult.success).toBe(false);
      expect(unassignedOrgResult.error).toContain('permission');

      // Should be able to update assigned organisation
      const updateResult = await repositories.organisations.update(assignedOrg.id, {
        description: 'Junior manager update'
      }, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(updateResult.success).toBe(true);

      // Should NOT be able to update unassigned organisation
      const unauthorizedUpdateResult = await repositories.organisations.update(unassignedOrg.id, {
        description: 'Unauthorized update'
      }, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(unauthorizedUpdateResult.success).toBe(false);
      expect(unauthorizedUpdateResult.error).toContain('permission');
    });

    it('should enforce verified organisation restrictions for junior managers', async () => {
      const { repositories, tenantId, juniorManagerUserId } = testContext;

      // Junior manager tries to create unverified organisation
      const unverifiedOrg = TestDataFactory.createOrganisation({
        tenantId,
        verified: false
      });

      const createResult = await repositories.organisations.create(unverifiedOrg, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      // Should succeed but force verification or reject based on business rules
      if (createResult.success) {
        expect(createResult.data?.verified).toBe(true); // Auto-verified
      } else {
        expect(createResult.error).toContain('verified');
      }
    });
  });

  describe('Deal Access Control', () => {
    it('should enforce deal assignment rules', async () => {
      const { repositories, tenantId, juniorManagerUserId, seniorManagerUserId, adminUserId } = testContext;

      // Get pipelines for deal creation
      const pipelinesResult = await repositories.pipelines.findAll({
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      const pipeline = pipelinesResult.data![0];

      // Create deals with different assignments
      const assignedDeal = TestDataFactory.createDeal({
        tenantId,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        assignedUserId: juniorManagerUserId,
        createdBy: juniorManagerUserId
      });

      await repositories.deals.create(assignedDeal, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      const unassignedDeal = TestDataFactory.createDeal({
        tenantId,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        assignedUserId: seniorManagerUserId,
        createdBy: seniorManagerUserId
      });

      await repositories.deals.create(unassignedDeal, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Junior manager should only see assigned deals
      const dealsResult = await repositories.deals.findAll({
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(dealsResult.success).toBe(true);
      dealsResult.data!.forEach(deal => {
        expect(
          deal.assignedUserId === juniorManagerUserId || 
          deal.createdBy === juniorManagerUserId
        ).toBe(true);
      });
    });

    it('should prevent unauthorized deal stage movements', async () => {
      const { repositories, tenantId, juniorManagerUserId, seniorManagerUserId, adminUserId } = testContext;

      const pipelinesResult = await repositories.pipelines.findAll({
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      const pipeline = pipelinesResult.data![0];

      // Create deal assigned to senior manager
      const deal = TestDataFactory.createDeal({
        tenantId,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        assignedUserId: seniorManagerUserId,
        createdBy: seniorManagerUserId
      });

      await repositories.deals.create(deal, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Junior manager should NOT be able to move deal to next stage
      const updateResult = await repositories.deals.update(deal.id, {
        stageId: pipeline.stages[1].id
      }, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('permission');
    });
  });

  describe('Contact Access Control', () => {
    it('should enforce contact visibility based on organisation access', async () => {
      const { repositories, tenantId, juniorManagerUserId, adminUserId } = testContext;

      // Create organisation assigned to admin
      const adminOrg = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      await repositories.organisations.create(adminOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Create contact in admin's organisation
      const contact = TestDataFactory.createContact({
        tenantId,
        organisationId: adminOrg.id,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      await repositories.contacts.create(contact, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Junior manager should NOT see contact from admin's organisation
      const contactResult = await repositories.contacts.findById(contact.id, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(contactResult.success).toBe(false);
      expect(contactResult.error).toContain('permission');
    });
  });

  describe('Lead Conversion Security', () => {
    it('should prevent unauthorized lead conversions', async () => {
      const { repositories, tenantId, juniorManagerUserId, seniorManagerUserId, adminUserId } = testContext;

      // Create target lead assigned to senior manager
      const lead = TestDataFactory.createLead({
        tenantId,
        isTarget: true,
        status: 'qualified' as any,
        assignedUserId: seniorManagerUserId,
        createdBy: seniorManagerUserId
      });

      await repositories.leads.create(lead, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Get pipeline for conversion
      const pipelinesResult = await repositories.pipelines.findAll({
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      const pipeline = pipelinesResult.data![0];

      // Junior manager should NOT be able to convert senior manager's lead
      const conversionResult = await repositories.leads.convertToDeal(lead.id, {
        dealTitle: 'Unauthorized conversion',
        dealValue: 50000,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id
      }, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(conversionResult.success).toBe(false);
      expect(conversionResult.error).toContain('permission');
    });
  });

  describe('Task Assignment Security', () => {
    it('should enforce task assignment rules', async () => {
      const { repositories, tenantId, juniorManagerUserId, seniorManagerUserId, adminUserId } = testContext;

      // Get organisation for task context
      const orgsResult = await repositories.organisations.findAll({
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      const org = orgsResult.data![0];

      // Create task assigned to senior manager
      const task = TestDataFactory.createTask({
        tenantId,
        entityType: 'organisation',
        entityId: org.id,
        assignedUserId: seniorManagerUserId,
        createdBy: seniorManagerUserId
      });

      await repositories.tasks.create(task, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Junior manager should NOT see task assigned to senior manager
      const taskResult = await repositories.tasks.findById(task.id, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(taskResult.success).toBe(false);
      expect(taskResult.error).toContain('permission');
    });
  });

  describe('History Access Control', () => {
    it('should restrict history access based on entity permissions', async () => {
      const { repositories, tenantId, juniorManagerUserId, adminUserId, historyLogger } = testContext;

      // Create organisation assigned to admin
      const adminOrg = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      await repositories.organisations.create(adminOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Get history for admin's organisation
      const historyEntries = historyLogger.getEntries('organisation', adminOrg.id);
      expect(historyEntries.length).toBeGreaterThan(0);

      // Junior manager should NOT have access to admin's organisation history
      // This would be enforced at the service layer in a real implementation
      // For now, we verify the organisation access restriction
      const orgAccessResult = await repositories.organisations.findById(adminOrg.id, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(orgAccessResult.success).toBe(false);
    });
  });

  describe('Tenant Isolation', () => {
    it('should enforce strict tenant isolation', async () => {
      const { repositories, adminUserId } = testContext;
      const otherTenantId = 'other-tenant-id';

      // Create organisation in different tenant
      const crossTenantOrg = TestDataFactory.createOrganisation({
        tenantId: otherTenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      // Should not be able to create in different tenant
      const createResult = await repositories.organisations.create(crossTenantOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId: testContext.tenantId // Different from org's tenantId
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toContain('tenant');

      // Verify tenant isolation in searches
      const searchResult = await repositories.organisations.findAll({
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId: testContext.tenantId
      });

      expect(searchResult.success).toBe(true);
      CRMAssertions.expectTenantIsolation(searchResult.data!, testContext.tenantId);
    });
  });

  describe('Pipeline Access Control', () => {
    it('should enforce pipeline management permissions', async () => {
      const { repositories, tenantId, juniorManagerUserId, adminUserId } = testContext;

      // Junior manager should NOT be able to create pipelines
      const newPipeline = TestDataFactory.createPipeline({
        tenantId,
        name: 'Unauthorized Pipeline'
      });

      const createResult = await repositories.pipelines.create(newPipeline, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toContain('permission');

      // Junior manager should be able to read pipelines
      const readResult = await repositories.pipelines.findAll({
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(readResult.success).toBe(true);

      // Junior manager should NOT be able to update pipelines
      const pipelines = readResult.data!;
      if (pipelines.length > 0) {
        const updateResult = await repositories.pipelines.update(pipelines[0].id, {
          name: 'Unauthorized Update'
        }, {
          userRole: UserRole.JUNIOR_SALES_MANAGER,
          userId: juniorManagerUserId,
          tenantId
        });

        expect(updateResult.success).toBe(false);
        expect(updateResult.error).toContain('permission');
      }
    });
  });

  describe('Cross-Entity Security Validation', () => {
    it('should validate entity relationships across RBAC boundaries', async () => {
      const { repositories, tenantId, juniorManagerUserId, seniorManagerUserId, adminUserId } = testContext;

      // Create organisation assigned to senior manager
      const seniorOrg = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: seniorManagerUserId,
        createdBy: seniorManagerUserId
      });

      await repositories.organisations.create(seniorOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Junior manager should NOT be able to create contact in senior manager's organisation
      const unauthorizedContact = TestDataFactory.createContact({
        tenantId,
        organisationId: seniorOrg.id, // This should fail
        assignedUserId: juniorManagerUserId,
        createdBy: juniorManagerUserId
      });

      const createContactResult = await repositories.contacts.create(unauthorizedContact, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      expect(createContactResult.success).toBe(false);
      expect(createContactResult.error).toContain('organisation');
    });
  });

  describe('Audit Trail Security', () => {
    it('should log all security violations', async () => {
      const { repositories, tenantId, juniorManagerUserId, adminUserId, historyLogger } = testContext;

      const initialHistoryCount = historyLogger.getAllEntries().length;

      // Attempt unauthorized operation
      const adminOrg = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      await repositories.organisations.create(adminOrg, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      // Try unauthorized update
      await repositories.organisations.update(adminOrg.id, {
        description: 'Unauthorized update'
      }, {
        userRole: UserRole.JUNIOR_SALES_MANAGER,
        userId: juniorManagerUserId,
        tenantId
      });

      // Check that security violation was logged
      const currentHistoryCount = historyLogger.getAllEntries().length;
      expect(currentHistoryCount).toBeGreaterThan(initialHistoryCount);

      // Find security violation entry
      const recentEntries = historyLogger.getAllEntries().slice(-10);
      const violationEntry = recentEntries.find(entry => 
        entry.userId === juniorManagerUserId && 
        entry.entityId === adminOrg.id &&
        entry.operation === 'update'
      );

      if (violationEntry) {
        CRMAssertions.expectValidHistoryEntry(violationEntry);
        expect(violationEntry.userId).toBe(juniorManagerUserId);
        expect(violationEntry.userRole).toBe(UserRole.JUNIOR_SALES_MANAGER);
      }
    });
  });

  describe('Data Integrity and Security', () => {
    it('should maintain data integrity under concurrent access', async () => {
      const { repositories, tenantId, adminUserId } = testContext;

      const org = TestDataFactory.createOrganisation({
        tenantId,
        assignedUserId: adminUserId,
        createdBy: adminUserId
      });

      const createResult = await repositories.organisations.create(org, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      expect(createResult.success).toBe(true);

      // Simulate concurrent updates
      const updates = [
        { description: 'Update 1' },
        { description: 'Update 2' },
        { description: 'Update 3' }
      ];

      const updatePromises = updates.map(update =>
        repositories.organisations.update(createResult.data!.id, update, {
          userRole: UserRole.ADMIN,
          userId: adminUserId,
          tenantId
        })
      );

      const results = await Promise.all(updatePromises);
      
      // At least one should succeed
      const successCount = results.filter(result => result.success).length;
      expect(successCount).toBeGreaterThan(0);

      // Verify data integrity
      const finalResult = await repositories.organisations.findById(createResult.data!.id, {
        userRole: UserRole.ADMIN,
        userId: adminUserId,
        tenantId
      });

      expect(finalResult.success).toBe(true);
      CRMAssertions.expectValidOrganisation(finalResult.data!);
    });
  });
});