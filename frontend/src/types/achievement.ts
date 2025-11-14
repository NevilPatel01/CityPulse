/**
 * Achievement/Badge Type Definitions
 */

export interface Achievement {
    id: number;
    name: string;
    description: string;
    badge_icon_url: string | null;
    achievement_type: AchievementType;
    target_value: number;
    is_active: boolean;
    created_at: string;
}

export interface UserAchievement extends Achievement {
    current_progress: number;
    is_completed: boolean;
    completed_at: string | null;
    progress_percentage: number;
}

export type AchievementType =
    | 'recommendations_created'
    | 'cities_visited'
    | 'travel_buddies_connected'
    | 'ratings_received'
    | 'likes_received';

export interface AchievementStats {
    totalAchievements: number;
    completedCount: number;
    inProgressCount: number;
    completionRate: number;
    byType: Array<{
        achievement_type: AchievementType;
        completed_count: number;
        total_count: number;
    }>;
}

export interface RecentAchievement {
    completed_at: string;
    achievement_name: string;
    achievement_description: string;
    badge_icon_url: string | null;
    username: string;
    full_name: string;
}
