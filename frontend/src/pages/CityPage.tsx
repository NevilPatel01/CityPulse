import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, ExternalLink } from 'lucide-react';
import { apiRequest } from '../config/api';

interface City {
  id: number;
  name: string;
  country: string;
  stateProvince: string | null;
  description: string | null;
  coverImage: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  stats: {
    total_recommendations: number;
    contributors: number;
    visitors: number;
  };
}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  userRating: number;
  priceRange: { min: number | null; max: number | null };
  difficultyLevel: string | null;
  viewsCount: number;
  likesCount: number;
  savesCount: number;
  ratingsCount: number;
  avgRating: number;
  category: { id: number; name: string };
  creator: { username: string; fullName: string; profilePhoto: string | null };
  photos: Array<{
    id: number;
    url: string;
    caption: string | null;
    is_primary: boolean;
  }>;
  tags: Array<{ id: number; name: string }>;
}

interface Category {
  id: number;
  name: string;
  iconUrl: string | null;
  count: number;
}

export default function CityPage() {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<City | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchCityData = useCallback(async () => {
    try {
      setLoading(true);
      const params =
        selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const response = await apiRequest<{
        success: boolean;
        data: {
          city: City;
          recommendations: Recommendation[];
          categories: Category[];
        };
      }>(`api/cities/${cityName}${params}`);

      if (response.success) {
        setCity(response.data.city);
        setRecommendations(response.data.recommendations);
        if (selectedCategory === 'all') {
          setCategories(response.data.categories);
        }
      }
    } catch (error) {
      console.error('Error fetching city data:', error);
    } finally {
      setLoading(false);
    }
  }, [cityName, selectedCategory]);

  useEffect(() => {
    fetchCityData();
  }, [fetchCityData]);

  // Get featured recommendations (top 3 by rating/views)
  const featuredRecommendations = recommendations
    .slice()
    .sort((a, b) => (b.avgRating * b.viewsCount) - (a.avgRating * a.viewsCount))
    .slice(0, 3);

  // Get population estimate based on stats (mock data for now)
  const getPopulation = () => {
    if (!city) return 'N/A';
    const visitors = city.stats.visitors;
    if (visitors > 1000000) return `${(visitors / 1000000).toFixed(1)}M`;
    if (visitors > 1000) return `${(visitors / 1000).toFixed(0)}K`;
    return visitors.toString();
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-base flex items-center justify-center'>
        <div className='text-text-primary text-lg'>Loading city...</div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className='min-h-screen bg-base flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl text-text-primary mb-4'>City not found</h1>
          <button
            onClick={() => navigate('/')}
            className='px-6 py-2 bg-pulse text-base rounded-lg hover:opacity-90 transition'
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-base pb-20'>
      {/* Main Container with Sidebar Layout */}
      <div className='max-w-[1400px] mx-auto px-6 py-8'>
        <div className='flex gap-8'>
          {/* Left Sidebar - City Info */}
          <aside className='w-80 flex-shrink-0 sticky top-8 self-start'>
            <div className='bg-surface-glass backdrop-blur-glass rounded-2xl p-6 border border-border-subtle'>
              {/* City Header */}
              <div className='mb-6'>
                <h1 className='text-3xl font-bold text-text-primary mb-2'>
                  {city.name}
                </h1>
                <p className='text-text-muted flex items-center gap-1'>
                  <MapPin className='w-4 h-4' />
                  {city.country}
                </p>
              </div>

              {/* City Cover Image */}
              {city.coverImage && (
                <div className='mb-6 rounded-xl overflow-hidden'>
                  <img
                    src={city.coverImage}
                    alt={city.name}
                    className='w-full h-40 object-cover'
                  />
                </div>
              )}

              {/* City Stats */}
              <div className='space-y-4 mb-6'>
                <div className='flex items-center justify-between'>
                  <span className='text-text-muted flex items-center gap-2'>
                    <Users className='w-4 h-4' />
                    Population
                  </span>
                  <span className='text-text-primary font-semibold'>{getPopulation()}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-text-muted flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    Timezone
                  </span>
                  <span className='text-text-primary font-semibold'>
                    {city.timezone || 'GMT'}
                  </span>
                </div>
              </div>

              {/* Visit Website Button */}
              <button className='w-full py-3 px-4 bg-pulse hover:opacity-90 text-base font-medium rounded-xl transition flex items-center justify-center gap-2'>
                <ExternalLink className='w-4 h-4' />
                Visit Website
              </button>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className='flex-1 min-w-0'>
            {/* Recommendations Header with Count */}
            <div className='mb-6'>
              <h2 className='text-2xl font-bold text-text-primary mb-4'>
                {city.stats.total_recommendations} Recommendations
              </h2>
              
              {/* Category Badges */}
              <div className='flex gap-2 flex-wrap'>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === 'all'
                      ? 'bg-pulse text-base'
                      : 'bg-surface-glass text-text-primary hover:bg-surface-glass/80'
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 6).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      selectedCategory === category.name
                        ? 'bg-pulse text-base'
                        : 'bg-surface-glass text-text-primary hover:bg-surface-glass/80'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Section - Top 3 Large Cards */}
            {selectedCategory === 'all' && featuredRecommendations.length > 0 && (
              <div className='mb-8'>
                <h3 className='text-xl font-semibold text-text-primary mb-4'>Featured</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {featuredRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => navigate(`/@${rec.creator.username}/recommendation/${rec.id}`)}
                      className='bg-surface-glass backdrop-blur-glass rounded-2xl overflow-hidden hover-lift cursor-pointer border border-border-subtle group'
                    >
                      <div className='relative h-56 bg-base/50'>
                        {rec.photos && rec.photos.length > 0 ? (
                          <img
                            src={rec.photos[0].url}
                            alt={rec.title}
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <span className='text-text-muted'>No image</span>
                          </div>
                        )}
                        <div className='absolute top-3 right-3 px-3 py-1 bg-pulse/90 backdrop-blur-sm font-medium rounded-full text-sm' style={{ color: 'var(--base)' }}>
                          {rec.category.name}
                        </div>
                      </div>
                      <div className='p-4'>
                        <h4 className='text-lg font-semibold text-text-primary mb-2 line-clamp-1'>
                          {rec.title}
                        </h4>
                        <p className='text-text-muted text-sm line-clamp-2 mb-3'>
                          {rec.description}
                        </p>
                        <div className='flex items-center gap-3 text-text-muted text-sm'>
                          <span className='flex items-center gap-1'>
                            ⭐ {rec.avgRating > 0 ? rec.avgRating.toFixed(1) : rec.userRating}
                          </span>
                          <span className='flex items-center gap-1'>
                            👁️ {rec.viewsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Recommendations Grid */}
            <div>
              <h3 className='text-xl font-semibold text-text-primary mb-4'>
                All Recommendations
              </h3>
              {recommendations.length === 0 ? (
                <div className='text-center py-20 bg-surface-glass rounded-2xl'>
                  <p className='text-text-muted text-lg'>No recommendations found</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => navigate(`/@${rec.creator.username}/recommendation/${rec.id}`)}
                      className='bg-surface-glass backdrop-blur-glass rounded-xl overflow-hidden hover-lift cursor-pointer border border-border-subtle'
                    >
                      <div className='relative h-40 bg-base/50'>
                        {rec.photos && rec.photos.length > 0 ? (
                          <img
                            src={rec.photos[0].url}
                            alt={rec.title}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <span className='text-text-muted text-sm'>No image</span>
                          </div>
                        )}
                      </div>
                      <div className='p-4'>
                        <h4 className='text-base font-semibold text-text-primary mb-1 line-clamp-1'>
                          {rec.title}
                        </h4>
                        <p className='text-text-muted text-xs mb-2 line-clamp-1'>
                          {rec.category.name}
                        </p>
                        <div className='flex items-center gap-3 text-text-muted text-xs'>
                          <span>⭐ {rec.avgRating > 0 ? rec.avgRating.toFixed(1) : rec.userRating}</span>
                          <span>👁️ {rec.viewsCount}</span>
                          <span>💾 {rec.savesCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
