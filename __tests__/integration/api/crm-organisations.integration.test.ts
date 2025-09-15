import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/crm/organisations/route';
import { getTestContext, TestScenarios } from '../../setup/test-setup';
import { CRMAssertions } from '../../test-utils/assertions';
import TestDataFactory from '../../test-utils/factories';
import { UserRole } from '@united-cars/crm-core';

describe('CRM Organisations API Integration Tests', () => {
  let testContext: ReturnType<typeof getTestContext>;

  beforeEach(() => {
    testContext = getTestContext();
  });

  describe('GET /api/crm/organisations', () => {
    it('should return all organisations for admin users', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeInstanceOf(Array);
      expect(responseData.data.length).toBeGreaterThan(0);
      
      responseData.data.forEach((org: any) => {
        CRMAssertions.expectValidOrganisation(org);
        CRMAssertions.expectTenantIsolation([org], testContext.tenantId);
      });
    });

    it('should return only assigned organisations for junior managers', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-user-id': testContext.juniorManagerUserId,
          'x-user-role': UserRole.JUNIOR_SALES_MANAGER,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeInstanceOf(Array);
      
      // All returned organisations should be assigned to the junior manager
      responseData.data.forEach((org: any) => {
        expect(
          org.assignedUserId === testContext.juniorManagerUserId || 
          org.createdBy === testContext.juniorManagerUserId
        ).toBe(true);
      });
    });

    it('should support search functionality', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          search: 'Admin',
        },
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      
      if (responseData.data.length > 0) {
        CRMAssertions.expectSearchResults(
          responseData.data,
          'Admin',
          ['name', 'description']
        );
      }
    });

    it('should support filtering by verified status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          verified: 'true',
        },
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      
      responseData.data.forEach((org: any) => {
        expect(org.verified).toBe(true);
        CRMAssertions.expectVerificationConsistency(org);
      });
    });
  });

  describe('POST /api/crm/organisations', () => {
    it('should create a new organisation with valid data', async () => {
      const newOrg = TestDataFactory.createOrganisation({
        tenantId: testContext.tenantId,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: newOrg,
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      
      CRMAssertions.expectValidOrganisation(responseData.data);
      expect(responseData.data.name).toBe(newOrg.name);
      expect(responseData.data.createdBy).toBe(testContext.adminUserId);
    });

    it('should detect uniqueness conflicts and provide resolution options', async () => {
      const { firstOrg, secondOrg, sharedEmail } = await TestScenarios.createUniquenessConflictScenario(testContext);

      const { req, res } = createMocks({
        method: 'POST',
        body: secondOrg,
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(false);
      expect(responseData.conflicts).toBeInstanceOf(Array);
      expect(responseData.conflicts.length).toBeGreaterThan(0);
      
      const emailConflict = responseData.conflicts.find((c: any) => c.field === 'contactMethods.email');
      CRMAssertions.expectUniquenessConflict(emailConflict, 'contactMethods.email', sharedEmail);
    });

    it('should validate required fields', async () => {
      const invalidOrg = {
        tenantId: testContext.tenantId,
        // Missing required name field
        type: 'DEALER',
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidOrg,
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(false);
      expect(responseData.errors).toBeInstanceOf(Array);
      expect(responseData.errors.some((error: string) => error.includes('name'))).toBe(true);
    });

    it('should enforce RBAC for junior managers creating organisations', async () => {
      const newOrg = TestDataFactory.createOrganisation({
        tenantId: testContext.tenantId,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: newOrg,
        headers: {
          'x-user-id': testContext.juniorManagerUserId,
          'x-user-role': UserRole.JUNIOR_SALES_MANAGER,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data.assignedUserId).toBe(testContext.juniorManagerUserId);
      expect(responseData.data.createdBy).toBe(testContext.juniorManagerUserId);
    });

    it('should reject unverified organisations from junior managers', async () => {
      const unverifiedOrg = TestDataFactory.createOrganisation({
        tenantId: testContext.tenantId,
        verified: false, // This should be rejected for junior managers
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: unverifiedOrg,
        headers: {
          'x-user-id': testContext.juniorManagerUserId,
          'x-user-role': UserRole.JUNIOR_SALES_MANAGER,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      // Should succeed but force verification based on business rules
      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      // Business rule: junior managers can only work with verified orgs
      expect(responseData.data.verified).toBe(true);
    });
  });

  describe('PUT /api/crm/organisations/[id]', () => {
    it('should update organisation when user has permission', async () => {
      // Get an organisation assigned to senior manager
      const orgsResult = await testContext.repositories.organisations.findAll({
        userRole: UserRole.ADMIN,
        userId: testContext.adminUserId,
        tenantId: testContext.tenantId
      });
      
      const targetOrg = orgsResult.data!.find(org => org.assignedUserId === testContext.seniorManagerUserId);
      
      if (!targetOrg) {
        throw new Error('No target organisation found for test');
      }

      const updates = {
        name: 'Updated Corp Name',
        description: 'Updated description',
      };

      const { req, res } = createMocks({
        method: 'PUT',
        body: updates,
        headers: {
          'x-user-id': testContext.seniorManagerUserId,
          'x-user-role': UserRole.SENIOR_SALES_MANAGER,
          'x-tenant-id': testContext.tenantId,
        },
        query: {
          id: targetOrg.id,
        },
      });

      // Mock the dynamic route
      req.url = `/api/crm/organisations/${targetOrg.id}`;
      
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe(updates.name);
      expect(responseData.data.description).toBe(updates.description);
      expect(responseData.data.updatedBy).toBe(testContext.seniorManagerUserId);
    });

    it('should reject updates when user lacks permission', async () => {
      // Get an organisation NOT assigned to junior manager
      const orgsResult = await testContext.repositories.organisations.findAll({
        userRole: UserRole.ADMIN,
        userId: testContext.adminUserId,
        tenantId: testContext.tenantId
      });
      
      const targetOrg = orgsResult.data!.find(org => 
        org.assignedUserId !== testContext.juniorManagerUserId &&
        org.createdBy !== testContext.juniorManagerUserId
      );
      
      if (!targetOrg) {
        throw new Error('No target organisation found for test');
      }

      const updates = {
        name: 'Unauthorized Update',
      };

      const { req, res } = createMocks({
        method: 'PUT',
        body: updates,
        headers: {
          'x-user-id': testContext.juniorManagerUserId,
          'x-user-role': UserRole.JUNIOR_SALES_MANAGER,
          'x-tenant-id': testContext.tenantId,
        },
        query: {
          id: targetOrg.id,
        },
      });

      req.url = `/api/crm/organisations/${targetOrg.id}`;
      
      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('permission');
    });

    it('should detect conflicts during updates', async () => {
      // Create two organisations
      const org1 = TestDataFactory.createOrganisation({
        tenantId: testContext.tenantId,
        contactMethods: [
          TestDataFactory.createContactMethod({
            type: 'email' as any,
            value: 'unique1@example.com',
            primary: true
          })
        ]
      });

      const org2 = TestDataFactory.createOrganisation({
        tenantId: testContext.tenantId,
        contactMethods: [
          TestDataFactory.createContactMethod({
            type: 'email' as any,
            value: 'unique2@example.com',
            primary: true
          })
        ]
      });

      // Create both organisations
      await testContext.repositories.organisations.create(org1, {
        userRole: UserRole.ADMIN,
        userId: testContext.adminUserId,
        tenantId: testContext.tenantId
      });

      await testContext.repositories.organisations.create(org2, {
        userRole: UserRole.ADMIN,
        userId: testContext.adminUserId,
        tenantId: testContext.tenantId
      });

      // Try to update org2 to have org1's email
      const conflictingUpdate = {
        contactMethods: [
          TestDataFactory.createContactMethod({
            type: 'email' as any,
            value: 'unique1@example.com', // This should conflict
            primary: true
          })
        ]
      };

      const { req, res } = createMocks({
        method: 'PUT',
        body: conflictingUpdate,
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
        query: {
          id: org2.id,
        },
      });

      req.url = `/api/crm/organisations/${org2.id}`;
      
      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(false);
      expect(responseData.conflicts).toBeInstanceOf(Array);
      expect(responseData.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/crm/organisations/[id]', () => {
    it('should delete organisation when user has permission', async () => {
      // Create an organisation for deletion
      const orgToDelete = TestDataFactory.createOrganisation({
        tenantId: testContext.tenantId,
        assignedUserId: testContext.adminUserId,
        createdBy: testContext.adminUserId
      });

      const createResult = await testContext.repositories.organisations.create(orgToDelete, {
        userRole: UserRole.ADMIN,
        userId: testContext.adminUserId,
        tenantId: testContext.tenantId
      });

      expect(createResult.success).toBe(true);

      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
        query: {
          id: orgToDelete.id,
        },
      });

      req.url = `/api/crm/organisations/${orgToDelete.id}`;
      
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      
      // Verify organisation is actually deleted
      const getResult = await testContext.repositories.organisations.findById(orgToDelete.id, {
        userRole: UserRole.ADMIN,
        userId: testContext.adminUserId,
        tenantId: testContext.tenantId
      });
      
      expect(getResult.success).toBe(false);
    });

    it('should reject deletion when user lacks permission', async () => {
      // Get an organisation NOT assigned to junior manager
      const orgsResult = await testContext.repositories.organisations.findAll({
        userRole: UserRole.ADMIN,
        userId: testContext.adminUserId,
        tenantId: testContext.tenantId
      });
      
      const targetOrg = orgsResult.data!.find(org => 
        org.assignedUserId !== testContext.juniorManagerUserId &&
        org.createdBy !== testContext.juniorManagerUserId
      );
      
      if (!targetOrg) {
        throw new Error('No target organisation found for test');
      }

      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          'x-user-id': testContext.juniorManagerUserId,
          'x-user-role': UserRole.JUNIOR_SALES_MANAGER,
          'x-tenant-id': testContext.tenantId,
        },
        query: {
          id: targetOrg.id,
        },
      });

      req.url = `/api/crm/organisations/${targetOrg.id}`;
      
      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('permission');
    });
  });

  describe('History and Audit Trail', () => {
    it('should log creation activities', async () => {
      const newOrg = TestDataFactory.createOrganisation({
        tenantId: testContext.tenantId,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: newOrg,
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      // Check that history entry was created
      const historyEntries = testContext.historyLogger.getEntries(
        'organisation',
        responseData.data.id
      );
      
      expect(historyEntries.length).toBeGreaterThan(0);
      const createEntry = historyEntries.find(entry => entry.operation === 'create');
      CRMAssertions.expectValidHistoryEntry(createEntry!);
    });

    it('should maintain history integrity', async () => {
      // Get all history entries
      const allEntries = testContext.historyLogger.getAllEntries();
      CRMAssertions.expectHistoryIntegrity(allEntries);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 50;
      
      const organisations = Array.from({ length: batchSize }, () =>
        TestDataFactory.createOrganisation({
          tenantId: testContext.tenantId,
        })
      );

      // Create organisations in parallel
      const createPromises = organisations.map(org => 
        testContext.repositories.organisations.create(org, {
          userRole: UserRole.ADMIN,
          userId: testContext.adminUserId,
          tenantId: testContext.tenantId
        })
      );

      const results = await Promise.all(createPromises);
      
      CRMAssertions.expectPerformanceMetrics(
        startTime,
        5000, // 5 second threshold for 50 operations
        `Bulk create ${batchSize} organisations`
      );

      // Verify all were created successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle search queries efficiently', async () => {
      const startTime = Date.now();

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          search: 'Corp',
          verified: 'true',
          limit: '100'
        },
        headers: {
          'x-user-id': testContext.adminUserId,
          'x-user-role': UserRole.ADMIN,
          'x-tenant-id': testContext.tenantId,
        },
      });

      await handler(req, res);

      CRMAssertions.expectPerformanceMetrics(
        startTime,
        1000, // 1 second threshold for search
        'Search organisations with filters'
      );

      expect(res._getStatusCode()).toBe(200);
    });
  });
});