import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
  role?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  isInteractive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  tabIndex?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  as: Component = 'div',
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  isInteractive = false,
  onClick,
  tabIndex
}) => {
  const baseClasses = 'bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-2xl hover:shadow-xl hover:shadow-pulse/10 hover:border-pulse/30 transition-all duration-300';
  
  const interactiveClasses = isInteractive 
    ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 focus:ring-offset-base'
    : '';

  const finalClasses = `${baseClasses} ${interactiveClasses} ${className}`;

  const interactiveProps = isInteractive ? {
    tabIndex: tabIndex ?? 0,
    role: role || 'button',
    onKeyDown: (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) {
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLElement>);
      }
    },
    onClick
  } : { onClick };

  const ariaProps = {
    role: !isInteractive ? role : interactiveProps.role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy
  };

  return (
    <Component
      className={finalClasses}
      {...interactiveProps}
      {...ariaProps}
    >
      {children}
    </Component>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'header';
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  as: Component = 'div'
}) => {
  return (
    <Component className={`px-6 py-4 border-b border-subtle ${className}`}>
      {children}
    </Component>
  );
};

export const CardContent: React.FC<CardProps> = ({
  children,
  className = '',
  as: Component = 'div',
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy
}) => {
  return (
    <Component 
      className={`p-6 ${className}`}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </Component>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'footer';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  as: Component = 'div'
}) => {
  return (
    <Component className={`px-6 py-4 border-t border-subtle ${className}`}>
      {children}
    </Component>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
  as,
  level = 3,
  id
}) => {
  const Component = as || (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
  
  const headingClasses = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    h5: 'text-base font-semibold',
    h6: 'text-sm font-semibold'
  };

  return (
    <Component 
      id={id}
      className={`text-primary ${headingClasses[Component]} ${className}`}
    >
      {children}
    </Component>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className = '',
  id
}) => {
  return (
    <p 
      id={id}
      className={`text-muted text-sm mt-1 ${className}`}
    >
      {children}
    </p>
  );
};
