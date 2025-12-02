import { ContractStatus, ContractType } from '@united-cars/crm-core';
import { contractRepository } from './repositories/enhanced-contract-repository';
import { RBACUser, UserRole } from '@united-cars/crm-core/src/rbac';

// Mock user for seeding
const mockUser: RBACUser = {
  id: 'admin-user-001',
  tenantId: 'united-cars',
  orgId: 'united-cars',
  email: 'admin@unitedcars.com',
  role: UserRole.ADMIN
};

export async function seedContracts() {
  console.log('Seeding contracts...');

  const contracts = [
    {
      title: 'Master Service Agreement - AutoMax Luxury',
      contractNumber: 'MSA-2024-001',
      type: ContractType.MASTER,
      status: ContractStatus.ACTIVE,
      description: 'Master agreement covering all vehicle shipping services for AutoMax Luxury Dealership',
      amount: 500000,
      currency: 'USD',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      signedDate: new Date('2023-12-15'),
      sentDate: new Date('2023-12-01'),
      organisationId: 'org-admin-001', // AutoMax Luxury
      contactIds: [],
      version: '1.0',
      responsibleUserId: 'admin-user-001',
      notes: 'Annual master service agreement with volume discounts applied'
    },
    {
      title: 'Vehicle Purchase Order #2024-Q1-045',
      contractNumber: 'PO-2024-045',
      type: ContractType.ORDER,
      status: ContractStatus.SIGNED,
      description: '50 vehicles bulk purchase from auction - Q1 2024 batch',
      amount: 1250000,
      currency: 'USD',
      effectiveDate: new Date('2024-03-01'),
      endDate: new Date('2024-06-30'),
      signedDate: new Date('2024-02-28'),
      sentDate: new Date('2024-02-15'),
      organisationId: 'org-admin-001',
      contactIds: [],
      version: '1.0',
      responsibleUserId: 'senior-mgr-001',
      notes: 'Bulk purchase order with expedited delivery terms'
    },
    {
      title: 'Shipping Services Agreement - Q2 2024',
      contractNumber: 'SSA-2024-Q2',
      type: ContractType.SERVICE,
      status: ContractStatus.SENT,
      description: 'Quarterly shipping services contract for international deliveries',
      amount: 75000,
      currency: 'USD',
      effectiveDate: new Date('2024-04-01'),
      endDate: new Date('2024-06-30'),
      sentDate: new Date(),
      organisationId: 'org-admin-001',
      contactIds: [],
      version: '1.0',
      responsibleUserId: 'senior-mgr-002',
      notes: 'Pending signature - sent for review'
    },
    {
      title: 'NDA - Strategic Partnership Discussion',
      contractNumber: 'NDA-2024-007',
      type: ContractType.NDA,
      status: ContractStatus.DRAFT,
      description: 'Non-disclosure agreement for potential partnership discussions with new dealer network',
      organisationId: 'org-admin-001',
      contactIds: [],
      version: '1.0',
      responsibleUserId: 'admin-user-001',
      notes: 'Draft prepared for legal review'
    },
    {
      title: 'Amendment to MSA-2024-001 - Rate Update',
      contractNumber: 'AMD-2024-001',
      type: ContractType.AMENDMENT,
      status: ContractStatus.ACTIVE,
      description: 'Updated shipping rates effective Q2 2024 - reflects market adjustments',
      amount: 50000,
      currency: 'USD',
      effectiveDate: new Date('2024-04-01'),
      signedDate: new Date('2024-03-25'),
      sentDate: new Date('2024-03-10'),
      organisationId: 'org-admin-001',
      contactIds: [],
      version: '1.1',
      responsibleUserId: 'admin-user-001',
      notes: 'Rate adjustment amendment - signed and active'
    },
    {
      title: 'Service Contract - Expiring Soon',
      contractNumber: 'CNT-2023-099',
      type: ContractType.SERVICE,
      status: ContractStatus.ACTIVE,
      description: 'Legacy service contract for vehicle inspection and certification services',
      amount: 25000,
      currency: 'USD',
      effectiveDate: new Date('2023-06-01'),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      signedDate: new Date('2023-05-15'),
      sentDate: new Date('2023-05-01'),
      organisationId: 'org-admin-001',
      contactIds: [],
      version: '1.0',
      responsibleUserId: 'junior-mgr-001',
      notes: 'Contract expiring soon - renewal needed'
    }
  ];

  for (const contractData of contracts) {
    await contractRepository.createContract(contractData as any, {
      user: mockUser,
      reason: 'Initial seed data'
    });
  }

  console.log(`Seeded ${contracts.length} contracts`);
}

export async function clearContracts() {
  console.log('Clearing contracts...');
  // The repository will handle cleanup if needed
}
