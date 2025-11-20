import { Link, useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSafeToast } from '../../hooks/useSafeToast';
import { Button } from '../ui/button';
import { apiRequest, apiConfig } from '../../config/api';

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
    user_id?: number;
  };
  showUser?: boolean;
  showActions?: boolean;
  className?: string;
  onDelete?: () => void;
}

export function RecommendationCard({ 
  recommendation, 
  showUser = true, 
  showActions = false,
  className = '',
  onDelete
}: RecommendationCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useSafeToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOwner = Number(user?.id) === recommendation.user_id;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      
      const data = await apiRequest<{ success: boolean; message?: string }>(
        `/api/recommendations/${recommendation.id}`,
        { method: 'DELETE' }
      );

      if (data.success) {
        showSuccess('Recommendation deleted successfully');
        setShowDeleteConfirm(false);
        if (onDelete) {
          onDelete();
        }
      } else {
        showError(data.message || 'Failed to delete recommendation');
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      showError(error instanceof Error ? error.message : 'An error occurred while deleting the recommendation');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/${recommendation.username}/recommendation/${recommendation.id}/edit`);
  };

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
      <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${colors[level as keyof typeof colors] || 'bg-surface-glass'}`}>
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
            className={`w-4 h-4 ${i < rating ? 'text-accent-amber' : 'text-muted'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.95l-2.8 2.179a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.179a1 1 0 00-1.175 0l-2.8 2.179c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.858c-.783-.71-.38-1.95.588-1.95h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-muted">({rating})</span>
      </div>
    );
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Recommendation</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{recommendation.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`relative bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass overflow-hidden hover:shadow-xl transition-all border border-subtle hover-lift ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Action Buttons (Owner Only) */}
        {showActions && isOwner && isHovered && (
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEdit();
              }}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-lg"
              title="Edit recommendation"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg"
              title="Delete recommendation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card Link - Makes entire card clickable */}
        <Link to={`/${recommendation.username}/recommendation/${recommendation.id}`} className="block">
          {/* Image */}
          <div className="relative h-48 bg-surface-glass rounded-t-2xl">
        {recommendation.photos && recommendation.photos.length > 0 ? (
          <img
            src={recommendation.photos[0].startsWith('http') 
              ? recommendation.photos[0] 
              : `${apiConfig.baseUrl}${recommendation.photos[0]}`
            }
            alt={recommendation.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
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
          <h3 className="text-lg font-semibold text-primary hover:text-pulse transition-colors">
            {recommendation.title}
          </h3>
          <span 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/cities/${recommendation.city_name}`);
            }}
            className="text-sm text-muted hover:text-pulse transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {recommendation.city_name}, {recommendation.country}
          </span>
        </div>

        {/* Description */}
        <p className="text-primary text-sm line-clamp-2">
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
          
          <div className="flex items-center space-x-3 text-sm text-muted">
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
        <div className="flex flex-wrap gap-2 text-xs text-muted">
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
          <div className="flex items-center justify-between pt-3 border-t border-subtle">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-surface-glass rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {recommendation.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{recommendation.full_name}</p>
                <p className="text-xs text-muted">@{recommendation.username}</p>
              </div>
            </div>
            <span className="text-xs text-muted">
              {formatDate(recommendation.created_at)}
            </span>
          </div>
        )}
      </div>
        </Link>
    </div>
    </>
  );
}
