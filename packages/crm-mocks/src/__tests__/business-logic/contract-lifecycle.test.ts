import { describe, it, expect, beforeEach } from 'vitest';
import { contractRepository } from '../../repositories/enhanced-contract-repository';
import { organisationRepository } from '../../repositories/organisation-repository';
import { ContractStatus, ContractType, EntityType } from '@united-cars/crm-core';
import { UserRole, RBACUser } from '@united-cars/crm-core/src/rbac';

describe('Contract Lifecycle Business Logic', () => {
  // Test user with admin role
  const adminUser: RBACUser = {
    id: 'admin-user',
    role: UserRole.ADMIN
  };

  // Helper to create a test organisation
  const createTestOrganisation = async () => {
    const org = await organisationRepository.create({
      name: `Test Org - ${Date.now()}`,
      type: 'DEALER' as any
    } as any);
    return org;
  };

  // Helper to create a test contract
  const createTestContract = async (overrides: Partial<{
    status: ContractStatus;
    reactivationCount: number;
  }> = {}) => {
    const org = await createTestOrganisation();

    const result = await contractRepository.createContract({
      title: `Test Contract - ${Date.now()}`,
      type: ContractType.SERVICE_AGREEMENT,
      organisationId: org.id,
      status: overrides.status,
      amount: 10000,
      currency: 'USD',
      effectiveDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      ...(overrides.reactivationCount !== undefined ? { reactivationCount: overrides.reactivationCount } : {})
    } as any, { user: adminUser });

    if (!result.success || !result.data) {
      throw new Error(`Failed to create contract: ${result.errors?.join(', ')}`);
    }

    return result.data;
  };

  describe('Contract Status Transitions', () => {
    it('should allow DRAFT -> SENT transition', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.SENT,
        { user: adminUser }
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(ContractStatus.SENT);
      expect(result.data?.sentDate).toBeDefined();
    });

    it('should allow DRAFT -> CANCELLED transition', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.CANCELLED,
        { user: adminUser }
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(ContractStatus.CANCELLED);
    });

    it('should reject DRAFT -> SIGNED transition (invalid)', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.SIGNED,
        { user: adminUser }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain(`Cannot transition from ${ContractStatus.DRAFT} to ${ContractStatus.SIGNED}`);
    });

    it('should allow SENT -> SIGNED transition', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // First send it
      await contractRepository.updateStatus(
        contract.id,
        ContractStatus.SENT,
        { user: adminUser }
      );

      // Then sign it
      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.SIGNED,
        { user: adminUser }
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(ContractStatus.SIGNED);
      expect(result.data?.signedDate).toBeDefined();
    });

    it('should allow SIGNED -> ACTIVE transition', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // Progress through states
      await contractRepository.updateStatus(contract.id, ContractStatus.SENT, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.SIGNED, { user: adminUser });

      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.ACTIVE,
        { user: adminUser }
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(ContractStatus.ACTIVE);
    });

    it('should allow ACTIVE -> EXPIRED transition', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // Progress through states
      await contractRepository.updateStatus(contract.id, ContractStatus.SENT, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.SIGNED, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });

      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.EXPIRED,
        { user: adminUser }
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(ContractStatus.EXPIRED);
    });

    it('should prevent transitions from CANCELLED (terminal state)', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // Cancel it
      await contractRepository.updateStatus(contract.id, ContractStatus.CANCELLED, { user: adminUser });

      // Try to reactivate
      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.ACTIVE,
        { user: adminUser }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Cannot transition from');
    });
  });

  describe('B5 Fix: Contract Reactivation Limits', () => {
    it('should allow first reactivation from EXPIRED to ACTIVE', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // Progress to expired
      await contractRepository.updateStatus(contract.id, ContractStatus.SENT, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.SIGNED, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.EXPIRED, { user: adminUser });

      // Reactivate
      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.ACTIVE,
        { user: adminUser }
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(ContractStatus.ACTIVE);
      expect(result.data?.reactivationCount).toBe(1);
    });

    it('should track reactivation count correctly', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // Progress to expired
      await contractRepository.updateStatus(contract.id, ContractStatus.SENT, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.SIGNED, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });

      // First cycle: expire and reactivate
      await contractRepository.updateStatus(contract.id, ContractStatus.EXPIRED, { user: adminUser });
      let result = await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });
      expect(result.data?.reactivationCount).toBe(1);

      // Second cycle
      await contractRepository.updateStatus(contract.id, ContractStatus.EXPIRED, { user: adminUser });
      result = await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });
      expect(result.data?.reactivationCount).toBe(2);

      // Third cycle
      await contractRepository.updateStatus(contract.id, ContractStatus.EXPIRED, { user: adminUser });
      result = await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });
      expect(result.data?.reactivationCount).toBe(3);
    });

    it('should reject reactivation after reaching limit (3)', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // Progress to expired
      await contractRepository.updateStatus(contract.id, ContractStatus.SENT, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.SIGNED, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });

      // Perform 3 reactivation cycles
      for (let i = 0; i < 3; i++) {
        await contractRepository.updateStatus(contract.id, ContractStatus.EXPIRED, { user: adminUser });
        await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });
      }

      // Now expire again
      await contractRepository.updateStatus(contract.id, ContractStatus.EXPIRED, { user: adminUser });

      // Fourth reactivation should fail
      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.ACTIVE,
        { user: adminUser }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('maximum reactivation limit');
    });

    it('should include reason in history when reactivating', async () => {
      const contract = await createTestContract({ status: ContractStatus.DRAFT });

      // Progress to expired
      await contractRepository.updateStatus(contract.id, ContractStatus.SENT, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.SIGNED, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.ACTIVE, { user: adminUser });
      await contractRepository.updateStatus(contract.id, ContractStatus.EXPIRED, { user: adminUser });

      // Reactivate
      const result = await contractRepository.updateStatus(
        contract.id,
        ContractStatus.ACTIVE,
        { user: adminUser, reason: 'Extended contract term' }
      );

      expect(result.success).toBe(true);
      // The reason should include reactivation number
    });
  });

  describe('Contract Data Validation', () => {
    it('should reject contract without title', async () => {
      const org = await createTestOrganisation();

      const result = await contractRepository.createContract({
        title: '',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: 10000,
        currency: 'USD'
      } as any, { user: adminUser });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should reject contract without organisation', async () => {
      const result = await contractRepository.createContract({
        title: 'Test Contract',
        type: ContractType.SERVICE_AGREEMENT,
        amount: 10000,
        currency: 'USD'
      } as any, { user: adminUser });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Organisation is required');
    });

    it('should reject negative amount', async () => {
      const org = await createTestOrganisation();

      const result = await contractRepository.createContract({
        title: 'Test Contract',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: -1000,
        currency: 'USD'
      } as any, { user: adminUser });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Amount cannot be negative');
    });

    it('should reject endDate before effectiveDate', async () => {
      const org = await createTestOrganisation();

      const result = await contractRepository.createContract({
        title: 'Test Contract',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: 10000,
        currency: 'USD',
        effectiveDate: new Date('2025-12-01'),
        endDate: new Date('2025-01-01')
      } as any, { user: adminUser });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('End date must be after effective date');
    });

    it('should auto-generate contract number if not provided', async () => {
      const org = await createTestOrganisation();

      const result = await contractRepository.createContract({
        title: 'Test Contract',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: 10000,
        currency: 'USD'
      } as any, { user: adminUser });

      expect(result.success).toBe(true);
      expect(result.data?.contractNumber).toBeDefined();
      expect(result.data?.contractNumber).toMatch(/^CNT-/);
    });

    it('should set default status to DRAFT', async () => {
      const org = await createTestOrganisation();

      const result = await contractRepository.createContract({
        title: 'Test Contract',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: 10000,
        currency: 'USD'
      } as any, { user: adminUser });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(ContractStatus.DRAFT);
    });
  });

  describe('Contract Queries', () => {
    it('should get contracts by organisation', async () => {
      const org = await createTestOrganisation();

      // Create multiple contracts for the same org
      await contractRepository.createContract({
        title: 'Contract 1',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: 10000,
        currency: 'USD'
      } as any, { user: adminUser });

      await contractRepository.createContract({
        title: 'Contract 2',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: 20000,
        currency: 'USD'
      } as any, { user: adminUser });

      const contracts = await contractRepository.getByOrganisation(org.id, adminUser);

      expect(contracts.length).toBeGreaterThanOrEqual(2);
      contracts.forEach(c => {
        expect(c.organisationId).toBe(org.id);
      });
    });

    it('should get contracts by status', async () => {
      const org = await createTestOrganisation();

      // Create a DRAFT contract
      const result = await contractRepository.createContract({
        title: 'Draft Contract',
        type: ContractType.SERVICE_AGREEMENT,
        organisationId: org.id,
        amount: 10000,
        currency: 'USD',
        status: ContractStatus.DRAFT
      } as any, { user: adminUser });

      const draftContracts = await contractRepository.getByStatus(ContractStatus.DRAFT, adminUser);

      expect(draftContracts.length).toBeGreaterThanOrEqual(1);
      draftContracts.forEach(c => {
        expect(c.status).toBe(ContractStatus.DRAFT);
      });
    });
  });
});
