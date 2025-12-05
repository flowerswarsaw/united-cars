import { NextRequest, NextResponse } from 'next/server';
import { ticketRepository, seedTickets, ticketEvents } from '@united-cars/crm-mocks';
import { TicketStatus, TicketType, TicketPriority } from '@united-cars/crm-core';
import { broadcastTicketCreated } from '@/lib/crm-events';

const DEFAULT_TENANT_ID = 'united-cars';

// Track if tickets have been seeded
let ticketsSeeded = false;

async function ensureTicketsSeeded() {
  if (ticketsSeeded) return;

  const existingTickets = await ticketRepository.getAll(DEFAULT_TENANT_ID);
  if (existingTickets.length === 0) {
    await seedTickets();
  }
  ticketsSeeded = true;
}

export async function GET(request: NextRequest) {
  try {
    // Ensure tickets are seeded on first access
    await ensureTicketsSeeded();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TicketStatus | null;
    const type = searchParams.get('type') as TicketType | null;
    const priority = searchParams.get('priority') as TicketPriority | null;
    const organisationId = searchParams.get('organisationId');
    const contactId = searchParams.get('contactId');
    const dealId = searchParams.get('dealId');
    const assigneeId = searchParams.get('assigneeId');
    const openOnly = searchParams.get('openOnly') === 'true';

    let tickets;

    if (openOnly) {
      tickets = await ticketRepository.getOpen(DEFAULT_TENANT_ID);
    } else if (organisationId) {
      tickets = await ticketRepository.getByOrganisation(DEFAULT_TENANT_ID, organisationId);
    } else if (contactId) {
      tickets = await ticketRepository.getByContact(DEFAULT_TENANT_ID, contactId);
    } else if (dealId) {
      tickets = await ticketRepository.getByDeal(DEFAULT_TENANT_ID, dealId);
    } else if (assigneeId) {
      tickets = await ticketRepository.getByAssignee(DEFAULT_TENANT_ID, assigneeId);
    } else if (status) {
      tickets = await ticketRepository.getByStatus(DEFAULT_TENANT_ID, status);
    } else {
      tickets = await ticketRepository.getAll(DEFAULT_TENANT_ID);
    }

    // Apply additional filters
    if (type) {
      tickets = tickets.filter(t => t.type === type);
    }
    if (priority) {
      tickets = tickets.filter(t => t.priority === priority);
    }

    // Sort by priority (URGENT first) then by createdAt (newest first)
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    tickets.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type || !body.priority) {
      return NextResponse.json(
        { error: 'Title, type, and priority are required' },
        { status: 400 }
      );
    }

    const ticket = await ticketRepository.create({
      tenantId: DEFAULT_TENANT_ID,
      title: body.title,
      description: body.description,
      type: body.type,
      status: body.status || TicketStatus.OPEN,
      priority: body.priority,
      source: body.source,
      organisationId: body.organisationId,
      contactId: body.contactId,
      dealId: body.dealId,
      assigneeId: body.assigneeId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      notes: body.notes,
      tags: body.tags,
    });

    // Emit automation event for ticket creation
    await ticketEvents.created(ticket, DEFAULT_TENANT_ID);

    // Broadcast real-time update to connected clients
    broadcastTicketCreated(ticket, DEFAULT_TENANT_ID);

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
