import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Star, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiRequest } from '../../config/api';

interface TravelHistoryItem {
  id: number;
  title: string;
  description: string;
  city_name: string;
  country: string;
  created_at: string;
  user_rating: number;
  photos: string[];
  category_name: string;
}

interface TravelHistoryTimelineProps {
  userId?: number;
  username?: string;
}

export const TravelHistoryTimeline: React.FC<TravelHistoryTimelineProps> = ({ userId, username }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<TravelHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTravelHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, username]);

  const loadTravelHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParam = userId ? `user_id=${userId}` : username ? `username=${username}` : '';
      if (!queryParam) {
        setError('No user specified');
        return;
      }

      const response = await apiRequest<{
        success: boolean;
        data: {
          recommendations: TravelHistoryItem[];
        };
      }>(`/api/recommendations?${queryParam}&sort=created_at&order=desc&limit=100`);

      if (response.success && response.data.recommendations) {
        setHistory(response.data.recommendations);
      } else {
        setError('Failed to load travel history');
      }
    } catch (err) {
      console.error('Error loading travel history:', err);
      setError('Failed to load travel history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-pulse animate-spin mb-3" />
        <p className="text-text-secondary">Loading travel history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 text-text-secondary mx-auto mb-3" />
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 text-text-secondary mx-auto mb-3" />
        <p className="text-text-secondary">No travel history yet</p>
        <p className="text-sm text-text-secondary mt-2">Start creating recommendations to track your travels!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pulse via-orange-500 to-transparent hidden md:block" />

      {/* Timeline Items */}
      <div className="space-y-8">
        {history.map((item, index) => (
          <div
            key={item.id}
            className="relative pl-0 md:pl-16 group cursor-pointer"
            onClick={() => navigate(`/recommendations/${item.id}`)}
          >
            {/* Timeline Dot */}
            <div className="absolute left-[18px] top-6 w-4 h-4 bg-pulse rounded-full shadow-lg hidden md:block group-hover:scale-125 transition-transform duration-200">
              <div className="absolute inset-0 bg-pulse rounded-full animate-ping opacity-75" />
            </div>

            {/* Content Card */}
            <div className="bg-surface-glass backdrop-blur-glass rounded-xl p-6 hover:bg-white/5 transition-all duration-200 shadow-lg">
              {/* Date Badge */}
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-pulse" />
                <span className="text-sm font-medium text-pulse">{getMonthYear(item.created_at)}</span>
                <span className="text-xs text-text-secondary">• {formatDate(item.created_at)}</span>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {/* Image Section */}
                {item.photos && item.photos.length > 0 ? (
                  <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.photos[0].startsWith('http') 
                        ? item.photos[0] 
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${item.photos[0]}`
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full md:w-48 h-32 bg-gradient-to-br from-pulse/20 to-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-12 h-12 text-text-secondary" />
                  </div>
                )}

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  {/* Location */}
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <h3 className="font-semibold text-lg text-primary">
                      {item.city_name}, {item.country}
                    </h3>
                  </div>

                  {/* Title */}
                  <h4 className="font-medium text-primary mb-2 line-clamp-2">
                    {item.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-text-secondary">{item.user_rating}/5</span>
                    </div>

                    {/* Category */}
                    {item.category_name && (
                      <span className="px-3 py-1 bg-pulse/10 text-pulse rounded-full text-xs font-medium">
                        {item.category_name}
                      </span>
                    )}

                    {/* Photo Count */}
                    {item.photos && item.photos.length > 1 && (
                      <div className="flex items-center gap-1 text-text-secondary">
                        <ImageIcon className="w-4 h-4" />
                        <span>{item.photos.length} photos</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Connection Line to Next Item */}
            {index < history.length - 1 && (
              <div className="hidden md:block absolute left-6 top-full h-8 w-0.5 bg-gradient-to-b from-orange-500/50 to-transparent" />
            )}
          </div>
        ))}
      </div>

      {/* Timeline End */}
      <div className="relative pl-0 md:pl-16 mt-8">
        <div className="absolute left-[14px] top-0 w-6 h-6 bg-gradient-to-br from-pulse to-orange-500 rounded-full shadow-lg hidden md:flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <div className="bg-surface-glass/50 backdrop-blur-glass rounded-xl p-4 text-center">
          <p className="text-sm text-text-secondary">
            {(() => {
              // Calculate unique countries and cities
              const countriesSet = new Set<string>();
              const citiesSet = new Set<string>();
              
              history.forEach(item => {
                if (item.country) countriesSet.add(item.country);
                if (item.city_name) citiesSet.add(`${item.city_name}, ${item.country}`);
              });
              
              const countries = countriesSet.size;
              const cities = citiesSet.size;
              
              if (countries > 0 && cities > 0) {
                return `${countries} ${countries === 1 ? 'country' : 'countries'} & ${cities} ${cities === 1 ? 'city' : 'cities'} explored`;
              } else if (cities > 0) {
                return `${cities} ${cities === 1 ? 'city' : 'cities'} explored`;
              } else {
                return `${history.length} ${history.length === 1 ? 'destination' : 'destinations'} explored`;
              }
            })()}
          </p>
        </div>
      </div>
    </div>
  );
};
