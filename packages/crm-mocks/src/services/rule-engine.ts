import {
  PipelineRule,
  PipelineRuleCondition,
  PipelineRuleAction,
  RuleActionType,
  RuleTrigger,
  RuleConditionOperator,
  Deal,
  Pipeline,
  Stage,
  RuleExecution
} from '@united-cars/crm-core';
import { ruleRepository } from '../repositories/rule-repository';
import * as ActionExecutors from './action-executors';

// ============================================================================
// TYPES
// ============================================================================

export interface RuleEvaluationContext {
  deal: Deal;
  pipeline: Pipeline;
  stage?: Stage;
  fromStage?: Stage;
  metadata?: Record<string, any>;
}

export interface ConditionEvaluationResult {
  conditionId: string;
  field: string;
  operator: RuleConditionOperator;
  expectedValue: any;
  actualValue: any;
  matched: boolean;
}

export interface ActionExecutionResult {
  actionId: string;
  type: RuleActionType;
  parameters: Record<string, any>;
  success: boolean;
  error?: string;
  result?: any;
}

export interface RuleExecutionResult {
  rule: PipelineRule;
  conditionsMatched: boolean;
  conditionResults: ConditionEvaluationResult[];
  executed: boolean;
  actionResults: ActionExecutionResult[];
  success: boolean;
  error?: string;
  executionTimeMs: number;
}

// ============================================================================
// RULE ENGINE
// ============================================================================

export class RuleEngine {
  /**
   * Evaluate all rules for a specific trigger and context
   */
  async evaluateRules(
    trigger: RuleTrigger,
    context: RuleEvaluationContext
  ): Promise<RuleExecutionResult[]> {
    const { deal, pipeline } = context;

    // Get all active rules for this trigger
    const rules = await ruleRepository.getByTrigger(trigger, pipeline.id);

    const results: RuleExecutionResult[] = [];

    for (const rule of rules) {
      // Check if rule can execute (cooldown, executeOnce)
      const canExecute = await ruleRepository.canExecute(rule.id, deal.id);
      if (!canExecute) {
        continue; // Skip this rule
      }

      // Evaluate the rule
      const result = await this.evaluateRule(rule, context);
      results.push(result);

      // Record execution in repository
      await this.recordExecution(rule, context, result);

      // Mark as executed if successful
      if (result.executed && result.success) {
        await ruleRepository.markExecuted(rule.id, deal.id);
      }
    }

    return results;
  }

  /**
   * Evaluate a single rule against context
   */
  async evaluateRule(
    rule: PipelineRule,
    context: RuleEvaluationContext
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Evaluate conditions
      const conditionResults = await this.evaluateConditions(rule.conditions, context);
      const conditionsMatched = this.checkConditionsMatched(conditionResults, rule.conditions);

      // If conditions don't match, don't execute actions
      if (!conditionsMatched) {
        return {
          rule,
          conditionsMatched: false,
          conditionResults,
          executed: false,
          actionResults: [],
          success: true,
          executionTimeMs: Date.now() - startTime
        };
      }

      // Step 2: Execute actions
      const actionResults = await this.executeActions(rule.actions, context);
      const allActionsSucceeded = actionResults.every(result => result.success);

      return {
        rule,
        conditionsMatched: true,
        conditionResults,
        executed: true,
        actionResults,
        success: allActionsSucceeded,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        rule,
        conditionsMatched: false,
        conditionResults: [],
        executed: false,
        actionResults: [],
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  // ============================================================================
  // CONDITION EVALUATION
  // ============================================================================

  /**
   * Evaluate all conditions
   */
  private async evaluateConditions(
    conditions: PipelineRuleCondition[],
    context: RuleEvaluationContext
  ): Promise<ConditionEvaluationResult[]> {
    const results: ConditionEvaluationResult[] = [];

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: PipelineRuleCondition,
    context: RuleEvaluationContext
  ): Promise<ConditionEvaluationResult> {
    const { deal } = context;

    // Get the actual value from the deal
    const actualValue = this.getFieldValue(deal, condition.field);

    // Evaluate the condition
    const matched = this.compareValues(
      actualValue,
      condition.operator,
      condition.value
    );

    return {
      conditionId: condition.id,
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue,
      matched
    };
  }

  /**
   * Get a field value from a deal using dot notation
   */
  private getFieldValue(deal: Deal, field: string): any {
    const parts = field.split('.');
    let value: any = deal;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Compare values using an operator
   */
  private compareValues(
    actualValue: any,
    operator: RuleConditionOperator,
    expectedValue: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;

      case 'not_equals':
        return actualValue !== expectedValue;

      case 'greater_than':
        return actualValue > expectedValue;

      case 'less_than':
        return actualValue < expectedValue;

      case 'greater_or_equal':
        return actualValue >= expectedValue;

      case 'less_or_equal':
        return actualValue <= expectedValue;

      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);

      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);

      case 'contains':
        if (typeof actualValue === 'string') {
          return actualValue.includes(expectedValue);
        }
        if (Array.isArray(actualValue)) {
          return actualValue.includes(expectedValue);
        }
        return false;

      case 'not_contains':
        if (typeof actualValue === 'string') {
          return !actualValue.includes(expectedValue);
        }
        if (Array.isArray(actualValue)) {
          return !actualValue.includes(expectedValue);
        }
        return true;

      case 'is_empty':
        return (
          actualValue === null ||
          actualValue === undefined ||
          actualValue === '' ||
          (Array.isArray(actualValue) && actualValue.length === 0)
        );

      case 'is_not_empty':
        return !(
          actualValue === null ||
          actualValue === undefined ||
          actualValue === '' ||
          (Array.isArray(actualValue) && actualValue.length === 0)
        );

      case 'days_ago_greater_than':
        if (actualValue instanceof Date) {
          const daysAgo = (Date.now() - actualValue.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo > expectedValue;
        }
        return false;

      case 'days_ago_less_than':
        if (actualValue instanceof Date) {
          const daysAgo = (Date.now() - actualValue.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo < expectedValue;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if all conditions are matched based on logical operators
   */
  private checkConditionsMatched(
    results: ConditionEvaluationResult[],
    conditions: PipelineRuleCondition[]
  ): boolean {
    if (results.length === 0) {
      return true; // No conditions means always match
    }

    // Build expression respecting AND/OR logical operators
    let currentResult = results[0].matched;

    for (let i = 1; i < results.length; i++) {
      const prevCondition = conditions[i - 1];
      const logicalOp = prevCondition.logicalOperator || 'AND';

      if (logicalOp === 'AND') {
        currentResult = currentResult && results[i].matched;
      } else if (logicalOp === 'OR') {
        currentResult = currentResult || results[i].matched;
      }
    }

    return currentResult;
  }

  // ============================================================================
  // ACTION EXECUTION
  // ============================================================================

  /**
   * Execute all actions sequentially
   */
  private async executeActions(
    actions: PipelineRuleAction[],
    context: RuleEvaluationContext
  ): Promise<ActionExecutionResult[]> {
    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    const results: ActionExecutionResult[] = [];

    for (const action of sortedActions) {
      // Apply delay if specified
      if (action.parameters.delayMinutes && action.parameters.delayMinutes > 0) {
        await this.delay(action.parameters.delayMinutes * 60 * 1000);
      }

      const result = await this.executeAction(action, context);
      results.push(result);

      // Stop executing if action failed and it's critical
      if (!result.success) {
        // For now, continue with other actions even if one fails
        // In the future, we could add a "stopOnError" flag to actions
      }
    }

    return results;
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: PipelineRuleAction,
    context: RuleEvaluationContext
  ): Promise<ActionExecutionResult> {
    try {
      let result: any;

      switch (action.type) {
        case RuleActionType.MARK_WON:
          result = await this.executeMarkWon(context);
          break;

        case RuleActionType.MARK_LOST:
          result = await this.executeMarkLost(context, action.parameters);
          break;

        case RuleActionType.MOVE_TO_STAGE:
          result = await this.executeMoveToStage(context, action.parameters);
          break;

        case RuleActionType.SPAWN_IN_PIPELINE:
          result = await this.executeSpawnInPipeline(context, action.parameters);
          break;

        case RuleActionType.REQUIRE_LOST_REASON:
        case RuleActionType.REQUIRE_FIELD:
          result = await this.executeRequireField(context, action.parameters);
          break;

        case RuleActionType.SET_FIELD_VALUE:
          result = await this.executeSetFieldValue(context, action.parameters);
          break;

        case RuleActionType.SEND_NOTIFICATION:
          result = await this.executeSendNotification(context, action.parameters);
          break;

        case RuleActionType.CREATE_TASK:
          result = await this.executeCreateTask(context, action.parameters);
          break;

        case RuleActionType.ASSIGN_TO_USER:
          result = await this.executeAssignToUser(context, action.parameters);
          break;

        case RuleActionType.ASSIGN_TO_TEAM:
          result = await this.executeAssignToTeam(context, action.parameters);
          break;

        case RuleActionType.UNASSIGN_DEAL:
          result = await this.executeUnassignDeal(context);
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return {
        actionId: action.id,
        type: action.type,
        parameters: action.parameters,
        success: true,
        result
      };
    } catch (error: any) {
      return {
        actionId: action.id,
        type: action.type,
        parameters: action.parameters,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Action executors - delegate to action-executors service
   */
  private async executeMarkWon(context: RuleEvaluationContext): Promise<any> {
    const result = await ActionExecutors.executeMarkWon(context);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeMarkLost(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeMarkLost(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeMoveToStage(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeMoveToStage(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeSpawnInPipeline(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeSpawnInPipeline(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeRequireField(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeRequireField(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeSetFieldValue(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeSetFieldValue(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeSendNotification(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeSendNotification(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeCreateTask(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeCreateTask(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeAssignToUser(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeAssignToUser(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeAssignToTeam(context: RuleEvaluationContext, params: any): Promise<any> {
    const result = await ActionExecutors.executeAssignToTeam(context, params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  private async executeUnassignDeal(context: RuleEvaluationContext): Promise<any> {
    const result = await ActionExecutors.executeUnassignDeal(context);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record rule execution to repository
   */
  private async recordExecution(
    rule: PipelineRule,
    context: RuleEvaluationContext,
    result: RuleExecutionResult
  ): Promise<void> {
    const { deal, pipeline, stage } = context;

    await ruleRepository.recordExecution({
      ruleId: rule.id,
      ruleName: rule.name,
      dealId: deal.id,
      dealTitle: deal.title,
      pipelineId: pipeline.id,
      stageId: stage?.id,
      trigger: rule.trigger,
      triggerData: context.metadata,
      conditionsMatched: result.conditionsMatched,
      evaluationResult: {
        conditions: result.conditionResults
      },
      executed: result.executed,
      executedAt: result.executed ? new Date() : undefined,
      actionsPerformed: result.actionResults,
      success: result.success,
      error: result.error,
      executionTimeMs: result.executionTimeMs
    });
  }
}

// Export singleton instance
export const ruleEngine = new RuleEngine();
