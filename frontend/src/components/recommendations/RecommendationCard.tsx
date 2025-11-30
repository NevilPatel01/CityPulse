import { Link, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Heart, Eye, Bookmark, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSafeToast } from '../../hooks/useSafeToast';
import { Button } from '../ui/button';
import { apiRequest, apiConfig } from '../../config/api';
import { likeRecommendation, toggleBookmark } from '../../services/feedService';

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
    is_liked?: boolean;
    is_bookmarked?: boolean;
    average_rating?: number;
    rating_count?: number;
  };
  showActions?: boolean;
  className?: string;
  onDelete?: () => void;
  onUpdate?: (id: number, updates: { is_liked?: boolean; likes_count?: number; is_bookmarked?: boolean }) => void;
}

export function RecommendationCard({ 
  recommendation, 
  showActions = false,
  className = '',
  onDelete,
  onUpdate
}: RecommendationCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useSafeToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(recommendation.is_liked || false);
  const [likesCount, setLikesCount] = useState(recommendation.likes_count);
  const [isBookmarked, setIsBookmarked] = useState(recommendation.is_bookmarked || false);

  const isOwner = Number(user?.id) === recommendation.user_id;

  // Sync state with props
  useEffect(() => {
    setIsLiked(recommendation.is_liked || false);
    setLikesCount(recommendation.likes_count);
    setIsBookmarked(recommendation.is_bookmarked || false);
  }, [recommendation.is_liked, recommendation.likes_count, recommendation.is_bookmarked]);

  // Check like status on mount if user is logged in
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || isOwner) return; // Don't check for owner's own posts initially
      
      try {
        const response = await apiRequest<{ success: boolean; data: { isLiked: boolean } }>(
          `/api/recommendations/${recommendation.id}/like-status`
        );
        if (response.success) {
          setIsLiked(response.data.isLiked);
        }
      } catch (error) {
        // Silently fail - like status check is optional
        console.debug('Could not check like status:', error);
      }
    };

    if (user && !recommendation.is_liked && !isOwner) {
      checkLikeStatus();
    }
  }, [recommendation.id, user, isOwner, recommendation.is_liked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistically update UI
    setIsLiked(!isLiked);
    setLikesCount(prev => previousLiked ? Math.max(0, prev - 1) : prev + 1);
    onUpdate?.(recommendation.id, { 
      is_liked: !previousLiked, 
      likes_count: previousLiked ? likesCount - 1 : likesCount + 1 
    });

    try {
      // Backend handles toggle automatically, so always call likeRecommendation
      const response = await likeRecommendation(recommendation.id) as { data?: { likes_count?: number } };
      
      // Update with actual response data if available
      if (response?.data && typeof response.data === 'object' && 'likes_count' in response.data) {
        setLikesCount(response.data.likes_count as number);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      onUpdate?.(recommendation.id, { 
        is_liked: previousLiked, 
        likes_count: previousCount 
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update like';
      // Don't show error if it's just a toggle (backend handles it)
      if (!errorMessage.includes('Already liked') && !errorMessage.includes('not liked yet')) {
        console.error('Error toggling like:', error);
        showError(errorMessage);
      }
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    const previousBookmarked = isBookmarked;
    
    // Optimistic update
    setIsBookmarked(!previousBookmarked);
    onUpdate?.(recommendation.id, { is_bookmarked: !previousBookmarked });

    try {
      const result = await toggleBookmark(recommendation.id) as { success?: boolean; data?: { isBookmarked: boolean } };
      
      // Determine actual state from response
      let actualBookmarked = !previousBookmarked;
      if (result.success && result.data && typeof result.data.isBookmarked === 'boolean') {
        actualBookmarked = result.data.isBookmarked;
      } else if (result.data && typeof result.data.isBookmarked === 'boolean') {
        actualBookmarked = result.data.isBookmarked;
      }
      
      // Update with actual state
      setIsBookmarked(actualBookmarked);
      onUpdate?.(recommendation.id, { is_bookmarked: actualBookmarked });
      showSuccess(actualBookmarked ? 'Saved' : 'Unsaved');
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update on error
      setIsBookmarked(previousBookmarked);
      onUpdate?.(recommendation.id, { is_bookmarked: previousBookmarked });
      showError('Failed to update bookmark');
    }
  };

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
              className="p-2.5 bg-pulse hover:bg-pulse/90 text-white rounded-full transition-all shadow-lg shadow-pulse/30 hover:scale-110 active:scale-95"
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
              className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg shadow-red-600/30 hover:scale-110 active:scale-95"
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
                src={(() => {
                  const photo = recommendation.photos?.[0];
                  let photoUrl: string | undefined;
                  if (typeof photo === 'string') {
                    photoUrl = photo;
                  } else if (photo && typeof photo === 'object' && 'photo_url' in photo) {
                    photoUrl = (photo as { photo_url: string }).photo_url;
                  }
                  return photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('http') 
                    ? photoUrl 
                    : photoUrl && typeof photoUrl === 'string'
                      ? `${apiConfig.baseUrl}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`
                      : 'https://via.placeholder.com/400x300?text=No+Image';
                })()}
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
              <h3 className="text-lg font-bold text-pulse group-hover:text-pulse/80 transition-colors duration-300 line-clamp-1 mb-2">
            {recommendation.title}
          </h3>
          <span 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/city/${recommendation.city_name}`);
            }}
                className="text-sm text-white hover:text-pulse transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {recommendation.city_name}, {recommendation.country}
          </span>
        </div>

            {/* Stats: Like, Views, Save, Star Rating - Social Media Style */}
            <div className="pt-3 border-t border-subtle/50">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className="flex flex-col items-center gap-1 disabled:opacity-50 group"
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart className={`w-6 h-6 transition-all ${
                    isLiked 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-red-500 hover:text-red-600 hover:scale-110'
                  }`} style={!isLiked ? { strokeWidth: 2.5 } : {}} />
                  <span className="text-xs font-medium text-primary">{likesCount}</span>
                </button>
                
                <div className="flex flex-col items-center gap-1">
                  <Eye className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-primary">{recommendation.views_count}</span>
          </div>
          
                <button
                  onClick={handleBookmark}
                  className="flex flex-col items-center gap-1 disabled:opacity-50 group"
                  title={isBookmarked ? 'Unsave' : 'Save recommendation'}
                >
                  <Bookmark 
                    className={`w-6 h-6 transition-all hover:scale-110 ${
                      isBookmarked 
                        ? 'fill-pulse text-pulse' 
                        : 'text-pulse hover:text-pulse/80'
                    }`}
                    fill={isBookmarked ? 'currentColor' : 'none'}
                    style={isBookmarked ? {} : { strokeWidth: 2.5 }}
                  />
                  <span className="text-xs font-medium text-primary">{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>
                
                {recommendation.average_rating && recommendation.average_rating > 0 && (
                  <div className="flex flex-col items-center gap-1" title={`Average rating: ${recommendation.average_rating.toFixed(1)}/5 (${recommendation.rating_count || 0} ${recommendation.rating_count === 1 ? 'rating' : 'ratings'})`}>
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium text-primary">{recommendation.average_rating.toFixed(1)}</span>
              </div>
                )}
              </div>
            </div>
      </div>
        </Link>
    </div>
    </>
  );
}
