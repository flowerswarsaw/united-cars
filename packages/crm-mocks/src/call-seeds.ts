import {
  Call,
  CallDirection,
  CallStatus
} from '@united-cars/crm-core';
import { callRepository } from './repositories';

const DEFAULT_TENANT_ID = 'united-cars';

// Seed call data
const calls: Omit<Call, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Completed outbound calls
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'admin-user-001',
    phoneNumber: '+1 (555) 123-4567',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.COMPLETED,
    provider: 'mock',
    contactId: 'contact_1',
    organisationId: 'org_1',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8 * 60 * 1000), // 8 min call
    durationSec: 480,
    notes: 'Discussed new vehicle inventory and pricing updates'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'sales-user-001',
    phoneNumber: '+1 (555) 234-5678',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.COMPLETED,
    provider: 'mock',
    contactId: 'contact_2',
    organisationId: 'org_2',
    startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    endedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 15 * 60 * 1000),
    durationSec: 900,
    notes: 'Follow-up call about delivery schedule for fleet order'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'admin-user-001',
    phoneNumber: '+1 (555) 345-6789',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.COMPLETED,
    provider: 'mock',
    contactId: 'contact_3',
    organisationId: 'org_3',
    dealId: 'deal_1',
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    endedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 22 * 60 * 1000),
    durationSec: 1320,
    notes: 'Negotiated final terms for the Chevrolet batch deal'
  },

  // Inbound calls
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'sales-user-001',
    phoneNumber: '+1 (555) 456-7890',
    direction: CallDirection.INBOUND,
    status: CallStatus.COMPLETED,
    provider: 'mock',
    contactId: 'contact_4',
    organisationId: 'org_4',
    startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    endedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 5 * 60 * 1000),
    durationSec: 300,
    notes: 'Customer inquiry about title transfer status'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'admin-user-001',
    phoneNumber: '+1 (555) 567-8901',
    direction: CallDirection.INBOUND,
    status: CallStatus.COMPLETED,
    provider: 'mock',
    contactId: 'contact_5',
    organisationId: 'org_5',
    startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    endedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 12 * 60 * 1000),
    durationSec: 720,
    notes: 'Callback from prospect interested in bulk auction purchases'
  },

  // Missed calls
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'sales-user-001',
    phoneNumber: '+1 (555) 678-9012',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.NO_ANSWER,
    provider: 'mock',
    contactId: 'contact_1',
    organisationId: 'org_1',
    notes: 'Left voicemail about upcoming auction dates'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'admin-user-001',
    phoneNumber: '+1 (555) 789-0123',
    direction: CallDirection.INBOUND,
    status: CallStatus.NO_ANSWER,
    provider: 'mock',
    notes: 'Unknown caller - no voicemail left'
  },

  // Busy signals
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'sales-user-001',
    phoneNumber: '+1 (555) 890-1234',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.BUSY,
    provider: 'mock',
    contactId: 'contact_2',
    organisationId: 'org_2',
    notes: 'Will retry in 1 hour'
  },

  // Recent calls today
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'admin-user-001',
    phoneNumber: '+1 (555) 901-2345',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.COMPLETED,
    provider: 'mock',
    contactId: 'contact_3',
    organisationId: 'org_3',
    dealId: 'deal_2',
    startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    endedAt: new Date(Date.now() - 30 * 60 * 1000 + 18 * 60 * 1000),
    durationSec: 1080,
    notes: 'Confirmed delivery timeline and inspection requirements'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'sales-user-001',
    phoneNumber: '+1 (555) 012-3456',
    direction: CallDirection.INBOUND,
    status: CallStatus.COMPLETED,
    provider: 'mock',
    contactId: 'contact_4',
    organisationId: 'org_4',
    startedAt: new Date(Date.now() - 45 * 60 * 1000),
    endedAt: new Date(Date.now() - 45 * 60 * 1000 + 7 * 60 * 1000),
    durationSec: 420,
    notes: 'Support call - helped with portal login issues'
  },

  // In progress (active call simulation)
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'admin-user-001',
    phoneNumber: '+1 (555) 111-2222',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.IN_PROGRESS,
    provider: 'mock',
    contactId: 'contact_5',
    organisationId: 'org_5',
    dealId: 'deal_3',
    startedAt: new Date(Date.now() - 5 * 60 * 1000), // Started 5 min ago
    notes: 'Discussing partnership expansion opportunities'
  },

  // Queued call
  {
    tenantId: DEFAULT_TENANT_ID,
    crmUserId: 'sales-user-001',
    phoneNumber: '+1 (555) 222-3333',
    direction: CallDirection.OUTBOUND,
    status: CallStatus.QUEUED,
    provider: 'mock',
    contactId: 'contact_1',
    organisationId: 'org_1',
    notes: 'Scheduled callback - customer requested afternoon'
  }
];

/**
 * Seeds the call repository with test data
 */
export async function seedCalls(): Promise<void> {
  console.log('Seeding call data...');

  // Clear existing calls
  callRepository.clear();

  // Create all calls
  for (const callData of calls) {
    await callRepository.create(callData);
  }

  console.log(`Seeded ${calls.length} calls`);
}

/**
 * Get sample calls (for use in API routes that don't use repository)
 */
export function getSampleCalls(): typeof calls {
  return calls;
}

export { calls };
