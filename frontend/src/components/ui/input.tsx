import type { InputHTMLAttributes } from 'react';
import { forwardRef as reactForwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  showRequiredIndicator?: boolean;
}

export const Input = reactForwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    label, 
    error, 
    helperText, 
    id, 
    isRequired = false,
    showRequiredIndicator = true,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    
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
            htmlFor={inputId}
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

        <input
          id={inputId}
          ref={ref}
          required={isRequired}
          aria-required={isRequired}
          aria-invalid={hasError}
          aria-describedby={describedByIds}
          className={`
            w-full px-4 py-3 
            bg-surface-glass backdrop-blur-glass 
            border border-subtle rounded-lg
            text-primary placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse focus:shadow-lg focus:shadow-pulse/20 focus:ring-offset-2 focus:ring-offset-base
            hover:border-pulse/50 hover:shadow-md hover:shadow-pulse/10
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${
              hasError
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-500'
                : ''
            }
            ${className}
          `}
          style={{ color: 'var(--text-primary)' }}
          {...props}
        />

        {/* Error message with proper ARIA attributes */}
        {error && (
          <div 
            id={errorId}
            role="alert"
            aria-live="polite"
            className='text-sm text-red-500 flex items-start gap-1'
          >
            <svg 
              className="w-4 h-4 mt-0.5 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p 
            id={helperTextId}
            className='text-sm text-muted flex items-start gap-1'
          >
            <svg 
              className="w-4 h-4 mt-0.5 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <span>{helperText}</span>
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
