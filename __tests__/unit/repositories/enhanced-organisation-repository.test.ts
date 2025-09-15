import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { 
  enhancedOrganisationRepository,
  uniquenessManager,
  historyLogger,
  initializeEnhancedCRM
} from '@united-cars/crm-mocks/src/enhanced-index';
import { UserRole } from '@united-cars/crm-core/src/rbac';
import { OrganizationType } from '@united-cars/crm-core';
import { createMockUser, createMockOrganisation, resetEnhancedSystem } from '../../test-utils/factories';
import { expectConflictError, expectAccessDenied, expectHistoryEntry } from '../../test-utils/assertions';

describe('EnhancedOrganisationRepository', () => {
  beforeAll(async () => {
    await initializeEnhancedCRM();
  });

  beforeEach(async () => {
    await resetEnhancedSystem();
  });

  describe('RBAC Enforcement', () => {
    it('should allow admin to create any organisation', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      const orgData = createMockOrganisation({ 
        name: 'Test Corp',
        email: 'test@testcorp.com',
        companyId: 'TEST-001'
      });

      const result = await enhancedOrganisationRepository.createOrganisation(orgData, {
        user: admin,
        ipAddress: '127.0.0.1',
        reason: 'Test creation'
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Test Corp',
        email: 'test@testcorp.com',
        companyId: 'TEST-001',
        createdBy: admin.id,
        assignedUserId: admin.id
      });

      // Verify history entry was created
      await expectHistoryEntry({
        entityType: 'organisations',
        entityId: result.data!.id,
        operation: 'CREATE',
        userId: admin.id
      });
    });

    it('should allow senior manager to create organisation', async () => {
      const senior = createMockUser({ role: UserRole.SENIOR_SALES_MANAGER });
      const orgData = createMockOrganisation({ name: 'Senior Corp' });

      const result = await enhancedOrganisationRepository.createOrganisation(orgData, {
        user: senior,
        reason: 'Senior creation'
      });

      expect(result.success).toBe(true);
      expect(result.data?.assignedUserId).toBe(senior.id);
    });

    it('should allow junior manager to create organisation', async () => {
      const junior = createMockUser({ role: UserRole.JUNIOR_SALES_MANAGER });
      const orgData = createMockOrganisation({ name: 'Junior Corp' });

      const result = await enhancedOrganisationRepository.createOrganisation(orgData, {
        user: junior,
        reason: 'Junior creation'
      });

      expect(result.success).toBe(true);
      expect(result.data?.assignedUserId).toBe(junior.id);
    });

    it('should restrict junior manager to only see assigned organisations', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      const junior = createMockUser({ role: UserRole.JUNIOR_SALES_MANAGER });

      // Create org assigned to admin
      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ name: 'Admin Org' }), 
        { user: admin }
      );

      // Create org assigned to junior
      const juniorOrgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ name: 'Junior Org' }), 
        { user: junior }
      );

      // Junior should only see their assigned org
      const juniorVisibleOrgs = await enhancedOrganisationRepository.list({}, { user: junior });
      
      expect(juniorVisibleOrgs).toHaveLength(1);
      expect(juniorVisibleOrgs[0].name).toBe('Junior Org');
      expect(juniorVisibleOrgs[0].assignedUserId).toBe(junior.id);
    });

    it('should prevent junior from updating non-assigned organisation', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      const junior = createMockUser({ role: UserRole.JUNIOR_SALES_MANAGER });

      // Admin creates org
      const adminOrgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ name: 'Admin Org' }), 
        { user: admin }
      );

      // Junior tries to update admin's org
      await expectAccessDenied(async () => {
        await enhancedOrganisationRepository.update(
          adminOrgResult.data!.id,
          { name: 'Hacked Name' },
          { user: junior }
        );
      });
    });

    it('should prevent non-admin from deleting any organisation', async () => {
      const senior = createMockUser({ role: UserRole.SENIOR_SALES_MANAGER });
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ name: 'Senior Org' }), 
        { user: senior }
      );

      await expectAccessDenied(async () => {
        await enhancedOrganisationRepository.remove(orgResult.data!.id, { user: senior });
      });
    });
  });

  describe('Uniqueness Constraints', () => {
    it('should detect email conflicts across organisations', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      // Create first org with email
      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'First Corp',
          email: 'conflict@test.com'
        }), 
        { user: admin }
      );

      // Attempt to create second org with same email
      await expectConflictError(
        async () => {
          await enhancedOrganisationRepository.createOrganisation(
            createMockOrganisation({
              name: 'Second Corp', 
              email: 'conflict@test.com'
            }),
            { user: admin }
          );
        },
        {
          field: 'email',
          value: 'conflict@test.com'
        }
      );
    });

    it('should detect phone conflicts with normalization', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      // Create org with formatted phone
      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'First Corp',
          phone: '+1 (555) 123-4567'
        }), 
        { user: admin }
      );

      // Attempt to create org with same phone, different format
      await expectConflictError(
        async () => {
          await enhancedOrganisationRepository.createOrganisation(
            createMockOrganisation({
              name: 'Second Corp', 
              phone: '555.123.4567'  // Different format, same number
            }),
            { user: admin }
          );
        },
        {
          field: 'phone',
          value: '555.123.4567'
        }
      );
    });

    it('should detect company ID conflicts', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'First Corp',
          companyId: 'COMP-001'
        }), 
        { user: admin }
      );

      await expectConflictError(
        async () => {
          await enhancedOrganisationRepository.createOrganisation(
            createMockOrganisation({
              name: 'Second Corp', 
              companyId: 'COMP-001'
            }),
            { user: admin }
          );
        },
        {
          field: 'companyId',
          value: 'COMP-001'
        }
      );
    });

    it('should allow conflict resolution with field modifications', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      // Create first org
      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'First Corp',
          email: 'conflict@test.com'
        }), 
        { user: admin }
      );

      // Create second org with conflict resolution
      const result = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({
          name: 'Second Corp', 
          email: 'conflict+resolved@test.com'  // Modified to resolve conflict
        }),
        { 
          user: admin,
          skipUniquenessCheck: true  // Simulate conflict resolution
        }
      );

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('conflict+resolved@test.com');
    });
  });

  describe('Verified Organisation Restrictions', () => {
    it('should allow admin to update verified organisation', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      // Create verified org
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Verified Corp',
          verified: true
        }), 
        { user: admin }
      );

      // Admin should be able to update
      const updateResult = await enhancedOrganisationRepository.update(
        orgResult.data!.id,
        { name: 'Updated Verified Corp' },
        { user: admin }
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe('Updated Verified Corp');
    });

    it('should prevent non-admin from updating verified organisation', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      const senior = createMockUser({ role: UserRole.SENIOR_SALES_MANAGER });
      
      // Admin creates verified org
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Verified Corp',
          verified: true
        }), 
        { user: admin }
      );

      // Assign to senior for access
      await enhancedOrganisationRepository.update(
        orgResult.data!.id,
        { assignedUserId: senior.id },
        { user: admin }
      );

      // Senior should not be able to update verified org
      await expectAccessDenied(async () => {
        await enhancedOrganisationRepository.update(
          orgResult.data!.id,
          { name: 'Hacked Verified Corp' },
          { user: senior }
        );
      });
    });

    it('should allow verification of organisation by admin only', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      const senior = createMockUser({ role: UserRole.SENIOR_SALES_MANAGER });
      
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ name: 'Unverified Corp' }), 
        { user: senior }
      );

      // Senior cannot verify
      const seniorVerifyResult = await enhancedOrganisationRepository.verifyField(
        orgResult.data!.id,
        'email',
        senior
      );
      expect(seniorVerifyResult.success).toBe(false);
      expect(seniorVerifyResult.errors).toContain('Only admins can verify fields');

      // Admin can verify
      const adminVerifyResult = await enhancedOrganisationRepository.verifyField(
        orgResult.data!.id,
        'email',
        admin
      );
      expect(adminVerifyResult.success).toBe(true);

      // Check that organisation is now verified
      const updatedOrg = await enhancedOrganisationRepository.get(orgResult.data!.id, admin);
      expect(updatedOrg?.verified).toBe(true);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate organisation type-specific data', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      // Test dealer-specific validation
      const result = await enhancedOrganisationRepository.validateTypeSpecificData(
        'test-org-id',
        admin
      );

      // This would fail since org doesn't exist, but tests validation structure
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Organisation not found or access denied');
    });

    it('should auto-assign creating user when no assignedUserId provided', async () => {
      const senior = createMockUser({ role: UserRole.SENIOR_SALES_MANAGER });
      
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Auto Assigned Corp'
          // No assignedUserId provided
        }), 
        { user: senior }
      );

      expect(result.success).toBe(true);
      expect(result.data?.assignedUserId).toBe(senior.id);
    });

    it('should track type-specific data changes in history', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Dealer Corp',
          type: OrganizationType.DEALER
        }), 
        { user: admin }
      );

      // Update type-specific data
      await enhancedOrganisationRepository.updateTypeSpecificData(
        orgResult.data!.id,
        { 
          dealerLicense: 'DL-12345',
          lotSize: 200,
          monthlyVolume: 50
        },
        { user: admin, reason: 'Updated dealer info' }
      );

      // Verify history entry
      await expectHistoryEntry({
        entityType: 'organisations',
        entityId: orgResult.data!.id,
        operation: 'UPDATE',
        userId: admin.id,
        changedFields: ['typeSpecificData']
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should perform role-aware advanced search', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      const junior = createMockUser({ role: UserRole.JUNIOR_SALES_MANAGER });

      // Create multiple orgs
      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'High Value Dealer',
          type: OrganizationType.DEALER,
          verified: true
        }), 
        { user: admin }
      );

      const juniorOrgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Junior Dealer',
          type: OrganizationType.DEALER
        }), 
        { user: junior }
      );

      // Admin search sees all
      const adminResults = await enhancedOrganisationRepository.advancedSearch({
        type: OrganizationType.DEALER
      }, admin);
      expect(adminResults.length).toBe(2);

      // Junior search sees only assigned
      const juniorResults = await enhancedOrganisationRepository.advancedSearch({
        type: OrganizationType.DEALER
      }, junior);
      expect(juniorResults.length).toBe(1);
      expect(juniorResults[0].name).toBe('Junior Dealer');
    });

    it('should filter by verification status', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });

      // Create verified and unverified orgs
      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Verified Corp',
          verified: true
        }), 
        { user: admin }
      );

      await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Unverified Corp',
          verified: false
        }), 
        { user: admin }
      );

      // Search for verified only
      const verifiedResults = await enhancedOrganisationRepository.advancedSearch({
        verified: true
      }, admin);
      
      expect(verifiedResults.length).toBe(1);
      expect(verifiedResults[0].name).toBe('Verified Corp');
      expect(verifiedResults[0].verified).toBe(true);
    });
  });

  describe('History and Audit Trail', () => {
    it('should log all CRUD operations with checksums', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      // Create
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ name: 'Audit Test Corp' }), 
        { user: admin }
      );

      // Update  
      await enhancedOrganisationRepository.update(
        orgResult.data!.id,
        { name: 'Updated Audit Test Corp' },
        { user: admin, reason: 'Name change' }
      );

      // Delete
      await enhancedOrganisationRepository.remove(
        orgResult.data!.id,
        { user: admin, reason: 'Cleanup' }
      );

      // Verify complete audit trail
      const history = historyLogger.getHistory({
        entityType: 'organisations',
        entityId: orgResult.data!.id
      });

      expect(history).toHaveLength(3);
      expect(history[0].operation).toBe('DELETE');
      expect(history[1].operation).toBe('UPDATE');
      expect(history[2].operation).toBe('CREATE');

      // All entries should have valid checksums
      history.forEach(entry => {
        expect(entry.checksum).toBeDefined();
        expect(typeof entry.checksum).toBe('string');
        expect(entry.checksum.length).toBeGreaterThan(0);
      });
    });

    it('should track field-level changes', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      const orgResult = await enhancedOrganisationRepository.createOrganisation(
        createMockOrganisation({ 
          name: 'Field Test Corp',
          email: 'old@test.com',
          phone: '+1-555-111-2222'
        }), 
        { user: admin }
      );

      // Update multiple fields
      await enhancedOrganisationRepository.update(
        orgResult.data!.id,
        { 
          email: 'new@test.com',
          phone: '+1-555-333-4444'
        },
        { user: admin, reason: 'Contact info update' }
      );

      const history = historyLogger.getHistory({
        entityType: 'organisations',
        entityId: orgResult.data!.id,
        operation: 'UPDATE'
      });

      expect(history).toHaveLength(1);
      expect(history[0].changedFields).toEqual(['email', 'phone']);
      expect(history[0].beforeData?.email).toBe('old@test.com');
      expect(history[0].afterData?.email).toBe('new@test.com');
    });
  });
});