'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type {
  CreateTaskConfig,
  CreateDealConfig,
  UpdateRecordConfig,
  CallWebhookConfig,
  CreateTicketConfig,
} from '@united-cars/crm-automation';
import { EntityType, ENTITY_TYPE_LABELS, ENUM_OPTIONS } from './types';
import { UserSelect } from '@/components/crm/shared/user-select';

// ============================================================================
// CREATE TASK CONFIG FORM
// ============================================================================

interface CreateTaskConfigFormProps {
  value: Partial<CreateTaskConfig>;
  onChange: (config: Partial<CreateTaskConfig>) => void;
  disabled?: boolean;
}

export function CreateTaskConfigForm({
  value,
  onChange,
  disabled,
}: CreateTaskConfigFormProps) {
  const update = (updates: Partial<CreateTaskConfig>) => {
    onChange({ ...value, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Task Title</Label>
        <Input
          value={value.titleTemplate || ''}
          onChange={(e) => update({ titleTemplate: e.target.value })}
          placeholder="e.g. Follow up on {{deal.title}}"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{{deal.title}}'}, {'{{organisation.name}}'}, etc. for dynamic values
        </p>
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={value.descriptionTemplate || ''}
          onChange={(e) => update({ descriptionTemplate: e.target.value })}
          placeholder="Task description..."
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={value.priority || 'MEDIUM'}
            onValueChange={(v) => update({ priority: v as CreateTaskConfig['priority'] })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENUM_OPTIONS.TaskPriority.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due In (days)</Label>
          <Input
            type="number"
            min={0}
            value={value.dueInDays ?? 7}
            onChange={(e) => update({ dueInDays: parseInt(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Assign To</Label>
        <Select
          value={value.assigneeType || 'OWNER_OF_ENTITY'}
          onValueChange={(v) => update({ assigneeType: v as CreateTaskConfig['assigneeType'] })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OWNER_OF_ENTITY">Owner of the entity</SelectItem>
            <SelectItem value="CURRENT_USER">User who triggered event</SelectItem>
            <SelectItem value="STATIC_USER">Specific user</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.assigneeType === 'STATIC_USER' && (
        <div className="space-y-2">
          <Label>Select User</Label>
          <UserSelect
            value={value.assigneeId}
            onValueChange={(userId) => update({ assigneeId: userId })}
            placeholder="Select a user..."
            statusFilter="ACTIVE"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CREATE DEAL CONFIG FORM
// ============================================================================

interface CreateDealConfigFormProps {
  value: Partial<CreateDealConfig>;
  onChange: (config: Partial<CreateDealConfig>) => void;
  disabled?: boolean;
}

interface Pipeline {
  id: string;
  name: string;
  stages?: { id: string; name: string }[];
}

export function CreateDealConfigForm({
  value,
  onChange,
  disabled,
}: CreateDealConfigFormProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      const response = await fetch('/api/crm/pipelines');
      if (response.ok) {
        const data = await response.json();
        setPipelines(data);
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const update = (updates: Partial<CreateDealConfig>) => {
    onChange({ ...value, ...updates });
  };

  const selectedPipeline = pipelines.find((p) => p.id === value.pipelineId);
  const stages = selectedPipeline?.stages || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Target Pipeline</Label>
        <Select
          value={value.pipelineId || ''}
          onValueChange={(v) => update({ pipelineId: v, stageId: '' })}
          disabled={disabled || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? 'Loading...' : 'Select pipeline'} />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Initial Stage</Label>
        <Select
          value={value.stageId || ''}
          onValueChange={(v) => update({ stageId: v })}
          disabled={disabled || !value.pipelineId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!value.pipelineId && (
          <p className="text-xs text-muted-foreground">Select a pipeline first</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Copy from Source Deal</Label>
        <p className="text-xs text-muted-foreground mb-2">
          The new deal will automatically inherit organisation and contact from the source
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// UPDATE RECORD CONFIG FORM
// ============================================================================

interface UpdateRecordConfigFormProps {
  value: Partial<UpdateRecordConfig>;
  onChange: (config: Partial<UpdateRecordConfig>) => void;
  disabled?: boolean;
}

export function UpdateRecordConfigForm({
  value,
  onChange,
  disabled,
}: UpdateRecordConfigFormProps) {
  const fields = value.fields || {};
  const fieldEntries = Object.entries(fields);

  const update = (updates: Partial<UpdateRecordConfig>) => {
    onChange({ ...value, ...updates });
  };

  const addField = () => {
    const newFields = { ...fields, '': '' };
    update({ fields: newFields });
  };

  const updateFieldKey = (oldKey: string, newKey: string) => {
    const newFields: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (key === oldKey) {
        newFields[newKey] = val;
      } else {
        newFields[key] = val;
      }
    }
    update({ fields: newFields });
  };

  const updateFieldValue = (key: string, newValue: string) => {
    update({ fields: { ...fields, [key]: newValue } });
  };

  const removeField = (key: string) => {
    const newFields = { ...fields };
    delete newFields[key];
    update({ fields: newFields });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Entity Type</Label>
        <Select
          value={value.entityType || EntityType.DEAL}
          onValueChange={(v) => update({ entityType: v as EntityType })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[EntityType.DEAL, EntityType.TICKET, EntityType.ORGANISATION, EntityType.CONTACT].map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {ENTITY_TYPE_LABELS[type]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Updates will be applied to the primary record from the event
        </p>
      </div>

      <div className="space-y-2">
        <Label>Fields to Update</Label>
        <div className="space-y-2">
          {fieldEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No fields defined
            </p>
          ) : (
            fieldEntries.map(([key, val], index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={key}
                  onChange={(e) => updateFieldKey(key, e.target.value)}
                  placeholder="Field name"
                  className="flex-1"
                  disabled={disabled}
                />
                <Input
                  value={val?.toString() || ''}
                  onChange={(e) => updateFieldValue(key, e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(key)}
                  disabled={disabled}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// CALL WEBHOOK CONFIG FORM
// ============================================================================

interface CallWebhookConfigFormProps {
  value: Partial<CallWebhookConfig>;
  onChange: (config: Partial<CallWebhookConfig>) => void;
  disabled?: boolean;
}

export function CallWebhookConfigForm({
  value,
  onChange,
  disabled,
}: CallWebhookConfigFormProps) {
  const headers = value.headers || {};
  const headerEntries = Object.entries(headers);

  const update = (updates: Partial<CallWebhookConfig>) => {
    onChange({ ...value, ...updates });
  };

  const addHeader = () => {
    update({ headers: { ...headers, '': '' } });
  };

  const updateHeaderKey = (oldKey: string, newKey: string) => {
    const newHeaders: Record<string, string> = {};
    for (const [key, val] of Object.entries(headers)) {
      if (key === oldKey) {
        newHeaders[newKey] = val;
      } else {
        newHeaders[key] = val;
      }
    }
    update({ headers: newHeaders });
  };

  const updateHeaderValue = (key: string, newValue: string) => {
    update({ headers: { ...headers, [key]: newValue } });
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    update({ headers: newHeaders });
  };

  // Handle body as JSON string for editing
  const bodyString = typeof value.body === 'object'
    ? JSON.stringify(value.body, null, 2)
    : value.body?.toString() || '{}';

  const handleBodyChange = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      update({ body: parsed });
    } catch {
      // Keep invalid JSON as string temporarily
      update({ body: jsonStr as any });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Webhook URL</Label>
        <Input
          value={value.url || ''}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="https://example.com/webhook"
          type="url"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Method</Label>
          <Select
            value={value.method || 'POST'}
            onValueChange={(v) => update({ method: v as CallWebhookConfig['method'] })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Timeout (ms)</Label>
          <Input
            type="number"
            min={1000}
            max={30000}
            value={value.timeoutMs ?? 5000}
            onChange={(e) => update({ timeoutMs: parseInt(e.target.value) || 5000 })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Retries</Label>
          <Input
            type="number"
            min={0}
            max={5}
            value={value.retries ?? 3}
            onChange={(e) => update({ retries: parseInt(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Headers</Label>
        <div className="space-y-2">
          {headerEntries.map(([key, val], index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={key}
                onChange={(e) => updateHeaderKey(key, e.target.value)}
                placeholder="Header name"
                className="flex-1"
                disabled={disabled}
              />
              <Input
                value={val}
                onChange={(e) => updateHeaderValue(key, e.target.value)}
                placeholder="Header value"
                className="flex-1"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeHeader(key)}
                disabled={disabled}
                className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addHeader}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Header
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Body (JSON)</Label>
        <Textarea
          value={bodyString}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder={'{\n  "event": "{{event.type}}",\n  "deal": "{{deal.id}}"\n}'}
          rows={6}
          className="font-mono text-sm"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{{deal.id}}'}, {'{{organisation.name}}'}, etc. for dynamic values
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE TICKET CONFIG FORM
// ============================================================================

interface CreateTicketConfigFormProps {
  value: Partial<CreateTicketConfig>;
  onChange: (config: Partial<CreateTicketConfig>) => void;
  disabled?: boolean;
}

export function CreateTicketConfigForm({
  value,
  onChange,
  disabled,
}: CreateTicketConfigFormProps) {
  const update = (updates: Partial<CreateTicketConfig>) => {
    onChange({ ...value, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ticket Title</Label>
        <Input
          value={value.titleTemplate || ''}
          onChange={(e) => update({ titleTemplate: e.target.value })}
          placeholder="e.g. Support request: {{deal.title}}"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{{deal.title}}'}, {'{{organisation.name}}'}, etc. for dynamic values
        </p>
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={value.descriptionTemplate || ''}
          onChange={(e) => update({ descriptionTemplate: e.target.value })}
          placeholder="Ticket description..."
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ticket Type</Label>
          <Select
            value={value.ticketType || ''}
            onValueChange={(v) => update({ ticketType: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {ENUM_OPTIONS.TicketType.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={value.priority || 'MEDIUM'}
            onValueChange={(v) => update({ priority: v as CreateTicketConfig['priority'] })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENUM_OPTIONS.TicketPriority.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
