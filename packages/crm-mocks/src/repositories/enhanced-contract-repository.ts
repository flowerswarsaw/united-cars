import { Contract, ContractStatus, ContractType, EntityType } from '@united-cars/crm-core';
import { EnhancedBaseRepository, EnhancedEntityBase, CreateOptions, UpdateOptions } from '../enhanced-base-repository';
import { RBACUser } from '@united-cars/crm-core/src/rbac';

export interface EnhancedContract extends Contract, EnhancedEntityBase {}

export class EnhancedContractRepository extends EnhancedBaseRepository<EnhancedContract> {
  constructor() {
    super(EntityType.CONTRACT, 'contracts');

    // Set uniqueness constraints
    this.setUniquenessFields(['contractNumber']);
  }

  // Create with auto-generated contract number if not provided
  async createContract(
    data: Omit<EnhancedContract, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    options: CreateOptions
  ) {
    // Auto-assign to creating user if not specified
    if (!data.assignedUserId) {
      data.assignedUserId = options.user.id;
    }

    // Auto-generate contract number if not provided
    if (!data.contractNumber) {
      data.contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    // Set default status
    if (!data.status) {
      data.status = ContractStatus.DRAFT;
    }

    // Set default version
    if (!data.version) {
      data.version = '1.0';
    }

    // Validate contract data
    const validationResult = this.validateContractData(data);
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    return await this.create(data, options);
  }

  // Get contracts by deal
  async getByDeal(dealId: string, user: RBACUser): Promise<EnhancedContract[]> {
    const all = await this.list({}, { user });
    return all.filter(contract => contract.dealId === dealId);
  }

  // Get contracts by organisation
  async getByOrganisation(organisationId: string, user: RBACUser): Promise<EnhancedContract[]> {
    const all = await this.list({}, { user });
    return all.filter(contract => contract.organisationId === organisationId);
  }

  // Get contracts by status
  async getByStatus(status: ContractStatus, user: RBACUser): Promise<EnhancedContract[]> {
    const all = await this.list({}, { user });
    return all.filter(contract => contract.status === status);
  }

  // Get contracts by type
  async getByType(type: ContractType, user: RBACUser): Promise<EnhancedContract[]> {
    const all = await this.list({}, { user });
    return all.filter(contract => contract.type === type);
  }

  // Update status with validation
  async updateStatus(
    contractId: string,
    newStatus: ContractStatus,
    options: UpdateOptions
  ) {
    const contract = await this.get(contractId, options.user);
    if (!contract) {
      return { success: false, errors: ['Contract not found or access denied'] };
    }

    // Validate status transition
    const canTransition = this.canTransitionStatus(contract.status, newStatus);
    if (!canTransition) {
      return {
        success: false,
        errors: [`Cannot transition from ${contract.status} to ${newStatus}`]
      };
    }

    const updateData: Partial<EnhancedContract> = { status: newStatus };

    // Set additional fields based on status
    if (newStatus === ContractStatus.SENT && !contract.sentDate) {
      updateData.sentDate = new Date();
    }
    if (newStatus === ContractStatus.SIGNED && !contract.signedDate) {
      updateData.signedDate = new Date();
    }

    return await this.update(contractId, updateData, {
      ...options,
      reason: `Status changed to ${newStatus}`
    });
  }

  // Validate status transitions
  private canTransitionStatus(from: ContractStatus, to: ContractStatus): boolean {
    const validTransitions: Record<ContractStatus, ContractStatus[]> = {
      [ContractStatus.DRAFT]: [ContractStatus.SENT, ContractStatus.CANCELLED],
      [ContractStatus.SENT]: [ContractStatus.SIGNED, ContractStatus.DRAFT, ContractStatus.CANCELLED],
      [ContractStatus.SIGNED]: [ContractStatus.ACTIVE, ContractStatus.CANCELLED],
      [ContractStatus.ACTIVE]: [ContractStatus.EXPIRED, ContractStatus.CANCELLED],
      [ContractStatus.EXPIRED]: [ContractStatus.ACTIVE], // Can be reactivated
      [ContractStatus.CANCELLED]: [] // Terminal state
    };

    return validTransitions[from]?.includes(to) || false;
  }

  // Business validation
  private validateContractData(data: Partial<EnhancedContract>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || data.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!data.organisationId) {
      errors.push('Organisation is required');
    }

    if (data.amount !== undefined && data.amount < 0) {
      errors.push('Amount cannot be negative');
    }

    if (data.endDate && data.effectiveDate && data.endDate < data.effectiveDate) {
      errors.push('End date must be after effective date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get expiring contracts (within days)
  async getExpiring(days: number, user: RBACUser): Promise<EnhancedContract[]> {
    const all = await this.list({ status: ContractStatus.ACTIVE }, { user });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return all.filter(contract =>
      contract.endDate &&
      contract.endDate <= cutoffDate &&
      contract.endDate >= new Date()
    );
  }
}

// Export singleton instance
export const contractRepository = new EnhancedContractRepository();
