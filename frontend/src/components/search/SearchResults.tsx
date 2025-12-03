import React, { useMemo } from 'react';
import type { SearchResult } from '../../services/searchService';
import ResultCard from './ResultCard';
import { LoadingInline } from '../ui/LoadingSpinner';

interface SearchResultsProps {
    results: {
        recommendations: SearchResult[];
        users: SearchResult[];
        cities: SearchResult[];
        total: number;
    } | null;
    loading: boolean;
    view: 'grid' | 'list';
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, view }) => {
    // Combine and shuffle all results (recommendations, cities) while keeping users separate
    const { mixedResults, userResults } = useMemo(() => {
        if (!results) return { mixedResults: [], userResults: [] };
        
        // Combine recommendations and cities (these are "content" items that should be mixed)
        const contentItems = [
            ...results.recommendations,
            ...results.cities
        ];
        
        // Shuffle the combined content items
        const shuffled = shuffleArray(contentItems);
        
        return {
            mixedResults: shuffled,
            userResults: results.users
        };
    }, [results]);

    if (loading) {
        return <LoadingInline message="Searching..." />;
    }

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <svg className="w-24 h-24 text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-primary mb-2">Start Your Search</h3>
                <p className="text-muted text-center max-w-md">
                    Enter a search term or select filters to discover amazing places, activities, and travel buddies.
                </p>
            </div>
        );
    }

    if (results.total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <svg className="w-24 h-24 text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-primary mb-2">No Results Found</h3>
                <p className="text-muted text-center max-w-md">
                    Try adjusting your filters or search terms to find what you're looking for.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Mixed Content Section (Recommendations + Cities shuffled together) */}
            {mixedResults.length > 0 && (
                <section aria-labelledby="content-heading">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 id="content-heading" className="text-xl font-bold text-primary">Discover</h2>
                        <span className="px-3 py-1 bg-pulse text-pulse-fg text-sm font-semibold rounded-full">
                            {mixedResults.length}
                        </span>
                    </div>
                    <div className={
                        view === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                            : 'space-y-4'
                    }>
                        {mixedResults.map((item, index) => (
                            <ResultCard
                                key={`${item.type}-${item.id}-${index}`}
                                item={item}
                                view={view}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Users Section - kept separate as they are different from content */}
            {userResults.length > 0 && (
                <section aria-labelledby="users-heading">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 id="users-heading" className="text-xl font-bold text-primary">Travel Buddies</h2>
                        <span className="px-3 py-1 bg-accent-teal text-pulse-fg text-sm font-semibold rounded-full">
                            {userResults.length}
                        </span>
                    </div>
                    <div className={
                        view === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                            : 'space-y-4'
                    }>
                        {userResults.map((item) => (
                            <ResultCard
                                key={`user-${item.id}`}
                                item={item}
                                view={view}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default SearchResults;
