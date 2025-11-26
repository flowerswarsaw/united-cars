"use client"

import * as React from "react"

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={className}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === RadioGroupItem) {
            return React.cloneElement(child as React.ReactElement<any>, {
              checked: child.props.value === value,
              onCheckedChange: () => onValueChange?.(child.props.value),
            });
          }
          return child;
        })}
      </div>
    )
  }
)

RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
  checked?: boolean;
  onCheckedChange?: () => void;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, checked, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        value={value}
        checked={checked}
        onChange={onCheckedChange}
        className={`h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 ${className || ''}`}
        {...props}
      />
    )
  }
)

RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
