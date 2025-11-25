import React from 'react';
import { Loader2 } from 'lucide-react';

export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'spinner' | 'pulse' | 'dots';

interface LoadingSpinnerProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  label?: string;
  className?: string;
}

const sizeMap: Record<LoadingSize, { spinner: string; dot: string }> = {
  sm: { spinner: 'w-4 h-4', dot: 'w-2 h-2' },
  md: { spinner: 'w-8 h-8', dot: 'w-3 h-3' },
  lg: { spinner: 'w-12 h-12', dot: 'w-4 h-4' },
  xl: { spinner: 'w-16 h-16', dot: 'w-5 h-5' },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  label = 'Loading...',
  className = '',
}) => {
  if (variant === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${className}`} role="status" aria-label={label}>
        <Loader2 className={`${sizeMap[size].spinner} animate-spin text-pulse`} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`} role="status" aria-label={label}>
        <div className={`${sizeMap[size].dot} bg-pulse rounded-full animate-pulse`} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // dots variant
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`} role="status" aria-label={label}>
      <div className={`${sizeMap[size].dot} bg-pulse rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`${sizeMap[size].dot} bg-pulse rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`${sizeMap[size].dot} bg-pulse rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Convenience component for full-page loading
export const LoadingPage: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base">
      <LoadingSpinner size="xl" label={message} />
      <p className="text-muted mt-4">{message}</p>
    </div>
  );
};

// Convenience component for inline loading
export const LoadingInline: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <LoadingSpinner size="lg" label={message} />
      {message && <p className="text-muted mt-3">{message}</p>}
    </div>
  );
};
