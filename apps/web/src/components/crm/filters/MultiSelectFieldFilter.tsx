import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MultiSelectFieldFilterProps {
  label: string;
  values: string[];
  options: string[];
  matchMode: 'ANY' | 'ALL';
  onValuesChange: (values: string[]) => void;
  onMatchModeChange: (mode: 'ANY' | 'ALL') => void;
}

export function MultiSelectFieldFilter({
  label,
  values,
  options,
  matchMode,
  onValuesChange,
  onMatchModeChange
}: MultiSelectFieldFilterProps) {
  const handleToggle = (option: string) => {
    if (values.includes(option)) {
      onValuesChange(values.filter(v => v !== option));
    } else {
      onValuesChange([...values, option]);
    }
  };

  const selectedCount = values.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {selectedCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedCount} selected
          </Badge>
        )}
      </div>

      {/* Options checkboxes */}
      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${label}-${option}`}
              checked={values.includes(option)}
              onCheckedChange={() => handleToggle(option)}
            />
            <label
              htmlFor={`${label}-${option}`}
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {option}
            </label>
          </div>
        ))}
      </div>

      {/* ANY/ALL toggle - only show if at least one option is selected */}
      {selectedCount > 1 && (
        <div className="pt-2 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">Match Mode</Label>
          <RadioGroup value={matchMode} onValueChange={(value) => onMatchModeChange(value as 'ANY' | 'ALL')} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ANY" id={`${label}-any`} />
              <Label htmlFor={`${label}-any`} className="text-sm font-normal cursor-pointer">
                ANY (at least one)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ALL" id={`${label}-all`} />
              <Label htmlFor={`${label}-all`} className="text-sm font-normal cursor-pointer">
                ALL (must have all)
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
