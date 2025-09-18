import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaHaspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  ariaCurrent?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  isLoading = false,
  loadingText = 'Loading...',
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaHaspopup,
  ariaCurrent,
  disabled,
  type = 'button',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer relative';

  const variantClasses = {
    default: 'bg-pulse text-pulse-fg hover:opacity-90 hover:shadow-lg hover:shadow-pulse/25 active:opacity-75',
    outline: 'border border-subtle bg-transparent hover:bg-surface-glass hover:border-pulse text-primary active:bg-pulse/10',
    ghost: 'hover:bg-surface-glass hover:text-pulse text-primary active:bg-pulse/10',
    secondary: 'bg-surface-glass text-primary hover:bg-surface-glass/80 hover:text-pulse active:bg-surface-glass/60',
  };

  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={classes}
      disabled={isDisabled}
      type={type}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      aria-current={ariaCurrent}
      aria-disabled={isDisabled}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      {...props}
    >
      {isLoading && (
        <span 
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            className="animate-spin h-4 w-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      {isLoading && (
        <span className="sr-only">
          {loadingText}
        </span>
      )}
    </button>
  );
};
