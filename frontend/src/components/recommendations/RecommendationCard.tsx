import { Link, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Heart, Eye, Bookmark } from 'lucide-react';
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
  showActions?: boolean;
  className?: string;
  onDelete?: () => void;
}

export function RecommendationCard({ 
  recommendation, 
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
    navigate(`/edit-recommendation/${recommendation.id}`);
  };

  const formatDifficulty = (level?: string) => {
    if (!level) return null;
    const colors = {
      easy: 'bg-green-500',
      medium: 'bg-yellow-500',
      hard: 'bg-red-500'
    };
    return (
      <span className={`inline-block px-3 py-1 text-xs font-medium text-white rounded-full shadow-lg ${colors[level as keyof typeof colors] || 'bg-surface-glass'}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-primary">Delete Recommendation</h3>
            </div>
            <p className="text-muted mb-6">
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
        className={`group relative bg-surface-glass backdrop-blur-glass rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-pulse/10 transition-all duration-500 border border-subtle hover:border-pulse/30 hover:-translate-y-2 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Action Buttons (Owner Only) */}
        {showActions && isOwner && isHovered && (
          <div className="absolute top-3 right-3 z-10 flex gap-2 animate-in slide-in-from-right duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEdit();
              }}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
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
              className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
              title="Delete recommendation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card Link - Makes entire card clickable */}
        <Link to={`/${recommendation.username}/recommendation/${recommendation.id}`} className="block">
          {/* Image */}
          <div className="relative h-56 bg-gradient-to-br from-gray-800/30 to-gray-700/20 overflow-hidden">
            {recommendation.photos && recommendation.photos.length > 0 ? (
              <img
                src={recommendation.photos[0].startsWith('http') 
                  ? recommendation.photos[0] 
                  : `${apiConfig.baseUrl}${recommendation.photos[0]}`
                }
                alt={recommendation.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <span className="bg-pulse text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                {recommendation.category_name}
              </span>
            </div>

            {/* Difficulty Badge */}
            {recommendation.difficulty_level && (
              <div className="absolute bottom-3 left-3">
                {formatDifficulty(recommendation.difficulty_level)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            {/* Title and Location */}
            <div>
              <h3 className="text-lg font-bold text-primary group-hover:text-pulse transition-colors duration-300 line-clamp-1 mb-2">
                {recommendation.title}
              </h3>
              <span 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/city/${recommendation.city_name}`);
                }}
                className="text-sm text-muted hover:text-pulse transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {recommendation.city_name}, {recommendation.country}
              </span>
            </div>

            {/* Description */}
            <p className="text-primary text-sm leading-relaxed line-clamp-2 min-h-[40px]">
              {recommendation.description}
            </p>

            {/* Stats: Likes, Views, Saved */}
            <div className="flex items-center justify-between pt-3 border-t border-subtle/50">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm text-muted hover:text-pulse transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">{recommendation.likes_count}</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted hover:text-pulse transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">{recommendation.views_count}</span>
                </span>
              </div>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add bookmark logic here
                }}
                className="p-2 rounded-full hover:bg-pulse/10 transition-all hover:scale-110 active:scale-95"
                title="Save recommendation"
              >
                <Bookmark className="w-4 h-4 text-muted hover:text-pulse" />
              </button>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
