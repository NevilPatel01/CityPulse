import type { InputHTMLAttributes } from 'react';
import { forwardRef as reactForwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = reactForwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className='space-y-2'>
        {label && (
          <label
            htmlFor={inputId}
            className='block text-sm font-medium text-primary'
          >
            {label}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          className={`
            w-full px-4 py-3 
            bg-surface-glass backdrop-blur-glass 
            border border-subtle rounded-lg
            text-primary placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse focus:shadow-lg focus:shadow-pulse/20
            hover:border-pulse/50 hover:shadow-md hover:shadow-pulse/10
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-500'
                : ''
            }
            ${className}
          `}
          style={{ color: 'var(--text-primary)' }}
          {...props}
        />

        {error && <p className='text-sm text-red-500'>{error}</p>}

        {helperText && !error && (
          <p className='text-sm text-muted'>{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
