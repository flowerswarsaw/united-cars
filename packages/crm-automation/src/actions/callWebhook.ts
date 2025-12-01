/**
 * CALL_WEBHOOK Action Handler
 *
 * Makes HTTP requests to external URLs.
 * Supports templating in the body and retry logic.
 */

import { nanoid } from 'nanoid';
import {
  AutomationAction,
  EventContext,
  ActionExecutionResult,
  AutomationStepRun,
  ExecutionStatus,
  TargetType,
  CallWebhookConfig,
} from '../domain/types';
import { resolveFieldPath } from '../engine/evaluator';
import { ActionHandler } from '../engine/executor';

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookResult {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
}

export interface HttpClient {
  request(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeoutMs: number
  ): Promise<WebhookResult>;
}

// ============================================================================
// DEFAULT HTTP CLIENT
// ============================================================================

/**
 * Default HTTP client using fetch
 */
export class FetchHttpClient implements HttpClient {
  async request(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeoutMs: number
  ): Promise<WebhookResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      let responseBody: any;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        statusCode: response.status,
        body: responseBody,
        headers: responseHeaders,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// HANDLER
// ============================================================================

export class CallWebhookHandler implements ActionHandler {
  private httpClient: HttpClient;

  constructor(httpClient?: HttpClient) {
    this.httpClient = httpClient ?? new FetchHttpClient();
  }

  async execute(
    action: AutomationAction,
    context: EventContext,
    runId: string
  ): Promise<ActionExecutionResult> {
    const config = action.config as CallWebhookConfig;

    const step: AutomationStepRun = {
      id: nanoid(),
      runId,
      actionId: action.id,
      actionType: action.type,
      order: action.order,
      status: ExecutionStatus.SUCCESS,
      startedAt: new Date(),
      targetType: TargetType.NEW_ENTITY, // External resource
      input: {
        url: config.url,
        method: config.method,
        // Don't log sensitive headers
        hasHeaders: !!config.headers,
      },
    };

    try {
      // Process the body with templates
      const processedBody = this.processBody(config.body, context);

      // Add automation metadata to body
      const bodyWithMetadata = {
        ...processedBody,
        _automation: {
          eventId: context.event.eventId,
          eventType: context.event.eventType,
          runId,
          timestamp: new Date().toISOString(),
        },
      };

      // Prepare headers
      const headers: Record<string, string> = {
        ...config.headers,
        'X-Automation-Run-Id': runId,
        'X-Automation-Event-Id': context.event.eventId,
      };

      const timeoutMs = config.timeoutMs ?? 10000;
      const retries = config.retries ?? 0;
      const retryDelayMs = config.retryDelayMs ?? 1000;

      // Execute with retry logic
      let lastError: Error | undefined;
      let result: WebhookResult | undefined;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            // Wait before retry
            await this.delay(retryDelayMs * attempt);
          }

          result = await this.httpClient.request(
            config.url,
            config.method,
            headers,
            bodyWithMetadata,
            timeoutMs
          );

          // Check for success status code
          if (result.statusCode >= 200 && result.statusCode < 300) {
            break; // Success
          }

          // Non-success status code, might retry
          lastError = new Error(
            `Webhook returned status ${result.statusCode}: ${JSON.stringify(result.body)}`
          );
        } catch (error: any) {
          lastError = error;
          // Continue to retry if we have attempts left
        }
      }

      // Check final result
      if (result && result.statusCode >= 200 && result.statusCode < 300) {
        step.output = {
          statusCode: result.statusCode,
          body: result.body,
        };
        step.details = {
          url: config.url,
          method: config.method,
          attempts: 1,
        };

        step.finishedAt = new Date();
        step.durationMs = Date.now() - step.startedAt.getTime();

        return {
          success: true,
          step,
        };
      }

      // All retries failed
      throw lastError ?? new Error('Webhook call failed');
    } catch (error: any) {
      step.status = ExecutionStatus.FAILED;
      step.errorMessage = error.message;
      step.finishedAt = new Date();
      step.durationMs = Date.now() - step.startedAt.getTime();

      return {
        success: false,
        step,
        error,
      };
    }
  }

  /**
   * Process body, replacing template values
   */
  private processBody(body: any, context: EventContext): any {
    if (body === null || body === undefined) {
      return body;
    }

    if (typeof body === 'string') {
      // Process string templates
      return body.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = resolveFieldPath(context, path.trim());
        return value !== undefined && value !== null ? String(value) : '';
      });
    }

    if (Array.isArray(body)) {
      return body.map((item) => this.processBody(item, context));
    }

    if (typeof body === 'object') {
      const processed: Record<string, any> = {};
      for (const [key, value] of Object.entries(body)) {
        processed[key] = this.processBody(value, context);
      }
      return processed;
    }

    return body;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a CallWebhook action handler
 */
export function createCallWebhookHandler(httpClient?: HttpClient): CallWebhookHandler {
  return new CallWebhookHandler(httpClient);
}
