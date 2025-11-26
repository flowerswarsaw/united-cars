import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateFieldFilterProps {
  label: string;
  from?: string;
  to?: string;
  onFromChange: (value: string | undefined) => void;
  onToChange: (value: string | undefined) => void;
}

export function DateFieldFilter({
  label,
  from,
  to,
  onFromChange,
  onToChange
}: DateFieldFilterProps) {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFromChange(value || undefined);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onToChange(value || undefined);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={from ?? ''}
            onChange={handleFromChange}
            className="w-full mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={to ?? ''}
            onChange={handleToChange}
            className="w-full mt-1"
          />
        </div>
      </div>
      {(from || to) && (
        <p className="text-xs text-muted-foreground">
          {from && to
            ? `${from} to ${to}`
            : from
            ? `From ${from}`
            : `Until ${to}`}
        </p>
      )}
    </div>
  );
}
