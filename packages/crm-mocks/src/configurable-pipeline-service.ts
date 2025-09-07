import {
  OrganizationType,
  EntityType,
  RuleEvaluationContext
} from '@united-cars/crm-core';
import { configurableRuleEngine } from './rule-engine';

export class ConfigurablePipelineService {
  /**
   * Get applicable pipelines for an organization type using configurable rules
   * Replaces the hard-coded isPipelineApplicableToType function
   */
  getPipelinesForOrganizationType(organizationType: OrganizationType, organization?: any): string[] {
    const context: RuleEvaluationContext = {
      entity: organization || { type: organizationType },
      entityType: EntityType.ORGANISATION,
      organization: organization || { type: organizationType }
    };

    return configurableRuleEngine.evaluatePipelineAssignment(context);
  }

  /**
   * Check if a specific pipeline is applicable to an organization type
   * Replaces the hard-coded isPipelineApplicableToType function
   */
  isPipelineApplicableToOrganization(pipelineId: string, organization: any): boolean {
    const applicablePipelines = this.getPipelinesForOrganizationType(
      organization.type, 
      organization
    );
    
    return applicablePipelines.includes(pipelineId);
  }

  /**
   * Get all unique pipeline IDs from configured rules
   * Replaces the hard-coded getAllPipelineIds function
   */
  getAllPipelineIds(): string[] {
    const allRules = configurableRuleEngine.getAllRules()
      .filter(rule => rule.ruleType === 'pipeline_assignment' && rule.isActive);
    
    const pipelineIds = new Set<string>();
    
    for (const rule of allRules) {
      for (const action of rule.actions) {
        if (action.type === 'assign_pipeline' && action.value) {
          pipelineIds.add(action.value);
        }
      }
    }
    
    return Array.from(pipelineIds);
  }

  /**
   * Get organization types that can use a specific pipeline
   */
  getOrganizationTypesForPipeline(pipelineId: string): OrganizationType[] {
    const allRules = configurableRuleEngine.getAllRules()
      .filter(rule => rule.ruleType === 'pipeline_assignment' && rule.isActive);
    
    const organizationTypes = new Set<OrganizationType>();
    
    for (const rule of allRules) {
      // Check if this rule assigns the specified pipeline
      const assignsPipeline = rule.actions.some(
        action => action.type === 'assign_pipeline' && action.value === pipelineId
      );
      
      if (assignsPipeline) {
        // Extract organization types from conditions
        for (const condition of rule.conditions) {
          if (condition.field === 'organization.type') {
            if (condition.operator === 'equals') {
              organizationTypes.add(condition.value);
            } else if (condition.operator === 'in' && Array.isArray(condition.value)) {
              condition.value.forEach(type => organizationTypes.add(type));
            }
          }
        }
      }
    }
    
    return Array.from(organizationTypes);
  }

  /**
   * Add a new pipeline assignment rule at runtime
   */
  addPipelineAssignmentRule(
    name: string,
    description: string,
    organizationType: OrganizationType | OrganizationType[],
    pipelineIds: string[],
    priority: number = 100
  ): string {
    const ruleId = `custom-pipeline-${Date.now()}`;
    
    const conditions = Array.isArray(organizationType)
      ? [{
          field: 'organization.type',
          operator: 'in' as const,
          value: organizationType
        }]
      : [{
          field: 'organization.type',
          operator: 'equals' as const,
          value: organizationType
        }];
    
    const actions = pipelineIds.map(pipelineId => ({
      type: 'assign_pipeline' as const,
      target: 'pipeline',
      value: pipelineId
    }));

    configurableRuleEngine.addRule({
      id: ruleId,
      name,
      description,
      ruleType: 'pipeline_assignment',
      isActive: true,
      priority,
      conditions,
      actions
    });

    return ruleId;
  }

  /**
   * Remove a pipeline assignment rule
   */
  removePipelineAssignmentRule(ruleId: string): boolean {
    return configurableRuleEngine.removeRule(ruleId);
  }

  /**
   * Update an existing pipeline assignment rule
   */
  updatePipelineAssignmentRule(ruleId: string, updates: {
    name?: string;
    description?: string;
    isActive?: boolean;
    priority?: number;
  }): boolean {
    return configurableRuleEngine.updateRule(ruleId, updates);
  }

  /**
   * Get all pipeline assignment rules
   */
  getAllPipelineAssignmentRules() {
    return configurableRuleEngine.getRulesByType('pipeline_assignment');
  }

  /**
   * Advanced rule evaluation with custom context
   */
  evaluateCustomPipelineRules(context: RuleEvaluationContext): string[] {
    return configurableRuleEngine.evaluatePipelineAssignment(context);
  }

  /**
   * Test a potential rule configuration without saving it
   */
  testPipelineRule(
    organizationType: OrganizationType,
    testOrganization?: any
  ): { 
    matchingRules: string[];
    assignedPipelines: string[];
  } {
    const context: RuleEvaluationContext = {
      entity: testOrganization || { type: organizationType },
      entityType: EntityType.ORGANISATION,
      organization: testOrganization || { type: organizationType }
    };

    const results = configurableRuleEngine.evaluateAllRules(context, 'pipeline_assignment');
    
    return {
      matchingRules: results.map(r => r.rule?.name || 'Unknown'),
      assignedPipelines: configurableRuleEngine.evaluatePipelineAssignment(context)
    };
  }
}

// Singleton instance for global use
export const configurablePipelineService = new ConfigurablePipelineService();