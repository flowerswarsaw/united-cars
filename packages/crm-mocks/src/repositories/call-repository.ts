/**
 * Call Repository
 *
 * Simple Map-based repository for phone calls.
 * Supports CRUD operations and JSON persistence.
 */

import { nanoid } from 'nanoid';
import {
  Call,
  CallDirection,
  CallStatus,
} from '@united-cars/crm-core';

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface CallRepository {
  // CRUD
  getAll(tenantId: string): Promise<Call[]>;
  getById(id: string): Promise<Call | null>;
  create(
    data: Omit<Call, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Call>;
  update(id: string, data: Partial<Call>): Promise<Call | null>;
  delete(id: string): Promise<boolean>;

  // Queries
  getByContact(tenantId: string, contactId: string): Promise<Call[]>;
  getByOrganisation(tenantId: string, organisationId: string): Promise<Call[]>;
  getByDeal(tenantId: string, dealId: string): Promise<Call[]>;
  getByUser(tenantId: string, crmUserId: string): Promise<Call[]>;
  getByStatus(tenantId: string, status: CallStatus): Promise<Call[]>;
  getRecent(tenantId: string, limit?: number): Promise<Call[]>;

  // Persistence
  toJSON(): Call[];
  fromJSON(data: any[]): void;
  clear(): void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class CallRepositoryImpl implements CallRepository {
  private calls: Map<string, Call> = new Map();

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  async getAll(tenantId: string): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string): Promise<Call | null> {
    return this.calls.get(id) ?? null;
  }

  async create(
    data: Omit<Call, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Call> {
    const now = new Date();
    const call: Call = {
      ...data,
      id: `call_${nanoid(12)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.calls.set(call.id, call);
    return call;
  }

  async update(id: string, data: Partial<Call>): Promise<Call | null> {
    const existing = this.calls.get(id);
    if (!existing) return null;

    const updated: Call = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID change
      tenantId: existing.tenantId, // Prevent tenant change
      createdAt: existing.createdAt, // Preserve creation timestamp
      updatedAt: new Date(),
    };

    // Handle status transitions
    if (data.status === CallStatus.IN_PROGRESS && !updated.startedAt) {
      updated.startedAt = new Date();
    }
    if (
      (data.status === CallStatus.COMPLETED ||
        data.status === CallStatus.FAILED ||
        data.status === CallStatus.NO_ANSWER ||
        data.status === CallStatus.BUSY ||
        data.status === CallStatus.CANCELLED) &&
      !updated.endedAt
    ) {
      updated.endedAt = new Date();
      // Calculate duration if we have start time
      if (updated.startedAt && !updated.durationSec) {
        updated.durationSec = Math.floor(
          (updated.endedAt.getTime() - updated.startedAt.getTime()) / 1000
        );
      }
    }

    this.calls.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.calls.delete(id);
  }

  // -------------------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------------------

  async getByContact(tenantId: string, contactId: string): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter((c) => c.tenantId === tenantId && c.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByOrganisation(
    tenantId: string,
    organisationId: string
  ): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter((c) => c.tenantId === tenantId && c.organisationId === organisationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByDeal(tenantId: string, dealId: string): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter((c) => c.tenantId === tenantId && c.dealId === dealId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByUser(tenantId: string, crmUserId: string): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter((c) => c.tenantId === tenantId && c.crmUserId === crmUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByStatus(tenantId: string, status: CallStatus): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter((c) => c.tenantId === tenantId && c.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRecent(tenantId: string, limit: number = 50): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // PERSISTENCE
  // -------------------------------------------------------------------------

  toJSON(): Call[] {
    return Array.from(this.calls.values());
  }

  fromJSON(data: any[]): void {
    this.clear();

    for (const item of data || []) {
      const call: Call = {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        startedAt: item.startedAt ? new Date(item.startedAt) : undefined,
        endedAt: item.endedAt ? new Date(item.endedAt) : undefined,
      };
      this.calls.set(call.id, call);
    }
  }

  clear(): void {
    this.calls.clear();
  }
}

// Export singleton instance
export const callRepository = new CallRepositoryImpl();
