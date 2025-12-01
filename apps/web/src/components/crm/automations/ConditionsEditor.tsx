'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import type { AutomationConditionGroup, AutomationCondition } from '@united-cars/crm-automation';
import {
  CONDITION_OPERATOR_LABELS,
  createDefaultCondition,
  createDefaultConditionGroup,
  ConditionOperator,
  LogicalOperator,
  EntityType,
  getFieldMetadata,
  getFieldsForEntity,
  getDefaultFieldMetadata,
  ENUM_OPTIONS,
  type FieldMetadata,
  type FieldOption,
  type FieldOptionSource,
} from './types';

interface ConditionsEditorProps {
  value: AutomationConditionGroup[];
  onChange: (groups: AutomationConditionGroup[]) => void;
  entityType?: EntityType;
  disabled?: boolean;
}

// ============================================================================
// useFieldOptions Hook - Load options based on option source
// ============================================================================

function useFieldOptions(optionSource: FieldOptionSource | undefined): {
  options: FieldOption[];
  loading: boolean;
} {
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!optionSource || optionSource.type === 'none') {
      setOptions([]);
      return;
    }

    if (optionSource.type === 'static') {
      setOptions(optionSource.options);
      return;
    }

    if (optionSource.type === 'enum') {
      setOptions(ENUM_OPTIONS[optionSource.enumName] || []);
      return;
    }

    if (optionSource.type === 'api') {
      setLoading(true);
      loadApiOptions(optionSource.resource)
        .then(setOptions)
        .finally(() => setLoading(false));
    }
  }, [optionSource?.type, optionSource?.type === 'enum' ? optionSource.enumName : null, optionSource?.type === 'api' ? optionSource.resource : null]);

  return { options, loading };
}

async function loadApiOptions(resource: 'pipelines' | 'stages' | 'users'): Promise<FieldOption[]> {
  try {
    switch (resource) {
      case 'pipelines': {
        const response = await fetch('/api/crm/pipelines');
        if (!response.ok) return [];
        const pipelines = await response.json();
        return pipelines.map((p: any) => ({ value: p.id, label: p.name }));
      }
      case 'stages': {
        const response = await fetch('/api/crm/pipelines');
        if (!response.ok) return [];
        const pipelines = await response.json();
        return pipelines.flatMap((p: any) =>
          (p.stages || []).map((s: any) => ({
            value: s.id,
            label: `${p.name} → ${s.name}`,
          }))
        );
      }
      case 'users': {
        const response = await fetch('/api/crm/users');
        if (!response.ok) return [];
        const users = await response.json();
        return users.map((u: any) => ({
          value: u.id,
          label: u.name || u.email,
        }));
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}

export function ConditionsEditor({
  value,
  onChange,
  entityType,
  disabled,
}: ConditionsEditorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(value.map((g) => g.id))
  );

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const addConditionGroup = () => {
    const newGroup = createDefaultConditionGroup();
    setExpandedGroups(new Set([...expandedGroups, newGroup.id]));
    onChange([...value, newGroup]);
  };

  const removeConditionGroup = (groupId: string) => {
    onChange(value.filter((g) => g.id !== groupId));
  };

  const updateConditionGroup = (
    groupId: string,
    updates: Partial<AutomationConditionGroup>
  ) => {
    onChange(
      value.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  };

  const addCondition = (groupId: string) => {
    onChange(
      value.map((g) =>
        g.id === groupId
          ? { ...g, conditions: [...g.conditions, createDefaultCondition()] }
          : g
      )
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    onChange(
      value.map((g) =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) }
          : g
      )
    );
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<AutomationCondition>
  ) => {
    onChange(
      value.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...updates } : c
              ),
            }
          : g
      )
    );
  };

  // Get available fields for the entity type
  const availableFields = getFieldsForEntity(entityType);

  if (value.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-3">
          No conditions defined. The workflow will run on every matching event.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addConditionGroup}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Condition Group
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {value.map((group, groupIndex) => (
        <div key={group.id}>
          {/* AND/OR connector between groups */}
          {groupIndex > 0 && (
            <div className="flex items-center justify-center my-2">
              <Select
                value={value[groupIndex - 1].logicalOperator}
                onValueChange={(op) =>
                  updateConditionGroup(value[groupIndex - 1].id, {
                    logicalOperator: op as LogicalOperator,
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LogicalOperator.AND}>AND</SelectItem>
                  <SelectItem value={LogicalOperator.OR}>OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Card>
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleGroupExpanded(group.id)}
            >
              <div className="flex items-center gap-2">
                {expandedGroups.has(group.id) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  Condition Group {groupIndex + 1}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeConditionGroup(group.id);
                }}
                disabled={disabled}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {expandedGroups.has(group.id) && (
              <CardContent className="pt-0 pb-3">
                <div className="space-y-3">
                  {group.conditions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No conditions in this group
                    </p>
                  ) : (
                    group.conditions.map((condition, condIndex) => (
                      <ConditionRow
                        key={condition.id}
                        condition={condition}
                        onChange={(updates) =>
                          updateCondition(group.id, condition.id, updates)
                        }
                        onRemove={() => removeCondition(group.id, condition.id)}
                        availableFields={availableFields}
                        disabled={disabled}
                        showAndLabel={condIndex > 0}
                      />
                    ))
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addCondition(group.id)}
                    disabled={disabled}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addConditionGroup}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Condition Group
      </Button>
    </div>
  );
}

// ============================================================================
// Condition Row Component
// ============================================================================

interface ConditionRowProps {
  condition: AutomationCondition;
  onChange: (updates: Partial<AutomationCondition>) => void;
  onRemove: () => void;
  availableFields: FieldMetadata[];
  disabled?: boolean;
  showAndLabel?: boolean;
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
  availableFields,
  disabled,
  showAndLabel,
}: ConditionRowProps) {
  // Get field metadata for the selected field
  const fieldMetadata = getFieldMetadata(condition.field);

  // If field not in registry, use default metadata for backwards compatibility
  const effectiveMetadata = fieldMetadata || (condition.field ? getDefaultFieldMetadata(condition.field) : undefined);

  // Get allowed operators for this field
  const allowedOperators = effectiveMetadata?.allowedOperators || Object.values(ConditionOperator);

  // Handle field change - reset operator and value if field type changes
  const handleFieldChange = (newField: string) => {
    const newMetadata = getFieldMetadata(newField);
    const currentOperatorAllowed = newMetadata?.allowedOperators.includes(condition.operator);

    if (newMetadata && !currentOperatorAllowed) {
      // Reset to first allowed operator if current isn't valid
      onChange({
        field: newField,
        operator: newMetadata.allowedOperators[0],
        value: undefined,
      });
    } else {
      onChange({ field: newField });
    }
  };

  // Handle operator change - reset value for certain operator changes
  const handleOperatorChange = (newOperator: ConditionOperator) => {
    const isMultiOld = [ConditionOperator.IN, ConditionOperator.NOT_IN].includes(condition.operator);
    const isMultiNew = [ConditionOperator.IN, ConditionOperator.NOT_IN].includes(newOperator);

    // Reset value when switching between single and multi-select operators
    if (isMultiOld !== isMultiNew) {
      onChange({ operator: newOperator, value: undefined });
    } else {
      onChange({ operator: newOperator });
    }
  };

  // Operators that don't need a value input
  const noValueOperators = [ConditionOperator.IS_EMPTY, ConditionOperator.IS_NOT_EMPTY];
  const needsValue = !noValueOperators.includes(condition.operator);
  const isMultiOperator = [ConditionOperator.IN, ConditionOperator.NOT_IN].includes(condition.operator);

  return (
    <div className="space-y-2">
      {showAndLabel && (
        <div className="text-xs text-muted-foreground text-center">AND</div>
      )}
      <div className="flex items-start gap-2">
        {/* Field Select */}
        <div className="flex-1 min-w-0">
          <FieldSelect
            value={condition.field}
            onChange={handleFieldChange}
            availableFields={availableFields}
            disabled={disabled}
          />
        </div>

        {/* Operator Select */}
        <Select
          value={condition.operator}
          onValueChange={(op) => handleOperatorChange(op as ConditionOperator)}
          disabled={disabled}
        >
          <SelectTrigger className="w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedOperators.map((op) => (
              <SelectItem key={op} value={op}>
                {CONDITION_OPERATOR_LABELS[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Control */}
        {needsValue && (
          <ValueControl
            condition={condition}
            fieldMetadata={effectiveMetadata}
            isMulti={isMultiOperator}
            onChange={onChange}
            disabled={disabled}
          />
        )}

        {/* Remove button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Field Select Component - Shows available fields with labels
// ============================================================================

interface FieldSelectProps {
  value: string;
  onChange: (field: string) => void;
  availableFields: FieldMetadata[];
  disabled?: boolean;
}

function FieldSelect({ value, onChange, availableFields, disabled }: FieldSelectProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Check if current value is in the available fields
  const isKnownField = availableFields.some((f) => f.path === value);
  const showCustomInput = isCustom || (!isKnownField && value);

  // Get label for current value
  const currentField = availableFields.find((f) => f.path === value);
  const displayLabel = currentField?.label || value;

  if (showCustomInput) {
    return (
      <div className="flex gap-1">
        <Input
          value={isCustom ? customValue : value}
          onChange={(e) => {
            if (isCustom) {
              setCustomValue(e.target.value);
            }
            onChange(e.target.value);
          }}
          placeholder="e.g. deal.customField"
          className="text-sm"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsCustom(false);
            setCustomValue('');
            onChange('');
          }}
          disabled={disabled}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value || '__placeholder__'}
      onValueChange={(v) => {
        if (v === '__custom__') {
          setIsCustom(true);
          setCustomValue('');
        } else if (v !== '__placeholder__') {
          onChange(v);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className="text-sm">
        <SelectValue placeholder="Select field...">
          {value ? displayLabel : 'Select field...'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableFields.map((field) => (
          <SelectItem key={field.path} value={field.path}>
            {field.label}
          </SelectItem>
        ))}
        <SelectItem value="__custom__" className="text-muted-foreground">
          Custom field...
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Value Control Component - Renders appropriate control based on field type
// ============================================================================

interface ValueControlProps {
  condition: AutomationCondition;
  fieldMetadata: FieldMetadata | undefined;
  isMulti: boolean;
  onChange: (updates: Partial<AutomationCondition>) => void;
  disabled?: boolean;
}

function ValueControl({
  condition,
  fieldMetadata,
  isMulti,
  onChange,
  disabled,
}: ValueControlProps) {
  const { options, loading } = useFieldOptions(fieldMetadata?.optionSource);

  // No metadata or no options - use text input
  if (!fieldMetadata || fieldMetadata.optionSource.type === 'none') {
    if (fieldMetadata?.control === 'number') {
      return (
        <Input
          type="number"
          value={condition.value?.toString() || ''}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            onChange({ value: isNaN(num) ? e.target.value : num });
          }}
          placeholder="Value"
          className="w-32 text-sm"
          disabled={disabled}
        />
      );
    }

    if (fieldMetadata?.control === 'checkbox') {
      return (
        <div className="flex items-center h-9 px-3">
          <Checkbox
            checked={condition.value === true || condition.value === 'true'}
            onCheckedChange={(checked) => onChange({ value: checked })}
            disabled={disabled}
          />
        </div>
      );
    }

    return (
      <Input
        value={condition.value?.toString() || ''}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder="Value"
        className="w-32 text-sm"
        disabled={disabled}
      />
    );
  }

  // Has options - use select or multi-select
  if (loading) {
    return (
      <div className="w-32 h-9 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isMulti) {
    return (
      <MultiSelectValue
        value={Array.isArray(condition.value) ? condition.value : []}
        options={options}
        onChange={(values) => onChange({ value: values })}
        disabled={disabled}
      />
    );
  }

  return (
    <SingleSelectValue
      value={condition.value?.toString() || ''}
      options={options}
      onChange={(v) => onChange({ value: v })}
      disabled={disabled}
    />
  );
}

// ============================================================================
// Single Select Value Component
// ============================================================================

interface SingleSelectValueProps {
  value: string;
  options: FieldOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function SingleSelectValue({ value, options, onChange, disabled }: SingleSelectValueProps) {
  const currentOption = options.find((o) => o.value === value);

  return (
    <Select
      value={value || '__placeholder__'}
      onValueChange={(v) => v !== '__placeholder__' && onChange(v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-40 text-sm">
        <SelectValue placeholder="Select...">
          {currentOption?.label || value || 'Select...'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Multi Select Value Component
// ============================================================================

interface MultiSelectValueProps {
  value: string[];
  options: FieldOption[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

function MultiSelectValue({ value, options, onChange, disabled }: MultiSelectValueProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const getLabels = () => {
    if (value.length === 0) return 'Select...';
    if (value.length <= 2) {
      return value
        .map((v) => options.find((o) => o.value === v)?.label || v)
        .join(', ');
    }
    return `${value.length} selected`;
  };

  return (
    <div className="relative w-40">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full h-9 justify-between text-sm font-normal"
      >
        <span className="truncate">{getLabels()}</span>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => toggleValue(option.value)}
                  disabled={disabled}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
