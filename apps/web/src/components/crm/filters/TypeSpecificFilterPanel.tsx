import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrganizationType, CustomFieldType } from '@united-cars/crm-core';
import { ORGANIZATION_TYPE_CONFIGS } from '@united-cars/crm-core';
import { SelectFieldFilter } from './SelectFieldFilter';
import { MultiSelectFieldFilter } from './MultiSelectFieldFilter';
import { NumberFieldFilter } from './NumberFieldFilter';
import { TextFieldFilter } from './TextFieldFilter';
import { DateFieldFilter } from './DateFieldFilter';
import { BooleanFieldFilter } from './BooleanFieldFilter';

export interface TypeSpecificFilterValue {
  // For SELECT, TEXT
  value?: string;

  // For MULTISELECT
  values?: string[];
  matchMode?: 'ANY' | 'ALL';

  // For NUMBER
  min?: number;
  max?: number;

  // For DATE
  from?: string;
  to?: string;

  // For BOOLEAN
  boolValue?: boolean | null;
}

interface TypeSpecificFilterPanelProps {
  organizationType: OrganizationType | null;
  pendingFilters: Record<string, TypeSpecificFilterValue>;
  onFilterChange: (fieldKey: string, value: TypeSpecificFilterValue) => void;
  onApply: () => void;
  onClear: () => void;
  hasUnappliedChanges: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TypeSpecificFilterPanel({
  organizationType,
  pendingFilters,
  onFilterChange,
  onApply,
  onClear,
  hasUnappliedChanges,
  isExpanded,
  onToggle
}: TypeSpecificFilterPanelProps) {
  // Get type-specific fields for the selected organization type
  const getFilterableFields = () => {
    if (!organizationType) return [];

    const config = ORGANIZATION_TYPE_CONFIGS[organizationType];
    if (!config || !config.customFields) return [];

    // Filter out JSON fields (too complex to filter)
    return config.customFields
      .filter(field => field.type !== CustomFieldType.JSON)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const filterableFields = getFilterableFields();
  const activeFilterCount = Object.keys(pendingFilters).length;

  // Don't show if no organization type selected
  if (!organizationType) {
    return null;
  }

  // Don't show if no filterable fields
  if (filterableFields.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            Advanced Filters
          </span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0 font-semibold"
            >
              {activeFilterCount}
            </Badge>
          )}
          {hasUnappliedChanges && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Unapplied changes" />
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            {filterableFields.map((field) => {
              const filterValue = pendingFilters[field.key] || {};

              // Render appropriate filter component based on field type
              switch (field.type) {
                case CustomFieldType.SELECT:
                  return (
                    <SelectFieldFilter
                      key={field.key}
                      label={field.name}
                      value={filterValue.value || ''}
                      options={field.options || []}
                      onValueChange={(value) =>
                        onFilterChange(field.key, { value })
                      }
                      placeholder={`Select ${field.name.toLowerCase()}...`}
                    />
                  );

                case CustomFieldType.MULTISELECT:
                  return (
                    <MultiSelectFieldFilter
                      key={field.key}
                      label={field.name}
                      values={filterValue.values || []}
                      options={field.options || []}
                      matchMode={filterValue.matchMode || 'ANY'}
                      onValuesChange={(values) =>
                        onFilterChange(field.key, {
                          ...filterValue,
                          values
                        })
                      }
                      onMatchModeChange={(matchMode) =>
                        onFilterChange(field.key, {
                          ...filterValue,
                          matchMode
                        })
                      }
                    />
                  );

                case CustomFieldType.NUMBER:
                  return (
                    <NumberFieldFilter
                      key={field.key}
                      label={field.name}
                      min={filterValue.min}
                      max={filterValue.max}
                      onMinChange={(min) =>
                        onFilterChange(field.key, {
                          ...filterValue,
                          min
                        })
                      }
                      onMaxChange={(max) =>
                        onFilterChange(field.key, {
                          ...filterValue,
                          max
                        })
                      }
                    />
                  );

                case CustomFieldType.TEXT:
                  return (
                    <TextFieldFilter
                      key={field.key}
                      label={field.name}
                      value={filterValue.value || ''}
                      onValueChange={(value) =>
                        onFilterChange(field.key, { value })
                      }
                      placeholder={`Search ${field.name.toLowerCase()}...`}
                    />
                  );

                case CustomFieldType.DATE:
                  return (
                    <DateFieldFilter
                      key={field.key}
                      label={field.name}
                      from={filterValue.from}
                      to={filterValue.to}
                      onFromChange={(from) =>
                        onFilterChange(field.key, {
                          ...filterValue,
                          from
                        })
                      }
                      onToChange={(to) =>
                        onFilterChange(field.key, {
                          ...filterValue,
                          to
                        })
                      }
                    />
                  );

                case CustomFieldType.BOOLEAN:
                  return (
                    <BooleanFieldFilter
                      key={field.key}
                      label={field.name}
                      value={filterValue.boolValue !== undefined ? filterValue.boolValue : null}
                      onValueChange={(boolValue) =>
                        onFilterChange(field.key, { boolValue })
                      }
                    />
                  );

                default:
                  return null;
              }
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between px-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {hasUnappliedChanges
                ? 'You have unapplied changes'
                : activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} applied`
                  : 'No advanced filters applied'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={activeFilterCount === 0}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onApply}
                disabled={!hasUnappliedChanges}
                className={hasUnappliedChanges ? 'bg-primary hover:bg-primary/90' : ''}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
