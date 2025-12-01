/**
 * Ticket Repository
 *
 * Simple Map-based repository for tickets.
 * Supports CRUD operations and JSON persistence.
 */

import { nanoid } from 'nanoid';
import {
  Ticket,
  TicketType,
  TicketStatus,
  TicketPriority,
} from '@united-cars/crm-core';

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface TicketRepository {
  // CRUD
  getAll(tenantId: string): Promise<Ticket[]>;
  getById(id: string): Promise<Ticket | null>;
  create(
    data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Ticket>;
  update(id: string, data: Partial<Ticket>): Promise<Ticket | null>;
  delete(id: string): Promise<boolean>;

  // Queries
  getByOrganisation(tenantId: string, organisationId: string): Promise<Ticket[]>;
  getByContact(tenantId: string, contactId: string): Promise<Ticket[]>;
  getByDeal(tenantId: string, dealId: string): Promise<Ticket[]>;
  getByStatus(tenantId: string, status: TicketStatus): Promise<Ticket[]>;
  getByAssignee(tenantId: string, assigneeId: string): Promise<Ticket[]>;
  getOpen(tenantId: string): Promise<Ticket[]>;

  // Persistence
  toJSON(): Ticket[];
  fromJSON(data: any[]): void;
  clear(): void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class TicketRepositoryImpl implements TicketRepository {
  private tickets: Map<string, Ticket> = new Map();

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  async getAll(tenantId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId
    );
  }

  async getById(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) ?? null;
  }

  async create(
    data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Ticket> {
    const now = new Date();
    const ticket: Ticket = {
      ...data,
      id: `ticket_${nanoid(12)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async update(id: string, data: Partial<Ticket>): Promise<Ticket | null> {
    const existing = this.tickets.get(id);
    if (!existing) return null;

    const updated: Ticket = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID change
      tenantId: existing.tenantId, // Prevent tenant change
      createdAt: existing.createdAt, // Preserve creation timestamp
      updatedAt: new Date(),
    };

    // Handle status transitions
    if (data.status === TicketStatus.RESOLVED && !updated.resolvedAt) {
      updated.resolvedAt = new Date();
    }
    if (data.status === TicketStatus.CLOSED && !updated.closedAt) {
      updated.closedAt = new Date();
    }

    this.tickets.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tickets.delete(id);
  }

  // -------------------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------------------

  async getByOrganisation(
    tenantId: string,
    organisationId: string
  ): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId && t.organisationId === organisationId
    );
  }

  async getByContact(tenantId: string, contactId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId && t.contactId === contactId
    );
  }

  async getByDeal(tenantId: string, dealId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId && t.dealId === dealId
    );
  }

  async getByStatus(tenantId: string, status: TicketStatus): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId && t.status === status
    );
  }

  async getByAssignee(tenantId: string, assigneeId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId && t.assigneeId === assigneeId
    );
  }

  async getOpen(tenantId: string): Promise<Ticket[]> {
    const openStatuses = [
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING,
    ];
    return Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId && openStatuses.includes(t.status)
    );
  }

  // -------------------------------------------------------------------------
  // PERSISTENCE
  // -------------------------------------------------------------------------

  toJSON(): Ticket[] {
    return Array.from(this.tickets.values());
  }

  fromJSON(data: any[]): void {
    this.clear();

    for (const item of data || []) {
      const ticket: Ticket = {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
        closedAt: item.closedAt ? new Date(item.closedAt) : undefined,
      };
      this.tickets.set(ticket.id, ticket);
    }
  }

  clear(): void {
    this.tickets.clear();
  }
}

// Export singleton instance
export const ticketRepository = new TicketRepositoryImpl();
