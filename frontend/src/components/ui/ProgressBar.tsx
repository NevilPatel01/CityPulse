import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  error?: string;
  onChange?: (value: number) => void;
  disabled?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  error,
  onChange,
  disabled = false,
  showPercentage = true,
  size = 'md',
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !disabled) {
      onChange(Number(e.target.value));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {/* Progress Bar */}
        <div className={`w-full bg-surface-glass rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div
            className="h-full bg-pulse transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label || 'Progress'}
          />
        </div>

        {/* Interactive Slider (if onChange is provided) */}
        {onChange && (
          <input
            type="range"
            min={0}
            max={max}
            value={value}
            onChange={handleSliderChange}
            disabled={disabled}
            className={`
              w-full appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-track]:bg-surface-glass
              [&::-webkit-slider-track]:rounded-full
              [&::-webkit-slider-track]:${sizeClasses[size]}
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-pulse
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-200
              hover:[&::-webkit-slider-thumb]:scale-110
              focus:outline-none
              focus:ring-2
              focus:ring-pulse
              focus:ring-offset-2
              focus:ring-offset-base
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label={label || 'Adjust progress'}
          />
        )}

        {/* Value Display */}
        {showPercentage && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">0%</span>
            <span className="text-primary font-medium">
              {percentage.toFixed(0)}%
            </span>
            <span className="text-muted">100%</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div 
          role="alert" 
          aria-live="polite" 
          className="text-sm text-red-500 flex items-start gap-1"
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
};