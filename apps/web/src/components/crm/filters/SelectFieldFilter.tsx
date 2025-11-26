import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectFieldFilterProps {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function SelectFieldFilter({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select...'
}: SelectFieldFilterProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
