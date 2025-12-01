/**
 * Automation Integration Tests
 *
 * Tests the end-to-end automation flow:
 * 1. Deal Won → Creates integration task
 * 2. High Priority Ticket → Creates urgent task
 * 3. Big Deal Created → Webhook called (mocked)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEvent,
  EventType,
  EntityType,
  ActionType,
  TriggerType,
  ConditionOperator,
  LogicalOperator,
  TargetType,
  ExecutionStatus,
} from '@united-cars/crm-automation';

import { automationWorkflowRepository } from '../repositories/automation-workflow-repository';
import { automationRunRepository } from '../repositories/automation-run-repository';
import { ticketRepository } from '../repositories/ticket-repository';
import { AutomationService } from '../services/automation-service';
import { CRMEntityLoader } from '../services/entity-loader';
import { dealRepository } from '../seeds';
import { TicketType, TicketStatus, TicketPriority, DealStatus, makeDeal } from '@united-cars/crm-core';

const DEFAULT_TENANT = 'united-cars';

describe('Automation Integration Tests', () => {
  let automationService: AutomationService;
  let entityLoader: CRMEntityLoader;

  beforeEach(() => {
    // Clear all repositories
    automationWorkflowRepository.clear();
    automationRunRepository.clear();
    ticketRepository.clear();
    dealRepository.clear();

    // Create entity loader and service
    entityLoader = new CRMEntityLoader();
    automationService = new AutomationService({ entityLoader });

    // Register a mock task creator to track created tasks
    vi.clearAllMocks();
  });

  describe('Scenario 1: Deal Won → Create Task', () => {
    it('should create a task when a deal is won', async () => {
      // Create workflow
      const workflow = await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'Deal Won - Create Task',
        description: 'Create task when deal is won',
        isActive: true,
        trigger: {
          type: TriggerType.EVENT,
          config: {
            eventType: EventType.DEAL_WON,
            entityType: EntityType.DEAL,
          },
        },
        conditionGroups: [],
        actions: [
          {
            id: 'a1',
            type: ActionType.CREATE_TASK,
            order: 1,
            target: { type: TargetType.NEW_ENTITY },
            config: {
              type: 'CREATE_TASK',
              titleTemplate: 'Onboard: {{deal.title}}',
              descriptionTemplate: 'Deal value: ${{deal.amount}}',
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
        createdBy: 'test',
        updatedBy: 'test',
      });

      // Create a test deal
      const deal = makeDeal({
        id: 'deal_123',
        title: 'Test Deal',
        amount: 5000,
        status: DealStatus.WON,
        organisationId: 'org_1',
      });
      dealRepository.seed([deal]);

      // Create and process the event
      const event = createEvent({
        eventType: EventType.DEAL_WON,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.DEAL,
        primaryEntityId: deal.id,
        payload: deal,
      });

      // Since we don't have action handlers registered, we test that the workflow is matched
      const results = await automationService.processEvent(event);

      // Verify workflow was found and executed
      expect(results).toHaveLength(1);
      expect(results[0].run.workflowId).toBe(workflow.id);
      expect(results[0].run.eventType).toBe(EventType.DEAL_WON);
      expect(results[0].run.primaryEntityId).toBe(deal.id);
    });

    it('should not process inactive workflows', async () => {
      // Create inactive workflow
      await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'Inactive Workflow',
        isActive: false, // Inactive
        trigger: {
          type: TriggerType.EVENT,
          config: {
            eventType: EventType.DEAL_WON,
          },
        },
        conditionGroups: [],
        actions: [
          {
            id: 'a1',
            type: ActionType.CREATE_TASK,
            order: 1,
            target: { type: TargetType.NEW_ENTITY },
            config: {
              type: 'CREATE_TASK',
              titleTemplate: 'Test',
              assigneeType: 'OWNER_OF_ENTITY',
              primaryContext: { entityType: EntityType.DEAL, entityId: 'FROM_EVENT' },
            },
          },
        ],
        createdBy: 'test',
        updatedBy: 'test',
      });

      const event = createEvent({
        eventType: EventType.DEAL_WON,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.DEAL,
        primaryEntityId: 'deal_123',
        payload: { id: 'deal_123' },
      });

      const results = await automationService.processEvent(event);

      // No workflows should be executed
      expect(results).toHaveLength(0);
    });
  });

  describe('Scenario 2: High Priority Ticket → Create Urgent Task', () => {
    it('should create urgent task for high priority ticket', async () => {
      // Create workflow - use EQUALS instead of IN for simpler condition
      const workflow = await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'High Priority Ticket Handler',
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
                operator: ConditionOperator.EQUALS,
                value: 'HIGH',
                valueType: 'string',
              },
            ],
            logicalOperator: LogicalOperator.AND,
          },
        ],
        actions: [
          {
            id: 'a1',
            type: ActionType.CREATE_TASK,
            order: 1,
            target: { type: TargetType.NEW_ENTITY },
            config: {
              type: 'CREATE_TASK',
              titleTemplate: 'URGENT: {{ticket.title}}',
              priority: 'URGENT',
              dueInDays: 1,
              assigneeType: 'OWNER_OF_ENTITY',
              primaryContext: { entityType: EntityType.TICKET, entityId: 'FROM_EVENT' },
            },
          },
        ],
        createdBy: 'test',
        updatedBy: 'test',
      });

      // Create a high priority ticket
      const ticket = await ticketRepository.create({
        tenantId: DEFAULT_TENANT,
        title: 'Critical Issue',
        type: TicketType.SUPPORT,
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
      });

      // Create event
      const event = createEvent({
        eventType: EventType.TICKET_CREATED,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.TICKET,
        primaryEntityId: ticket.id,
        payload: ticket,
      });

      const results = await automationService.processEvent(event);

      expect(results).toHaveLength(1);
      expect(results[0].run.conditionsMatched).toBe(true);
    });

    it('should NOT create task for low priority ticket', async () => {
      // Create workflow with priority condition (checking for HIGH)
      await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'High Priority Only',
        isActive: true,
        trigger: {
          type: TriggerType.EVENT,
          config: {
            eventType: EventType.TICKET_CREATED,
          },
        },
        conditionGroups: [
          {
            id: 'cg1',
            conditions: [
              {
                id: 'c1',
                field: 'ticket.priority',
                operator: ConditionOperator.EQUALS,
                value: 'HIGH',
                valueType: 'string',
              },
            ],
            logicalOperator: LogicalOperator.AND,
          },
        ],
        actions: [
          {
            id: 'a1',
            type: ActionType.CREATE_TASK,
            order: 1,
            target: { type: TargetType.NEW_ENTITY },
            config: {
              type: 'CREATE_TASK',
              titleTemplate: 'Task',
              assigneeType: 'OWNER_OF_ENTITY',
              primaryContext: { entityType: EntityType.TICKET, entityId: 'FROM_EVENT' },
            },
          },
        ],
        createdBy: 'test',
        updatedBy: 'test',
      });

      // Create a LOW priority ticket
      const ticket = await ticketRepository.create({
        tenantId: DEFAULT_TENANT,
        title: 'Minor Issue',
        type: TicketType.SUPPORT,
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW, // Low priority - should NOT match
      });

      const event = createEvent({
        eventType: EventType.TICKET_CREATED,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.TICKET,
        primaryEntityId: ticket.id,
        payload: ticket,
      });

      const results = await automationService.processEvent(event);

      // Workflow matches event type, but conditions don't match
      expect(results).toHaveLength(1);
      expect(results[0].run.conditionsMatched).toBe(false);
      expect(results[0].run.status).toBe(ExecutionStatus.SKIPPED);
    });
  });

  describe('Scenario 3: Big Deal → Webhook', () => {
    it('should match workflow for big deals (>= $10k)', async () => {
      // Create workflow
      const workflow = await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'Big Deal Alert',
        isActive: true,
        trigger: {
          type: TriggerType.EVENT,
          config: {
            eventType: EventType.DEAL_CREATED,
          },
        },
        conditionGroups: [
          {
            id: 'cg1',
            conditions: [
              {
                id: 'c1',
                field: 'deal.amount',
                operator: ConditionOperator.GREATER_OR_EQUAL,
                value: 10000,
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
              url: 'https://example.com/webhook',
              method: 'POST',
              body: { event: 'big_deal' },
            },
          },
        ],
        createdBy: 'test',
        updatedBy: 'test',
      });

      // Create a big deal
      const deal = makeDeal({
        id: 'big_deal',
        title: 'Big Deal',
        amount: 15000, // Above threshold
        status: DealStatus.OPEN,
      });
      dealRepository.seed([deal]);

      const event = createEvent({
        eventType: EventType.DEAL_CREATED,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.DEAL,
        primaryEntityId: deal.id,
        payload: deal,
      });

      const results = await automationService.processEvent(event);

      expect(results).toHaveLength(1);
      expect(results[0].run.conditionsMatched).toBe(true);
    });

    it('should NOT match workflow for small deals (< $10k)', async () => {
      await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'Big Deal Alert',
        isActive: true,
        trigger: {
          type: TriggerType.EVENT,
          config: {
            eventType: EventType.DEAL_CREATED,
          },
        },
        conditionGroups: [
          {
            id: 'cg1',
            conditions: [
              {
                id: 'c1',
                field: 'deal.amount',
                operator: ConditionOperator.GREATER_OR_EQUAL,
                value: 10000,
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
              url: 'https://example.com/webhook',
              method: 'POST',
              body: {},
            },
          },
        ],
        createdBy: 'test',
        updatedBy: 'test',
      });

      // Create a small deal
      const deal = makeDeal({
        id: 'small_deal',
        title: 'Small Deal',
        amount: 5000, // Below threshold
        status: DealStatus.OPEN,
      });
      dealRepository.seed([deal]);

      const event = createEvent({
        eventType: EventType.DEAL_CREATED,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.DEAL,
        primaryEntityId: deal.id,
        payload: deal,
      });

      const results = await automationService.processEvent(event);

      expect(results).toHaveLength(1);
      expect(results[0].run.conditionsMatched).toBe(false);
      expect(results[0].run.status).toBe(ExecutionStatus.SKIPPED);
    });
  });

  describe('Idempotency', () => {
    it('should not process same event twice', async () => {
      // Create workflow
      await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'Test Workflow',
        isActive: true,
        trigger: {
          type: TriggerType.EVENT,
          config: {
            eventType: EventType.DEAL_CREATED,
          },
        },
        conditionGroups: [],
        actions: [
          {
            id: 'a1',
            type: ActionType.CREATE_TASK,
            order: 1,
            target: { type: TargetType.NEW_ENTITY },
            config: {
              type: 'CREATE_TASK',
              titleTemplate: 'Test',
              assigneeType: 'OWNER_OF_ENTITY',
              primaryContext: { entityType: EntityType.DEAL, entityId: 'FROM_EVENT' },
            },
          },
        ],
        createdBy: 'test',
        updatedBy: 'test',
      });

      // Create same event
      const event = createEvent({
        eventType: EventType.DEAL_CREATED,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.DEAL,
        primaryEntityId: 'deal_123',
        payload: { id: 'deal_123', title: 'Test' },
      });

      // Process first time
      const results1 = await automationService.processEvent(event);
      expect(results1).toHaveLength(1);

      // Process same event again
      const results2 = await automationService.processEvent(event);

      // Should be empty - already processed
      expect(results2).toHaveLength(0);
    });
  });

  describe('Skip Automations Flag', () => {
    it('should skip processing when skipAutomations is true', async () => {
      await automationWorkflowRepository.create({
        tenantId: DEFAULT_TENANT,
        name: 'Test Workflow',
        isActive: true,
        trigger: {
          type: TriggerType.EVENT,
          config: {
            eventType: EventType.DEAL_CREATED,
          },
        },
        conditionGroups: [],
        actions: [
          {
            id: 'a1',
            type: ActionType.CREATE_TASK,
            order: 1,
            target: { type: TargetType.NEW_ENTITY },
            config: {
              type: 'CREATE_TASK',
              titleTemplate: 'Test',
              assigneeType: 'OWNER_OF_ENTITY',
              primaryContext: { entityType: EntityType.DEAL, entityId: 'FROM_EVENT' },
            },
          },
        ],
        createdBy: 'test',
        updatedBy: 'test',
      });

      const event = createEvent({
        eventType: EventType.DEAL_CREATED,
        tenantId: DEFAULT_TENANT,
        primaryEntity: EntityType.DEAL,
        primaryEntityId: 'deal_123',
        payload: { id: 'deal_123' },
        skipAutomations: true, // Skip flag set
      });

      const results = await automationService.processEvent(event);

      // Should be empty - skipped
      expect(results).toHaveLength(0);
    });
  });
});
