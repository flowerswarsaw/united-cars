import {
  Ticket,
  TicketType,
  TicketStatus,
  TicketPriority
} from '@united-cars/crm-core';
import { ticketRepository } from './repositories';

const DEFAULT_TENANT_ID = 'united-cars';

// Seed ticket data
const tickets: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // SUPPORT Tickets
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'API Integration Help - AutoMax',
    description: 'AutoMax needs assistance setting up API integration for inventory sync. They are using their custom ERP system and need help with authentication setup.',
    type: TicketType.SUPPORT,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    source: 'Email',
    organisationId: 'org_1',
    contactId: 'contact_1',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    tags: ['technical', 'api', 'integration'],
    notes: 'Category: Technical Support. Assigned to Tech Team.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Portal Access Issue',
    description: 'Premier Motors reporting intermittent login issues with the dealer portal. Users are being logged out randomly during sessions.',
    type: TicketType.SUPPORT,
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    source: 'Phone',
    organisationId: 'org_2',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    tags: ['portal', 'access', 'login'],
    notes: 'Browser: Chrome 118. Category: Portal Access.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Training Request - New Features',
    description: 'Request for training session on new inventory management features for the team.',
    type: TicketType.SUPPORT,
    status: TicketStatus.WAITING,
    priority: TicketPriority.LOW,
    source: 'Portal',
    organisationId: 'org_3',
    contactId: 'contact_3',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    tags: ['training', 'onboarding'],
    notes: 'Attendees: 5. Category: Training request.'
  },

  // CLAIM Tickets
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Damaged Vehicle in Transit - VIN 1HGBH41JXMN109186',
    description: 'Vehicle received with significant damage to the front bumper and right fender. Photos attached to the system. Requesting damage claim processing.',
    type: TicketType.CLAIM,
    status: TicketStatus.OPEN,
    priority: TicketPriority.URGENT,
    source: 'Phone',
    organisationId: 'org_1',
    dealId: 'deal_1',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    tags: ['damage', 'transit', 'claim'],
    notes: 'VIN: 1HGBH41JXMN109186. Claim amount: $4,500. Damage type: Transit Damage.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Wrong Vehicle Delivered',
    description: 'Customer received a different vehicle than ordered. VIN does not match the purchase order. Need immediate resolution.',
    type: TicketType.CLAIM,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.URGENT,
    source: 'Email',
    organisationId: 'org_5',
    contactId: 'contact_5',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    tags: ['wrong-delivery', 'urgent', 'claim'],
    notes: 'Expected VIN: 2T1BURHE0JC123456. Received VIN: 2T1BURHE0JC789012.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Title Documentation Error',
    description: 'Title received with incorrect owner information. Name spelled wrong on official documentation.',
    type: TicketType.CLAIM,
    status: TicketStatus.RESOLVED,
    priority: TicketPriority.MEDIUM,
    source: 'Portal',
    organisationId: 'org_4',
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Resolved 2 days ago
    tags: ['documentation', 'title', 'resolved'],
    notes: 'Resolution: Corrected title reissued.'
  },

  // SERVICE Tickets
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Vehicle Inspection Scheduling',
    description: 'Request to schedule pre-delivery inspection for 5 vehicles arriving next week. Need certified inspector available.',
    type: TicketType.SERVICE,
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    source: 'Email',
    organisationId: 'org_2',
    contactId: 'contact_2',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    tags: ['inspection', 'scheduling', 'pre-delivery'],
    notes: 'Vehicle count: 5. Inspection type: Pre-Delivery. Location: Main Warehouse.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Transportation Quote Request',
    description: 'Need quote for transporting 3 vehicles from Los Angeles to Phoenix. Open transport acceptable.',
    type: TicketType.SERVICE,
    status: TicketStatus.WAITING,
    priority: TicketPriority.LOW,
    source: 'Portal',
    organisationId: 'org_3',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    tags: ['transportation', 'quote', 'logistics'],
    notes: 'Origin: Los Angeles, CA. Destination: Phoenix, AZ. Vehicles: 3. Transport type: Open.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Express Title Processing',
    description: 'Urgent request for expedited title processing on a high-value sale. Customer requires title within 48 hours.',
    type: TicketType.SERVICE,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    source: 'Phone',
    organisationId: 'org_1',
    dealId: 'deal_2',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    tags: ['express', 'title', 'urgent'],
    notes: 'Service type: Express Processing. Additional fee: $150.'
  },

  // COMPLAINT Tickets
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Slow Response Time Complaint',
    description: 'Customer complaint about slow response times from support team. Waited over 48 hours for initial response on their last inquiry.',
    type: TicketType.COMPLAINT,
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    source: 'Email',
    organisationId: 'org_5',
    contactId: 'contact_5',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    tags: ['response-time', 'sla-breach', 'complaint'],
    notes: 'Original ticket: TKT-2024-001. Response time: 52 hours. SLA breached: Yes.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Billing Discrepancy',
    description: 'Customer disputing charges on their last invoice. Claim they were charged twice for the same service.',
    type: TicketType.COMPLAINT,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.MEDIUM,
    source: 'Phone',
    organisationId: 'org_4',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    tags: ['billing', 'dispute', 'invoice'],
    notes: 'Invoice: INV-2024-0567. Disputed amount: $750.'
  },
  {
    tenantId: DEFAULT_TENANT_ID,
    title: 'Vehicle Condition Complaint',
    description: 'Customer unhappy with the condition of vehicle received. Reports minor scratches not mentioned in the listing.',
    type: TicketType.COMPLAINT,
    status: TicketStatus.CLOSED,
    priority: TicketPriority.MEDIUM,
    source: 'Portal',
    organisationId: 'org_2',
    contactId: 'contact_2',
    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Resolved 5 days ago
    closedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Closed 4 days ago
    tags: ['condition', 'resolved', 'refund'],
    notes: 'Resolution: Partial refund of $300 provided. Customer satisfied.'
  }
];

/**
 * Seeds the ticket repository with test data
 */
export async function seedTickets(): Promise<void> {
  console.log('Seeding ticket data...');

  // Clear existing tickets
  ticketRepository.clear();

  // Create all tickets
  for (const ticketData of tickets) {
    await ticketRepository.create(ticketData);
  }

  console.log(`Seeded ${tickets.length} tickets`);
}

/**
 * Get sample tickets (for use in API routes that don't use repository)
 */
export function getSampleTickets(): typeof tickets {
  return tickets;
}

export { tickets };
