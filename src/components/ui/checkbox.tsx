'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, label, ...props }, ref) => {
    return (
      <label className={cn('inline-flex items-center gap-2 cursor-pointer', className)}>
        <input
          type="checkbox"
          ref={(el) => {
            if (el && indeterminate !== undefined) {
              el.indeterminate = indeterminate;
            }
            if (typeof ref === 'function') ref(el);
            else if (ref) ref.current = el;
          }}
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-blue-600',
            'focus:ring-blue-500 focus:ring-offset-0',
            'cursor-pointer transition-colors',
            props.disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        />
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export { Checkbox };
