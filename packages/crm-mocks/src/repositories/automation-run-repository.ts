/**
 * Automation Run Repository
 *
 * JSON-backed repository for automation runs and step runs.
 * Includes built-in idempotency checking (no separate repo needed).
 */

import { nanoid } from 'nanoid';
import {
  AutomationRun,
  AutomationStepRun,
  ExecutionStatus,
  EntityType,
} from '@united-cars/crm-automation';

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface AutomationRunRepository {
  // Run CRUD
  getById(id: string): Promise<AutomationRun | null>;
  getByWorkflowId(workflowId: string, limit?: number): Promise<AutomationRun[]>;
  getByEntityId(entityType: EntityType, entityId: string, limit?: number): Promise<AutomationRun[]>;
  create(run: AutomationRun): Promise<AutomationRun>;
  update(id: string, data: Partial<AutomationRun>): Promise<AutomationRun | null>;

  // Step runs
  getStepsByRunId(runId: string): Promise<AutomationStepRun[]>;
  createStep(step: AutomationStepRun): Promise<AutomationStepRun>;
  createSteps(steps: AutomationStepRun[]): Promise<AutomationStepRun[]>;

  // Idempotency (built-in)
  hasExecutedForEvent(workflowId: string, eventId: string): Promise<boolean>;
  getRunForEvent(workflowId: string, eventId: string): Promise<AutomationRun | null>;

  // Persistence
  toJSON(): { runs: AutomationRun[]; steps: AutomationStepRun[] };
  fromJSON(data: { runs: any[]; steps: any[] }): void;
  clear(): void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class AutomationRunRepositoryImpl implements AutomationRunRepository {
  private runs: Map<string, AutomationRun> = new Map();
  private steps: Map<string, AutomationStepRun> = new Map();

  // Track by (workflowId, eventId) for idempotency
  private eventIndex: Map<string, string> = new Map(); // "workflowId:eventId" -> runId

  // Configurable limits
  private maxRuns = 1000;
  private maxSteps = 5000;

  // -------------------------------------------------------------------------
  // RUN CRUD
  // -------------------------------------------------------------------------

  async getById(id: string): Promise<AutomationRun | null> {
    return this.runs.get(id) ?? null;
  }

  async getByWorkflowId(workflowId: string, limit = 50): Promise<AutomationRun[]> {
    return Array.from(this.runs.values())
      .filter(r => r.workflowId === workflowId)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  async getByEntityId(
    entityType: EntityType,
    entityId: string,
    limit = 50
  ): Promise<AutomationRun[]> {
    return Array.from(this.runs.values())
      .filter(r => r.primaryEntityType === entityType && r.primaryEntityId === entityId)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  async create(run: AutomationRun): Promise<AutomationRun> {
    this.runs.set(run.id, run);

    // Index for idempotency
    const idempotencyKey = this.buildIdempotencyKey(run.workflowId, run.eventId);
    this.eventIndex.set(idempotencyKey, run.id);

    // Clean up old runs if limit exceeded
    this.cleanupOldRuns();

    return run;
  }

  async update(id: string, data: Partial<AutomationRun>): Promise<AutomationRun | null> {
    const existing = this.runs.get(id);
    if (!existing) return null;

    const updated: AutomationRun = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID change
    };

    this.runs.set(id, updated);
    return updated;
  }

  // -------------------------------------------------------------------------
  // STEP RUNS
  // -------------------------------------------------------------------------

  async getStepsByRunId(runId: string): Promise<AutomationStepRun[]> {
    return Array.from(this.steps.values())
      .filter(s => s.runId === runId)
      .sort((a, b) => a.order - b.order);
  }

  async createStep(step: AutomationStepRun): Promise<AutomationStepRun> {
    this.steps.set(step.id, step);
    this.cleanupOldSteps();
    return step;
  }

  async createSteps(steps: AutomationStepRun[]): Promise<AutomationStepRun[]> {
    for (const step of steps) {
      this.steps.set(step.id, step);
    }
    this.cleanupOldSteps();
    return steps;
  }

  // -------------------------------------------------------------------------
  // IDEMPOTENCY
  // -------------------------------------------------------------------------

  /**
   * Check if a workflow has already been executed for a given event.
   * Returns true if there's a run with a terminal status (SUCCESS, FAILED, PARTIAL).
   * SKIPPED runs don't count - we might want to retry those.
   */
  async hasExecutedForEvent(workflowId: string, eventId: string): Promise<boolean> {
    const run = await this.getRunForEvent(workflowId, eventId);
    if (!run) return false;

    // Terminal statuses that indicate the workflow was actually processed
    const terminalStatuses = [
      ExecutionStatus.SUCCESS,
      ExecutionStatus.FAILED,
      ExecutionStatus.PARTIAL,
    ];

    return terminalStatuses.includes(run.status);
  }

  /**
   * Get the run for a specific workflow + event combination
   */
  async getRunForEvent(workflowId: string, eventId: string): Promise<AutomationRun | null> {
    const idempotencyKey = this.buildIdempotencyKey(workflowId, eventId);
    const runId = this.eventIndex.get(idempotencyKey);

    if (!runId) return null;
    return this.runs.get(runId) ?? null;
  }

  private buildIdempotencyKey(workflowId: string, eventId: string): string {
    return `${workflowId}:${eventId}`;
  }

  // -------------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------------

  private cleanupOldRuns(): void {
    if (this.runs.size <= this.maxRuns) return;

    const sorted = Array.from(this.runs.values())
      .sort((a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime());

    const toDelete = sorted.slice(0, this.runs.size - this.maxRuns);
    for (const run of toDelete) {
      this.runs.delete(run.id);

      // Also remove from event index
      const key = this.buildIdempotencyKey(run.workflowId, run.eventId);
      this.eventIndex.delete(key);
    }
  }

  private cleanupOldSteps(): void {
    if (this.steps.size <= this.maxSteps) return;

    const sorted = Array.from(this.steps.values())
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

    const toDelete = sorted.slice(0, this.steps.size - this.maxSteps);
    for (const step of toDelete) {
      this.steps.delete(step.id);
    }
  }

  // -------------------------------------------------------------------------
  // PERSISTENCE
  // -------------------------------------------------------------------------

  toJSON(): { runs: AutomationRun[]; steps: AutomationStepRun[] } {
    return {
      runs: Array.from(this.runs.values()),
      steps: Array.from(this.steps.values()),
    };
  }

  fromJSON(data: { runs: any[]; steps: any[] }): void {
    this.clear();

    // Load runs
    for (const item of data.runs || []) {
      const run: AutomationRun = {
        ...item,
        triggeredAt: new Date(item.triggeredAt),
        finishedAt: item.finishedAt ? new Date(item.finishedAt) : undefined,
      };
      this.runs.set(run.id, run);

      // Rebuild event index
      const key = this.buildIdempotencyKey(run.workflowId, run.eventId);
      this.eventIndex.set(key, run.id);
    }

    // Load steps
    for (const item of data.steps || []) {
      const step: AutomationStepRun = {
        ...item,
        startedAt: new Date(item.startedAt),
        finishedAt: item.finishedAt ? new Date(item.finishedAt) : undefined,
      };
      this.steps.set(step.id, step);
    }
  }

  clear(): void {
    this.runs.clear();
    this.steps.clear();
    this.eventIndex.clear();
  }
}

// Export singleton instance
export const automationRunRepository = new AutomationRunRepositoryImpl();
