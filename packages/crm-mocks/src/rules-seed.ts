import { PipelineRule, RuleTrigger, RuleActionType } from '@united-cars/crm-core';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_TENANT = 'united-cars';

/**
 * Default rules that replicate hardcoded business logic from deal-repository.ts
 * These rules are marked as system rules and migrated from hardcoded logic
 */
export const defaultRules: Omit<PipelineRule, 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] = [
  {
    id: 'rule-dealer-won-spawn-integration',
    name: 'Dealer Acquisition Close Won → Spawn Integration',
    description: 'When a deal is closed won in the Dealer Acquisition pipeline, automatically spawn it into the Dealer Integration pipeline',
    pipelineId: '', // Will be set dynamically based on pipeline name
    isGlobal: false,
    trigger: RuleTrigger.DEAL_MARKED_WON,
    triggerConfig: {
      // Trigger fires when deal is marked as won (closing stage)
    },
    conditions: [
      {
        id: uuidv4(),
        field: 'pipeline.name',
        operator: 'equals',
        value: 'Dealer Acquisition',
        logicalOperator: 'AND'
      }
    ],
    actions: [
      {
        id: uuidv4(),
        type: RuleActionType.SPAWN_IN_PIPELINE,
        parameters: {
          pipelineId: '', // Will be set dynamically based on pipeline name 'Integration'
          copyFields: ['title', 'amount', 'currency', 'organisationId', 'contactId']
        },
        delay: 0,
        order: 0
      }
    ],
    isActive: true,
    priority: 1,
    executeOnce: false, // Can re-spawn if deal is reopened and won again
    cooldownMinutes: 0,
    isSystem: true,
    isMigrated: true, // Indicates this was migrated from hardcoded logic
    lastTriggeredAt: undefined,
    executionCount: 0,
    customFields: {}
  },

  // Future rule: Auto-assign to recovery team when deal goes inactive
  {
    id: 'rule-inactive-deal-notification',
    name: 'Inactive Deal Notification',
    description: 'Send notification when a deal has been inactive for 7 days',
    pipelineId: '', // Global rule, applies to all pipelines
    isGlobal: true,
    trigger: RuleTrigger.DEAL_INACTIVE,
    triggerConfig: {
      daysInactive: 7
    },
    conditions: [],
    actions: [
      {
        id: uuidv4(),
        type: RuleActionType.SEND_NOTIFICATION,
        parameters: {
          message: 'Deal {{deal.title}} has been inactive for 7 days',
          recipients: ['assignee', 'manager']
        },
        delay: 0,
        order: 0
      }
    ],
    isActive: true,
    priority: 10,
    executeOnce: false,
    cooldownMinutes: 10080, // 7 days in minutes (7 * 24 * 60)
    isSystem: false,
    isMigrated: false,
    lastTriggeredAt: undefined,
    executionCount: 0,
    customFields: {}
  },

  // Future rule: Require lost reason when marking as lost
  {
    id: 'rule-require-lost-reason',
    name: 'Require Lost Reason',
    description: 'Require a lost reason when marking a deal as lost',
    pipelineId: '',
    isGlobal: true,
    trigger: RuleTrigger.DEAL_MARKED_LOST,
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        id: uuidv4(),
        type: RuleActionType.REQUIRE_LOST_REASON,
        parameters: {},
        delay: 0,
        order: 0
      }
    ],
    isActive: true,
    priority: 1,
    executeOnce: false,
    cooldownMinutes: 0,
    isSystem: true,
    isMigrated: false,
    lastTriggeredAt: undefined,
    executionCount: 0,
    customFields: {}
  }
];

/**
 * Initialize default rules with proper pipeline IDs
 * Call this function after pipelines have been seeded
 */
export async function seedDefaultRules(
  pipelineRepository: any,
  ruleRepository: any
): Promise<void> {
  console.log('[Rules Seed] Starting to seed default rules...');

  try {
    // Get all pipelines
    const pipelines = await pipelineRepository.list();
    const dealerPipeline = pipelines.find((p: any) => p.name === 'Dealer Acquisition');
    const integrationPipeline = pipelines.find((p: any) => p.name === 'Dealer Integration');

    if (!dealerPipeline) {
      console.warn('[Rules Seed] Dealer Acquisition pipeline not found, skipping Dealer-specific rules');
    }
    if (!integrationPipeline) {
      console.warn('[Rules Seed] Dealer Integration pipeline not found, skipping Integration spawn rule');
    }

    // Process each default rule
    for (const ruleTemplate of defaultRules) {
      const rule = { ...ruleTemplate };

      // Set pipeline IDs dynamically
      if (rule.id === 'rule-dealer-won-spawn-integration') {
        if (!dealerPipeline || !integrationPipeline) {
          console.warn(`[Rules Seed] Skipping rule ${rule.id} - required pipelines not found`);
          continue;
        }
        rule.pipelineId = dealerPipeline.id;
        rule.actions[0].parameters.pipelineId = integrationPipeline.id;
      }

      // Check if rule already exists
      const existing = await ruleRepository.get(rule.id);
      if (existing) {
        console.log(`[Rules Seed] Rule ${rule.id} already exists, skipping`);
        continue;
      }

      // Create the rule
      const created = await ruleRepository.create({
        ...rule,
        tenantId: DEFAULT_TENANT,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system'
      });

      if (created) {
        console.log(`[Rules Seed] ✓ Created rule: ${rule.name} (${rule.id})`);
      } else {
        console.error(`[Rules Seed] ✗ Failed to create rule: ${rule.name}`);
      }
    }

    console.log('[Rules Seed] Default rules seeding completed successfully');
  } catch (error) {
    console.error('[Rules Seed] Error seeding default rules:', error);
    throw error;
  }
}
