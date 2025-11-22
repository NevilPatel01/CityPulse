import React, { useState, useEffect, useCallback } from 'react';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
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
        priceMax: 50000, // Increased from 500 to 50000
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

    const performSearch = useCallback(async () => {
        setLoading(true);
        try {
            console.log('[SEARCH] Sending filters:', filters);
            const searchResults = await searchApi.advancedSearch(filters);
            console.log('[SEARCH] Received results:', searchResults);
            setResults(searchResults);
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
            // Search if there's query text OR any filters selected
            if (filters.q || filters.categories.length > 0 || filters.location.length > 0 || 
                filters.tags.length > 0 || filters.priceMin > 0 || filters.minRating > 0 || filters.difficulty !== 'any') {
                performSearch();
            } else {
                // Clear results if no search criteria
                setResults(null);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [filters.q, filters.categories.length, filters.location.length, filters.tags.length, filters.priceMin, filters.minRating, filters.difficulty, performSearch]);

    // Immediate search when other filters change
    useEffect(() => {
        // Search if there's any criteria selected
        if (filters.q || filters.categories.length > 0 || filters.location.length > 0 ||
            filters.tags.length > 0 || filters.priceMin > 0 || filters.minRating > 0 || filters.difficulty !== 'any') {
            performSearch();
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

    const resetFilters = () => {
        setFilters({
            q: filters.q, // Keep search query
            location: [],
            categories: [],
            tags: [],
            priceMin: 0,
            priceMax: 50000, // Increased from 500 to 50000
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

    return (
        <div className="min-h-screen bg-base">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
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
                            className="w-full pl-12 pr-4 py-4 bg-surface-glass border border-subtle rounded-xl text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-transparent transition-all"
                            autoFocus
                        />
                        {filters.q && (
                            <button
                                onClick={() => updateFilters({ q: '' })}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-primary transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters and Results Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filters - Always visible, stacked on mobile */}
                    {filterOptions && (
                        <aside className={`${isMobile ? 'w-full' : 'w-80 flex-shrink-0'}`}>
                            <div className={isMobile ? '' : 'sticky top-24'}>
                                <SearchFilters
                                    filters={filters}
                                    filterOptions={filterOptions}
                                    onFilterChange={updateFilters}
                                    onReset={resetFilters}
                                />
                            </div>
                        </aside>
                    )}

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        <SearchResults
                            results={results}
                            loading={loading}
                            view={filters.view}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;
