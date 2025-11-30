import { apiRequest } from '../config/api';

export interface SearchFiltersType {
    q?: string;
    location?: string[];
    categories?: string[];
    tags?: string[];
    priceMin?: number;
    priceMax?: number;
    minRating?: number;
    difficulty?: string;
    dateFrom?: string;
    dateTo?: string;
    dateType?: 'created' | 'best_time' | 'both';
    sortBy?: 'relevant' | 'rating' | 'recent' | 'price_low' | 'price_high';
    type?: 'all' | 'recommendations' | 'users' | 'cities';
    view?: 'grid' | 'list';
    limit?: number;
    offset?: number;
}

export interface SearchResult {
    id: number;
    type: 'recommendation' | 'user' | 'city';
    title?: string;
    description?: string;
    location?: string;
    city?: {
        id: number;
        name: string;
        country: string;
    };
    price?: {
        min: number | null;
        max: number | null;
        display: string;
    };
    difficulty?: string;
    duration?: string;
    bestTimeToVisit?: string;
    imageUrl?: string;
    category?: {
        id: number;
        name: string;
    };
    author?: {
        id: number;
        username: string;
        name: string;
        profilePicture?: string;
    };
    stats?: {
        likes: number;
        views: number;
        rating: number;
        ratingCount: number;
    };
    createdAt: string;
}

export interface FilterOptions {
    categories: Array<{
        id: number;
        name: string;
        description?: string;
        icon?: string;
    }>;
    cities: Array<{
        id: number;
        name: string;
        country: string;
        recommendationsCount: number;
        userVisited?: boolean;
    }>;
    tags: Array<{
        id: number;
        name: string;
    }>;
    difficulties: string[];
    priceRange: {
        min: number;
        max: number;
    };
    sortOptions: Array<{
        value: string;
        label: string;
    }>;
}

export const searchApi = {
    /**
     * Get available filter options
     */
    async getFilters(): Promise<FilterOptions> {
        const response = await apiRequest<{ data: FilterOptions }>('/api/advanced-search/filters');
        return response.data;
    },

    /**
     * Perform advanced search with filters
     */
    async advancedSearch(filters: SearchFiltersType): Promise<{
        recommendations: SearchResult[];
        users: SearchResult[];
        cities: SearchResult[];
        total: number;
        filters: SearchFiltersType;
    }> {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            // Skip default/empty values to simplify the query
            if (value === undefined || value === null || value === '') {
                return;
            }
            
            // Skip default values that haven't been changed by user
            if (key === 'priceMin' && value === 0) return;
            if (key === 'priceMax' && value === 1000) return;
            if (key === 'minRating' && value === 0) return;
            if (key === 'difficulty' && value === 'any') return;
            if (key === 'dateType' && value === 'both') return;
            if (key === 'sortBy' && value === 'relevant') return;
            if (key === 'type' && value === 'all') return;
            if (key === 'view') return; // View is frontend only
            
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    value.forEach(v => params.append(key, v.toString()));
                }
            } else {
                params.append(key, value.toString());
            }
        });

        const response = await apiRequest<{ 
            data: {
                recommendations: SearchResult[];
                users: SearchResult[];
                cities: SearchResult[];
                total: number;
                filters: SearchFiltersType;
            }
        }>(`/api/advanced-search?${params.toString()}`);
        return response.data;
    },

    /**
     * Basic search (legacy endpoint)
     */
    async basicSearch(query: string, type?: string): Promise<{
        recommendations: SearchResult[];
        users: SearchResult[];
        cities: SearchResult[];
        total: number;
    }> {
        const params = new URLSearchParams({ q: query });
        if (type) params.append('type', type);
        
        const response = await apiRequest<{ 
            data: {
                recommendations: SearchResult[];
                users: SearchResult[];
                cities: SearchResult[];
                total: number;
            }
        }>(`/api/search?${params.toString()}`);
        return response.data;
    }
};
