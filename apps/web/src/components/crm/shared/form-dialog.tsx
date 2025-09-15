"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { AlertCircle, X } from 'lucide-react';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  description?: string;
  className?: string;
  rows?: number; // For textarea
  min?: number; // For number inputs
  max?: number; // For number inputs
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode; // For custom content
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialData = {},
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  size = 'md',
  className = '',
  children
}: FormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes or initial data changes
  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors({});
      // Focus first field after a brief delay to ensure dialog is rendered
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
    }
  }, [open, initialData]);

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name];

      // Required field validation
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.name] = `${field.label} is required`;
          return;
        }
        if (field.type === 'checkbox' && !value) {
          newErrors[field.name] = `${field.label} is required`;
          return;
        }
      }

      // Custom validation
      if (field.validation && value !== undefined && value !== null && value !== '') {
        const validationError = field.validation(value);
        if (validationError) {
          newErrors[field.name] = validationError;
        }
      }

      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              newErrors[field.name] = 'Please enter a valid email address';
            }
            break;
          case 'tel':
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(value)) {
              newErrors[field.name] = 'Please enter a valid phone number';
            }
            break;
          case 'number':
            if (isNaN(value)) {
              newErrors[field.name] = 'Please enter a valid number';
            } else {
              if (field.min !== undefined && value < field.min) {
                newErrors[field.name] = `Value must be at least ${field.min}`;
              }
              if (field.max !== undefined && value > field.max) {
                newErrors[field.name] = `Value must be at most ${field.max}`;
              }
            }
            break;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    }
  };

  // Render form field
  const renderField = (field: FormField, index: number) => {
    const fieldId = `field-${field.name}`;
    const hasError = !!errors[field.name];
    const isFirstField = index === 0;

    const fieldClasses = `${field.className || ''} ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`;

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={fieldId} className={`text-sm font-medium ${hasError ? 'text-red-700' : 'text-gray-700'}`}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.type === 'textarea' ? (
          <Textarea
            id={fieldId}
            name={field.name}
            ref={isFirstField ? firstFieldRef : undefined}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={field.rows || 3}
            className={fieldClasses}
            disabled={isSubmitting || loading}
            aria-describedby={field.description ? `${fieldId}-description` : undefined}
            aria-invalid={hasError}
          />
        ) : field.type === 'select' ? (
          <Select
            value={formData[field.name] || ''}
            onValueChange={(value) => handleFieldChange(field.name, value)}
            disabled={isSubmitting || loading}
          >
            <SelectTrigger className={fieldClasses} aria-invalid={hasError}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'checkbox' ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              disabled={isSubmitting || loading}
              aria-invalid={hasError}
            />
            <Label
              htmlFor={fieldId}
              className={`text-sm ${hasError ? 'text-red-700' : 'text-gray-600'}`}
            >
              {field.placeholder || field.label}
            </Label>
          </div>
        ) : (
          <Input
            id={fieldId}
            name={field.name}
            type={field.type}
            ref={isFirstField ? firstFieldRef : undefined}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => {
              const value = field.type === 'number' ? 
                (e.target.value === '' ? '' : Number(e.target.value)) : 
                e.target.value;
              handleFieldChange(field.name, value);
            }}
            className={fieldClasses}
            disabled={isSubmitting || loading}
            min={field.min}
            max={field.max}
            aria-describedby={field.description ? `${fieldId}-description` : undefined}
            aria-invalid={hasError}
          />
        )}

        {field.description && (
          <p id={`${fieldId}-description`} className="text-xs text-gray-500">
            {field.description}
          </p>
        )}

        {hasError && (
          <div className="flex items-center space-x-1 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs">{errors[field.name]}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${sizeClasses[size]} ${className}`}
        onKeyDown={handleKeyDown}
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <DialogHeader>
          <DialogTitle id="dialog-title" className="text-lg font-semibold">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription id="dialog-description" className="text-gray-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field, index) => renderField(field, index))}
            {children}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="sm:order-1"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="sm:order-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
              {submitText}
            </Button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to cancel, 
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs mx-1">Cmd+Enter</kbd> to save
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}