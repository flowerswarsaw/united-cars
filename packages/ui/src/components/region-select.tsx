"use client";

import * as React from "react";

export interface Region {
  code: string;
  name: string;
}

interface RegionSelectProps {
  value?: string; // Region code or custom text
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  regions: Region[];
  allowCustom?: boolean; // Allow custom text input for regions
  customPlaceholder?: string;
}

export function RegionSelect({
  value,
  onValueChange,
  placeholder = "Select region/state...",
  disabled = false,
  className,
  regions,
  allowCustom = true,
  customPlaceholder = "Enter region/state...",
}: RegionSelectProps) {
  const [isCustomMode, setIsCustomMode] = React.useState(false);

  // Check if current value is in the regions list
  const selectedRegion = React.useMemo(() => {
    return regions.find(region => region.code === value);
  }, [regions, value]);

  // If value exists but no region matches, assume it's custom text
  React.useEffect(() => {
    if (value && !selectedRegion && regions.length > 0) {
      setIsCustomMode(true);
    } else if (!value || selectedRegion) {
      setIsCustomMode(false);
    }
  }, [value, selectedRegion, regions.length]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;

    if (newValue === "__custom__") {
      setIsCustomMode(true);
      onValueChange?.("");
    } else {
      setIsCustomMode(false);
      onValueChange?.(newValue === "" ? "" : newValue);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(event.target.value);
  };

  const handleInputBlur = () => {
    // If input is empty and we have predefined regions, switch back to select
    if (!value && regions.length > 0) {
      setIsCustomMode(false);
    }
  };

  // If no predefined regions available, always show text input
  if (regions.length === 0 || isCustomMode) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value || ""}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={customPlaceholder}
          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
        />
        {allowCustom && regions.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            Select
          </button>
        )}
      </div>
    );
  }

  return (
    <select
      value={selectedRegion ? selectedRegion.code : ""}
      onChange={handleSelectChange}
      disabled={disabled}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
    >
      <option value="">
        {placeholder}
      </option>
      {regions.map((region) => (
        <option key={region.code} value={region.code}>
          {region.name}
        </option>
      ))}
      {allowCustom && (
        <option value="__custom__">
          Custom region/state...
        </option>
      )}
    </select>
  );
}