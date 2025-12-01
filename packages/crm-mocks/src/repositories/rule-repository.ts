import {
  PipelineRule,
  RuleExecution,
  RuleExecutionSummary,
  RuleTrigger,
  EntityType,
  PipelineRuleRepository as IPipelineRuleRepository
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { nanoid } from 'nanoid';

class PipelineRuleRepositoryImpl extends BaseRepository<PipelineRule> implements IPipelineRuleRepository {
  constructor() {
    super();
    this.setEntityType(EntityType.PIPELINE); // Rules belong to pipeline entity type conceptually
  }

  private executions: Map<string, RuleExecution> = new Map();
  private lastExecutions: Map<string, Date> = new Map(); // Key: `${ruleId}:${dealId}`

  // ============================================================================
  // RULE QUERIES
  // ============================================================================

  async getByPipeline(pipelineId: string): Promise<PipelineRule[]> {
    const allRules = await this.list();
    return allRules
      .filter(rule => rule.pipelineId === pipelineId && !rule.isGlobal)
      .sort((a, b) => a.priority - b.priority);
  }

  async getGlobalRules(): Promise<PipelineRule[]> {
    const allRules = await this.list();
    return allRules
      .filter(rule => rule.isGlobal === true)
      .sort((a, b) => a.priority - b.priority);
  }

  async getActiveRules(pipelineId?: string): Promise<PipelineRule[]> {
    const allRules = await this.list();
    let filtered = allRules.filter(rule => rule.isActive);

    if (pipelineId) {
      filtered = filtered.filter(rule =>
        rule.pipelineId === pipelineId || rule.isGlobal === true
      );
    }

    return filtered.sort((a, b) => a.priority - b.priority);
  }

  async getSystemRules(): Promise<PipelineRule[]> {
    const allRules = await this.list();
    return allRules
      .filter(rule => rule.isSystem === true)
      .sort((a, b) => a.priority - b.priority);
  }

  async getMigratedRules(): Promise<PipelineRule[]> {
    const allRules = await this.list();
    return allRules
      .filter(rule => rule.isMigrated === true)
      .sort((a, b) => a.priority - b.priority);
  }

  async getByTrigger(trigger: RuleTrigger, pipelineId?: string): Promise<PipelineRule[]> {
    const allRules = await this.list();
    let filtered = allRules.filter(rule => rule.trigger === trigger && rule.isActive);

    if (pipelineId) {
      filtered = filtered.filter(rule =>
        rule.pipelineId === pipelineId || rule.isGlobal === true
      );
    }

    return filtered.sort((a, b) => a.priority - b.priority);
  }

  // ============================================================================
  // RULE MANAGEMENT
  // ============================================================================

  async activate(ruleId: string): Promise<PipelineRule | undefined> {
    return this.update(ruleId, { isActive: true });
  }

  async deactivate(ruleId: string): Promise<PipelineRule | undefined> {
    return this.update(ruleId, { isActive: false });
  }

  async reorderRules(ruleIds: string[]): Promise<boolean> {
    // Update priority based on order in array (1-indexed)
    const updates = ruleIds.map(async (ruleId, index) => {
      const rule = await this.get(ruleId);
      if (!rule) return false;

      await this.update(ruleId, { priority: index + 1 });
      return true;
    });

    const results = await Promise.all(updates);
    return results.every(r => r === true);
  }

  // ============================================================================
  // SYSTEM RULE PROTECTION
  // ============================================================================

  async canDelete(ruleId: string): Promise<boolean> {
    const rule = await this.get(ruleId);
    if (!rule) return false;

    // Cannot delete system rules
    return !rule.isSystem;
  }

  async remove(id: string): Promise<boolean> {
    const canDel = await this.canDelete(id);
    if (!canDel) {
      throw new Error('Cannot delete system rule');
    }
    return super.remove(id);
  }

  // ============================================================================
  // RULE EXECUTION TRACKING
  // ============================================================================

  async recordExecution(
    execution: Omit<RuleExecution, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<RuleExecution> {
    const newExecution: RuleExecution = {
      id: nanoid(),
      tenantId: this.currentTenantId,
      ...execution,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.executions.set(newExecution.id, newExecution);

    // Update rule's last triggered timestamp and execution count
    const rule = await this.get(execution.ruleId);
    if (rule && execution.executed) {
      await this.update(execution.ruleId, {
        lastTriggeredAt: new Date(),
        executionCount: (rule.executionCount || 0) + 1
      });
    }

    return newExecution;
  }

  async getExecutions(ruleId: string, limit: number = 50): Promise<RuleExecution[]> {
    const allExecutions = Array.from(this.executions.values());
    return allExecutions
      .filter(exec => exec.ruleId === ruleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getExecutionsByDeal(dealId: string, limit: number = 50): Promise<RuleExecution[]> {
    const allExecutions = Array.from(this.executions.values());
    return allExecutions
      .filter(exec => exec.dealId === dealId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getExecutionSummary(
    ruleId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<RuleExecutionSummary> {
    const executions = await this.getExecutions(ruleId);
    const periodExecutions = executions.filter(
      exec =>
        exec.createdAt >= periodStart &&
        exec.createdAt <= periodEnd
    );

    const rule = await this.get(ruleId);
    const ruleName = rule?.name || 'Unknown Rule';

    const totalExecutions = periodExecutions.length;
    const successfulExecutions = periodExecutions.filter(exec => exec.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;

    const executionTimes = periodExecutions
      .filter(exec => exec.executionTimeMs !== undefined)
      .map(exec => exec.executionTimeMs!);

    const averageExecutionTimeMs = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;

    const dealsAffected = new Set(periodExecutions.map(exec => exec.dealId)).size;

    const lastExecution = periodExecutions[0]; // Already sorted by date descending
    const lastExecutedAt = lastExecution?.executedAt;

    return {
      ruleId,
      ruleName,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTimeMs,
      lastExecutedAt,
      dealsAffected,
      periodStart,
      periodEnd
    };
  }

  // ============================================================================
  // COOLDOWN MANAGEMENT
  // ============================================================================

  async canExecute(ruleId: string, dealId: string): Promise<boolean> {
    const rule = await this.get(ruleId);
    if (!rule) return false;

    // Check if rule is active
    if (!rule.isActive) return false;

    // Check cooldown
    if (rule.cooldownMinutes && rule.cooldownMinutes > 0) {
      const key = `${ruleId}:${dealId}`;
      const lastExecution = this.lastExecutions.get(key);

      if (lastExecution) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        const timeSinceLastExecution = Date.now() - lastExecution.getTime();

        if (timeSinceLastExecution < cooldownMs) {
          return false; // Still in cooldown period
        }
      }
    }

    // Check executeOnce flag
    if (rule.executeOnce) {
      const executions = await this.getExecutionsByDeal(dealId);
      const hasExecuted = executions.some(
        exec => exec.ruleId === ruleId && exec.executed && exec.success
      );

      if (hasExecuted) {
        return false; // Already executed successfully once
      }
    }

    return true;
  }

  async markExecuted(ruleId: string, dealId: string): Promise<void> {
    const key = `${ruleId}:${dealId}`;
    this.lastExecutions.set(key, new Date());
  }
}

export const ruleRepository = new PipelineRuleRepositoryImpl();
