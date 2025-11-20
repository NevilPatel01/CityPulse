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

const ResultCardGrid: React.FC<CardHelpersProps> = ({ item, formatPrice, formatDifficulty, renderStars, formatDate, closeSearch }) => {
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
        <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass overflow-hidden hover:shadow-xl transition-shadow border border-subtle hover-lift">
            {/* Image */}
            <div className="relative h-48 bg-surface-glass rounded-t-2xl">
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
                    <div className="absolute top-3 right-3">
                        <span className="bg-pulse text-white text-xs font-medium px-2 py-1 rounded-full">
                            {typeof item.category === 'string' ? item.category : item.category.name}
                        </span>
                    </div>
                )}

                {/* Difficulty Badge */}
                {item.difficulty && (
                    <div className="absolute top-3 left-3">
                        {formatDifficulty(item.difficulty)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title and Location */}
                <div>
                    <Link
                        to={item.type === 'recommendation' ? `/recommendations/${item.id}` : 
                            item.type === 'city' ? `/cities/${item.title}` : 
                            `/profile/${item.author?.username}`}
                        onClick={closeSearch}
                        className="text-lg font-semibold text-primary hover:text-pulse transition-colors"
                    >
                        {item.title || 'Untitled'}
                    </Link>
                    {item.city && item.type !== 'city' && (
                        <Link
                            to={`/cities/${typeof item.city === 'string' ? item.city : item.city.name}`}
                            onClick={closeSearch}
                            className="text-sm text-muted hover:text-pulse transition-colors inline-flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {typeof item.city === 'string' ? item.city : `${item.city.name}, ${item.city.country}`}
                        </Link>
                    )}
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-primary text-sm line-clamp-2">
                        {item.description}
                    </p>
                )}

                {/* Price and Rating */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {formatPrice() && (
                            <span className="text-pulse font-medium text-sm">
                                {formatPrice()}
                            </span>
                        )}
                        {item.stats && renderStars(item.stats.rating)}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm text-muted">
                        {item.stats && item.stats.views > 0 && (
                            <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.418 0 8.168 3.943 9.542 7-1.374 3.057-5.124 7-9.542 7-4.477 0-8.268-3.943-9.542-7z" />
                                </svg>
                                <span>{item.stats.views}</span>
                            </span>
                        )}
                        {item.stats && item.stats.likes > 0 && (
                            <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{item.stats.likes}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                    {item.bestTimeToVisit && (
                        <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{item.bestTimeToVisit}</span>
                        </span>
                    )}
                    {item.duration && (
                        <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{item.duration}</span>
                        </span>
                    )}
                </div>

                {/* User Info */}
                {item.author && (
                    <div className="flex items-center justify-between pt-3 border-t border-subtle">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-surface-glass rounded-full flex items-center justify-center">
                                {item.author.profilePicture ? (
                                    <img 
                                        src={item.author.profilePicture.startsWith('http') ? item.author.profilePicture : `${apiConfig.baseUrl}${item.author.profilePicture}`} 
                                        alt={item.author.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-primary">
                                        {item.author.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary">{item.author.name}</p>
                                <p className="text-xs text-muted">@{item.author.username}</p>
                            </div>
                        </div>
                        {item.createdAt && (
                            <span className="text-xs text-muted">
                                {formatDate(item.createdAt)}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// List View Card - Matching Profile Card Design
const ResultCardList: React.FC<CardHelpersProps> = ({ item, formatPrice, formatDifficulty, renderStars, formatDate, closeSearch }) => {
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
        <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass overflow-hidden hover:shadow-xl transition-shadow border border-subtle hover-lift">
            <div className="flex flex-col sm:flex-row gap-4 p-4">
                {/* Image */}
                <div className="relative w-full sm:w-64 h-48 bg-surface-glass rounded-xl flex-shrink-0">
                    <img
                        src={getImageUrl()}
                        alt={item.title || 'Image'}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = getDefaultImage();
                        }}
                    />
                    
                    {/* Category Badge */}
                    {item.category && (
                        <div className="absolute top-3 right-3">
                            <span className="bg-pulse text-white text-xs font-medium px-2 py-1 rounded-full">
                                {typeof item.category === 'string' ? item.category : item.category.name}
                            </span>
                        </div>
                    )}

                    {/* Difficulty Badge */}
                    {item.difficulty && (
                        <div className="absolute top-3 left-3">
                            {formatDifficulty(item.difficulty)}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                    {/* Title and Location */}
                    <div>
                        <Link
                            to={item.type === 'recommendation' ? `/recommendations/${item.id}` : 
                                item.type === 'city' ? `/cities/${item.title}` : 
                                `/profile/${item.author?.username}`}
                            onClick={closeSearch}
                            className="text-xl font-semibold text-primary hover:text-pulse transition-colors"
                        >
                            {item.title || 'Untitled'}
                        </Link>
                        {item.city && item.type !== 'city' && (
                            <Link
                                to={`/cities/${typeof item.city === 'string' ? item.city : item.city.name}`}
                                onClick={closeSearch}
                                className="text-sm text-muted hover:text-pulse transition-colors inline-flex items-center gap-1 mt-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {typeof item.city === 'string' ? item.city : `${item.city.name}, ${item.city.country}`}
                            </Link>
                        )}
                    </div>

                    {/* Description */}
                    {item.description && (
                        <p className="text-primary text-sm line-clamp-3">
                            {item.description}
                        </p>
                    )}

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                            {formatPrice() && (
                                <span className="text-pulse font-medium">
                                    {formatPrice()}
                                </span>
                            )}
                            {item.stats && renderStars(item.stats.rating)}
                        </div>
                        
                        <div className="flex items-center space-x-3 text-sm text-muted">
                            {item.stats && item.stats.views > 0 && (
                                <span className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.418 0 8.168 3.943 9.542 7-1.374 3.057-5.124 7-9.542 7-4.477 0-8.268-3.943-9.542-7z" />
                                    </svg>
                                    <span>{item.stats.views}</span>
                                </span>
                            )}
                            {item.stats && item.stats.likes > 0 && (
                                <span className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{item.stats.likes}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted">
                        {item.bestTimeToVisit && (
                            <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{item.bestTimeToVisit}</span>
                            </span>
                        )}
                        {item.duration && (
                            <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{item.duration}</span>
                            </span>
                        )}
                    </div>

                    {/* User Info */}
                    {item.author && (
                        <div className="flex items-center justify-between pt-3 border-t border-subtle">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-surface-glass rounded-full flex items-center justify-center">
                                    {item.author.profilePicture ? (
                                        <img 
                                            src={item.author.profilePicture.startsWith('http') ? item.author.profilePicture : `${apiConfig.baseUrl}${item.author.profilePicture}`} 
                                            alt={item.author.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-primary">
                                            {item.author.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-primary">{item.author.name}</p>
                                    <p className="text-xs text-muted">@{item.author.username}</p>
                                </div>
                            </div>
                            {item.createdAt && (
                                <span className="text-xs text-muted">
                                    {formatDate(item.createdAt)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
