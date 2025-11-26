import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface TextFieldFilterProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function TextFieldFilter({
  label,
  value,
  onValueChange,
  placeholder = 'Search...'
}: TextFieldFilterProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Partial match (case-insensitive)
      </p>
    </div>
  );
}
