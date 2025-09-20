"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface ColorOption {
  value: string;
  label: string;
  category?: string;
}

// Professional color palette inspired by Airtable and other premium tools
export const STAGE_COLORS: ColorOption[] = [
  // Grays
  { value: "#6B7280", label: "Gray", category: "Neutral" },
  { value: "#4B5563", label: "Dark Gray", category: "Neutral" },
  { value: "#9CA3AF", label: "Light Gray", category: "Neutral" },

  // Blues
  { value: "#3B82F6", label: "Blue", category: "Primary" },
  { value: "#2563EB", label: "Dark Blue", category: "Primary" },
  { value: "#60A5FA", label: "Light Blue", category: "Primary" },
  { value: "#0EA5E9", label: "Sky Blue", category: "Primary" },

  // Greens
  { value: "#10B981", label: "Green", category: "Success" },
  { value: "#059669", label: "Dark Green", category: "Success" },
  { value: "#34D399", label: "Light Green", category: "Success" },
  { value: "#84CC16", label: "Lime", category: "Success" },

  // Purples
  { value: "#8B5CF6", label: "Purple", category: "Creative" },
  { value: "#7C3AED", label: "Dark Purple", category: "Creative" },
  { value: "#A78BFA", label: "Light Purple", category: "Creative" },
  { value: "#EC4899", label: "Pink", category: "Creative" },

  // Oranges & Yellows
  { value: "#F59E0B", label: "Amber", category: "Warning" },
  { value: "#F97316", label: "Orange", category: "Warning" },
  { value: "#FCD34D", label: "Yellow", category: "Warning" },
  { value: "#FB923C", label: "Light Orange", category: "Warning" },

  // Reds
  { value: "#EF4444", label: "Red", category: "Danger" },
  { value: "#DC2626", label: "Dark Red", category: "Danger" },
  { value: "#F87171", label: "Light Red", category: "Danger" },

  // Teals & Cyans
  { value: "#14B8A6", label: "Teal", category: "Info" },
  { value: "#06B6D4", label: "Cyan", category: "Info" },
  { value: "#0891B2", label: "Dark Cyan", category: "Info" },
];

interface ColorPaletteProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
  showLabels?: boolean;
}

export function ColorPalette({
  value,
  onChange,
  className,
  showLabels = false,
}: ColorPaletteProps) {
  const categories = Array.from(new Set(STAGE_COLORS.map(c => c.category).filter(Boolean)));

  return (
    <div className={cn("space-y-3", className)}>
      {categories.map((category) => (
        <div key={category} className="space-y-2">
          {showLabels && (
            <div className="text-xs font-medium text-muted-foreground">
              {category}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {STAGE_COLORS.filter(color => color.category === category).map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => onChange(color.value)}
                className={cn(
                  "w-8 h-8 rounded-md border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400",
                  value === color.value
                    ? "border-gray-900 shadow-md"
                    : "border-transparent"
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
                aria-label={`Select ${color.label}`}
              >
                {value === color.value && (
                  <Check className="w-4 h-4 text-white m-auto drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface InlineColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  onClose?: () => void;
  className?: string;
}

export function InlineColorPicker({
  value,
  onChange,
  onClose,
  className,
}: InlineColorPickerProps) {
  return (
    <div className={cn(
      "absolute z-50 bg-white rounded-lg shadow-lg border p-3 min-w-[280px]",
      className
    )}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">Choose a color</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
      <ColorPalette
        value={value}
        onChange={(color) => {
          onChange(color);
          onClose?.();
        }}
        showLabels={true}
      />
    </div>
  );
}

// Compact color selector for forms
interface ColorSelectorProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
  label?: string;
}

export function ColorSelector({
  value,
  onChange,
  className,
  label = "Color"
}: ColorSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedColor = STAGE_COLORS.find(c => c.value === value);

  return (
    <div className={cn("relative", className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 w-full"
      >
        <div
          className="w-5 h-5 rounded border border-gray-300"
          style={{ backgroundColor: value || '#6B7280' }}
        />
        <span className="text-sm">
          {selectedColor?.label || "Select color"}
        </span>
      </button>

      {isOpen && (
        <InlineColorPicker
          value={value}
          onChange={onChange}
          onClose={() => setIsOpen(false)}
          className="top-full mt-2"
        />
      )}
    </div>
  );
}