/**
 * Universal Condition Evaluator
 *
 * This is the SINGLE source of truth for condition evaluation across the entire app.
 * Extracted from the pipeline rule engine and made entity-agnostic.
 *
 * Features:
 * - Dot notation field path resolution (e.g., "deal.amount", "organisation.country")
 * - All comparison operators
 * - AND/OR logic between condition groups
 * - Type coercion for proper comparisons
 * - Date handling
 */

import {
  AutomationCondition,
  AutomationConditionGroup,
  ConditionOperator,
  LogicalOperator,
  EventContext,
} from '../domain/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ConditionEvaluationResult {
  conditionId: string;
  field: string;
  operator: ConditionOperator;
  expectedValue: any;
  actualValue: any;
  matched: boolean;
  error?: string;
}

export interface GroupEvaluationResult {
  groupId: string;
  conditions: ConditionEvaluationResult[];
  matched: boolean;
  logicalOperator: LogicalOperator;
}

export interface EvaluationResult {
  matched: boolean;
  groups: GroupEvaluationResult[];
  error?: string;
}

// ============================================================================
// FIELD RESOLUTION
// ============================================================================

/**
 * Resolve a field path from a context object
 * Supports dot notation: "deal.amount", "organisation.country", "contact.emails[0].email"
 */
export function resolveFieldPath(context: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let value: any = context;

  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }

    // Handle array index notation: "emails[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      value = value[arrayName];
      if (Array.isArray(value) && index < value.length) {
        value = value[index];
      } else {
        return undefined;
      }
    } else {
      value = value[part];
    }
  }

  return value;
}

// ============================================================================
// VALUE COMPARISON
// ============================================================================

/**
 * Coerce value to the appropriate type for comparison
 */
function coerceValue(value: any, valueType?: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (valueType) {
    case 'number':
      return typeof value === 'number' ? value : parseFloat(String(value));
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return Boolean(value);
    case 'date':
      return value instanceof Date ? value : new Date(value);
    case 'array':
      return Array.isArray(value) ? value : [value];
    default:
      return value;
  }
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Calculate days ago from a date value
 */
function getDaysAgo(value: any): number | null {
  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Compare two values using the specified operator
 */
export function compareValues(
  actualValue: any,
  operator: ConditionOperator,
  expectedValue: any,
  valueType?: string
): boolean {
  // Coerce values for proper comparison
  const actual = coerceValue(actualValue, valueType);
  const expected = coerceValue(expectedValue, valueType);

  switch (operator) {
    case ConditionOperator.EQUALS:
      if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() === expected.getTime();
      }
      return actual === expected;

    case ConditionOperator.NOT_EQUALS:
      if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() !== expected.getTime();
      }
      return actual !== expected;

    case ConditionOperator.GREATER_THAN:
      if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() > expected.getTime();
      }
      return actual > expected;

    case ConditionOperator.LESS_THAN:
      if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() < expected.getTime();
      }
      return actual < expected;

    case ConditionOperator.GREATER_OR_EQUAL:
      if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() >= expected.getTime();
      }
      return actual >= expected;

    case ConditionOperator.LESS_OR_EQUAL:
      if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() <= expected.getTime();
      }
      return actual <= expected;

    case ConditionOperator.IN:
      if (!Array.isArray(expected)) {
        return false;
      }
      return expected.includes(actual);

    case ConditionOperator.NOT_IN:
      if (!Array.isArray(expected)) {
        return true;
      }
      return !expected.includes(actual);

    case ConditionOperator.CONTAINS:
      if (typeof actual === 'string') {
        return actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;

    case ConditionOperator.NOT_CONTAINS:
      if (typeof actual === 'string') {
        return !actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      if (Array.isArray(actual)) {
        return !actual.includes(expected);
      }
      return true;

    case ConditionOperator.IS_EMPTY:
      return isEmpty(actual);

    case ConditionOperator.IS_NOT_EMPTY:
      return !isEmpty(actual);

    default:
      // Handle legacy/extended operators if needed
      return false;
  }
}

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

/**
 * Evaluate a single condition against a context
 */
export function evaluateCondition(
  condition: AutomationCondition,
  context: Record<string, any>
): ConditionEvaluationResult {
  try {
    const actualValue = resolveFieldPath(context, condition.field);
    const matched = compareValues(
      actualValue,
      condition.operator,
      condition.value,
      condition.valueType
    );

    return {
      conditionId: condition.id,
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue,
      matched,
    };
  } catch (error: any) {
    return {
      conditionId: condition.id,
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue: undefined,
      matched: false,
      error: error.message,
    };
  }
}

/**
 * Evaluate a condition group (all conditions within a group are AND'd together)
 */
export function evaluateConditionGroup(
  group: AutomationConditionGroup,
  context: Record<string, any>
): GroupEvaluationResult {
  const conditionResults: ConditionEvaluationResult[] = [];

  for (const condition of group.conditions) {
    const result = evaluateCondition(condition, context);
    conditionResults.push(result);
  }

  // Within a group, all conditions must match (AND logic)
  const matched = conditionResults.every((r) => r.matched);

  return {
    groupId: group.id,
    conditions: conditionResults,
    matched,
    logicalOperator: group.logicalOperator,
  };
}

/**
 * Evaluate all condition groups
 * Groups are combined using the logicalOperator specified on each group
 */
export function evaluateConditionGroups(
  groups: AutomationConditionGroup[],
  context: Record<string, any>
): EvaluationResult {
  // No conditions = always match
  if (groups.length === 0) {
    return {
      matched: true,
      groups: [],
    };
  }

  const groupResults: GroupEvaluationResult[] = [];

  for (const group of groups) {
    const result = evaluateConditionGroup(group, context);
    groupResults.push(result);
  }

  // Combine groups using their logical operators
  // The logicalOperator on a group defines how it combines with the NEXT group
  // First group result is the starting value
  let finalResult = groupResults[0].matched;

  for (let i = 1; i < groupResults.length; i++) {
    const prevGroup = groupResults[i - 1];
    const currentResult = groupResults[i].matched;

    if (prevGroup.logicalOperator === LogicalOperator.AND) {
      finalResult = finalResult && currentResult;
    } else if (prevGroup.logicalOperator === LogicalOperator.OR) {
      finalResult = finalResult || currentResult;
    }
  }

  return {
    matched: finalResult,
    groups: groupResults,
  };
}

// ============================================================================
// MAIN EVALUATOR CLASS
// ============================================================================

/**
 * Universal Condition Evaluator
 * Use this class for all condition evaluation across the app
 */
export class ConditionEvaluator {
  /**
   * Evaluate condition groups against a context
   */
  evaluate(
    groups: AutomationConditionGroup[],
    context: Record<string, any>
  ): EvaluationResult {
    return evaluateConditionGroups(groups, context);
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(
    condition: AutomationCondition,
    context: Record<string, any>
  ): ConditionEvaluationResult {
    return evaluateCondition(condition, context);
  }

  /**
   * Resolve a field path from context
   */
  resolveField(context: Record<string, any>, path: string): any {
    return resolveFieldPath(context, path);
  }

  /**
   * Compare two values using an operator
   */
  compare(
    actualValue: any,
    operator: ConditionOperator,
    expectedValue: any,
    valueType?: string
  ): boolean {
    return compareValues(actualValue, operator, expectedValue, valueType);
  }
}

// Export singleton instance
export const conditionEvaluator = new ConditionEvaluator();
