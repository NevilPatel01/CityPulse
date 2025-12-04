import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    /**
     * Callback function to load more data
     */
    onLoadMore: () => void;
    
    /**
     * Whether data is currently being loaded
     */
    isLoading: boolean;
    
    /**
     * Whether there is more data to load
     */
    hasMore: boolean;
    
    /**
     * Root margin for intersection observer (default: '300px')
     * Triggers loading before reaching the bottom
     */
    rootMargin?: string;
    
    /**
     * Threshold for intersection observer (default: 0)
     */
    threshold?: number;
    
    /**
     * Debounce time in ms to prevent rapid fire (default: 300)
     */
    debounceMs?: number;
}

/**
 * Custom hook for implementing infinite scroll functionality
 * Uses Intersection Observer API to detect when user scrolls near bottom
 * 
 * @example
 * ```tsx
 * const { observerTarget } = useInfiniteScroll({
 *   onLoadMore: fetchMorePosts,
 *   isLoading: loading,
 *   hasMore: pagination.hasMore
 * });
 * 
 * return (
 *   <div>
 *     {posts.map(post => <PostCard key={post.id} post={post} />)}
 *     <div ref={observerTarget} />
 *   </div>
 * );
 * ```
 */
export const useInfiniteScroll = ({
    onLoadMore,
    isLoading,
    hasMore,
    rootMargin = '300px', // Trigger earlier - 300px before reaching bottom
    threshold = 0,
    debounceMs = 300
}: UseInfiniteScrollOptions) => {
    const observerTarget = useRef<HTMLDivElement>(null);
    const lastLoadTimeRef = useRef<number>(0);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [target] = entries;
            const now = Date.now();
            
            // Debounce - don't trigger if we just loaded
            if (now - lastLoadTimeRef.current < debounceMs) {
                return;
            }
            
            // If target is visible, not loading, and has more data, load more
            if (target.isIntersecting && !isLoading && hasMore) {
                lastLoadTimeRef.current = now;
                onLoadMore();
            }
        },
        [onLoadMore, isLoading, hasMore, debounceMs]
    );

    useEffect(() => {
        const element = observerTarget.current;
        if (!element) {
            return;
        }

        const observer = new IntersectionObserver(handleObserver, {
            root: null, // viewport
            rootMargin,
            threshold
        });

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [handleObserver, rootMargin, threshold]);

    return { observerTarget };
};
