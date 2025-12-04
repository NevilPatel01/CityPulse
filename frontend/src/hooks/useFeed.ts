import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed } from '../services/feedService';
import type { FeedPost, FeedResponse } from '../services/feedService';
import { useToast } from './useToast';

interface UseFeedOptions {
    limit?: number;
    enableLocation?: boolean;
}

interface FeedState {
    posts: FeedPost[];
    loading: boolean;
    hasMore: boolean;
    page: number;
    error: string | null;
    totalAvailable: number;
}

/**
 * Generate a unique ID for a feed post
 * Format: "rec_123" for recommendations, "trip_456" for trips
 */
const getPostUniqueId = (post: FeedPost): string => {
    return post.content_type === 'trip' ? `trip_${post.id}` : `rec_${post.id}`;
};

/**
 * Custom hook for managing personalized feed state
 * Handles pagination, location filtering, infinite scroll, and no-duplicate cycling
 */
export const useFeed = ({ limit = 10, enableLocation = false }: UseFeedOptions = {}) => {
    const { showWarning, showError } = useToast();
    const [state, setState] = useState<FeedState>({
        posts: [],
        loading: true,
        hasMore: true,
        page: 1,
        error: null,
        totalAvailable: 0
    });
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    
    // Track seen post IDs to avoid duplicates until all posts are shown
    const seenIdsRef = useRef<Set<string>>(new Set());
    
    // Debounce flag to prevent multiple simultaneous loads
    const isLoadingRef = useRef<boolean>(false);

    /**
     * Request user's location
     */
    const requestLocation = useCallback(() => {
        if (!enableLocation) return;

        // Check if location permission was already denied in this session
        const locationDenied = localStorage.getItem('locationPermissionDenied');
        if (locationDenied === 'true') {
            return;
        }

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    // Clear the denied flag if permission is granted
                    localStorage.removeItem('locationPermissionDenied');
                },
                (error) => {
                    console.warn('[Feed] Location denied or unavailable:', error);
                    // Store that permission was denied so we don't ask again
                    localStorage.setItem('locationPermissionDenied', 'true');
                    showWarning('Location access denied. Showing all posts.');
                }
            );
        }
    }, [enableLocation, showWarning]);

    /**
     * Load initial feed
     */
    const loadInitialFeed = useCallback(async () => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // Reset seen IDs on initial load
            seenIdsRef.current.clear();

            const response: FeedResponse = await getFeed(1, limit, location ? {
                latitude: location.latitude,
                longitude: location.longitude,
                radius: 50
            } : undefined, []);

            // Track seen post IDs
            response.data.forEach(post => {
                seenIdsRef.current.add(getPostUniqueId(post));
            });

            const totalAvailable = response.pagination.total || response.data.length;

            setState({
                posts: response.data,
                loading: false,
                hasMore: true, // Always true to enable infinite scroll cycling
                page: 1,
                error: null,
                totalAvailable
            });

        } catch (error) {
            console.error('[Feed] Error loading initial feed:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load feed'
            }));
            showError('Failed to load feed');
        } finally {
            isLoadingRef.current = false;
        }
    }, [limit, location, showError]);

    /**
     * Load more posts for infinite scroll
     * When all posts are seen, reset and start cycling from beginning
     */
    const loadMore = useCallback(async () => {
        // Prevent multiple simultaneous loads
        if (state.loading || isLoadingRef.current) {
            return;
        }
        
        isLoadingRef.current = true;

        try {
            setState(prev => ({ ...prev, loading: true }));

            const excludeIds = Array.from(seenIdsRef.current);

            // Check if we've seen all posts - if so, reset and cycle
            const shouldReset = seenIdsRef.current.size >= state.totalAvailable && state.totalAvailable > 0;
            
            if (shouldReset) {
                seenIdsRef.current.clear();
            }

            const response: FeedResponse = await getFeed(
                1, // Always page 1 since we use excludeIds for pagination
                limit, 
                location ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius: 50
                } : undefined,
                shouldReset ? [] : excludeIds
            );

            // Track new post IDs
            response.data.forEach(post => {
                seenIdsRef.current.add(getPostUniqueId(post));
            });

            const totalAvailable = response.pagination.total || state.totalAvailable;

            setState(prev => ({
                // When cycling, append at end (don't replace) to prevent flickering
                posts: [...prev.posts, ...response.data],
                loading: false,
                hasMore: true, // Always true for infinite cycling
                page: prev.page + 1,
                error: null,
                totalAvailable
            }));

        } catch (error) {
            console.error('[Feed] Error loading more posts:', error);
            setState(prev => ({ ...prev, loading: false }));
            showError('Failed to load more posts');
        } finally {
            isLoadingRef.current = false;
        }
    }, [state.loading, state.totalAvailable, state.posts.length, limit, location, showError]);

    /**
     * Refresh feed (pull to refresh or manual refresh)
     */
    const refresh = useCallback(async () => {
        // Clear seen IDs on refresh
        seenIdsRef.current.clear();
        isLoadingRef.current = false;
        
        setState({
            posts: [],
            loading: true,
            hasMore: true,
            page: 1,
            error: null,
            totalAvailable: 0
        });
        await loadInitialFeed();
    }, [loadInitialFeed]);

    /**
     * Update a post in the feed (e.g., after like/bookmark)
     */
    const updatePost = useCallback((postId: number, updates: Partial<FeedPost>) => {
        setState(prev => ({
            ...prev,
            posts: prev.posts.map(post =>
                post.id === postId ? { ...post, ...updates } : post
            )
        }));
    }, []);

    /**
     * Remove a post from the feed
     */
    const removePost = useCallback((postId: number) => {
        setState(prev => ({
            ...prev,
            posts: prev.posts.filter(post => post.id !== postId)
        }));
    }, []);

    // Request location on mount if enabled
    useEffect(() => {
        if (enableLocation) {
            requestLocation();
        }
    }, [enableLocation, requestLocation]);

    // Load initial feed when location changes or on mount
    useEffect(() => {
        // If location is not enabled, load immediately
        // If location is enabled, wait for location to be set or timeout
        if (!enableLocation) {
            loadInitialFeed();
        } else if (location) {
            // Location was successfully obtained
            loadInitialFeed();
        }
        // If location is enabled but not obtained yet, 
        // loadInitialFeed will be called after timeout or location grant
        
        // Add timeout to load feed even if location is denied/delayed
        const timeout = setTimeout(() => {
            if (enableLocation && !location && state.posts.length === 0) {
                loadInitialFeed();
            }
        }, 3000); // 3 second timeout
        
        return () => clearTimeout(timeout);
    }, [location, enableLocation, loadInitialFeed, state.posts.length]);

    return {
        posts: state.posts,
        loading: state.loading,
        hasMore: state.hasMore,
        error: state.error,
        totalAvailable: state.totalAvailable,
        seenCount: seenIdsRef.current.size,
        loadMore,
        refresh,
        updatePost,
        removePost,
        location,
        requestLocation
    };
};
