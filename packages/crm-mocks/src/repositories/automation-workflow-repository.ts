/**
 * Automation Workflow Repository
 *
 * JSON-backed repository for automation workflows.
 * Follows existing crm-mocks patterns.
 */

import { nanoid } from 'nanoid';
import {
  AutomationWorkflow,
  TriggerType,
  EventTriggerConfig,
} from '@united-cars/crm-automation';

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface AutomationWorkflowRepository {
  // CRUD
  getAll(tenantId: string): Promise<AutomationWorkflow[]>;
  getById(id: string): Promise<AutomationWorkflow | null>;
  create(data: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastTriggeredAt'>): Promise<AutomationWorkflow>;
  update(id: string, data: Partial<Omit<AutomationWorkflow, 'id' | 'tenantId' | 'createdAt' | 'createdBy'>>): Promise<AutomationWorkflow | null>;
  delete(id: string): Promise<boolean>;

  // Queries
  getByTenantAndEvent(tenantId: string, eventType: string): Promise<AutomationWorkflow[]>;
  getActive(tenantId: string): Promise<AutomationWorkflow[]>;

  // Stats
  incrementExecutionCount(id: string): Promise<void>;

  // Persistence
  toJSON(): AutomationWorkflow[];
  fromJSON(data: any[]): void;
  clear(): void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class AutomationWorkflowRepositoryImpl implements AutomationWorkflowRepository {
  private workflows: Map<string, AutomationWorkflow> = new Map();

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  async getAll(tenantId: string): Promise<AutomationWorkflow[]> {
    return Array.from(this.workflows.values())
      .filter(w => w.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getById(id: string): Promise<AutomationWorkflow | null> {
    return this.workflows.get(id) ?? null;
  }

  async create(
    data: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastTriggeredAt'>
  ): Promise<AutomationWorkflow> {
    const now = new Date();
    const workflow: AutomationWorkflow = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async update(
    id: string,
    data: Partial<Omit<AutomationWorkflow, 'id' | 'tenantId' | 'createdAt' | 'createdBy'>>
  ): Promise<AutomationWorkflow | null> {
    const existing = this.workflows.get(id);
    if (!existing) return null;

    const updated: AutomationWorkflow = {
      ...existing,
      ...data,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: new Date(),
    };

    this.workflows.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = this.workflows.get(id);
    if (!existing) return false;

    // Don't allow deleting system workflows
    if (existing.isSystem) {
      throw new Error('Cannot delete system workflow');
    }

    return this.workflows.delete(id);
  }

  // -------------------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------------------

  async getByTenantAndEvent(tenantId: string, eventType: string): Promise<AutomationWorkflow[]> {
    return Array.from(this.workflows.values()).filter(w => {
      if (w.tenantId !== tenantId) return false;
      if (!w.isActive) return false;
      if (w.trigger.type !== TriggerType.EVENT) return false;

      const config = w.trigger.config as EventTriggerConfig;
      return config.eventType === eventType;
    });
  }

  async getActive(tenantId: string): Promise<AutomationWorkflow[]> {
    return Array.from(this.workflows.values())
      .filter(w => w.tenantId === tenantId && w.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // -------------------------------------------------------------------------
  // STATS
  // -------------------------------------------------------------------------

  async incrementExecutionCount(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (workflow) {
      workflow.executionCount++;
      workflow.lastTriggeredAt = new Date();
    }
  }

  // -------------------------------------------------------------------------
  // PERSISTENCE
  // -------------------------------------------------------------------------

  toJSON(): AutomationWorkflow[] {
    return Array.from(this.workflows.values());
  }

  fromJSON(data: any[]): void {
    this.clear();
    for (const item of data) {
      // Convert date strings back to Date objects
      const workflow: AutomationWorkflow = {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        lastTriggeredAt: item.lastTriggeredAt ? new Date(item.lastTriggeredAt) : undefined,
      };
      this.workflows.set(workflow.id, workflow);
    }
  }

  clear(): void {
    this.workflows.clear();
  }

  // Seed helper
  seed(workflows: AutomationWorkflow[]): void {
    for (const workflow of workflows) {
      this.workflows.set(workflow.id, workflow);
    }
  }
}

// Export singleton instance
export const automationWorkflowRepository = new AutomationWorkflowRepositoryImpl();
