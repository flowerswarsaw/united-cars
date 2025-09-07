import {
  ConfigurableRule,
  RuleCondition,
  RuleAction,
  RuleEvaluationContext,
  RuleEvaluationResult,
  OrganizationType,
  EntityType
} from '@united-cars/crm-core';

export class ConfigurableRuleEngine {
  private rules: Map<string, ConfigurableRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  // Add a new rule to the engine
  addRule(rule: ConfigurableRule): void {
    this.rules.set(rule.id, rule);
  }

  // Remove a rule from the engine
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  // Update an existing rule
  updateRule(ruleId: string, updates: Partial<ConfigurableRule>): boolean {
    const existing = this.rules.get(ruleId);
    if (!existing) return false;
    
    const updated = { ...existing, ...updates };
    this.rules.set(ruleId, updated);
    return true;
  }

  // Get all rules of a specific type
  getRulesByType(ruleType: ConfigurableRule['ruleType']): ConfigurableRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.ruleType === ruleType && rule.isActive)
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  // Evaluate rules for pipeline assignment
  evaluatePipelineAssignment(context: RuleEvaluationContext): string[] {
    const pipelineRules = this.getRulesByType('pipeline_assignment');
    const assignedPipelines: string[] = [];
    const restrictedPipelines: string[] = [];

    for (const rule of pipelineRules) {
      const result = this.evaluateRule(rule, context);
      if (result.matched) {
        for (const action of result.actions) {
          if (action.type === 'assign_pipeline' && action.value) {
            assignedPipelines.push(action.value);
          } else if (action.type === 'restrict_pipeline' && action.value) {
            restrictedPipelines.push(action.value);
          }
        }
      }
    }

    // Return assigned pipelines minus any restricted ones
    return assignedPipelines.filter(p => !restrictedPipelines.includes(p));
  }

  // Evaluate all rules and return matching results
  evaluateAllRules(context: RuleEvaluationContext, ruleType?: ConfigurableRule['ruleType']): RuleEvaluationResult[] {
    const rulesToEvaluate = ruleType 
      ? this.getRulesByType(ruleType)
      : Array.from(this.rules.values()).filter(r => r.isActive);

    return rulesToEvaluate
      .map(rule => this.evaluateRule(rule, context))
      .filter(result => result.matched);
  }

  // Evaluate a single rule against context
  private evaluateRule(rule: ConfigurableRule, context: RuleEvaluationContext): RuleEvaluationResult {
    const conditionsMatch = this.evaluateConditions(rule.conditions, context);
    
    return {
      matched: conditionsMatch,
      actions: conditionsMatch ? rule.actions : [],
      rule: conditionsMatch ? rule : undefined
    };
  }

  // Evaluate rule conditions with logical operators
  private evaluateConditions(conditions: RuleCondition[], context: RuleEvaluationContext): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], context);
    
    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else { // Default to AND
        result = result && conditionResult;
      }
    }
    
    return result;
  }

  // Evaluate a single condition
  private evaluateCondition(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  // Get field value from context using dot notation
  private getFieldValue(fieldPath: string, context: RuleEvaluationContext): any {
    const parts = fieldPath.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    
    return value;
  }

  // Initialize default rules for backward compatibility
  private initializeDefaultRules(): void {
    // Dealer acquisition rule
    this.addRule({
      id: 'dealer-pipeline-assignment',
      name: 'Dealer Pipeline Assignment',
      description: 'Assigns appropriate pipelines to dealer organizations',
      ruleType: 'pipeline_assignment',
      isActive: true,
      priority: 100,
      conditions: [
        {
          field: 'organization.type',
          operator: 'equals',
          value: OrganizationType.DEALER
        }
      ],
      actions: [
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'dealer-acquisition'
        },
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'dealer-integration'
        }
      ]
    });

    // Retail client rule
    this.addRule({
      id: 'retail-pipeline-assignment',
      name: 'Retail Client Pipeline Assignment',
      description: 'Assigns sales and service pipelines to retail clients',
      ruleType: 'pipeline_assignment',
      isActive: true,
      priority: 100,
      conditions: [
        {
          field: 'organization.type',
          operator: 'equals',
          value: OrganizationType.RETAIL_CLIENT
        }
      ],
      actions: [
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'retail-sales'
        },
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'retail-service'
        }
      ]
    });

    // Vendor pipeline rule
    this.addRule({
      id: 'vendor-pipeline-assignment',
      name: 'Vendor Pipeline Assignment',
      description: 'Assigns vendor pipelines to logistics partners',
      ruleType: 'pipeline_assignment',
      isActive: true,
      priority: 100,
      conditions: [
        {
          field: 'organization.type',
          operator: 'in',
          value: [OrganizationType.EXPEDITOR, OrganizationType.SHIPPER, OrganizationType.TRANSPORTER]
        }
      ],
      actions: [
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'vendor-onboarding'
        },
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'active-vendor'
        }
      ]
    });

    // Auction integration rule
    this.addRule({
      id: 'auction-pipeline-assignment',
      name: 'Auction Pipeline Assignment',
      description: 'Assigns integration pipeline to auction houses',
      ruleType: 'pipeline_assignment',
      isActive: true,
      priority: 100,
      conditions: [
        {
          field: 'organization.type',
          operator: 'equals',
          value: OrganizationType.AUCTION
        }
      ],
      actions: [
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'auction-integration'
        }
      ]
    });

    // Processor partnership rule
    this.addRule({
      id: 'processor-pipeline-assignment',
      name: 'Processor Pipeline Assignment',
      description: 'Assigns partnership pipeline to title processors',
      ruleType: 'pipeline_assignment',
      isActive: true,
      priority: 100,
      conditions: [
        {
          field: 'organization.type',
          operator: 'equals',
          value: OrganizationType.PROCESSOR
        }
      ],
      actions: [
        {
          type: 'assign_pipeline',
          target: 'pipeline',
          value: 'processor-partnership'
        }
      ]
    });
  }

  // Get all configured rules (for management/debugging)
  getAllRules(): ConfigurableRule[] {
    return Array.from(this.rules.values());
  }

  // Clear all rules (for testing)
  clearAllRules(): void {
    this.rules.clear();
  }
}

// Singleton instance for global use
export const configurableRuleEngine = new ConfigurableRuleEngine();