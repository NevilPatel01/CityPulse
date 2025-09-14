import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer';

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

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
