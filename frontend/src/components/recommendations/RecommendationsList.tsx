import React, { useState, useEffect, useCallback } from 'react';
import { RecommendationCard } from './RecommendationCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui';
import { useSafeToast } from '../../hooks/useSafeToast';
import { apiRequest } from '../../config/api';

interface Recommendation {
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
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface City {
  id: number;
  name: string;
  country: string;
  state_province?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface RecommendationsApiResponse {
  success: boolean;
  data: {
    recommendations: Recommendation[];
    pagination: Pagination;
  };
  message?: string;
}

interface RecommendationsListProps {
  userId?: number;
  showActions?: boolean;
  className?: string;
}

export function RecommendationsList({ userId, showActions = false, className = '' }: RecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    city_id: ''
  });
  const [searchDebounce, setSearchDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const { showError } = useSafeToast();

  const loadData = useCallback(async () => {
    try {
      // Load categories and cities in parallel using apiRequest
      const [categoriesResponse, citiesResponse] = await Promise.all([
        apiRequest<{success: boolean; data: Category[]}>('/api/recommendations/categories'),
        apiRequest<{success: boolean; data: City[]}>('/api/recommendations/cities')
      ]);

      if (categoriesResponse && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (citiesResponse && citiesResponse.data) {
        setCities(citiesResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
        showError('Failed to load form data');
    }
  }, [showError]);

  const loadRecommendations = useCallback(async (page = 1, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.city_id) params.append('city_id', filters.city_id);
      if (userId) params.append('user_id', userId.toString());

      const data = await apiRequest<RecommendationsApiResponse>(`/api/recommendations?${params}`);

      if (data && data.success) {
        if (reset) {
          setRecommendations(data.data.recommendations);
        } else {
          setRecommendations(prev => [...prev, ...data.data.recommendations]);
        }
        setPagination(data.data.pagination);
      } else {
        showError(data?.message || 'Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      showError('An error occurred while loading recommendations');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.limit, showError, userId]);

  // Load initial data
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load recommendations when filters change (with debounce for search)
  useEffect(() => {
    // For category/city filters, load immediately (no debounce needed)
    if (filters.category_id || filters.city_id) {
      void loadRecommendations(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category_id, filters.city_id]); // Only reload immediately for category/city changes

  // Separate effect for search debounce
  useEffect(() => {
    // Clear existing timeout
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    if (filters.search) {
      const timeout = setTimeout(() => {
        void loadRecommendations(1, true);
      }, 500);
      setSearchDebounce(timeout);
    } else if (!filters.search && filters.category_id === '' && filters.city_id === '') {
      // If search is cleared and no other filters, load immediately
      void loadRecommendations(1, true);
    }

    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loadingMore) {
      void loadRecommendations(pagination.page + 1, false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any pending debounce and search immediately
    if (searchDebounce) {
      clearTimeout(searchDebounce);
      setSearchDebounce(null);
    }
    void loadRecommendations(1, true);
  };

  const handleDelete = () => {
    // Refresh the list after deletion
    void loadRecommendations(pagination.page, true);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface-glass backdrop-blur-glass rounded-2xl p-4 animate-pulse border border-subtle shadow-glass">
              <div className="h-48 bg-surface-glass rounded-2xl mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-surface-glass rounded w-3/4"></div>
                <div className="h-3 bg-surface-glass rounded w-1/2"></div>
                <div className="h-3 bg-surface-glass rounded w-full"></div>
                <div className="h-3 bg-surface-glass rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <div className="bg-surface-glass backdrop-blur-glass rounded-2xl p-4 border border-subtle shadow-glass">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Search recommendations..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="bg-surface-glass border-subtle text-primary"
            />
            
            <Select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="bg-surface-glass border-subtle text-primary"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>

            <Select
              value={filters.city_id}
              onChange={(e) => handleFilterChange('city_id', e.target.value)}
              className="bg-surface-glass border-subtle text-primary"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.country}
                </option>
              ))}
            </Select>

            <Button
              type="submit"
              className="bg-pulse hover:bg-pulse/80 text-white"
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted">
          {pagination.total} recommendations found
        </p>
        {pagination.pages > 1 && (
          <p className="text-muted">
            Page {pagination.page} of {pagination.pages}
          </p>
        )}
      </div>

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map(recommendation => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                showActions={showActions}
                onDelete={handleDelete}
                onUpdate={(id, updates) => {
                  // Update local state when like/bookmark changes
                  setRecommendations(prev => 
                    prev.map(rec => 
                      rec.id === id ? { ...rec, ...updates } : rec
                    )
                  );
                }}
              />
            ))}
          </div>

          {/* Load More Button */}
          {pagination.page < pagination.pages && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-pulse hover:bg-pulse/80 text-white"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.709A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">No recommendations found</h3>
          <p className="text-muted">
            {filters.search || filters.category_id || filters.city_id
              ? 'Try adjusting your filters to see more results.'
              : 'Be the first to share a recommendation!'}
          </p>
        </div>
      )}
    </div>
  );
}
