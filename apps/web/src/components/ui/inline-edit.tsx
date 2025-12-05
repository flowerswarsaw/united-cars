'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Pencil } from 'lucide-react';
import { Button } from './button';

/**
 * InlineEdit - A reusable component for inline editing of text values
 *
 * Features:
 * - Click to edit or use the pencil icon
 * - Enter to save, Escape to cancel
 * - Visual feedback during editing
 * - Optional validation
 * - Loading state support
 */

export interface InlineEditProps {
  /** Current value */
  value: string;
  /** Called when value is saved */
  onSave: (value: string) => void | Promise<void>;
  /** Placeholder when value is empty */
  placeholder?: string;
  /** Additional CSS classes for the display text */
  className?: string;
  /** Additional CSS classes for the input */
  inputClassName?: string;
  /** Disable editing */
  disabled?: boolean;
  /** Validate input before saving - return error message or undefined */
  validate?: (value: string) => string | undefined;
  /** Input type (text, email, tel, url, number) */
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  /** Show pencil icon on hover */
  showEditIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Render as multiline textarea */
  multiline?: boolean;
  /** Number of rows for multiline */
  rows?: number;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit',
  className,
  inputClassName,
  disabled = false,
  validate,
  type = 'text',
  showEditIcon = true,
  size = 'md',
  multiline = false,
  rows = 3,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [error, setError] = React.useState<string>();
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update edit value when prop changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setError(undefined);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(undefined);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Validate if validator provided
    if (validate) {
      const validationError = validate(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Don't save if value hasn't changed
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setError(undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const sizeClasses = {
    sm: 'text-sm py-0.5 px-1',
    md: 'text-base py-1 px-2',
    lg: 'text-lg py-1.5 px-2.5',
  };

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';

    return (
      <div className="inline-flex items-start gap-1 w-full">
        <div className="flex-1 relative">
          <InputComponent
            ref={inputRef as any}
            type={multiline ? undefined : type}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError(undefined);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Small delay to allow button clicks
              setTimeout(() => {
                if (document.activeElement !== inputRef.current) {
                  handleSave();
                }
              }, 150);
            }}
            disabled={isSaving}
            rows={multiline ? rows : undefined}
            className={cn(
              'w-full border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50',
              sizeClasses[size],
              error && 'border-red-500 focus:ring-red-500/50',
              isSaving && 'opacity-50',
              inputClassName
            )}
          />
          {error && (
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          )}
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-3.5 w-3.5 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group inline-flex items-center gap-1 rounded cursor-pointer transition-colors',
        !disabled && 'hover:bg-muted/50',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      onClick={handleStartEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Edit ${value || placeholder}`}
    >
      <span
        className={cn(
          sizeClasses[size],
          !value && 'text-muted-foreground italic'
        )}
      >
        {value || placeholder}
      </span>
      {showEditIcon && !disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

/**
 * InlineSelect - Inline editing for select/dropdown values
 */
export interface InlineSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onSave: (value: string) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showEditIcon?: boolean;
}

export function InlineSelect({
  value,
  options,
  onSave,
  placeholder = 'Select...',
  className,
  disabled = false,
  size = 'md',
  showEditIcon = true,
}: InlineSelectProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const selectRef = React.useRef<HTMLSelectElement>(null);

  React.useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleSave = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (err) {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm py-0.5 px-1',
    md: 'text-base py-1 px-2',
    lg: 'text-lg py-1.5 px-2.5',
  };

  const currentLabel = options.find(o => o.value === value)?.label || placeholder;

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => handleSave(e.target.value)}
        onBlur={() => setIsEditing(false)}
        disabled={isSaving}
        className={cn(
          'border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50',
          sizeClasses[size],
          isSaving && 'opacity-50',
          className
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      className={cn(
        'group inline-flex items-center gap-1 rounded cursor-pointer transition-colors',
        !disabled && 'hover:bg-muted/50',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      onClick={handleStartEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
      tabIndex={disabled ? -1 : 0}
      role="button"
    >
      <span
        className={cn(
          sizeClasses[size],
          !value && 'text-muted-foreground italic'
        )}
      >
        {currentLabel}
      </span>
      {showEditIcon && !disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}

/**
 * InlineToggle - Quick toggle for boolean values with visual feedback
 */
export interface InlineToggleProps {
  value: boolean;
  onToggle: (value: boolean) => void | Promise<void>;
  labelTrue?: string;
  labelFalse?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function InlineToggle({
  value,
  onToggle,
  labelTrue = 'Yes',
  labelFalse = 'No',
  className,
  disabled = false,
  size = 'md',
}: InlineToggleProps) {
  const [isToggling, setIsToggling] = React.useState(false);

  const handleToggle = async () => {
    if (disabled || isToggling) return;

    setIsToggling(true);
    try {
      await onToggle(!value);
    } finally {
      setIsToggling(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5',
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isToggling}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all',
        sizeClasses[size],
        value
          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400',
        disabled && 'opacity-50 cursor-not-allowed',
        isToggling && 'animate-pulse',
        className
      )}
    >
      {value ? labelTrue : labelFalse}
    </button>
  );
}
