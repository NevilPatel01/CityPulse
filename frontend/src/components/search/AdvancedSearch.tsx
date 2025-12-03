import React, { useState, useEffect, useCallback } from 'react';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import SearchHistoryList from './SearchHistoryList';
import { searchApi, type FilterOptions, type SearchResult } from '../../services/searchService';

export interface SearchFilters {
    q: string;
    location: string[];
    categories: string[];
    tags: string[];
    priceMin: number;
    priceMax: number;
    minRating: number;
    difficulty: string;
    dateFrom: string;
    dateTo: string;
    dateType: 'created' | 'best_time' | 'both';
    sortBy: 'relevant' | 'rating' | 'recent' | 'price_low' | 'price_high';
    type: 'all' | 'recommendations' | 'users' | 'cities';
    view: 'grid' | 'list';
}

const AdvancedSearch: React.FC = () => {
    const [filters, setFilters] = useState<SearchFilters>({
        q: '',
        location: [],
        categories: [],
        tags: [],
        priceMin: 0,
        priceMax: 1000,
        minRating: 0,
        difficulty: 'any',
        dateFrom: '',
        dateTo: '',
        dateType: 'both',
        sortBy: 'relevant',
        type: 'all',
        view: 'grid'
    });

    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [results, setResults] = useState<{
        recommendations: SearchResult[];
        users: SearchResult[];
        cities: SearchResult[];
        total: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const performSearch = useCallback(async () => {
        setLoading(true);
        try {
            console.log('[SEARCH] Sending filters:', filters);
            const searchResults = await searchApi.advancedSearch(filters);
            console.log('[SEARCH] Received results:', searchResults);
            setResults(searchResults);
            
            // Save search history (backend auto-saves, but we can ensure it has filter info)
            if (filters.q.trim()) {
                try {
                    await searchApi.saveSearchHistory(
                        filters.q.trim(),
                        {
                            location: filters.location,
                            categories: filters.categories,
                            tags: filters.tags,
                            priceMin: filters.priceMin,
                            priceMax: filters.priceMax,
                            minRating: filters.minRating,
                            difficulty: filters.difficulty,
                            dateFrom: filters.dateFrom,
                            dateTo: filters.dateTo,
                            sortBy: filters.sortBy,
                            type: filters.type
                        },
                        searchResults.total
                    );
                } catch (error) {
                    // Don't fail the search if history save fails
                    console.error('Failed to save search history:', error);
                }
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const loadFilterOptions = useCallback(async () => {
        try {
            const options = await searchApi.getFilters();
            setFilterOptions(options);
        } catch (error) {
            console.error('Failed to load filter options:', error);
        }
    }, []);

    // Check if mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load filter options on mount
    useEffect(() => {
        loadFilterOptions();
    }, [loadFilterOptions]);

    // Debounced search when query changes
    useEffect(() => {
        // Only debounce the search query, not other filters
        const timer = setTimeout(() => {
            // Search if there's query text OR any filters selected (including location, price range, etc.)
            const hasFilters = filters.categories.length > 0 || 
                             filters.location.length > 0 || 
                             filters.tags.length > 0 || 
                             filters.priceMin > 0 || 
                             filters.priceMax < 1000 ||
                             filters.minRating > 0 || 
                             filters.difficulty !== 'any' ||
                             filters.dateFrom || 
                             filters.dateTo;
            
            if (filters.q || hasFilters) {
                performSearch();
            } else {
                // Clear results if no search criteria
                setResults(null);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [filters.q, filters.categories.length, filters.location.length, filters.tags.length, filters.priceMin, filters.priceMax, filters.minRating, filters.difficulty, filters.dateFrom, filters.dateTo, performSearch]);

    // Immediate search when other filters change
    useEffect(() => {
        // Search if there's any criteria selected (including filters without query)
        const hasFilters = filters.categories.length > 0 || 
                         filters.location.length > 0 ||
                         filters.tags.length > 0 || 
                         filters.priceMin > 0 || 
                         filters.priceMax < 1000 ||
                         filters.minRating > 0 || 
                         filters.difficulty !== 'any' ||
                         filters.dateFrom || 
                         filters.dateTo;
        
        if (filters.q || hasFilters) {
            performSearch();
        } else {
            // Clear results if no search criteria
            setResults(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters.location,
        filters.categories,
        filters.tags,
        filters.priceMin,
        filters.priceMax,
        filters.minRating,
        filters.difficulty,
        filters.dateFrom,
        filters.dateTo,
        filters.dateType,
        filters.sortBy,
        filters.type
    ]);

    const updateFilters = (updates: Partial<SearchFilters>) => {
        setFilters((prev: SearchFilters) => ({ ...prev, ...updates }));
    };

    const handleSelectHistory = (query: string, historyFilters?: Record<string, unknown>) => {
        // Clear all filters first
        const updates: Partial<SearchFilters> = {
            q: query,
            location: [],
            categories: [],
            tags: [],
            priceMin: 0,
            priceMax: 1000,
            minRating: 0,
            difficulty: 'any',
            dateFrom: '',
            dateTo: '',
            dateType: 'both',
            sortBy: 'relevant',
            type: 'all'
        };
        
        // Restore filters from history if they exist
        if (historyFilters) {
            if (historyFilters.location) updates.location = historyFilters.location as string[];
            if (historyFilters.categories) updates.categories = historyFilters.categories as string[];
            if (historyFilters.tags) updates.tags = historyFilters.tags as string[];
            if (historyFilters.priceMin !== undefined) updates.priceMin = historyFilters.priceMin as number;
            if (historyFilters.priceMax !== undefined) updates.priceMax = historyFilters.priceMax as number;
            if (historyFilters.minRating !== undefined) updates.minRating = historyFilters.minRating as number;
            if (historyFilters.difficulty) updates.difficulty = historyFilters.difficulty as string;
            if (historyFilters.dateFrom) updates.dateFrom = historyFilters.dateFrom as string;
            if (historyFilters.dateTo) updates.dateTo = historyFilters.dateTo as string;
            if (historyFilters.sortBy) updates.sortBy = historyFilters.sortBy as SearchFilters['sortBy'];
            if (historyFilters.type) updates.type = historyFilters.type as SearchFilters['type'];
        }
        
        updateFilters(updates);
        setShowHistory(false);
    };

    const resetFilters = () => {
        setFilters({
            q: filters.q, // Keep search query
            location: [],
            categories: [],
            tags: [],
            priceMin: 0,
            priceMax: 1000,
            minRating: 0,
            difficulty: 'any',
            dateFrom: '',
            dateTo: '',
            dateType: 'both',
            sortBy: 'relevant',
            type: 'all',
            view: filters.view
        });
    };

    // Check if any filters are active
    const hasActiveFilters = filters.categories.length > 0 || 
                            filters.location.length > 0 ||
                            filters.tags.length > 0 ||
                            filters.priceMin > 0 ||
                            filters.priceMax < 1000 ||
                            filters.minRating > 0 ||
                            (filters.difficulty && filters.difficulty !== 'any') ||
                            filters.dateFrom || 
                            filters.dateTo;

    return (
        <div className="min-h-screen bg-base">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={filters.q}
                                onChange={(e) => updateFilters({ q: e.target.value })}
                                placeholder="Search places, friends, or experiences..."
                                className="w-full pl-12 pr-20 py-4 bg-surface-glass border border-subtle rounded-xl text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-transparent transition-all"
                                autoFocus
                                aria-label="Search query"
                                aria-describedby="search-help"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                                {filters.q && (
                                    <button
                                        onClick={() => updateFilters({ q: '' })}
                                        className="p-1 text-muted hover:text-primary transition-colors"
                                        aria-label="Clear search query"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        showHistory 
                                            ? 'bg-pulse text-white' 
                                            : 'text-muted hover:text-primary hover:bg-surface-glass'
                                    }`}
                                    aria-label="Toggle search history"
                                    title="Search history"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Mobile Filter Button */}
                        {isMobile && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFilters(!showFilters);
                                }}
                                className={`flex-shrink-0 px-4 py-4 rounded-xl border transition-all ${
                                    showFilters || hasActiveFilters 
                                        ? 'bg-pulse border-pulse text-white' 
                                        : 'bg-surface-glass border-subtle text-primary hover:border-pulse'
                                }`}
                                aria-label="Toggle filters"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <span id="search-help" className="sr-only">Type to search for recommendations, users, or cities. Use filters below to refine your search.</span>
                </div>

                {/* Filters and Results Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters - Toggleable on mobile, always visible on desktop */}
                    {filterOptions && !showHistory && (
                        <>
                            {/* Mobile Filter Modal/Overlay */}
                            {isMobile && showFilters && (
                                <div 
                                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                    onClick={() => setShowFilters(false)}
                                />
                            )}
                            
                            {/* Filters Sidebar */}
                            <aside className={`
                                ${isMobile 
                                    ? `fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-base z-50 transform transition-transform duration-300 overflow-y-auto ${
                                        showFilters ? 'translate-x-0' : 'translate-x-full'
                                    } lg:relative lg:translate-x-0 lg:w-80` 
                                    : 'w-80 flex-shrink-0'
                                }
                            `}>
                                <div className={isMobile ? 'p-4' : 'sticky top-24'}>
                                    {/* Mobile Filter Header */}
                                    {isMobile && (
                                        <div className="flex items-center justify-between mb-4 lg:hidden">
                                            <h2 className="text-xl font-bold text-primary">Filters</h2>
                                            <button
                                                onClick={() => setShowFilters(false)}
                                                className="p-2 text-muted hover:text-primary transition-colors"
                                                aria-label="Close filters"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                    
                                    <SearchFilters
                                        filters={filters}
                                        filterOptions={filterOptions}
                                        onFilterChange={updateFilters}
                                        onReset={resetFilters}
                                    />
                                    
                                    {/* Mobile Apply Button */}
                                    {isMobile && (
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="w-full mt-6 py-3 bg-pulse text-white font-medium rounded-xl hover:bg-pulse/80 transition-colors lg:hidden"
                                        >
                                            Apply Filters
                                        </button>
                                    )}
                                </div>
                            </aside>
                        </>
                    )}

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        {showHistory ? (
                            /* Search History List - with proper background */
                            <div className="relative z-10 bg-surface-glass rounded-xl p-4 border border-subtle">
                                <SearchHistoryList
                                    onSelectSearch={handleSelectHistory}
                                />
                            </div>
                        ) : (
                            <>
                                {/* Results Header with View Toggle */}
                                {(results && results.total > 0) && (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                        {/* Results Count and Sort */}
                                        <div className="flex items-center justify-between sm:justify-start gap-2">
                                            <h2 className="text-lg sm:text-xl font-bold text-primary">
                                                {results.total} {results.total === 1 ? 'Result' : 'Results'}
                                            </h2>
                                            
                                            {/* Sort Dropdown */}
                                            <div className="sm:ml-4">
                                                <select
                                                    value={filters.sortBy}
                                                    onChange={(e) => updateFilters({ sortBy: e.target.value as 'relevant' | 'rating' | 'recent' | 'price_low' | 'price_high' })}
                                                    className="px-3 py-2 bg-surface-glass border border-subtle rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-pulse transition-all"
                                                >
                                                    <option value="relevant">Most Relevant</option>
                                                    <option value="rating">Highest Rated</option>
                                                    <option value="recent">Most Recent</option>
                                                    <option value="price_low">Price: Low to High</option>
                                                    <option value="price_high">Price: High to Low</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* View Toggle */}
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                onClick={() => updateFilters({ view: 'grid' })}
                                                className={`p-2 rounded-lg transition-all ${
                                                    filters.view === 'grid'
                                                        ? 'bg-pulse text-white'
                                                        : 'bg-surface-glass text-muted hover:text-primary hover:bg-surface-glass/80'
                                                }`}
                                                aria-label="Grid view"
                                                title="Grid view"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => updateFilters({ view: 'list' })}
                                                className={`p-2 rounded-lg transition-all ${
                                                    filters.view === 'list'
                                                        ? 'bg-pulse text-white'
                                                        : 'bg-surface-glass text-muted hover:text-primary hover:bg-surface-glass/80'
                                                }`}
                                                aria-label="List view"
                                                title="List view"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <SearchResults
                                    results={results}
                                    loading={loading}
                                    view={filters.view}
                                />
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;
