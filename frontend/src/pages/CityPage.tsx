import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Users, TrendingUp, Compass, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest, apiConfig } from '../config/api';
import { Header } from '../components/layout/Header';
import Avatar from '../components/ui/Avatar';

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

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Get primary image URL
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${apiConfig.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Get primary photo for recommendation
  const getPrimaryPhoto = (rec: Recommendation) => {
    const primaryPhoto = rec.photos?.find(p => p.is_primary) || rec.photos?.[0];
    if (!primaryPhoto) return null;
    const photoUrl = getImageUrl(primaryPhoto.url);
    return photoUrl || 'https://via.placeholder.com/400x300?text=No+Image';
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-base flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-pulse mx-auto mb-4'></div>
          <div className='text-text-primary text-lg'>Discovering {cityName}...</div>
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className='min-h-screen bg-base pb-20'>
        <Header />
        <div className='min-h-[calc(100vh-5rem)] flex items-center justify-center'>
          <div className='text-center'>
            <div className='text-6xl mb-4'>🏙️</div>
            <h1 className='text-3xl font-bold text-text-primary mb-4'>City not found</h1>
            <p className='text-text-muted mb-6'>We couldn't find this city in our database.</p>
            <button
              onClick={() => navigate('/explore')}
              className='px-8 py-3 bg-pulse text-white rounded-xl hover:bg-pulse/90 transition-all font-medium shadow-lg shadow-pulse/20'
            >
              Explore Cities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-base pb-20'>
      <Header />
      
      {/* City Header Section - Replaces Hero */}
      <div className='container mx-auto px-6 pt-8'>
        <div className='max-w-7xl mx-auto'>
          {/* City Title and Location */}
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-3 flex-wrap'>
              <h1 className='text-5xl md:text-6xl font-bold text-text-primary'>
                {city.name}
              </h1>
              <div className='flex items-center gap-2 text-pulse'>
                <MapPin className='w-5 h-5' />
                <span className='text-sm font-medium'>
                  {city.country}{city.stateProvince ? `, ${city.stateProvince}` : ''}
                </span>
              </div>
              {city.stats.total_recommendations > 0 && (
                <div className='ml-2 flex items-center gap-1 bg-pulse/20 px-3 py-1 rounded-full'>
                  <TrendingUp className='w-4 h-4 text-pulse' />
                  <span className='text-xs font-semibold text-pulse'>
                    {city.stats.total_recommendations} {city.stats.total_recommendations === 1 ? 'Place' : 'Places'}
                  </span>
                </div>
              )}
            </div>
            
            {city.description && (
              <p className='text-lg text-text-muted max-w-3xl'>
                {city.description}
              </p>
            )}
          </div>

          {/* Stats Cards Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
            <div className='bg-surface-glass backdrop-blur-glass rounded-2xl p-6 border border-subtle hover:border-pulse/50 transition-all group'>
              <div className='flex items-center justify-between mb-4'>
                <div className='w-12 h-12 rounded-xl bg-pulse/20 flex items-center justify-center group-hover:bg-pulse/30 transition-colors'>
                  <MapPin className='w-6 h-6 text-pulse' />
                </div>
                <span className='text-pulse font-bold text-2xl'>{city.stats.total_recommendations}</span>
              </div>
              <h3 className='text-text-primary font-semibold mb-1'>Recommendations</h3>
              <p className='text-text-muted text-sm'>Local places to explore</p>
            </div>

            <div className='bg-surface-glass backdrop-blur-glass rounded-2xl p-6 border border-subtle hover:border-pulse/50 transition-all group'>
              <div className='flex items-center justify-between mb-4'>
                <div className='w-12 h-12 rounded-xl bg-pulse/20 flex items-center justify-center group-hover:bg-pulse/30 transition-colors'>
                  <Users className='w-6 h-6 text-pulse' />
                </div>
                <span className='text-pulse font-bold text-2xl'>{formatNumber(city.stats.contributors)}</span>
              </div>
              <h3 className='text-text-primary font-semibold mb-1'>Contributors</h3>
              <p className='text-text-muted text-sm'>Travelers sharing insights</p>
            </div>

            <div className='bg-surface-glass backdrop-blur-glass rounded-2xl p-6 border border-subtle hover:border-pulse/50 transition-all group'>
              <div className='flex items-center justify-between mb-4'>
                <div className='w-12 h-12 rounded-xl bg-pulse/20 flex items-center justify-center group-hover:bg-pulse/30 transition-colors'>
                  <Compass className='w-6 h-6 text-pulse' />
                </div>
                <span className='text-pulse font-bold text-2xl'>{formatNumber(city.stats.visitors)}</span>
              </div>
              <h3 className='text-text-primary font-semibold mb-1'>Visitors</h3>
              <p className='text-text-muted text-sm'>People who explored</p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-4'>
              <Filter className='w-5 h-5 text-text-muted' />
              <h2 className='text-xl font-bold text-text-primary'>Filter by Category</h2>
            </div>
            <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide'>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-pulse text-white shadow-lg shadow-pulse/30 scale-105'
                    : 'bg-surface-glass text-text-primary hover:bg-surface-glass/80 border border-subtle'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.name
                      ? 'bg-pulse text-white shadow-lg shadow-pulse/30 scale-105'
                      : 'bg-surface-glass text-text-primary hover:bg-surface-glass/80 border border-subtle'
                  }`}
                >
                  {category.iconUrl && (
                    <img src={category.iconUrl} alt='' className='w-4 h-4' />
                  )}
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Featured Recommendations Section */}
          {selectedCategory === 'all' && featuredRecommendations.length > 0 && (
            <div className='mb-12'>
              <div className='mb-6'>
                <h2 className='text-3xl font-bold text-text-primary mb-2'>🌟 Featured Experiences</h2>
                <p className='text-text-muted'>Top-rated recommendations from travelers</p>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {featuredRecommendations.map((rec) => {
                  const primaryPhoto = getPrimaryPhoto(rec);
                  
                  return (
                    <Link
                      key={rec.id}
                      to={`/recommendations/${rec.id}`}
                      className='group bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105 block'
                    >
                      <div className='relative'>
                        <img
                          src={primaryPhoto || 'https://via.placeholder.com/400x300?text=No+Image'}
                          alt={rec.title}
                          className='w-full h-48 object-cover'
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                        <div className='absolute top-3 left-3'>
                          <span className='bg-pulse text-white px-3 py-1 rounded-full text-xs font-medium'>
                            {rec.category.name}
                          </span>
                        </div>
                        {rec.difficultyLevel && (
                          <div className='absolute top-3 right-3'>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                              rec.difficultyLevel === 'easy' ? 'bg-green-500' :
                              rec.difficultyLevel === 'moderate' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}>
                              {rec.difficultyLevel.charAt(0).toUpperCase() + rec.difficultyLevel.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className='p-4 relative'>
                        <h3 className='text-lg font-semibold text-primary mb-1 group-hover:text-pulse transition-colors line-clamp-1'>
                          {rec.title}
                        </h3>
                        <p className='text-muted text-sm mb-2'>{city.name}, {city.country}</p>
                        {rec.description && (
                          <p className='text-primary text-sm line-clamp-2 mb-3'>{rec.description}</p>
                        )}
                        {(rec.priceRange?.min !== null || rec.priceRange?.max !== null) && (
                          <div className='text-pulse text-sm font-medium'>
                            {rec.priceRange?.min === 0 && rec.priceRange?.max === 0 
                              ? 'FREE'
                              : `$${rec.priceRange?.min || 0}.00 - $${rec.priceRange?.max || 0}.00`
                            }
                          </div>
                        )}
                        {/* Profile Icon - Bottom Right */}
                        {rec.creator && (
                          <Link
                            to={`/profile/${rec.creator.username}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigate(`/profile/${rec.creator.username}`);
                            }}
                            className='absolute bottom-4 right-4 z-10'
                            title={`View ${rec.creator.fullName}'s profile`}
                          >
                            <Avatar
                              src={rec.creator.profilePhoto}
                              name={rec.creator.fullName}
                              size="sm"
                              className="border-2 border-pulse hover:border-pulse/80 transition-colors"
                            />
                          </Link>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Recommendations Grid */}
          <div>
            <div className='mb-6'>
              <h2 className='text-3xl font-bold text-text-primary mb-2'>
                {selectedCategory === 'all' && featuredRecommendations.length > 0 
                  ? 'All Experiences' 
                  : `${selectedCategory === 'all' ? 'All' : selectedCategory} Recommendations`}
              </h2>
              <p className='text-text-muted'>
                {recommendations.length} {recommendations.length === 1 ? 'recommendation' : 'recommendations'} found
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className='text-center py-20 bg-surface-glass rounded-2xl border border-subtle'>
                <Compass className='w-16 h-16 text-pulse/30 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-text-primary mb-2'>No recommendations yet</h3>
                <p className='text-text-muted mb-6'>Be the first to share an experience in {city.name}!</p>
                <button
                  onClick={() => navigate('/create-recommendation')}
                  className='px-6 py-3 bg-pulse text-white rounded-xl hover:bg-pulse/90 transition-all font-medium'
                >
                  Share Your Experience
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {recommendations.map((rec) => {
                  const primaryPhoto = getPrimaryPhoto(rec);
                  
                  return (
                    <Link
                      key={rec.id}
                      to={`/recommendations/${rec.id}`}
                      className='group bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105 block'
                    >
                      <div className='relative'>
                        <img
                          src={primaryPhoto || 'https://via.placeholder.com/400x300?text=No+Image'}
                          alt={rec.title}
                          className='w-full h-48 object-cover'
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                        <div className='absolute top-3 left-3'>
                          <span className='bg-pulse text-white px-3 py-1 rounded-full text-xs font-medium'>
                            {rec.category.name}
                          </span>
                        </div>
                        {rec.difficultyLevel && (
                          <div className='absolute top-3 right-3'>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                              rec.difficultyLevel === 'easy' ? 'bg-green-500' :
                              rec.difficultyLevel === 'moderate' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}>
                              {rec.difficultyLevel.charAt(0).toUpperCase() + rec.difficultyLevel.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className='p-4 relative'>
                        <h3 className='text-lg font-semibold text-primary mb-1 group-hover:text-pulse transition-colors line-clamp-1'>
                          {rec.title}
                        </h3>
                        <p className='text-muted text-sm mb-2'>{city.name}, {city.country}</p>
                        {rec.description && (
                          <p className='text-primary text-sm line-clamp-2 mb-3'>{rec.description}</p>
                        )}
                        {(rec.priceRange?.min !== null || rec.priceRange?.max !== null) && (
                          <div className='text-pulse text-sm font-medium'>
                            {rec.priceRange?.min === 0 && rec.priceRange?.max === 0 
                              ? 'FREE'
                              : `$${rec.priceRange?.min || 0}.00 - $${rec.priceRange?.max || 0}.00`
                            }
                          </div>
                        )}
                        {/* Profile Icon - Bottom Right */}
                        {rec.creator && (
                          <Link
                            to={`/profile/${rec.creator.username}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigate(`/profile/${rec.creator.username}`);
                            }}
                            className='absolute bottom-4 right-4 z-10'
                            title={`View ${rec.creator.fullName}'s profile`}
                          >
                            <Avatar
                              src={rec.creator.profilePhoto}
                              name={rec.creator.fullName}
                              size="sm"
                              className="border-2 border-pulse hover:border-pulse/80 transition-colors"
                            />
                          </Link>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
