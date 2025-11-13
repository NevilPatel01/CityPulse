import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { useSafeToast } from '../hooks/useSafeToast';
import { CreateRecommendationForm } from '../components/recommendations/CreateRecommendationForm';
import { apiRequest } from '../config/api';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  user_id: number;
  username?: string;
  category_id?: number;
  category_name?: string;
  city_id?: number;
  city_name?: string;
  country?: string;
  photos?: Array<{
    id: number;
    photo_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  price_range_min?: number;
  price_range_max?: number;
  difficulty_level?: string;
  address?: string;
  best_time_to_visit?: string;
  duration_suggestion?: string;
  user_rating?: number;
  latitude?: number;
  longitude?: number;
}

export function EditRecommendationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useSafeToast();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const loadRecommendation = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const data = await apiRequest<{ 
        success: boolean; 
        data: Recommendation; 
        message?: string 
      }>(`/api/recommendations/${id}`);

      if (data.success) {
        // Check if user owns this recommendation
        if (data.data.user_id !== Number(user?.id)) {
          showError('You do not have permission to edit this recommendation');
          const username = data.data.username || user?.username || '';
          navigate(`/@${username}/recommendation/${id}`);
          return;
        }
        
        setRecommendation(data.data);
      } else {
        showError(data.message || 'Recommendation not found');
        navigate('/recommendations');
      }
    } catch (error) {
      console.error('Error loading recommendation:', error);
      showError(error instanceof Error ? error.message : 'An error occurred while loading the recommendation');
      navigate('/recommendations');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showError, user?.id, user?.username]);

  useEffect(() => {
    void loadRecommendation();
  }, [loadRecommendation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mx-auto"></div>
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
          <Link to="/recommendations" className="text-pulse hover:underline">
            Back to Recommendations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/recommendations/${id}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Recommendation
          </Link>
        </div>

        {/* Edit Form */}
        <CreateRecommendationForm
          isEditing={true}
          recommendationId={id}
          initialData={{
            place_name: recommendation.title,
            description: recommendation.description,
            category_id: recommendation.category_id?.toString() || '',
            city_id: recommendation.city_name || '',
            address: recommendation.address || '',
            price_range_min: recommendation.price_range_min?.toString() || '',
            price_range_max: recommendation.price_range_max?.toString() || '',
            difficulty_level: recommendation.difficulty_level || '',
            best_time_to_visit: recommendation.best_time_to_visit || '',
            duration_suggestion: recommendation.duration_suggestion || '',
            user_rating: recommendation.user_rating || 0,
            latitude: recommendation.latitude?.toString() || '',
            longitude: recommendation.longitude?.toString() || '',
            photos: recommendation.photos || [],
          }}
          onSuccess={() => {
            const username = recommendation.username || user?.username || '';
            navigate(`/@${username}/recommendation/${id}`);
          }}
          onCancel={() => {
            const username = recommendation.username || user?.username || '';
            navigate(`/@${username}/recommendation/${id}`);
          }}
        />
      </div>
    </div>
  );
}
