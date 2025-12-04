import { apiRequest, buildApiUrl } from '../config/api';

export interface FeedPost {
    id: number;
    title: string;
    description: string;
    user_rating: number;
    likes_count: number;
    shares_count: number;
    views_count: number;
    created_at: string;
    user_id: number;
    username: string;
    full_name: string;
    profile_picture_url?: string;
    category_name?: string;
    city_name?: string;
    country?: string;
    source?: 'buddy' | 'trending' | 'interest';
    photos?: string[];
    is_liked: boolean;
    is_bookmarked: boolean;
    content_type: 'recommendation' | 'trip';
    // Trip-specific fields
    start_date?: string;
    end_date?: string;
    status?: string;
    privacy?: string;
    cover_photo_url?: string;
    creator_username?: string;
    creator_name?: string;
    creator_photo?: string;
    companions_count?: number;
    cities?: Array<{ id: number; name: string; country: string }>;
}

export interface FeedResponse {
    success: boolean;
    data: FeedPost[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
        seenCount?: number;
    };
    debug?: {
        recommendationsCount?: number;
        tripsCount?: number;
        totalRecommendations?: number;
        totalTrips?: number;
        totalAvailable?: number;
        seenCount?: number;
        buddyCount?: number;
        trendingCount?: number;
        interestCount?: number;
        locationFilter?: boolean;
    };
}

export interface UserStats {
    recommendations: number;
    citiesVisited: number;
    buddies: number;
    likesReceived: number;
    totalViews: number;
}

export interface ActiveBuddy {
    id: number;
    username: string;
    full_name: string;
    profile_photo_url?: string;
    current_city_id?: number;
    current_city?: string;
    last_active: string;
}

/**
 * Get personalized feed with algorithm (50% buddies, 30% trending, 20% interests)
 * Supports excludeIds to prevent showing duplicate posts until all are seen
 */
export const getFeed = async (
    page: number = 1,
    limit: number = 10,
    location?: { latitude: number; longitude: number; radius?: number },
    excludeIds?: string[] // Format: ['rec_1', 'rec_2', 'trip_3', 'trip_4']
): Promise<FeedResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    if (location) {
        params.append('latitude', location.latitude.toString());
        params.append('longitude', location.longitude.toString());
        params.append('radius', (location.radius || 50).toString());
    }

    // Add excludeIds to prevent duplicates
    if (excludeIds && excludeIds.length > 0) {
        params.append('excludeIds', excludeIds.join(','));
    }

    const url = buildApiUrl(`api/feed?${params.toString()}`);
    return await apiRequest<FeedResponse>(url);
};

/**
 * Get trending recommendations
 */
export const getTrendingPosts = async (page: number = 1, limit: number = 10, days: number = 7) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        days: days.toString()
    });
    const url = buildApiUrl(`api/feed/trending?${params.toString()}`);
    return await apiRequest(url);
};

/**
 * Get active buddies
 */
export const getActiveBuddies = async (limit: number = 10): Promise<{ success: boolean; data: ActiveBuddy[] }> => {
    const url = buildApiUrl(`api/feed/active-buddies?limit=${limit}`);
    return await apiRequest<{ success: boolean; data: ActiveBuddy[] }>(url);
};

/**
 * Get user statistics
 */
export const getUserStats = async (): Promise<{ success: boolean; data: UserStats }> => {
    const url = buildApiUrl('api/social/stats');
    return await apiRequest<{ success: boolean; data: UserStats }>(url);
};

/**
 * Toggle bookmark on a post
 */
export const toggleBookmark = async (recommendationId: number) => {
    const url = buildApiUrl(`api/social/bookmarks/${recommendationId}`);
    return await apiRequest(url, { method: 'POST' });
};

/**
 * Check if a post is bookmarked
 */
export const checkBookmarkStatus = async (recommendationId: number): Promise<{ success: boolean; data: { isBookmarked: boolean } }> => {
    const url = buildApiUrl(`api/social/bookmarks/${recommendationId}/status`);
    return await apiRequest<{ success: boolean; data: { isBookmarked: boolean } }>(url);
};

/**
 * Get user's bookmarked posts
 */
export const getBookmarkedPosts = async (page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    const url = buildApiUrl(`api/social/bookmarks?${params.toString()}`);
    return await apiRequest(url);
};

/**
 * Record a share
 */
export const recordShare = async (recommendationId: number, platform: string) => {
    const url = buildApiUrl(`api/social/shares/${recommendationId}`);
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ platform })
    });
};

/**
 * Report a recommendation
 */
export const reportPost = async (
    recommendationId: number,
    reason: 'spam' | 'inappropriate' | 'misleading' | 'offensive' | 'copyright' | 'other',
    description?: string
) => {
    const url = buildApiUrl(`api/social/reports/${recommendationId}`);
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ reason, description })
    });
};

/**
 * Report a user profile
 */
export const reportProfile = async (
    userId: number,
    reason: 'spam' | 'inappropriate' | 'misleading' | 'offensive' | 'harassment' | 'impersonation' | 'other',
    description?: string
) => {
    const url = buildApiUrl(`api/social/reports/profile/${userId}`);
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ reason, description })
    });
};

/**
 * Set user interests
 */
export const setUserInterests = async (categoryIds: number[]) => {
    const url = buildApiUrl('api/social/interests');
    return await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ categoryIds })
    });
};

/**
 * Get user interests
 */
export const getUserInterests = async () => {
    const url = buildApiUrl('api/social/interests');
    return await apiRequest(url);
};

/**
 * Like a recommendation
 */
export const likeRecommendation = async (recommendationId: number) => {
    const url = buildApiUrl(`api/recommendations/${recommendationId}/like`);
    return await apiRequest(url, { method: 'POST' });
};

/**
 * Unlike a recommendation
 */
export const unlikeRecommendation = async (recommendationId: number) => {
    const url = buildApiUrl(`api/recommendations/${recommendationId}/unlike`);
    return await apiRequest(url, { method: 'DELETE' });
};

/**
 * Get top places this month (last 30 days)
 */
export const getTopPlacesThisMonth = async (page: number = 1, limit: number = 6): Promise<{ success: boolean; data: FeedPost[] }> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    const url = buildApiUrl(`api/feed/top-places-month?${params.toString()}`);
    return await apiRequest<{ success: boolean; data: FeedPost[] }>(url);
};

/**
 * Get popular recommendations in user's current country
 */
export const getPopularInCountry = async (page: number = 1, limit: number = 6): Promise<{ success: boolean; data: FeedPost[]; meta?: { country: string } }> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    const url = buildApiUrl(`api/feed/popular-country?${params.toString()}`);
    return await apiRequest<{ success: boolean; data: FeedPost[]; meta?: { country: string } }>(url);
};

/**
 * Get mixed activity from travel buddies (recommendations + trips)
 */
export const getBuddiesActivity = async (page: number = 1, limit: number = 10): Promise<{ success: boolean; data: FeedPost[] }> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    const url = buildApiUrl(`api/feed/buddies-activity?${params.toString()}`);
    return await apiRequest<{ success: boolean; data: FeedPost[] }>(url);
};

/**
 * Get top 5 recommendations + top 5 trips this month (last 30 days)
 * Ranked by engagement score
 */
export const getTopFiveThisMonth = async (): Promise<{ 
    success: boolean; 
    data: { 
        recommendations: FeedPost[]; 
        trips: FeedPost[] 
    } 
}> => {
    const url = buildApiUrl('api/feed/top-five-month');
    return await apiRequest<{ success: boolean; data: { recommendations: FeedPost[]; trips: FeedPost[] } }>(url);
};
