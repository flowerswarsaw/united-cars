/**
 * Automation Repositories
 *
 * Mock implementations for development.
 * Replace with Prisma implementations for production.
 */

import { nanoid } from 'nanoid';
import {
  AutomationWorkflow,
  AutomationRun,
  AutomationStepRun,
  EntityType,
  ExecutionStatus,
} from '../domain/types';

// ============================================================================
// WORKFLOW REPOSITORY
// ============================================================================

export interface WorkflowRepository {
  getAll(tenantId: string): Promise<AutomationWorkflow[]>;
  getById(id: string): Promise<AutomationWorkflow | null>;
  getByTenantAndEvent(tenantId: string, eventType: string): Promise<AutomationWorkflow[]>;
  create(workflow: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationWorkflow>;
  update(id: string, data: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null>;
  delete(id: string): Promise<boolean>;
  activate(id: string): Promise<AutomationWorkflow | null>;
  deactivate(id: string): Promise<AutomationWorkflow | null>;
  incrementExecutionCount(id: string): Promise<void>;
}

/**
 * In-memory workflow repository for development
 */
export class MockWorkflowRepository implements WorkflowRepository {
  private workflows: Map<string, AutomationWorkflow> = new Map();

  async getAll(tenantId: string): Promise<AutomationWorkflow[]> {
    return Array.from(this.workflows.values()).filter(
      (w) => w.tenantId === tenantId
    );
  }

  async getById(id: string): Promise<AutomationWorkflow | null> {
    return this.workflows.get(id) ?? null;
  }

  async getByTenantAndEvent(
    tenantId: string,
    eventType: string
  ): Promise<AutomationWorkflow[]> {
    return Array.from(this.workflows.values()).filter((w) => {
      if (w.tenantId !== tenantId) return false;
      if (!w.isActive) return false;
      if (w.trigger.type !== 'EVENT') return false;

      const config = w.trigger.config as { eventType: string };
      return config.eventType === eventType;
    });
  }

  async create(
    data: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AutomationWorkflow> {
    const now = new Date();
    const workflow: AutomationWorkflow = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async update(
    id: string,
    data: Partial<AutomationWorkflow>
  ): Promise<AutomationWorkflow | null> {
    const existing = this.workflows.get(id);
    if (!existing) return null;

    const updated: AutomationWorkflow = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent createdAt change
      updatedAt: new Date(),
    };

    this.workflows.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async activate(id: string): Promise<AutomationWorkflow | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<AutomationWorkflow | null> {
    return this.update(id, { isActive: false });
  }

  async incrementExecutionCount(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (workflow) {
      workflow.executionCount++;
      workflow.lastTriggeredAt = new Date();
    }
  }

  // Helper for seeding
  seed(workflows: AutomationWorkflow[]): void {
    for (const workflow of workflows) {
      this.workflows.set(workflow.id, workflow);
    }
  }

  clear(): void {
    this.workflows.clear();
  }
}

// ============================================================================
// AUTOMATION RUN REPOSITORY
// ============================================================================

export interface RunRepository {
  getById(id: string): Promise<AutomationRun | null>;
  getByWorkflowId(workflowId: string, limit?: number): Promise<AutomationRun[]>;
  getByEntityId(entityType: EntityType, entityId: string, limit?: number): Promise<AutomationRun[]>;
  create(run: AutomationRun): Promise<AutomationRun>;
  update(id: string, data: Partial<AutomationRun>): Promise<AutomationRun | null>;
  hasExecutedOnce(workflowId: string, entityId: string): Promise<boolean>;
  getLastExecution(workflowId: string, entityId: string): Promise<AutomationRun | null>;
}

/**
 * In-memory run repository for development
 */
export class MockRunRepository implements RunRepository {
  private runs: Map<string, AutomationRun> = new Map();
  private maxRuns = 1000; // Limit stored runs to prevent memory issues

  async getById(id: string): Promise<AutomationRun | null> {
    return this.runs.get(id) ?? null;
  }

  async getByWorkflowId(
    workflowId: string,
    limit = 50
  ): Promise<AutomationRun[]> {
    return Array.from(this.runs.values())
      .filter((r) => r.workflowId === workflowId)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  async getByEntityId(
    entityType: EntityType,
    entityId: string,
    limit = 50
  ): Promise<AutomationRun[]> {
    return Array.from(this.runs.values())
      .filter(
        (r) =>
          r.primaryEntityType === entityType && r.primaryEntityId === entityId
      )
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  async create(run: AutomationRun): Promise<AutomationRun> {
    this.runs.set(run.id, run);

    // Clean up old runs if we exceed the limit
    if (this.runs.size > this.maxRuns) {
      const sorted = Array.from(this.runs.values()).sort(
        (a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime()
      );
      const toDelete = sorted.slice(0, this.runs.size - this.maxRuns);
      for (const r of toDelete) {
        this.runs.delete(r.id);
      }
    }

    return run;
  }

  async update(
    id: string,
    data: Partial<AutomationRun>
  ): Promise<AutomationRun | null> {
    const existing = this.runs.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...data };
    this.runs.set(id, updated);
    return updated;
  }

  async hasExecutedOnce(workflowId: string, entityId: string): Promise<boolean> {
    for (const run of this.runs.values()) {
      if (
        run.workflowId === workflowId &&
        run.primaryEntityId === entityId &&
        run.status === ExecutionStatus.SUCCESS
      ) {
        return true;
      }
    }
    return false;
  }

  async getLastExecution(
    workflowId: string,
    entityId: string
  ): Promise<AutomationRun | null> {
    let lastRun: AutomationRun | null = null;

    for (const run of this.runs.values()) {
      if (
        run.workflowId === workflowId &&
        run.primaryEntityId === entityId
      ) {
        if (
          !lastRun ||
          run.triggeredAt.getTime() > lastRun.triggeredAt.getTime()
        ) {
          lastRun = run;
        }
      }
    }

    return lastRun;
  }

  clear(): void {
    this.runs.clear();
  }
}

// ============================================================================
// STEP RUN REPOSITORY
// ============================================================================

export interface StepRunRepository {
  getByRunId(runId: string): Promise<AutomationStepRun[]>;
  create(step: AutomationStepRun): Promise<AutomationStepRun>;
  createMany(steps: AutomationStepRun[]): Promise<AutomationStepRun[]>;
}

/**
 * In-memory step run repository for development
 */
export class MockStepRunRepository implements StepRunRepository {
  private steps: Map<string, AutomationStepRun> = new Map();
  private maxSteps = 5000;

  async getByRunId(runId: string): Promise<AutomationStepRun[]> {
    return Array.from(this.steps.values())
      .filter((s) => s.runId === runId)
      .sort((a, b) => a.order - b.order);
  }

  async create(step: AutomationStepRun): Promise<AutomationStepRun> {
    this.steps.set(step.id, step);

    // Clean up if needed
    if (this.steps.size > this.maxSteps) {
      const sorted = Array.from(this.steps.values()).sort(
        (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
      );
      const toDelete = sorted.slice(0, this.steps.size - this.maxSteps);
      for (const s of toDelete) {
        this.steps.delete(s.id);
      }
    }

    return step;
  }

  async createMany(steps: AutomationStepRun[]): Promise<AutomationStepRun[]> {
    for (const step of steps) {
      this.steps.set(step.id, step);
    }
    return steps;
  }

  clear(): void {
    this.steps.clear();
  }
}

// ============================================================================
// IDEMPOTENCY REPOSITORY
// ============================================================================

export interface IdempotencyRepository {
  hasProcessed(key: string): Promise<boolean>;
  markProcessed(key: string, ttlMs?: number): Promise<void>;
}

/**
 * In-memory idempotency repository
 */
export class MockIdempotencyRepository implements IdempotencyRepository {
  private processed: Map<string, number> = new Map(); // key -> expiry timestamp

  async hasProcessed(key: string): Promise<boolean> {
    const expiry = this.processed.get(key);
    if (!expiry) return false;

    if (Date.now() > expiry) {
      this.processed.delete(key);
      return false;
    }

    return true;
  }

  async markProcessed(key: string, ttlMs = 3600000): Promise<void> {
    // Default 1 hour TTL
    this.processed.set(key, Date.now() + ttlMs);
  }

  clear(): void {
    this.processed.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, expiry] of this.processed) {
      if (now > expiry) {
        this.processed.delete(key);
      }
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export interface AutomationRepositories {
  workflows: WorkflowRepository;
  runs: RunRepository;
  steps: StepRunRepository;
  idempotency: IdempotencyRepository;
}

/**
 * Create mock repositories for development
 */
export function createMockRepositories(): AutomationRepositories {
  return {
    workflows: new MockWorkflowRepository(),
    runs: new MockRunRepository(),
    steps: new MockStepRunRepository(),
    idempotency: new MockIdempotencyRepository(),
  };
}
