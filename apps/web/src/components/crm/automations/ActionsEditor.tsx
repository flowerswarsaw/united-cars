'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ListTodo,
  FileText,
  RefreshCw,
  Webhook,
  Ticket,
} from 'lucide-react';
import {
  DraftAction,
  ACTION_TYPE_LABELS,
  ActionType,
  createDefaultAction,
} from './types';
import {
  CreateTaskConfigForm,
  CreateDealConfigForm,
  UpdateRecordConfigForm,
  CallWebhookConfigForm,
  CreateTicketConfigForm,
} from './ActionConfigForms';
import type { ActionConfig } from '@united-cars/crm-automation';

interface ActionsEditorProps {
  value: DraftAction[];
  onChange: (actions: DraftAction[]) => void;
  disabled?: boolean;
}

// Supported action types for the UI
const SUPPORTED_ACTION_TYPES = [
  ActionType.CREATE_TASK,
  ActionType.CREATE_DEAL,
  ActionType.UPDATE_RECORD,
  ActionType.CALL_WEBHOOK,
  ActionType.CREATE_TICKET,
];

// Icons for each action type
const ACTION_ICONS: Record<string, React.ElementType> = {
  [ActionType.CREATE_TASK]: ListTodo,
  [ActionType.CREATE_DEAL]: FileText,
  [ActionType.UPDATE_RECORD]: RefreshCw,
  [ActionType.CALL_WEBHOOK]: Webhook,
  [ActionType.CREATE_TICKET]: Ticket,
};

export function ActionsEditor({ value, onChange, disabled }: ActionsEditorProps) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  const toggleExpanded = (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedActions(newExpanded);
  };

  const addAction = (type: ActionType) => {
    const newAction = createDefaultAction(type);
    newAction.order = value.length + 1;
    setExpandedActions(new Set([...expandedActions, newAction.id]));
    onChange([...value, newAction]);
  };

  const removeAction = (actionId: string) => {
    const newActions = value.filter((a) => a.id !== actionId);
    // Reorder remaining actions
    onChange(newActions.map((a, i) => ({ ...a, order: i + 1 })));
  };

  const updateAction = (actionId: string, updates: Partial<DraftAction>) => {
    onChange(value.map((a) => (a.id === actionId ? { ...a, ...updates } : a)));
  };

  const updateActionConfig = (actionId: string, config: Partial<ActionConfig>) => {
    onChange(
      value.map((a) =>
        a.id === actionId ? { ...a, config: { ...a.config, ...config } } : a
      )
    );
  };

  const moveAction = (actionId: string, direction: 'up' | 'down') => {
    const index = value.findIndex((a) => a.id === actionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= value.length) return;

    const newActions = [...value];
    [newActions[index], newActions[newIndex]] = [newActions[newIndex], newActions[index]];

    // Update order numbers
    onChange(newActions.map((a, i) => ({ ...a, order: i + 1 })));
  };

  const getActionSummary = (action: DraftAction): string => {
    const config = action.config;
    switch (action.type) {
      case ActionType.CREATE_TASK:
        return (config as any)?.titleTemplate || 'Create a task';
      case ActionType.CREATE_DEAL:
        return 'Create a new deal in pipeline';
      case ActionType.UPDATE_RECORD:
        const fieldCount = Object.keys((config as any)?.fields || {}).length;
        return `Update ${fieldCount} field${fieldCount !== 1 ? 's' : ''}`;
      case ActionType.CALL_WEBHOOK:
        return (config as any)?.url || 'Call external webhook';
      case ActionType.CREATE_TICKET:
        return (config as any)?.titleTemplate || 'Create a ticket';
      default:
        return 'Configure action';
    }
  };

  if (value.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-3">
          No actions defined. Add actions to perform when the workflow runs.
        </p>
        <ActionTypeSelector onSelect={addAction} disabled={disabled} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {value.map((action, index) => {
        const Icon = ACTION_ICONS[action.type] || ListTodo;
        const isExpanded = expandedActions.has(action.id);

        return (
          <Card key={action.id}>
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleExpanded(action.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="h-6 w-6 p-0 justify-center">
                    {index + 1}
                  </Badge>
                </div>
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {ACTION_TYPE_LABELS[action.type] || action.type}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {getActionSummary(action)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Move buttons */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveAction(action.id, 'up');
                  }}
                  disabled={disabled || index === 0}
                  className="h-7 w-7 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveAction(action.id, 'down');
                  }}
                  disabled={disabled || index === value.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                {/* Delete button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAction(action.id);
                  }}
                  disabled={disabled}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {/* Expand/collapse */}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                )}
              </div>
            </div>

            {isExpanded && (
              <CardContent className="pt-0 pb-4 border-t">
                <div className="pt-4">
                  <ActionConfigRenderer
                    action={action}
                    onChange={(config) => updateActionConfig(action.id, config)}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      <ActionTypeSelector onSelect={addAction} disabled={disabled} />
    </div>
  );
}

// ============================================================================
// Action Type Selector
// ============================================================================

interface ActionTypeSelectorProps {
  onSelect: (type: ActionType) => void;
  disabled?: boolean;
}

function ActionTypeSelector({ onSelect, disabled }: ActionTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Action
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg overflow-hidden">
            {SUPPORTED_ACTION_TYPES.map((type) => {
              const Icon = ACTION_ICONS[type] || ListTodo;
              return (
                <button
                  key={type}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
                  onClick={() => {
                    onSelect(type);
                    setIsOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ACTION_TYPE_LABELS[type]}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Action Config Renderer
// ============================================================================

interface ActionConfigRendererProps {
  action: DraftAction;
  onChange: (config: Partial<ActionConfig>) => void;
  disabled?: boolean;
}

function ActionConfigRenderer({
  action,
  onChange,
  disabled,
}: ActionConfigRendererProps) {
  switch (action.type) {
    case ActionType.CREATE_TASK:
      return (
        <CreateTaskConfigForm
          value={action.config as any}
          onChange={onChange as any}
          disabled={disabled}
        />
      );
    case ActionType.CREATE_DEAL:
      return (
        <CreateDealConfigForm
          value={action.config as any}
          onChange={onChange as any}
          disabled={disabled}
        />
      );
    case ActionType.UPDATE_RECORD:
      return (
        <UpdateRecordConfigForm
          value={action.config as any}
          onChange={onChange as any}
          disabled={disabled}
        />
      );
    case ActionType.CALL_WEBHOOK:
      return (
        <CallWebhookConfigForm
          value={action.config as any}
          onChange={onChange as any}
          disabled={disabled}
        />
      );
    case ActionType.CREATE_TICKET:
      return (
        <CreateTicketConfigForm
          value={action.config as any}
          onChange={onChange as any}
          disabled={disabled}
        />
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          No configuration available for this action type.
        </p>
      );
  }
}
