import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BooleanFieldFilterProps {
  label: string;
  value: boolean | null;
  onValueChange: (value: boolean | null) => void;
}

export function BooleanFieldFilter({
  label,
  value,
  onValueChange
}: BooleanFieldFilterProps) {
  const handleChange = (stringValue: string) => {
    if (stringValue === 'any') {
      onValueChange(null);
    } else if (stringValue === 'true') {
      onValueChange(true);
    } else {
      onValueChange(false);
    }
  };

  const currentValue = value === null ? 'any' : value ? 'true' : 'false';

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup value={currentValue} onValueChange={handleChange} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="any" id={`${label}-any`} />
          <Label htmlFor={`${label}-any`} className="text-sm font-normal cursor-pointer">
            Any
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="true" id={`${label}-yes`} />
          <Label htmlFor={`${label}-yes`} className="text-sm font-normal cursor-pointer">
            Yes
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="false" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`} className="text-sm font-normal cursor-pointer">
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
