import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  showRequiredIndicator?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className = '', 
    label, 
    error, 
    helperText, 
    id, 
    isRequired = false,
    showRequiredIndicator = true,
    'aria-describedby': ariaDescribedBy,
    children,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperTextId = helperText ? `${selectId}-helper` : undefined;
    
    // Combine all describedby IDs
    const describedByIds = [
      ariaDescribedBy,
      errorId,
      helperTextId
    ].filter(Boolean).join(' ') || undefined;

    const hasError = Boolean(error);

    return (
      <div className='space-y-2'>
        {label && (
          <label
            htmlFor={selectId}
            className='block text-sm font-medium text-primary'
          >
            {label}
            {isRequired && showRequiredIndicator && (
              <span 
                className='text-red-500 ml-1' 
                aria-label="required"
                role="text"
              >
                *
              </span>
            )}
          </label>
        )}

        <select
          id={selectId}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          aria-describedby={describedByIds}
          aria-invalid={hasError}
          {...props}
        >
          {children}
        </select>

        {helperText && !error && (
          <p 
            id={helperTextId}
            className='text-sm text-muted-foreground'
          >
            {helperText}
          </p>
        )}

        {error && (
          <p 
            id={errorId}
            className='text-sm text-red-500'
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
