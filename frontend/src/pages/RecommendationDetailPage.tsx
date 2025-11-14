import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Calendar, Clock, Eye, Heart, AlertTriangle, Edit, Trash2, ArrowLeft, Bookmark, Share2, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ImageCarousel } from '../components/recommendations/ImageCarousel';
import { PhotoUpload } from '../components/recommendations/PhotoUpload';
import { Header } from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { useSafeToast } from '../hooks/useSafeToast';
import { apiRequest, apiConfig } from '../config/api';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  price_range_min?: number;
  price_range_max?: number;
  difficulty_level?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  best_time_to_visit?: string;
  duration_suggestion?: string;
  user_rating?: number;
  views_count: number;
  likes_count: number;
  saves_count?: number;
  created_at: string;
  updated_at: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  category_name: string;
  city_name: string;
  country: string;
  photos?: string[];
  tags?: string[];
  user_id?: number;
  average_rating?: number;
  rating_count?: number;
  user_rating_value?: number;
  user_review?: string;
  user_has_liked?: boolean;
}

export function RecommendationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useSafeToast();
  
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [showRatingActions, setShowRatingActions] = useState(false);
  const [userRatings, setUserRatings] = useState<Array<{
    user_id: number;
    username: string;
    full_name: string;
    profile_picture_url?: string;
    rating: number;
    created_at: string;
  }>>([]);

  const checkSaveStatus = useCallback(async () => {
    if (!id || !user) return;
    
    try {
      const data = await apiRequest<{ success: boolean; data: { isSaved: boolean } }>(
        `/api/recommendations/${id}/save/status`
      );
      
      if (data.success) {
        setIsSaved(data.data.isSaved);
      }
    } catch (error) {
      console.error('Error checking save status:', error);
    }
  }, [id, user]);

  const fetchUserRatings = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await apiRequest<{ 
        success: boolean; 
        data: {
          ratings: Array<{
            user_id: number;
            username: string;
            full_name: string;
            profile_picture_url?: string;
            rating: number;
            created_at: string;
          }>;
        };
      }>(
        `/api/recommendations/${id}/ratings/list`
      );
      
      if (data.success) {
        setUserRatings(data.data.ratings);
      }
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  }, [id]);

  const loadRecommendation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      const data = await apiRequest<{ success: boolean; data: Recommendation; message?: string }>(
        `/api/recommendations/${id}`
      );

      if (data.success) {
        setRecommendation(data.data);
        setIsOwner(Number(user?.id) === data.data.user_id);
        setLikesCount(data.data.likes_count);
        setIsLiked(data.data.user_has_liked || false);
        setSavesCount(data.data.saves_count || 0);
        // Set user's rating if they've already rated
        if (data.data.user_rating_value) {
          setUserRating(data.data.user_rating_value);
        }
        
        // Check if user has saved this recommendation
        if (user) {
          checkSaveStatus();
        }
        
        // Fetch all user ratings
        fetchUserRatings();
      } else {
        showError(data.message || 'Recommendation not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading recommendation:', error);
      showError(error instanceof Error ? error.message : 'An error occurred while loading the recommendation');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showError, user, checkSaveStatus, fetchUserRatings]);

  useEffect(() => {
    void loadRecommendation();
  }, [loadRecommendation]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setDeleting(true);
      
      const data = await apiRequest<{ success: boolean; message?: string }>(
        `/api/recommendations/${id}`,
        { method: 'DELETE' }
      );

      if (data.success) {
        showSuccess('Recommendation deleted successfully');
        navigate('/profile/' + user?.username);
      } else {
        showError(data.message || 'Failed to delete recommendation');
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      showError(error instanceof Error ? error.message : 'An error occurred while deleting the recommendation');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRatingSelect = (rating: number) => {
    if (isOwner) {
      showError('You cannot rate your own recommendation');
      return;
    }

    if (!user) {
      showError('Please login to rate this recommendation');
      return;
    }

    setSelectedRating(rating);
    setShowRatingActions(true);
  };

  const handleRatingSubmit = async () => {
    if (!selectedRating || !id) return;

    try {
      const data = await apiRequest<{ 
        success: boolean; 
        data: { averageRating: number; ratingCount: number }; 
        message?: string 
      }>(
        `/api/recommendations/${id}/ratings`,
        {
          method: 'POST',
          body: JSON.stringify({ rating: selectedRating })
        }
      );

      if (data.success) {
        setUserRating(selectedRating);
        setShowRatingActions(false);
        // Update the recommendation with new average rating
        if (recommendation) {
          setRecommendation({
            ...recommendation,
            average_rating: data.data.averageRating,
            rating_count: data.data.ratingCount
          });
        }
        // Refresh ratings list
        fetchUserRatings();
        showSuccess('Rating submitted successfully');
      } else {
        showError(data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError(error instanceof Error ? error.message : 'An error occurred while submitting your rating');
    }
  };

  const handleRatingCancel = () => {
    setSelectedRating(0);
    setShowRatingActions(false);
  };

  const handleLike = async () => {
    if (!id || isLiking) return;
    
    try {
      setIsLiking(true);
      
      const endpoint = isLiked ? `/api/recommendations/${id}/like` : `/api/recommendations/${id}/like`;
      const method = isLiked ? 'DELETE' : 'POST';
      
      const data = await apiRequest<{ success: boolean; data: { likes_count: number }; message?: string }>(
        endpoint,
        { method }
      );

      if (data.success) {
        setIsLiked(!isLiked);
        setLikesCount(data.data.likes_count);
        showSuccess(isLiked ? 'Removed from liked recommendations' : 'Added to liked recommendations');
      } else {
        showError(data.message || 'Failed to update like status');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      showError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!id || isSaving || !user) return;
    
    try {
      setIsSaving(true);
      
      const endpoint = isSaved ? `/api/recommendations/${id}/save` : `/api/recommendations/${id}/save`;
      const method = isSaved ? 'DELETE' : 'POST';
      
      const data = await apiRequest<{ success: boolean; data: { saves_count: number }; message?: string }>(
        endpoint,
        { method }
      );

      if (data.success) {
        setIsSaved(!isSaved);
        setSavesCount(data.data.saves_count);
        showSuccess(isSaved ? 'Removed from saved recommendations' : 'Saved recommendation');
      } else {
        showError(data.message || 'Failed to update save status');
      }
    } catch (error) {
      console.error('Error updating save:', error);
      showError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      showSuccess('Link copied to clipboard!');
      
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      showError('Failed to copy link');
    }
  };

  const formatPrice = () => {
    if (recommendation?.price_range_min && recommendation?.price_range_max) {
      return `$${recommendation.price_range_min} - $${recommendation.price_range_max}`;
    } else if (recommendation?.price_range_min) {
      return `From $${recommendation.price_range_min}`;
    } else if (recommendation?.price_range_max) {
      return `Up to $${recommendation.price_range_max}`;
    }
    return null;
  };

  const formatDifficulty = (level?: string) => {
    if (!level) return null;
    const colors = {
      easy: 'bg-green-500/20 text-green-400 border-green-500/50',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      hard: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${colors[level as keyof typeof colors] || 'bg-surface-glass/50 text-muted border-subtle'}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const renderStars = (rating?: number, interactive: boolean = false) => {
    const currentRating = interactive ? (hoveredRating || selectedRating || userRating) : (rating || 0);
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!interactive || isOwner}
            onClick={() => interactive && handleRatingSelect(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`${interactive && !isOwner ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${star <= currentRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`}
            />
          </button>
        ))}
        {!interactive && rating && (
          <span className="text-muted ml-2 text-sm">({rating}/5)</span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mx-auto"></div>
          <p className="text-muted mt-4">Loading recommendation...</p>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Recommendation not found</h1>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-pulse hover:bg-pulse/80 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-glass backdrop-blur-glass rounded-lg p-6 max-w-md w-full mx-4 border border-subtle">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-primary">Delete Recommendation</h3>
            </div>
            <p className="text-primary mb-6">
              Are you sure you want to delete this recommendation? This action cannot be undone.
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-primary">{recommendation.title}</h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-muted mb-4">
                <Link
                  to={`/cities/${recommendation.city_name}`}
                  className="inline-flex items-center gap-1 hover:text-pulse transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {recommendation.city_name}, {recommendation.country}
                </Link>
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {recommendation.views_count} views
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-pulse text-white text-sm font-medium px-4 py-2 rounded-full">
                {recommendation.category_name}
              </span>
              {formatDifficulty(recommendation.difficulty_level)}
              
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/${recommendation.username}/recommendation/${id}/edit`)}
                    className="p-2 text-muted hover:text-pulse transition-colors"
                    aria-label="Edit recommendation"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-muted hover:text-red-400 transition-colors"
                    aria-label="Delete recommendation"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Upload Section */}
        {showPhotoUpload && isOwner && (
          <div className="mb-8">
            <PhotoUpload
              recommendationId={recommendation.id}
              onUploadSuccess={() => {
                setShowPhotoUpload(false);
                loadRecommendation();
              }}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Carousel */}
            {recommendation.photos && recommendation.photos.length > 0 ? (
              <ImageCarousel 
                images={recommendation.photos.map(photo => 
                  photo.startsWith('http') ? photo : `${apiConfig.baseUrl}${photo}`
                )}
                title={recommendation.title}
                autoPlay={true}
                autoPlayInterval={5000}
              />
            ) : (
              <div className="relative w-full h-[500px] bg-surface-glass backdrop-blur-glass rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg 
                    className="mx-auto h-16 w-16 text-muted mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  <p className="text-muted text-lg mb-4">No photos available</p>
                  {isOwner && (
                    <Button
                      onClick={() => setShowPhotoUpload(true)}
                      className="bg-pulse hover:bg-pulse/80 text-white"
                    >
                      Add Photos
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Instagram-style Action Buttons */}
            <div className="flex items-center justify-between py-3 border-b border-subtle">
              <div className="flex items-center gap-4">
                {user && (
                  <>
                    <button
                      onClick={handleLike}
                      disabled={isLiking}
                      className="group relative disabled:opacity-50"
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <Heart className={`w-7 h-7 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-primary hover:text-red-500 hover:scale-110'}`} />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                      </span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="group relative disabled:opacity-50"
                      title={isSaved ? 'Unsave' : 'Save'}
                    >
                      <Bookmark className={`w-7 h-7 transition-all ${isSaved ? 'fill-pulse text-pulse scale-110' : 'text-primary hover:text-pulse hover:scale-110'}`} />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {savesCount} {savesCount === 1 ? 'save' : 'saves'}
                      </span>
                    </button>
                  </>
                )}
                <button
                  onClick={handleShare}
                  className="group relative"
                  title="Share"
                >
                  {linkCopied ? (
                    <Check className="w-7 h-7 text-green-500" />
                  ) : (
                    <Share2 className="w-7 h-7 text-primary hover:text-pulse hover:scale-110 transition-all" />
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Share
                  </span>
                </button>
              </div>
              
              {/* Engagement Stats */}
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="hover:text-primary cursor-pointer transition-colors" title="Likes">
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </span>
                {user && (
                  <span className="hover:text-primary cursor-pointer transition-colors" title="Saves">
                    {savesCount} {savesCount === 1 ? 'save' : 'saves'}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-surface-glass backdrop-blur-glass rounded-lg p-6 shadow-glass border border-subtle">
              <h2 className="text-2xl font-semibold text-primary mb-4">About this place</h2>
              <p className="text-primary leading-relaxed whitespace-pre-line">
                {recommendation.description}
              </p>
            </div>

            {/* Rating Section */}
            <div className="bg-surface-glass backdrop-blur-glass rounded-lg p-6 shadow-glass border border-subtle">
              <h2 className="text-xl font-semibold text-primary mb-4">Rate this place</h2>
              {isOwner ? (
                <p className="text-muted">You cannot rate your own recommendation</p>
              ) : !user ? (
                <p className="text-muted">Please login to rate this recommendation</p>
              ) : (
                <div>
                  <div className="mb-2">
                    {renderStars(userRating, true)}
                  </div>
                  <p className="text-sm text-muted mb-3">
                    {userRating > 0 ? `You rated this ${userRating} star${userRating > 1 ? 's' : ''}` : 'Click to rate this recommendation'}
                  </p>
                  
                  {/* Cancel / Submit Buttons */}
                  {showRatingActions && (
                    <div className="flex gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Button
                        onClick={handleRatingCancel}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRatingSubmit}
                        className="flex-1 bg-pulse hover:bg-pulse/80 text-white"
                      >
                        Submit Rating
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* User Ratings List */}
              {userRatings.length > 0 && (
                <div className="mt-6 pt-6 border-t border-subtle">
                  <h3 className="text-lg font-semibold text-primary mb-4">
                    All Ratings ({userRatings.length})
                  </h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                    {userRatings.map((rating) => (
                      <div key={`${rating.user_id}-${rating.created_at}`} className="flex items-start gap-3 p-3 bg-surface-glass/50 rounded-lg hover:bg-surface-glass transition-colors">
                        <Link to={`/profile/${rating.username}`}>
                          {rating.profile_picture_url ? (
                            <img
                              src={rating.profile_picture_url}
                              alt={rating.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-pulse to-orange-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {rating.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <Link
                              to={`/profile/${rating.username}`}
                              className="font-semibold text-primary hover:text-pulse transition-colors"
                            >
                              {rating.full_name}
                            </Link>
                            <span className="text-xs text-muted">
                              {formatDate(rating.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= rating.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-muted'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-muted ml-2">
                              {rating.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {recommendation.tags && recommendation.tags.length > 0 && (
              <div className="bg-surface-glass backdrop-blur-glass rounded-lg p-6 shadow-glass border border-subtle">
                <h2 className="text-2xl font-semibold text-primary mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {recommendation.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-surface-glass hover:bg-surface-glass/80 text-primary px-4 py-2 rounded-full text-sm transition-colors cursor-pointer border border-subtle"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Price and Details */}
            <div className="bg-surface-glass backdrop-blur-glass rounded-lg p-6 shadow-glass border border-subtle">
              <h3 className="text-xl font-semibold text-primary mb-4">Details</h3>
              <div className="space-y-4">
                {formatPrice() && (
                  <div className="flex items-center justify-between py-3 border-b border-subtle">
                    <span className="text-muted">Price Range</span>
                    <span className="text-pulse font-semibold">{formatPrice()}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-3 border-b border-subtle">
                  <span className="text-muted">Average Rating</span>
                  <div className="flex items-center gap-2">
                    {renderStars(recommendation.average_rating || recommendation.user_rating || 0)}
                  </div>
                </div>
                
                {recommendation.best_time_to_visit && (
                  <div className="flex items-start justify-between py-3 border-b border-subtle">
                    <span className="text-muted flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Best Time
                    </span>
                    <span className="text-primary text-right">{recommendation.best_time_to_visit}</span>
                  </div>
                )}
                
                {recommendation.duration_suggestion && (
                  <div className="flex items-start justify-between py-3">
                    <span className="text-muted flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </span>
                    <span className="text-primary text-right">{recommendation.duration_suggestion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {recommendation.address && (
              <div className="bg-surface-glass backdrop-blur-glass rounded-lg p-6 shadow-glass border border-subtle">
                <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-pulse" />
                  Location
                </h3>
                <p className="text-primary">{recommendation.address}</p>
                {recommendation.latitude && recommendation.longitude && (
                  <p className="text-sm text-muted mt-2">
                    {Number(recommendation.latitude).toFixed(6)}, {Number(recommendation.longitude).toFixed(6)}
                  </p>
                )}
              </div>
            )}

            {/* Author */}
            <div className="bg-surface-glass backdrop-blur-glass rounded-lg p-6 shadow-glass border border-subtle">
              <h3 className="text-xl font-semibold text-primary mb-4">Created by</h3>
              <Link 
                to={`/profile/${recommendation.username}`}
                className="flex items-center gap-3 group"
              >
                {recommendation.profile_picture_url ? (
                  <img
                    src={recommendation.profile_picture_url}
                    alt={recommendation.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-pulse to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {recommendation.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-primary group-hover:text-pulse transition-colors">
                    {recommendation.full_name}
                  </p>
                  <p className="text-sm text-muted">@{recommendation.username}</p>
                </div>
              </Link>
              <div className="mt-4 pt-4 border-t border-subtle">
                <p className="text-sm text-muted">
                  Created on {formatDate(recommendation.created_at)}
                </p>
              </div>
            </div>

            {/* Report Button */}
            {!isOwner && (
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-muted hover:text-red-400 hover:border-red-400"
              >
                <AlertTriangle className="w-4 h-4" />
                Report this recommendation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
