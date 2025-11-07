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
     * Root margin for intersection observer (default: '100px')
     * Triggers loading before reaching the bottom
     */
    rootMargin?: string;
    
    /**
     * Threshold for intersection observer (default: 0.1)
     */
    threshold?: number;
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
    rootMargin = '100px',
    threshold = 0.1
}: UseInfiniteScrollOptions) => {
    const observerTarget = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [target] = entries;
            
            // If target is visible, not loading, and has more data, load more
            if (target.isIntersecting && !isLoading && hasMore) {
                console.log('[InfiniteScroll] Loading more data...');
                onLoadMore();
            }
        },
        [onLoadMore, isLoading, hasMore]
    );

    useEffect(() => {
        const element = observerTarget.current;
        if (!element) return;

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
