import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  showRequiredIndicator?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperTextId = helperText ? `${textareaId}-helper` : undefined;
    
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
            htmlFor={textareaId}
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

        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-subtle bg-surface-glass backdrop-blur-glass px-4 py-3 text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse focus:shadow-lg focus:shadow-pulse/20 focus:ring-offset-2 focus:ring-offset-base hover:border-pulse/50 hover:shadow-md hover:shadow-pulse/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            hasError && 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-500',
            className
          )}
          aria-describedby={describedByIds}
          aria-invalid={hasError}
          style={{ color: 'var(--text-primary)' }}
          {...props}
        />

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
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
