"use client";

import * as React from "react";

interface CitySelectProps {
  value?: string; // City name or custom text
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  cities: string[];
  allowCustom?: boolean; // Allow custom text input for cities
  customPlaceholder?: string;
}

export function CitySelect({
  value,
  onValueChange,
  placeholder = "Select city...",
  disabled = false,
  className,
  cities,
  allowCustom = true,
  customPlaceholder = "Enter city...",
}: CitySelectProps) {
  const [isCustomMode, setIsCustomMode] = React.useState(false);

  // Check if current value is in the cities list
  const selectedCity = React.useMemo(() => {
    return cities?.find(city => city === value);
  }, [cities, value]);

  // If value exists but no city matches, assume it's custom text
  React.useEffect(() => {
    if (value && !selectedCity && cities && cities.length > 0) {
      setIsCustomMode(true);
    } else if (!value || selectedCity) {
      setIsCustomMode(false);
    }
  }, [value, selectedCity, cities]);

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
    // If input is empty and we have predefined cities, switch back to select
    if (!value && cities && cities.length > 0) {
      setIsCustomMode(false);
    }
  };

  // If no predefined cities available, always show text input
  if (!cities || cities.length === 0 || isCustomMode) {
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
        {allowCustom && cities && cities.length > 0 && (
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
      value={selectedCity || ""}
      onChange={handleSelectChange}
      disabled={disabled}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
    >
      <option value="">
        {placeholder}
      </option>
      {cities?.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
      {allowCustom && (
        <option value="__custom__">
          Custom city...
        </option>
      )}
    </select>
  );
}