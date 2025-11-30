import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { SearchResult } from '../../services/searchService';
import { useSearchOverlay } from '../../context/SearchOverlayContext';
import { apiConfig } from '../../config/api';
import { toggleBookmark, checkBookmarkStatus, recordShare } from '../../services/feedService';
import { useSafeToast } from '../../hooks/useSafeToast';
import { Bookmark, Share2 } from 'lucide-react';

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
    const { showSuccess, showError } = useSafeToast();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Check bookmark status on mount (only for recommendations)
    useEffect(() => {
        if (item.type === 'recommendation') {
            checkBookmarkStatus(item.id)
                .then((response) => {
                    if (response.success) {
                        setIsBookmarked(response.data.isBookmarked);
                    }
                })
                .catch(() => {
                    // Silently fail - user might not be logged in
                });
        }
    }, [item.id, item.type]);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (item.type !== 'recommendation' || isBookmarking) return;

        try {
            setIsBookmarking(true);
            const result = await toggleBookmark(item.id) as { success?: boolean; data?: { isBookmarked: boolean } };
            
            // Handle different response formats
            if (result.success && result.data && typeof result.data.isBookmarked === 'boolean') {
                setIsBookmarked(result.data.isBookmarked);
                showSuccess(result.data.isBookmarked ? 'Saved recommendation' : 'Removed from saved');
            } else if (result.data && typeof result.data.isBookmarked === 'boolean') {
                // Fallback if success field is missing
                setIsBookmarked(result.data.isBookmarked);
                showSuccess(result.data.isBookmarked ? 'Saved recommendation' : 'Removed from saved');
            } else {
                // If response format is unexpected, refresh status
                const statusResponse = await checkBookmarkStatus(item.id);
                if (statusResponse.success) {
                    setIsBookmarked(statusResponse.data.isBookmarked);
                }
                showSuccess(isBookmarked ? 'Removed from saved' : 'Saved recommendation');
            }
        } catch (error) {
            console.error('Bookmark error:', error);
            showError('Failed to update bookmark. Please try again.');
            // Refresh status on error
            try {
                const statusResponse = await checkBookmarkStatus(item.id);
                if (statusResponse.success) {
                    setIsBookmarked(statusResponse.data.isBookmarked);
                }
            } catch {
                // Ignore refresh errors
            }
        } finally {
            setIsBookmarking(false);
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (item.type !== 'recommendation') {
            showError('Can only share recommendations');
            return;
        }

        const url = `${window.location.origin}/recommendations/${item.id}`;
        
        // Always copy URL to clipboard (no navigator.share with title/text)
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                setLinkCopied(true);
                try {
                    await recordShare(item.id, 'link');
                } catch {
                    // Ignore share tracking errors
                }
                showSuccess('Link copied to clipboard');
                setTimeout(() => setLinkCopied(false), 2000);
            } else {
                // Fallback: select text and show message
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    setLinkCopied(true);
                    try {
                        await recordShare(item.id, 'link');
                    } catch {
                        // Ignore share tracking errors
                    }
                    showSuccess('Link copied to clipboard');
                    setTimeout(() => setLinkCopied(false), 2000);
                } catch {
                    showError('Failed to copy link. Please copy manually.');
                }
                document.body.removeChild(textArea);
            }
        } catch (error) {
            console.error('Share error:', error);
            showError('Failed to copy link. Please try again.');
        }
    };

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
                <div 
                    className="flex items-center gap-2 pt-3 border-t border-subtle relative z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                    }}
                >
                    {item.type === 'recommendation' && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    handleBookmark(e);
                                }}
                                disabled={isBookmarking}
                                style={{ pointerEvents: 'auto', zIndex: 20 }}
                                className={`relative z-20 p-2 text-primary bg-surface-glass hover:bg-subtle border border-subtle rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                                    isBookmarked ? 'text-accent-amber border-accent-amber/50' : ''
                                }`}
                                aria-label={isBookmarked ? 'Remove bookmark' : 'Save'}
                                title={isBookmarked ? 'Remove bookmark' : 'Save'}
                            >
                                <Bookmark 
                                    size={16} 
                                    fill={isBookmarked ? 'currentColor' : 'none'}
                                    className={isBookmarked ? '' : 'stroke-2'}
                                />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    handleShare(e);
                                }}
                                style={{ pointerEvents: 'auto', zIndex: 20 }}
                                className={`relative z-20 p-2 bg-surface-glass hover:bg-subtle border border-subtle rounded-lg transition-colors cursor-pointer ${
                                    linkCopied ? 'text-green-500' : 'text-primary'
                                }`}
                                aria-label="Share"
                                title="Share"
                            >
                                <Share2 size={16} />
                            </button>
                        </>
                    )}
                    <Link
                        to={item.type === 'recommendation' ? `/recommendations/${item.id}` : 
                            item.type === 'city' ? `/city/${item.title}` : 
                            `/profile/${item.author?.username}`}
                        onClick={(e) => {
                            closeSearch();
                            e.stopPropagation();
                        }}
                        className="ml-auto relative z-20 px-4 py-2 text-sm font-medium text-white bg-pulse hover:bg-pulse/80 rounded-lg transition-all shadow-md hover:shadow-lg"
                        style={{ pointerEvents: 'auto' }}
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
    const { showSuccess, showError } = useSafeToast();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Check bookmark status on mount (only for recommendations)
    useEffect(() => {
        if (item.type === 'recommendation') {
            checkBookmarkStatus(item.id)
                .then((response) => {
                    if (response.success) {
                        setIsBookmarked(response.data.isBookmarked);
                    }
                })
                .catch(() => {
                    // Silently fail - user might not be logged in
                });
        }
    }, [item.id, item.type]);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (item.type !== 'recommendation' || isBookmarking) return;

        try {
            setIsBookmarking(true);
            const result = await toggleBookmark(item.id) as { success?: boolean; data?: { isBookmarked: boolean } };
            
            // Handle different response formats
            if (result.success && result.data && typeof result.data.isBookmarked === 'boolean') {
                setIsBookmarked(result.data.isBookmarked);
                showSuccess(result.data.isBookmarked ? 'Saved recommendation' : 'Removed from saved');
            } else if (result.data && typeof result.data.isBookmarked === 'boolean') {
                // Fallback if success field is missing
                setIsBookmarked(result.data.isBookmarked);
                showSuccess(result.data.isBookmarked ? 'Saved recommendation' : 'Removed from saved');
            } else {
                // If response format is unexpected, refresh status
                const statusResponse = await checkBookmarkStatus(item.id);
                if (statusResponse.success) {
                    setIsBookmarked(statusResponse.data.isBookmarked);
                }
                showSuccess(isBookmarked ? 'Removed from saved' : 'Saved recommendation');
            }
        } catch (error) {
            console.error('Bookmark error:', error);
            showError('Failed to update bookmark. Please try again.');
            // Refresh status on error
            try {
                const statusResponse = await checkBookmarkStatus(item.id);
                if (statusResponse.success) {
                    setIsBookmarked(statusResponse.data.isBookmarked);
                }
            } catch {
                // Ignore refresh errors
            }
        } finally {
            setIsBookmarking(false);
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (item.type !== 'recommendation') {
            showError('Can only share recommendations');
            return;
        }

        const url = `${window.location.origin}/recommendations/${item.id}`;
        
        // Always copy URL to clipboard (no navigator.share with title/text)
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                setLinkCopied(true);
                try {
                    await recordShare(item.id, 'link');
                } catch {
                    // Ignore share tracking errors
                }
                showSuccess('Link copied to clipboard');
                setTimeout(() => setLinkCopied(false), 2000);
            } else {
                // Fallback: select text and show message
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    setLinkCopied(true);
                    try {
                        await recordShare(item.id, 'link');
                    } catch {
                        // Ignore share tracking errors
                    }
                    showSuccess('Link copied to clipboard');
                    setTimeout(() => setLinkCopied(false), 2000);
                } catch {
                    showError('Failed to copy link. Please copy manually.');
                }
                document.body.removeChild(textArea);
            }
        } catch (error) {
            console.error('Share error:', error);
            showError('Failed to copy link. Please try again.');
        }
    };

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
        <div 
            className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass overflow-hidden hover:shadow-xl transition-shadow border border-subtle"
            onClick={(e) => {
                // Prevent card clicks from interfering with buttons
                const target = e.target as HTMLElement;
                if (target.closest('button[type="button"]') || target.closest('a')) {
                    return;
                }
            }}
        >
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
                    <div 
                        className="flex items-center gap-2 mt-4 pt-4 border-t border-subtle relative z-10" 
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                        }}
                    >
                        {item.type === 'recommendation' && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.nativeEvent.stopImmediatePropagation();
                                        handleBookmark(e);
                                    }}
                                    disabled={isBookmarking}
                                    style={{ pointerEvents: 'auto', zIndex: 20 }}
                                    className={`relative z-20 px-4 py-2 text-sm font-medium border border-subtle rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                                        isBookmarked
                                            ? 'bg-accent-amber/20 text-accent-amber border-accent-amber/30 hover:bg-accent-amber/30'
                                            : 'bg-surface-glass text-primary hover:bg-subtle'
                                    }`}
                                    aria-label={isBookmarked ? 'Remove bookmark' : 'Save'}
                                >
                                    <Bookmark 
                                        size={16} 
                                        fill={isBookmarked ? 'currentColor' : 'none'}
                                        className={isBookmarked ? '' : 'stroke-2'}
                                    />
                                    {isBookmarked ? 'Saved' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.nativeEvent.stopImmediatePropagation();
                                        handleShare(e);
                                    }}
                                    style={{ pointerEvents: 'auto', zIndex: 20 }}
                                    className={`relative z-20 px-4 py-2 text-sm font-medium bg-surface-glass border border-subtle rounded-lg transition-colors inline-flex items-center gap-2 hover:bg-subtle cursor-pointer ${
                                        linkCopied ? 'text-green-500' : 'text-primary'
                                    }`}
                                    aria-label="Share"
                                >
                                    <Share2 size={16} />
                                    {linkCopied ? 'Copied!' : 'Share'}
                                </button>
                            </>
                        )}
                        <Link
                            to={item.type === 'recommendation' ? `/recommendations/${item.id}` : 
                                item.type === 'city' ? `/city/${item.title}` : 
                                `/profile/${item.author?.username}`}
                            onClick={(e) => {
                                closeSearch();
                                e.stopPropagation();
                            }}
                            className="ml-auto relative z-20 px-6 py-2 text-sm font-medium text-white bg-pulse hover:bg-pulse/80 rounded-lg transition-all shadow-md hover:shadow-lg"
                            style={{ pointerEvents: 'auto' }}
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
