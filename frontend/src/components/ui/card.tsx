import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-2xl hover:shadow-xl hover:shadow-pulse/10 hover:border-pulse/30 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};
