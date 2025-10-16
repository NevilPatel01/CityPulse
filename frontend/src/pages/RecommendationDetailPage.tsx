import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { PhotoUpload } from '../components/recommendations/PhotoUpload';
import { useAuth } from '../hooks/useAuth';
import { useSafeToast } from '../hooks/useSafeToast';

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
  created_at: string;
  updated_at: string;
  username: string;
  full_name: string;
  category_name: string;
  city_name: string;
  country: string;
  photos?: string[];
  tags?: string[];
}

export function RecommendationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useSafeToast();
  
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const loadRecommendation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/recommendations/${id}`);
      const data = await response.json();

      if (response.ok) {
        setRecommendation(data.data);
        setIsOwner(user?.id === data.data.user_id);
      } else {
        showError(data.message || 'Recommendation not found');
        navigate('/recommendations');
      }
    } catch (error) {
      console.error('Error loading recommendation:', error);
      showError('An error occurred while loading the recommendation');
      navigate('/recommendations');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showError, user?.id]);

  useEffect(() => {
    void loadRecommendation();
  }, [loadRecommendation]);

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
      easy: 'bg-green-500',
      medium: 'bg-yellow-500',
      hard: 'bg-red-500'
    };
    return (
      <span className={`inline-block px-3 py-1 text-sm font-medium text-white rounded-full ${colors[level as keyof typeof colors] || 'bg-gray-500'}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.95l-2.8 2.179a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.179a1 1 0 00-1.175 0l-2.8 2.179c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.858c-.783-.71-.38-1.95.588-1.95h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-gray-400 ml-2">({rating}/5)</span>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading recommendation...</p>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Recommendation not found</h1>
          <Link to="/recommendations">
            <Button className="bg-pulse hover:bg-pulse/80 text-white">
              Back to Recommendations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/recommendations"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Recommendations
            </Link>
            
            {isOwner && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                  className="text-gray-400 hover:text-white"
                >
                  {showPhotoUpload ? 'Hide' : 'Add'} Photos
                </Button>
                <Button
                  variant="outline"
                  className="text-gray-400 hover:text-white"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{recommendation.title}</h1>
                <p className="text-gray-400 text-lg">
                  {recommendation.city_name}, {recommendation.country}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="bg-pulse text-white text-sm font-medium px-3 py-1 rounded-full">
                  {recommendation.category_name}
                </span>
                {formatDifficulty(recommendation.difficulty_level)}
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
                loadRecommendation(); // Reload to show new photos
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photos */}
            {recommendation.photos && recommendation.photos.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Photos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendation.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${recommendation.title} photo ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400">No photos available</p>
                {isOwner && (
                  <Button
                    onClick={() => setShowPhotoUpload(true)}
                    className="mt-4 bg-pulse hover:bg-pulse/80 text-white"
                  >
                    Add Photos
                  </Button>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
              <p className="text-gray-300 leading-relaxed">{recommendation.description}</p>
            </div>

            {/* Tags */}
            {recommendation.tags && recommendation.tags.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {recommendation.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price and Rating */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
              <div className="space-y-4">
                {formatPrice() && (
                  <div>
                    <p className="text-sm text-gray-400">Price Range</p>
                    <p className="text-pulse font-medium">{formatPrice()}</p>
                  </div>
                )}
                
                {renderStars(recommendation.user_rating)}
                
                {recommendation.best_time_to_visit && (
                  <div>
                    <p className="text-sm text-gray-400">Best Time to Visit</p>
                    <p className="text-white">{recommendation.best_time_to_visit}</p>
                  </div>
                )}
                
                {recommendation.duration_suggestion && (
                  <div>
                    <p className="text-sm text-gray-400">Recommended Duration</p>
                    <p className="text-white">{recommendation.duration_suggestion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {recommendation.address && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                <p className="text-gray-300">{recommendation.address}</p>
                {recommendation.latitude && recommendation.longitude && (
                  <p className="text-sm text-gray-400 mt-2">
                    {recommendation.latitude}, {recommendation.longitude}
                  </p>
                )}
              </div>
            )}

            {/* Author */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Author</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {recommendation.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{recommendation.full_name}</p>
                  <p className="text-sm text-gray-400">@{recommendation.username}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Views</span>
                  <span className="text-white">{recommendation.views_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Likes</span>
                  <span className="text-white">{recommendation.likes_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-white">{formatDate(recommendation.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
