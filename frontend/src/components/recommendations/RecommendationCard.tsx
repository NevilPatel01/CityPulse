import { Link } from 'react-router-dom';

interface RecommendationCardProps {
  recommendation: {
    id: number;
    title: string;
    description: string;
    price_range_min?: number;
    price_range_max?: number;
    difficulty_level?: string;
    address?: string;
    best_time_to_visit?: string;
    duration_suggestion?: string;
    user_rating?: number;
    views_count: number;
    likes_count: number;
    created_at: string;
    username: string;
    full_name: string;
    category_name: string;
    city_name: string;
    country: string;
    photos?: string[];
  };
  showUser?: boolean;
  className?: string;
}

export function RecommendationCard({ recommendation, showUser = true, className = '' }: RecommendationCardProps) {
  const formatPrice = () => {
    if (recommendation.price_range_min && recommendation.price_range_max) {
      return `$${recommendation.price_range_min} - $${recommendation.price_range_max}`;
    } else if (recommendation.price_range_min) {
      return `From $${recommendation.price_range_min}`;
    } else if (recommendation.price_range_max) {
      return `Up to $${recommendation.price_range_max}`;
    }
    return null;
  };

  const formatDifficulty = (level?: string) => {
    if (!level) return null;
    const colors = {
      easy: 'bg-green-500',
      medium: 'bg-yellow-500',
      hard: 'bg-red-500'
    };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${colors[level as keyof typeof colors] || 'bg-gray-500'}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.95l-2.8 2.179a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.179a1 1 0 00-1.175 0l-2.8 2.179c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.858c-.783-.71-.38-1.95.588-1.95h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-400">({rating})</span>
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${className}`}>
      {/* Image */}
      <div className="relative h-48 bg-gray-800">
        {recommendation.photos && recommendation.photos.length > 0 ? (
          <img
            src={recommendation.photos[0]}
            alt={recommendation.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-pulse text-white text-xs font-medium px-2 py-1 rounded-full">
            {recommendation.category_name}
          </span>
        </div>

        {/* Difficulty Badge */}
        {recommendation.difficulty_level && (
          <div className="absolute top-3 left-3">
            {formatDifficulty(recommendation.difficulty_level)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Location */}
        <div>
          <Link
            to={`/recommendations/${recommendation.id}`}
            className="text-lg font-semibold text-white hover:text-pulse transition-colors"
          >
            {recommendation.title}
          </Link>
          <p className="text-sm text-gray-400">
            {recommendation.city_name}, {recommendation.country}
          </p>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-2">
          {recommendation.description}
        </p>

        {/* Price and Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {formatPrice() && (
              <span className="text-pulse font-medium text-sm">
                {formatPrice()}
              </span>
            )}
            {renderStars(recommendation.user_rating)}
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-400">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.418 0 8.168 3.943 9.542 7-1.374 3.057-5.124 7-9.542 7-4.477 0-8.268-3.943-9.542-7z" />
              </svg>
              <span>{recommendation.views_count}</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{recommendation.likes_count}</span>
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          {recommendation.best_time_to_visit && (
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{recommendation.best_time_to_visit}</span>
            </span>
          )}
          {recommendation.duration_suggestion && (
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{recommendation.duration_suggestion}</span>
            </span>
          )}
        </div>

        {/* User Info */}
        {showUser && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {recommendation.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{recommendation.full_name}</p>
                <p className="text-xs text-gray-400">@{recommendation.username}</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {formatDate(recommendation.created_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
