import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  isRequired?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  disabled = false,
  size = 'md',
  label,
  error,
  isRequired = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const starSize = sizeClasses[size];

  const handleClick = (newRating: number) => {
    if (!disabled) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (!disabled) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      const isFilled = i <= (hoverRating || rating);
      const isHovered = hoverRating > 0 && i <= hoverRating;
      
      stars.push(
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => handleClick(i)}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          className={`
            ${starSize} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 focus:ring-offset-base
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
            ${isHovered ? 'drop-shadow-lg' : ''}
          `}
          aria-label={`Rate ${i} star${i !== 1 ? 's' : ''}`}
        >
          <svg
            className={`w-full h-full transition-colors duration-200 ${
              isFilled 
                ? (isHovered ? 'text-amber-400' : 'text-pulse') 
                : 'text-muted hover:text-pulse/50'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-primary">
          {label}
          {isRequired && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      <div className="flex items-center space-x-1">
        {renderStars()}
        <span className="ml-2 text-sm text-muted">
          {rating} star{rating !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div role="alert" aria-live="polite" className="text-sm text-red-500 flex items-start gap-1">
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