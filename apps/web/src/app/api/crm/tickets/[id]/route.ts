import { NextRequest, NextResponse } from 'next/server';
import { ticketRepository, ticketEvents } from '@united-cars/crm-mocks';
import { broadcastTicketStatusChanged } from '@/lib/crm-events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await ticketRepository.getById(id);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await ticketRepository.getById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects if provided
    const updates = { ...body };
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const updated = await ticketRepository.update(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    // Emit automation event if status changed
    if (body.status && body.status !== existing.status) {
      await ticketEvents.statusChanged(updated, existing.status, body.status, existing.tenantId);
      // Broadcast real-time update to connected clients
      broadcastTicketStatusChanged(updated, existing.status, body.status, existing.tenantId);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await ticketRepository.getById(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const deleted = await ticketRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
