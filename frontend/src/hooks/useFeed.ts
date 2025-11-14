import { useState, useEffect, useCallback } from 'react';
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
}

/**
 * Custom hook for managing personalized feed state
 * Handles pagination, location filtering, and infinite scroll
 */
export const useFeed = ({ limit = 10, enableLocation = false }: UseFeedOptions = {}) => {
    const { showWarning, showError } = useToast();
    const [state, setState] = useState<FeedState>({
        posts: [],
        loading: true,
        hasMore: true,
        page: 1,
        error: null
    });
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    /**
     * Request user's location
     */
    const requestLocation = useCallback(() => {
        if (!enableLocation) return;

        // Check if location permission was already denied in this session
        const locationDenied = localStorage.getItem('locationPermissionDenied');
        if (locationDenied === 'true') {
            console.log('[Feed] Location permission was previously denied');
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
                    console.log('[Feed] Location enabled:', position.coords);
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
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const response: FeedResponse = await getFeed(1, limit, location ? {
                latitude: location.latitude,
                longitude: location.longitude,
                radius: 50
            } : undefined);

            setState({
                posts: response.data,
                loading: false,
                hasMore: response.pagination.hasMore,
                page: 1,
                error: null
            });

            console.log('[Feed] Initial feed loaded:', response.data.length, 'posts');
            console.log('[Feed] Debug:', response.debug);
        } catch (error) {
            console.error('[Feed] Error loading initial feed:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load feed'
            }));
            showError('Failed to load feed');
        }
    }, [limit, location, showError]);

    /**
     * Load more posts for infinite scroll
     */
    const loadMore = useCallback(async () => {
        if (state.loading || !state.hasMore) return;

        try {
            setState(prev => ({ ...prev, loading: true }));

            const nextPage = state.page + 1;
            const response: FeedResponse = await getFeed(nextPage, limit, location ? {
                latitude: location.latitude,
                longitude: location.longitude,
                radius: 50
            } : undefined);

            setState(prev => ({
                posts: [...prev.posts, ...response.data],
                loading: false,
                hasMore: response.pagination.hasMore,
                page: nextPage,
                error: null
            }));

            console.log('[Feed] Loaded page', nextPage, ':', response.data.length, 'posts');
        } catch (error) {
            console.error('[Feed] Error loading more posts:', error);
            setState(prev => ({ ...prev, loading: false }));
            showError('Failed to load more posts');
        }
    }, [state.loading, state.hasMore, state.page, limit, location, showError]);

    /**
     * Refresh feed (pull to refresh or manual refresh)
     */
    const refresh = useCallback(async () => {
        setState({
            posts: [],
            loading: true,
            hasMore: true,
            page: 1,
            error: null
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
                console.log('[Feed] Loading feed without location after timeout');
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
        loadMore,
        refresh,
        updatePost,
        removePost,
        location,
        requestLocation
    };
};
