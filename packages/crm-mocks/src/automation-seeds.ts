/**
 * Automation Seed Data
 *
 * Creates 3 canonical workflows for real-world use-cases:
 * 1. Sales Win → Implementation Handoff (create implementation deal + kickoff task)
 * 2. High Priority Ticket → Auto-assign + Urgent Task
 * 3. Big Win → Webhook Notification (deals > $50k)
 */

import {
  AutomationWorkflow,
  TriggerType,
  EventType,
  ActionType,
  TargetType,
  EntityType,
  ConditionOperator,
  LogicalOperator,
} from '@united-cars/crm-automation';
import { automationWorkflowRepository } from './repositories';

const DEFAULT_TENANT = 'united-cars';
const SYSTEM_USER = 'system';

// ============================================================================
// SEED WORKFLOWS
// ============================================================================

export const SEED_WORKFLOWS: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>[] = [
  // -------------------------------------------------------------------------
  // Workflow 1: Sales Win → Implementation Handoff
  // When a deal is won in the Sales pipeline (dealer-acquisition),
  // create an implementation deal and a kickoff task.
  // -------------------------------------------------------------------------
  {
    tenantId: DEFAULT_TENANT,
    name: 'Sales Win → Implementation Handoff',
    description: 'When a sales deal is won, create an implementation deal in the dealer-integration pipeline and a kickoff task linked to the original deal.',
    isActive: true,
    trigger: {
      type: TriggerType.EVENT,
      config: {
        eventType: EventType.DEAL_WON,
        entityType: EntityType.DEAL,
      },
    },
    conditionGroups: [
      {
        id: 'cg1',
        conditions: [
          {
            id: 'c1',
            field: 'deal.pipelineId',
            operator: ConditionOperator.EQUALS,
            value: 'dealer-acquisition',
            valueType: 'string',
          },
        ],
        logicalOperator: LogicalOperator.AND,
      },
    ],
    actions: [
      // Action 1: Create implementation deal
      {
        id: 'a1',
        type: ActionType.CREATE_DEAL,
        order: 1,
        target: { type: TargetType.NEW_ENTITY },
        config: {
          type: 'CREATE_DEAL',
          pipelineId: 'dealer-integration',
          stageId: 'intake',
          copyFields: ['organisationId', 'contactId', 'value', 'currency'],
          setFields: {
            title: 'Implementation: {{deal.title}}',
            description: 'Implementation deal created from sales win.\n\nOriginal Deal: {{deal.id}}\nOriginal Value: ${{deal.value}}',
          },
          parentDealId: 'FROM_EVENT',
        },
      },
      // Action 2: Create kickoff task linked to the ORIGINAL sales deal
      // TODO: Future enhancement - link to the new implementation deal once
      // the engine supports referencing results from previous actions
      {
        id: 'a2',
        type: ActionType.CREATE_TASK,
        order: 2,
        target: { type: TargetType.NEW_ENTITY },
        config: {
          type: 'CREATE_TASK',
          titleTemplate: 'Kickoff call: {{deal.title}}',
          descriptionTemplate: 'Schedule kickoff call with the client for implementation.\n\nOrganisation: {{organisation.name}}\nDeal Value: ${{deal.value}}',
          priority: 'HIGH',
          dueInDays: 3,
          assigneeType: 'OWNER_OF_ENTITY',
          primaryContext: {
            entityType: EntityType.DEAL,
            entityId: 'FROM_EVENT',
          },
        },
      },
    ],
    executeOnce: true,
    isSystem: true,
    createdBy: SYSTEM_USER,
    updatedBy: SYSTEM_USER,
  },

  // -------------------------------------------------------------------------
  // Workflow 2: High Priority Ticket → Auto-assign + Urgent Task
  // When a ticket is created with HIGH or URGENT priority,
  // assign to support lead and create an urgent response task.
  // -------------------------------------------------------------------------
  {
    tenantId: DEFAULT_TENANT,
    name: 'High Priority Ticket → Urgent Response',
    description: 'When a high or urgent priority ticket is created, assign to support lead and create an urgent task.',
    isActive: true,
    trigger: {
      type: TriggerType.EVENT,
      config: {
        eventType: EventType.TICKET_CREATED,
        entityType: EntityType.TICKET,
      },
    },
    conditionGroups: [
      {
        id: 'cg1',
        conditions: [
          {
            id: 'c1',
            field: 'ticket.priority',
            operator: ConditionOperator.IN,
            value: ['HIGH', 'URGENT'],
            valueType: 'array',
          },
        ],
        logicalOperator: LogicalOperator.AND,
      },
    ],
    actions: [
      // Action 1: Auto-assign the ticket
      {
        id: 'a1',
        type: ActionType.UPDATE_RECORD,
        order: 1,
        target: { type: TargetType.PRIMARY_RECORD },
        config: {
          type: 'UPDATE_RECORD',
          entityType: EntityType.TICKET,
          fields: {
            assigneeId: 'user_support_lead',
          },
          skipAutomations: true,
        },
      },
      // Action 2: Create urgent response task
      {
        id: 'a2',
        type: ActionType.CREATE_TASK,
        order: 2,
        target: { type: TargetType.NEW_ENTITY },
        config: {
          type: 'CREATE_TASK',
          titleTemplate: 'URGENT: Respond to {{ticket.title}}',
          descriptionTemplate: 'High priority ticket requires immediate attention.\n\nPriority: {{ticket.priority}}\nType: {{ticket.type}}',
          priority: 'URGENT',
          dueInDays: 1,
          assigneeType: 'STATIC_USER',
          assigneeId: 'user_support_lead',
          primaryContext: {
            entityType: EntityType.TICKET,
            entityId: 'FROM_EVENT',
          },
        },
      },
    ],
    executeOnce: true,
    isSystem: true,
    createdBy: SYSTEM_USER,
    updatedBy: SYSTEM_USER,
  },

  // -------------------------------------------------------------------------
  // Workflow 3: Big Win → Webhook Notification
  // When a deal > $50,000 is won, send a webhook notification.
  // -------------------------------------------------------------------------
  {
    tenantId: DEFAULT_TENANT,
    name: 'Big Win Alert → Webhook',
    description: 'When a deal worth $50,000 or more is won, send a webhook notification to external systems.',
    isActive: true,
    trigger: {
      type: TriggerType.EVENT,
      config: {
        eventType: EventType.DEAL_WON,
        entityType: EntityType.DEAL,
      },
    },
    conditionGroups: [
      {
        id: 'cg1',
        conditions: [
          {
            id: 'c1',
            field: 'deal.value',
            operator: ConditionOperator.GREATER_OR_EQUAL,
            value: 50000,
            valueType: 'number',
          },
        ],
        logicalOperator: LogicalOperator.AND,
      },
    ],
    actions: [
      {
        id: 'a1',
        type: ActionType.CALL_WEBHOOK,
        order: 1,
        target: { type: TargetType.PRIMARY_RECORD },
        config: {
          type: 'CALL_WEBHOOK',
          url: 'https://webhook.site/test',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Source': 'united-cars-crm',
          },
          body: {
            event: 'big_deal_won',
            deal: {
              id: '{{deal.id}}',
              title: '{{deal.title}}',
              value: '{{deal.value}}',
              organisationId: '{{deal.organisationId}}',
            },
            timestamp: '{{event.metadata.timestamp}}',
          },
          retries: 3,
          retryDelayMs: 1000,
          timeoutMs: 5000,
        },
      },
    ],
    executeOnce: false,
    isSystem: true,
    createdBy: SYSTEM_USER,
    updatedBy: SYSTEM_USER,
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

/**
 * Seed the automation workflows
 */
export async function seedAutomationWorkflows(): Promise<void> {
  console.log('[Automation] Seeding automation workflows...');

  for (const workflowData of SEED_WORKFLOWS) {
    // Check if workflow already exists (by name)
    const existing = (await automationWorkflowRepository.getAll(DEFAULT_TENANT))
      .find(w => w.name === workflowData.name);

    if (!existing) {
      await automationWorkflowRepository.create(workflowData);
      console.log(`[Automation] Created workflow: ${workflowData.name}`);
    } else {
      console.log(`[Automation] Workflow already exists: ${workflowData.name}`);
    }
  }

  console.log('[Automation] Automation workflows seeded successfully.');
}

/**
 * Clear all automation workflows (for testing)
 */
export async function clearAutomationWorkflows(): Promise<void> {
  automationWorkflowRepository.clear();
  console.log('[Automation] Automation workflows cleared.');
}
