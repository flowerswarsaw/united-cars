import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberFieldFilterProps {
  label: string;
  min?: number;
  max?: number;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
}

export function NumberFieldFilter({
  label,
  min,
  max,
  onMinChange,
  onMaxChange
}: NumberFieldFilterProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onMinChange(undefined);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        onMinChange(num);
      }
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onMaxChange(undefined);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        onMaxChange(num);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            type="number"
            placeholder="Min"
            value={min ?? ''}
            onChange={handleMinChange}
            className="w-full"
          />
        </div>
        <div>
          <Input
            type="number"
            placeholder="Max"
            value={max ?? ''}
            onChange={handleMaxChange}
            className="w-full"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {min !== undefined && max !== undefined
          ? `Range: ${min} - ${max}`
          : min !== undefined
          ? `Min: ${min}`
          : max !== undefined
          ? `Max: ${max}`
          : 'No range set'}
      </p>
    </div>
  );
}
