"use client";

import * as React from "react";

export interface Country {
  code: string;
  name: string;
}

interface CountrySelectProps {
  value?: string; // Country code
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  countries: Country[];
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country...",
  disabled = false,
  className,
  countries,
}: CountrySelectProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    onValueChange?.(newValue === "" ? "" : newValue);
  };

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      disabled={disabled}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
    >
      <option value="">
        {placeholder}
      </option>
      {countries?.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
}