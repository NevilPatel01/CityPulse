import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from './SearchBar';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import FilterDrawer from './FilterDrawer';
import { searchApi, type FilterOptions, type SearchResult } from '../../services/searchService';

export interface SearchFilters {
    q: string;
    location: string[];
    categories: string[];
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
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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
                filters.priceMin > 0 || filters.minRating > 0 || filters.difficulty !== 'any') {
                performSearch();
            } else {
                // Clear results if no search criteria
                setResults(null);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [filters.q, filters.categories.length, filters.location.length, filters.priceMin, filters.minRating, filters.difficulty, performSearch]);

    // Immediate search when other filters change
    useEffect(() => {
        // Search if there's any criteria selected
        if (filters.q || filters.categories.length > 0 || filters.location.length > 0 ||
            filters.priceMin > 0 || filters.minRating > 0 || filters.difficulty !== 'any') {
            performSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters.location,
        filters.categories,
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
            {/* Header with Search Bar */}
            <div className="sticky top-0 z-30 bg-surface-glass backdrop-blur-glass border-b border-subtle">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <SearchBar
                        value={filters.q}
                        onChange={(q: string) => updateFilters({ q })}
                        onSearch={performSearch}
                        sortBy={filters.sortBy}
                        onSortChange={(sortBy: string) => updateFilters({ sortBy: sortBy as 'relevant' | 'rating' | 'recent' | 'price_low' | 'price_high' })}
                        view={filters.view}
                        onViewChange={(view: 'grid' | 'list') => updateFilters({ view })}
                        onFilterClick={() => setIsFilterDrawerOpen(true)}
                        showFilters={isMobile}
                        resultsCount={results?.total || 0}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Desktop Sidebar Filters */}
                    {!isMobile && filterOptions && (
                        <aside className="w-80 flex-shrink-0">
                            <div className="sticky top-24">
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

            {/* Mobile Filter Drawer */}
            {isMobile && filterOptions && (
                <FilterDrawer
                    isOpen={isFilterDrawerOpen}
                    onClose={() => setIsFilterDrawerOpen(false)}
                    filters={filters}
                    filterOptions={filterOptions}
                    onFilterChange={updateFilters}
                    onReset={resetFilters}
                    onApply={() => {
                        setIsFilterDrawerOpen(false);
                        performSearch();
                    }}
                />
            )}
        </div>
    );
};

export default AdvancedSearch;
