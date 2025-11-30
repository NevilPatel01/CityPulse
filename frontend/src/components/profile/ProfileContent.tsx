import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, apiConfig } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  category_name: string;
  city_name: string;
  country: string;
  photos: string[];
  price_range_min?: number;
  price_range_max?: number;
  difficulty_level?: string;
}

interface ProfileContentProps {
  activeTab: number;
  username?: string;
}

export function ProfileContent({ activeTab, username }: ProfileContentProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [likedRecommendations, setLikedRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if viewing current user's profile
  const isCurrentUser = !username || username === user?.username;

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      // If username is provided, fetch that user's recommendations, otherwise fetch current user's
      const targetUsername = username || user?.username;
      
      if (!targetUsername) return;

      // Get user ID first
      const profileResponse = await apiRequest<{ success: boolean; data: { id: number } }>(
        `/api/profile/${targetUsername}`
      );

      if (!profileResponse.success) return;

      const userId = profileResponse.data.id;

      // Fetch recommendations
      const response = await apiRequest<{ 
        success: boolean; 
        data: { recommendations: Recommendation[] } 
      }>(
        `/api/recommendations?user_id=${userId}&limit=50`
      );

      if (response.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's recommendations
  useEffect(() => {
    if (activeTab === 0) {
      fetchRecommendations();
    } else if (activeTab === 3) {
      fetchLikedRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, username]);

  const fetchLikedRecommendations = async () => {
    try {
      setLoading(true);
      
      // Fetch liked recommendations (only for current user)
      const response = await apiRequest<{ 
        success: boolean; 
        data: { recommendations: Recommendation[] } 
      }>(
        `/api/recommendations/user/liked?limit=50`
      );

      if (response.success) {
        setLikedRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching liked recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for other tabs - replace with API calls later
  const mockTravelHistory = [
    {
      id: 1,
      location: 'Snowdonia, Wales',
      dates: 'Dec 10-17, 2024',
      highlights: ['Mount Snowdon Summit', 'Llanberis Railway', 'Betws-y-Coed'],
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      location: 'Tokyo, Japan',
      dates: 'Nov 15 - Dec 5, 2024',
      highlights: ['Shibuya Sky', 'Tsukiji Market', 'Senso-ji Temple'],
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 3,
      location: 'Seoul, South Korea',
      dates: 'Oct 10-25, 2024',
      highlights: ['Han River Park', 'Bukchon Village', 'Namsan Tower'],
      image: 'https://images.unsplash.com/photo-1519864600265-abb224a0e3c7?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const mockAchievements = [
    {
      id: 1,
      title: 'Badge: Globetrotter',
      description: 'Visited 20+ countries',
    },
    {
      id: 2,
      title: 'Badge: Local Expert',
      description: 'Top-rated recommendations in Tokyo',
    },
  ];

  const mockSaved = [
    {
      id: 1,
      title: 'Saved: Brooklyn Bridge Park',
      location: 'New York, NY',
    },
  ];

  const renderRecommendations = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse"></div>
        </div>
      );
    }

    if (recommendations.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted text-lg">No recommendations yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((item) => {
          const primaryPhoto = item.photos && item.photos.length > 0 
            ? (item.photos[0].startsWith('http') ? item.photos[0] : `${apiConfig.baseUrl}${item.photos[0]}`)
            : 'https://via.placeholder.com/400x300?text=No+Image';

          return (
            <Link 
              key={item.id} 
              to={`/recommendations/${item.id}`}
              className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="relative">
                <img
                  src={primaryPhoto}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-pulse text-white px-3 py-1 rounded-full text-xs font-medium">
                    {item.category_name}
                  </span>
                </div>
                {item.difficulty_level && (
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      item.difficulty_level === 'easy' ? 'bg-green-500' :
                      item.difficulty_level === 'moderate' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}>
                      {item.difficulty_level.charAt(0).toUpperCase() + item.difficulty_level.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-primary mb-1 group-hover:text-pulse transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-muted text-sm mb-2">{item.city_name}, {item.country}</p>
                {item.description && (
                  <p className="text-primary text-sm line-clamp-2 mb-3">{item.description}</p>
                )}
                {(item.price_range_min || item.price_range_max) && (
                  <div className="text-pulse text-sm font-medium">
                    {item.price_range_min === 0 && item.price_range_max === 0
                      ? 'FREE'
                      : `$${item.price_range_min || 0}.00 - $${item.price_range_max || 0}.00`
                    }
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderLikedRecommendations = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse"></div>
        </div>
      );
    }

    if (likedRecommendations.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted text-lg">
            You haven't liked any recommendations yet. Start exploring and save your favorites!
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {likedRecommendations.map((item) => {
          const primaryPhoto = item.photos && item.photos.length > 0 
            ? (item.photos[0].startsWith('http') ? item.photos[0] : `${apiConfig.baseUrl}${item.photos[0]}`)
            : 'https://via.placeholder.com/400x300?text=No+Image';

          return (
            <Link 
              key={item.id} 
              to={`/recommendations/${item.id}`}
              className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="relative">
                <img
                  src={primaryPhoto}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-pulse text-white px-3 py-1 rounded-full text-xs font-medium">
                    {item.category_name}
                  </span>
                </div>
                {item.difficulty_level && (
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      item.difficulty_level === 'easy' ? 'bg-green-500' :
                      item.difficulty_level === 'moderate' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}>
                      {item.difficulty_level.charAt(0).toUpperCase() + item.difficulty_level.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-primary mb-1 group-hover:text-pulse transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-muted text-sm mb-2">{item.city_name}, {item.country}</p>
                {item.description && (
                  <p className="text-primary text-sm line-clamp-2 mb-3">{item.description}</p>
                )}
                {(item.price_range_min || item.price_range_max) && (
                  <div className="text-pulse text-sm font-medium">
                    {item.price_range_min === 0 && item.price_range_max === 0
                      ? 'FREE'
                      : `$${item.price_range_min || 0}.00 - $${item.price_range_max || 0}.00`
                    }
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderTravelHistory = () => (
    <div className="space-y-6">
      <div className="text-2xl font-bold text-white mb-4">2024</div>
      {mockTravelHistory.map((trip) => (
        <div key={trip.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200">
          <div className="flex gap-4">
            <img
              src={trip.image}
              alt={trip.location}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {trip.location}
              </h3>
              <p className="text-gray-400 text-sm mb-2">{trip.dates}</p>
              <div className="text-sm text-gray-400 mb-2">Highlights</div>
              <div className="flex flex-wrap gap-2">
                {trip.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      {mockAchievements.map((achievement) => (
        <div key={achievement.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200">
          <h3 className="text-lg font-semibold text-white mb-1">
            {achievement.title}
          </h3>
          <p className="text-gray-400 text-sm">{achievement.description}</p>
        </div>
      ))}
    </div>
  );

  const renderSaved = () => (
    <div className="space-y-6">
      {mockSaved.map((item) => (
        <div key={item.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200">
          <h3 className="text-lg font-semibold text-white mb-1">
            {item.title}
          </h3>
          <p className="text-gray-400 text-sm">{item.location}</p>
        </div>
      ))}
    </div>
  );

  switch (activeTab) {
    case 0:
      return renderRecommendations();
    case 1:
      return renderTravelHistory();
    case 2:
      return renderAchievements();
    case 3:
      return isCurrentUser ? renderLikedRecommendations() : renderSaved();
    default:
      return null;
  }
}