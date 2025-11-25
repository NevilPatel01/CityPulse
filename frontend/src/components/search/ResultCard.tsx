import React from 'react';
import { Link } from 'react-router-dom';
import type { SearchResult } from '../../services/searchService';
import { useSearchOverlay } from '../../context/SearchOverlayContext';
import { apiConfig } from '../../config/api';

interface ResultCardProps {
    item: SearchResult;
    view: 'grid' | 'list';
}

const ResultCard: React.FC<ResultCardProps> = ({ item, view }) => {
    const { closeSearch } = useSearchOverlay();
    
    // Format price display
    const formatPrice = () => {
        if (!item.price) return null;
        return item.price.display;
    };

    // Format difficulty level
    const formatDifficulty = (level?: string) => {
        if (!level) return null;
        const colors = {
            easy: 'bg-green-500',
            medium: 'bg-yellow-500',
            moderate: 'bg-yellow-500',
            hard: 'bg-red-500'
        };
        return (
            <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${colors[level as keyof typeof colors] || 'bg-surface-glass'}`}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
        );
    };

    // Render star rating
    const renderStars = (rating?: number) => {
        if (!rating || rating === 0) return null;
        
        return (
            <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                    <svg
                        key={i}
                        className={`w-4 h-4 ${i < rating ? 'text-accent-amber' : 'text-muted'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.95l-2.8 2.179a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.179a1 1 0 00-1.175 0l-2.8 2.179c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.858c-.783-.71-.38-1.95.588-1.95h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="text-sm text-muted">({rating})</span>
            </div>
        );
    };

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (view === 'list') {
        return <ResultCardList item={item} formatPrice={formatPrice} formatDifficulty={formatDifficulty} renderStars={renderStars} formatDate={formatDate} closeSearch={closeSearch} />;
    }

    return <ResultCardGrid item={item} formatPrice={formatPrice} formatDifficulty={formatDifficulty} renderStars={renderStars} formatDate={formatDate} closeSearch={closeSearch} />;
};

// Grid View Card - Matching Profile Card Design
interface CardHelpersProps {
    item: SearchResult;
    formatPrice: () => string | null;
    formatDifficulty: (level?: string) => React.ReactElement | null;
    renderStars: (rating?: number) => React.ReactElement | null;
    formatDate: (dateString?: string) => string | null;
    closeSearch: () => void;
}

const ResultCardGrid: React.FC<CardHelpersProps> = ({ item, formatPrice, closeSearch }) => {
    const getDefaultImage = () => {
        if (item.type === 'city') {
            return 'https://via.placeholder.com/400x300?text=City';
        }
        return 'https://via.placeholder.com/400x300?text=Recommendation';
    };

    // Get the full image URL
    const getImageUrl = () => {
        if (!item.imageUrl) return getDefaultImage();
        // If it's already a full URL (starts with http), use it as is
        if (item.imageUrl.startsWith('http')) return item.imageUrl;
        // Otherwise, prepend the API base URL
        return `${apiConfig.baseUrl}${item.imageUrl}`;
    };

    return (
        <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass overflow-hidden hover:shadow-xl transition-all border border-subtle group">
            {/* Image */}
            <div className="relative h-52 bg-surface-glass overflow-hidden">
                <img
                    src={getImageUrl()}
                    alt={item.title || 'Image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = getDefaultImage();
                    }}
                />
                
                {/* Category Badge */}
                {item.category && (
                    <div className="absolute top-3 left-3">
                        <span className="bg-pulse text-white text-xs font-semibold px-3 py-1 rounded-md shadow-lg">
                            {typeof item.category === 'string' ? item.category : item.category.name}
                        </span>
                    </div>
                )}

                {/* Rating Badge */}
                {item.stats && item.stats.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-base/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
                        <svg className="w-4 h-4 text-accent-amber" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.95l-2.8 2.179a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.179a1 1 0 00-1.175 0l-2.8 2.179c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.858c-.783-.71-.38-1.95.588-1.95h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-primary">{item.stats.rating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                {/* Title */}
                <Link
                    to={item.type === 'recommendation' ? `/recommendations/${item.id}` : 
                        item.type === 'city' ? `/city/${item.title}` : 
                        `/profile/${item.author?.username}`}
                    onClick={closeSearch}
                    className="text-lg font-bold text-primary hover:text-pulse transition-colors line-clamp-1 block"
                >
                    {item.title || 'Untitled'}
                </Link>

                {/* Location, Price, Duration */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    {item.city && item.type !== 'city' && (
                        <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="line-clamp-1">{typeof item.city === 'string' ? item.city : item.city.name}</span>
                        </span>
                    )}
                    {formatPrice() ? (
                        <span className="inline-flex items-center gap-1 font-medium text-pulse">
                            {formatPrice()}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-green-600">
                            Free
                        </span>
                    )}
                    {item.duration && (
                        <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.duration}
                        </span>
                    )}
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-primary text-sm line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-subtle">
                    <button
                        className="p-2 text-primary bg-surface-glass hover:bg-subtle border border-subtle rounded-lg transition-colors"
                        aria-label="Save"
                        title="Save"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                    <button
                        className="p-2 text-primary bg-surface-glass hover:bg-subtle border border-subtle rounded-lg transition-colors"
                        aria-label="Share"
                        title="Share"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <Link
                        to={item.type === 'recommendation' ? `/recommendations/${item.id}` : 
                            item.type === 'city' ? `/city/${item.title}` : 
                            `/profile/${item.author?.username}`}
                        onClick={closeSearch}
                        className="ml-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent-amber to-amber-500 hover:from-amber-500 hover:to-accent-amber rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

// List View Card - Matching image design
const ResultCardList: React.FC<CardHelpersProps> = ({ item, formatPrice, closeSearch }) => {
    const getDefaultImage = () => {
        if (item.type === 'city') {
            return 'https://via.placeholder.com/400x300?text=City';
        }
        return 'https://via.placeholder.com/400x300?text=Recommendation';
    };

    // Get the full image URL
    const getImageUrl = () => {
        if (!item.imageUrl) return getDefaultImage();
        // If it's already a full URL (starts with http), use it as is
        if (item.imageUrl.startsWith('http')) return item.imageUrl;
        // Otherwise, prepend the API base URL
        return `${apiConfig.baseUrl}${item.imageUrl}`;
    };

    return (
        <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass overflow-hidden hover:shadow-xl transition-shadow border border-subtle">
            <div className="flex flex-col sm:flex-row gap-0">
                {/* Image */}
                <div className="relative w-full sm:w-72 h-56 bg-surface-glass flex-shrink-0">
                    <img
                        src={getImageUrl()}
                        alt={item.title || 'Image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = getDefaultImage();
                        }}
                    />
                    
                    {/* Category Badge */}
                    {item.category && (
                        <div className="absolute top-3 left-3">
                            <span className="bg-pulse text-white text-xs font-semibold px-3 py-1 rounded-md">
                                {typeof item.category === 'string' ? item.category : item.category.name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="space-y-3">
                        {/* Title and Rating Row */}
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-xl font-bold text-primary flex-1">
                                {item.title || 'Untitled'}
                            </h3>
                            {item.stats && item.stats.rating > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-5 h-5 text-accent-amber" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.95l-2.8 2.179a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.179a1 1 0 00-1.175 0l-2.8 2.179c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.858c-.783-.71-.38-1.95.588-1.95h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-base font-semibold text-primary">{item.stats.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        {/* Location, Price, Duration */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                            {item.city && item.type !== 'city' && (
                                <span className="inline-flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span>{typeof item.city === 'string' ? item.city : `${item.city.name}, ${item.city.country}`}</span>
                                </span>
                            )}
                            {formatPrice() ? (
                                <span className="inline-flex items-center gap-1 font-medium text-pulse">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    {formatPrice()}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 font-medium text-green-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Free
                                </span>
                            )}
                            {item.duration && (
                                <span className="inline-flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{item.duration}</span>
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {item.description && (
                            <p className="text-primary text-sm line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-subtle">
                        <button
                            className="px-4 py-2 text-sm font-medium text-primary bg-surface-glass hover:bg-subtle border border-subtle rounded-lg transition-colors inline-flex items-center gap-2"
                            aria-label="Save"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Save
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-primary bg-surface-glass hover:bg-subtle border border-subtle rounded-lg transition-colors inline-flex items-center gap-2"
                            aria-label="Share"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                        <Link
                            to={item.type === 'recommendation' ? `/recommendations/${item.id}` : 
                                item.type === 'city' ? `/city/${item.title}` : 
                                `/profile/${item.author?.username}`}
                            onClick={closeSearch}
                            className="ml-auto px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent-amber to-amber-500 hover:from-amber-500 hover:to-accent-amber rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                            View Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
