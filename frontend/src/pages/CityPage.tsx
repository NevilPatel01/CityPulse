import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      {/* Hero Section with City Cover */}
      <div className='relative h-80 bg-surface-glass'>
        {city.coverImage ? (
          <img
            src={city.coverImage}
            alt={city.name}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-pulse/20 to-transparent'>
            <h1 className='text-6xl font-bold text-pulse'>{city.name}</h1>
          </div>
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-base via-base/50 to-transparent' />

        {/* City Info Overlay */}
        <div className='absolute bottom-0 left-0 right-0 p-8'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-5xl font-bold text-text-primary mb-2'>
              {city.name}
            </h1>
            <p className='text-text-muted text-lg mb-4'>{city.country}</p>
            {city.description && (
              <p className='text-text-primary max-w-3xl line-clamp-2'>
                {city.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className='bg-surface-glass backdrop-blur-glass border-b border-border-subtle'>
        <div className='max-w-7xl mx-auto px-8 py-6'>
          <div className='flex gap-12'>
            <div>
              <div className='text-3xl font-bold text-pulse'>
                {city.stats.total_recommendations}
              </div>
              <div className='text-text-muted text-sm'>Recommendations</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-pulse'>
                {city.stats.contributors}
              </div>
              <div className='text-text-muted text-sm'>Contributors</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-pulse'>
                {city.stats.visitors}
              </div>
              <div className='text-text-muted text-sm'>Visitors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className='max-w-7xl mx-auto px-8 py-6'>
        <div className='flex gap-3 overflow-x-auto scrollbar-hide pb-2'>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-pulse text-base font-medium'
                : 'bg-surface-glass text-text-primary hover:bg-surface-glass/80'
            }`}
          >
            All ({city.stats.total_recommendations})
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-6 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === category.name
                  ? 'bg-pulse text-base font-medium'
                  : 'bg-surface-glass text-text-primary hover:bg-surface-glass/80'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className='max-w-7xl mx-auto px-8'>
        {recommendations.length === 0 ? (
          <div className='text-center py-20'>
            <p className='text-text-muted text-lg'>No recommendations found</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => navigate(`/recommendations/${rec.id}`)}
                className='bg-surface-glass backdrop-blur-glass rounded-2xl overflow-hidden hover-lift cursor-pointer border border-border-subtle'
              >
                {/* Image */}
                <div className='relative h-48 bg-base/50'>
                  {rec.photos && rec.photos.length > 0 ? (
                    <img
                      src={rec.photos[0].url}
                      alt={rec.title}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <span className='text-text-muted'>No image</span>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div
                    className='absolute top-3 right-3 px-3 py-1 bg-pulse font-medium rounded-full'
                    style={{ color: 'var(--base)' }}
                  >
                    {rec.category.name}
                  </div>
                </div>

                {/* Content */}
                <div className='p-5'>
                  <h3 className='text-xl font-semibold text-text-primary mb-2 line-clamp-1'>
                    {rec.title}
                  </h3>
                  <p className='text-text-muted text-sm mb-4 line-clamp-2'>
                    {rec.description}
                  </p>

                  {/* Creator */}
                  <div className='flex items-center gap-2 mb-4'>
                    {rec.creator.profilePhoto ? (
                      <img
                        src={rec.creator.profilePhoto}
                        alt={rec.creator.fullName}
                        className='w-6 h-6 rounded-full'
                      />
                    ) : (
                      <div className='w-6 h-6 rounded-full bg-pulse/20 flex items-center justify-center'>
                        <span className='text-pulse text-xs'>
                          {rec.creator.fullName[0]}
                        </span>
                      </div>
                    )}
                    <span className='text-text-muted text-sm'>
                      {rec.creator.fullName}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className='flex items-center gap-4 text-text-muted text-sm'>
                    <div className='flex items-center gap-1'>
                      <span>⭐</span>
                      <span>
                        {rec.avgRating > 0
                          ? rec.avgRating.toFixed(1)
                          : rec.userRating}
                      </span>
                      {rec.ratingsCount > 0 && (
                        <span className='text-xs'>({rec.ratingsCount})</span>
                      )}
                    </div>
                    <div className='flex items-center gap-1'>
                      <span>👁️</span>
                      <span>{rec.viewsCount}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span>💾</span>
                      <span>{rec.savesCount}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {rec.tags && rec.tags.length > 0 && (
                    <div className='flex flex-wrap gap-2 mt-4'>
                      {rec.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className='px-2 py-1 bg-base/50 text-text-muted text-xs rounded-full'
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
