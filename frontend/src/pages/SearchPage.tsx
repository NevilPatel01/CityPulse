import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { buildApiUrl } from '../config/api';

interface SearchResult {
  id: number;
  type: 'recommendation' | 'user' | 'city';
  title?: string;
  name?: string;
  description?: string;
  bio?: string;
  location?: string;
  city?: string;
  imageUrl?: string;
  profilePicture?: string;
  category?: string;
  author?: {
    username: string;
    fullName: string;
    profilePicture: string;
  };
  username?: string;
  fullName?: string;
  likesCount?: number;
  rating?: string;
  connectionsCount?: number;
  recommendationsCount?: number;
  mentionsCount?: number;
  contributorsCount?: number;
}

interface SearchResults {
  recommendations: SearchResult[];
  users: SearchResult[];
  cities: SearchResult[];
  total: number;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResults>({
    recommendations: [],
    users: [],
    cities: [],
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recommendations' | 'users' | 'cities'>('all');
  
  // Local search input state
  const [searchQuery, setSearchQuery] = useState('');

  useAuthGuard({ requireAuth: true });

  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';

  // Update local search state when URL params change
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/search');
  };

  // Set initial tab based on URL type parameter
  useEffect(() => {
    if (type && ['recommendations', 'users', 'cities'].includes(type)) {
      setActiveTab(type as 'recommendations' | 'users' | 'cities');
    }
  }, [type]);

  // Perform search when query changes
  useEffect(() => {
    if (query.trim()) {
      performSearch(query.trim());
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${buildApiUrl('api/search')}?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'recommendations' | 'users' | 'cities') => {
    setActiveTab(tab);
    // Update URL to reflect the active tab
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'all') {
      newParams.delete('type');
    } else {
      newParams.set('type', tab);
    }
    setSearchParams(newParams);
  };

  const getActiveResults = () => {
    switch (activeTab) {
      case 'recommendations':
        return results.recommendations;
      case 'users':
        return results.users;
      case 'cities':
        return results.cities;
      default:
        return [...results.recommendations, ...results.users, ...results.cities];
    }
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-base">
        <Header />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="text-muted mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-primary mb-2">Search CityPulse</h1>
              <p className="text-muted">Enter a search term to find places, people, and experiences</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />
      <main className="pt-16 pb-20 lg:pb-8"> 
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Search Input - Always visible and properly functional */}
          <div className="mb-6">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search places, users, or cities..."
                  className="w-full bg-surface-glass border border-subtle rounded-lg px-4 py-3 pr-20 text-base text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse transition-all duration-200 hover:border-pulse/50"
                />
                
                {/* Clear button (when there's text) */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-700/50 transition-colors duration-200"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4 text-muted hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Search button */}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-md hover:bg-pulse/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">
              {query ? `Search Results for "${query}"` : 'Search'}
            </h1>
            {!loading && query && (
              <p className="text-muted">
                {results.total} result{results.total !== 1 ? 's' : ''} found
              </p>
            )}
            {!query && (
              <p className="text-muted">
                Search for places, users, or cities to discover new experiences
              </p>
            )}
          </div>

          {/* Filter Tabs - Mobile Optimized */}
          <div className="mb-8">
            <div className="border-b border-subtle">
              {/* Mobile: Scrollable tabs */}
              <nav className="flex space-x-6 overflow-x-auto scrollbar-hide md:space-x-8">
                {[
                  { key: 'all', label: 'All', count: results.total },
                  { key: 'recommendations', label: 'Places', count: results.recommendations.length },
                  { key: 'users', label: 'People', count: results.users.length },
                  { key: 'cities', label: 'Cities', count: results.cities.length },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key as 'all' | 'recommendations' | 'users' | 'cities')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center ${
                      activeTab === key
                        ? 'border-pulse text-pulse'
                        : 'border-transparent text-muted hover:text-primary hover:border-gray-300'
                    }`}
                  >
                    {label} {!loading && count > 0 && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        activeTab === key ? 'bg-pulse/10 text-pulse' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse mx-auto mb-4"></div>
              <p className="text-muted">Searching...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">Search Error</h3>
              <p className="text-muted">{error}</p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && results.total > 0 && (
            <div className="space-y-6">
              {getActiveResults().map((result, index) => (
                <SearchResultCard key={`${result.type}-${result.id}-${index}`} result={result} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && results.total === 0 && query && (
            <div className="text-center py-12">
              <div className="text-muted mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">No results found</h3>
              <p className="text-muted">Try searching with different keywords or check your spelling</p>
            </div>
          )}

          {/* Welcome State - No query */}
          {!loading && !error && !query && (
            <div className="text-center py-12">
              <div className="text-pulse mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Discover Amazing Places</h3>
              <p className="text-muted mb-6 max-w-md mx-auto">Search for recommendations, connect with fellow travelers, or explore cities around the world</p>
              
              {/* Quick Search Suggestions */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {['Coffee shops', 'Restaurants', 'Hidden gems', 'Tourist spots', 'Local favorites'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('q', suggestion);
                      setSearchParams(params);
                    }}
                    className="bg-surface-glass hover:bg-pulse/10 border border-subtle hover:border-pulse/50 text-primary px-3 py-2 rounded-lg text-sm transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}

// Search Result Card Component
const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  if (result.type === 'recommendation') {
    return (
      <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 md:p-6 hover:border-pulse/50 transition-all duration-200 active:scale-[0.99]">
        <div className="flex gap-3 md:gap-4">
          {result.imageUrl && (
            <img
              src={result.imageUrl}
              alt={result.title}
              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-primary mb-1 line-clamp-1">
                  {result.title}
                </h3>
                <p className="text-sm text-muted mb-2">
                  📍 {result.location} • {result.city}
                </p>
              </div>
              {result.category && (
                <span className="bg-pulse/10 text-pulse px-2 py-1 rounded-md text-xs font-medium ml-2 flex-shrink-0">
                  {result.category}
                </span>
              )}
            </div>
            <p className="text-muted text-sm mb-3 line-clamp-2">
              {result.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-muted">
                {result.author && (
                  <span>By {result.author.fullName}</span>
                )}
                {result.likesCount && result.likesCount > 0 && (
                  <span>❤️ {result.likesCount}</span>
                )}
                {result.rating && (
                  <span>⭐ {result.rating}</span>
                )}
              </div>
              <Link
                to={`/recommendations/${result.id}`}
                className="text-pulse hover:text-pulse/80 text-sm font-medium py-2 px-1 -mr-1 min-h-[44px] flex items-center"
              >
                View Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.type === 'user') {
    return (
      <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 md:p-6 hover:border-pulse/50 transition-all duration-200 active:scale-[0.99]">
        <div className="flex gap-3 md:gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 bg-pulse">
            {result.profilePicture ? (
              <img
                src={result.profilePicture}
                alt={result.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {result.fullName?.charAt(0) || result.username?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">
                  {result.fullName}
                </h3>
                <p className="text-sm text-pulse">@{result.username}</p>
              </div>
            </div>
            {result.bio && (
              <p className="text-muted text-sm mb-3 line-clamp-2">
                {result.bio}
              </p>
            )}
            {result.location && (
              <p className="text-xs text-muted mb-3">📍 {result.location}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-muted">
                {result.recommendationsCount && result.recommendationsCount > 0 && (
                  <span>{result.recommendationsCount} recommendations</span>
                )}
                {result.connectionsCount && result.connectionsCount > 0 && (
                  <span>{result.connectionsCount} connections</span>
                )}
              </div>
              <Link
                to={`/profile/${result.username}`}
                className="text-pulse hover:text-pulse/80 text-sm font-medium py-2 px-1 -mr-1 min-h-[44px] flex items-center"
              >
                View Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.type === 'city') {
    return (
      <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 md:p-6 hover:border-pulse/50 transition-all duration-200 active:scale-[0.99]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-primary mb-2">
              🏙️ {result.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted">
              {result.mentionsCount && (
                <span>{result.mentionsCount} recommendations</span>
              )}
              {result.contributorsCount && (
                <span>{result.contributorsCount} contributors</span>
              )}
            </div>
          </div>
          <Link
            to={`/search?q=${encodeURIComponent(result.name || '')}&type=recommendations`}
            className="text-pulse hover:text-pulse/80 text-sm font-medium py-2 px-1 -mr-1 min-h-[44px] flex items-center ml-2 flex-shrink-0"
          >
            Explore {result.name} →
          </Link>
        </div>
      </div>
    );
  }

  return null;
};
