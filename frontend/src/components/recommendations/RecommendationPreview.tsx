import { MapPin, Clock, Star } from 'lucide-react';
import { apiConfig } from '../../config/api';

interface RecommendationPreviewProps {
  place_name: string;
  category_name: string;
  city_name: string;
  description: string;
  price_range_min?: string;
  price_range_max?: string;
  user_rating: number;
  best_time_to_visit?: string;
  duration_suggestion?: string;
  difficulty_level?: string;
  photos?: File[];
  existingPhotos?: Array<{
    id: number;
    photo_url: string;
    is_primary: boolean;
  }>;
}

export function RecommendationPreview({
  place_name,
  category_name,
  city_name,
  description,
  price_range_min,
  price_range_max,
  user_rating,
  best_time_to_visit,
  duration_suggestion,
  difficulty_level,
  photos = [],
  existingPhotos = []
}: RecommendationPreviewProps) {
  
  const formatPrice = () => {
    const min = parseFloat(price_range_min || '0');
    const max = parseFloat(price_range_max || '0');
    
    // Show FREE if both are 0
    if (min === 0 && max === 0) {
      return 'FREE';
    }
    
    if (min && max) {
      return `$ ${min} - $${max}`;
    } else if (min) {
      return `From $${min}`;
    } else if (max) {
      return `Up to $${max}`;
    }
    return '$ 0 - $100';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-accent-amber fill-accent-amber' : 'text-muted'}`}
          />
        ))}
      </div>
    );
  };

  const formatDifficulty = (level?: string) => {
    if (!level) return null;
    const colors: Record<string, string> = {
      easy: 'bg-green-500',
      moderate: 'bg-yellow-500',
      hard: 'bg-red-500',
      expert: 'bg-purple-500'
    };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${colors[level] || 'bg-surface-glass'}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  // Get preview image
  const getPreviewImage = () => {
    if (photos.length > 0) {
      return URL.createObjectURL(photos[0]);
    }
    if (existingPhotos.length > 0) {
      const primaryPhoto = existingPhotos.find(p => p.is_primary) || existingPhotos[0];
      // Check if photo_url exists before using it
      if (primaryPhoto && primaryPhoto.photo_url) {
        return primaryPhoto.photo_url.startsWith('http')
          ? primaryPhoto.photo_url
          : `${apiConfig.baseUrl}${primaryPhoto.photo_url}`;
      }
    }
    return null;
  };

  const previewImage = getPreviewImage();

  return (
    <div className="sticky top-8">
      <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass border border-subtle p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Preview</h3>
        <p className="text-sm text-muted mb-4">How your recommendation will look</p>

        {/* Preview Card - Matching RecommendationCard style */}
        <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass overflow-hidden border border-subtle">
          {/* Image */}
          <div className="relative h-48 bg-surface-glass rounded-t-2xl">
            {previewImage ? (
              <img
                src={previewImage}
                alt={place_name || 'Preview'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Category Badge */}
            {category_name && (
              <div className="absolute top-3 right-3">
                <span className="bg-pulse text-white text-xs font-medium px-2 py-1 rounded-full">
                  {category_name}
                </span>
              </div>
            )}

            {/* Difficulty Badge */}
            {difficulty_level && (
              <div className="absolute top-3 left-3">
                {formatDifficulty(difficulty_level)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title and Location */}
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {place_name || 'Place Name'}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted mt-1">
                <MapPin className="w-3 h-3" />
                <span>{city_name || 'City'}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-primary text-sm line-clamp-2">
              {description || 'Describe what makes this place special...'}
            </p>

            {/* Price and Rating */}
            <div className="flex items-center justify-between">
              <span className="text-pulse font-medium text-sm">
                {formatPrice()}
              </span>
              {renderStars(user_rating)}
            </div>

            {/* Additional Info */}
            {(best_time_to_visit || duration_suggestion) && (
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                {best_time_to_visit && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{best_time_to_visit}</span>
                  </span>
                )}
                {duration_suggestion && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{duration_suggestion}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
