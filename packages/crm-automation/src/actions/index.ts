/**
 * Action Handlers - Index
 *
 * All v1 action handlers:
 * - UPDATE_RECORD
 * - CREATE_TASK
 * - CREATE_DEAL
 * - CREATE_TICKET
 * - CALL_WEBHOOK
 */

export {
  UpdateRecordHandler,
  createUpdateRecordHandler,
  type EntityRepository,
  type RepositoryRegistry,
} from './updateRecord';

export {
  CreateTaskHandler,
  createCreateTaskHandler,
  type TaskRepository,
  type TaskCreateData,
} from './createTask';

export {
  CreateDealHandler,
  createCreateDealHandler,
  type DealRepository,
  type DealCreateData,
} from './createDeal';

export {
  CreateTicketHandler,
  createCreateTicketHandler,
  type TicketRepository,
  type TicketCreateData,
} from './createTicket';

export {
  CallWebhookHandler,
  createCallWebhookHandler,
  FetchHttpClient,
  type HttpClient,
  type WebhookResult,
} from './callWebhook';

import { ActionType } from '../domain/types';
import { ActionHandler } from '../engine/executor';
import { UpdateRecordHandler, RepositoryRegistry } from './updateRecord';
import { CreateTaskHandler, TaskRepository } from './createTask';
import { CreateDealHandler, DealRepository } from './createDeal';
import { CreateTicketHandler, TicketRepository } from './createTicket';
import { CallWebhookHandler, HttpClient } from './callWebhook';

/**
 * Configuration for creating all action handlers
 */
export interface ActionHandlerConfig {
  repositories: RepositoryRegistry;
  taskRepository: TaskRepository;
  dealRepository: DealRepository;
  ticketRepository: TicketRepository;
  httpClient?: HttpClient;
}

/**
 * Create all action handlers and return them as a map
 */
export function createAllActionHandlers(
  config: ActionHandlerConfig
): Map<string, ActionHandler> {
  const handlers = new Map<string, ActionHandler>();

  handlers.set(
    ActionType.UPDATE_RECORD,
    new UpdateRecordHandler(config.repositories)
  );

  handlers.set(
    ActionType.CREATE_TASK,
    new CreateTaskHandler(config.taskRepository)
  );

  handlers.set(
    ActionType.CREATE_DEAL,
    new CreateDealHandler(config.dealRepository)
  );

  handlers.set(
    ActionType.CREATE_TICKET,
    new CreateTicketHandler(config.ticketRepository)
  );

  handlers.set(
    ActionType.CALL_WEBHOOK,
    new CallWebhookHandler(config.httpClient)
  );

  return handlers;
}

/**
 * Register all action handlers with a workflow executor
 */
export function registerAllActionHandlers(
  executor: { registerActionHandler: (type: string, handler: ActionHandler) => void },
  config: ActionHandlerConfig
): void {
  const handlers = createAllActionHandlers(config);

  for (const [type, handler] of handlers) {
    executor.registerActionHandler(type, handler);
  }
}
