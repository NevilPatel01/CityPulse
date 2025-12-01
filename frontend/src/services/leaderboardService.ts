import { apiRequest } from '../config/api';

export interface LeaderboardEntry {
  rank: number;
  id: number;
  username: string;
  full_name: string;
  profile_photo_url?: string;
  achievements_count: number;
  total_points: number;
  unique_badges?: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
    type: string;
    limit: number;
  };
}

export interface MyLeaderboardPosition {
  success: boolean;
  data: {
    rank: number;
    achievements_count: number;
    total_points: number;
  };
}

/**
 * Get leaderboard
 * @param type - 'all', 'achievements', 'points', 'badges'
 * @param limit - Number of results (default: 10, max: 100)
 */
export const getLeaderboard = async (
  type: 'all' | 'achievements' | 'points' | 'badges' = 'all',
  limit: number = 10
): Promise<LeaderboardResponse> => {
  const response = await apiRequest<LeaderboardResponse>(
    `/api/leaderboard?type=${type}&limit=${limit}`
  );
  return response;
};

/**
 * Get current user's leaderboard position
 */
export const getMyLeaderboardPosition = async (): Promise<MyLeaderboardPosition> => {
  const response = await apiRequest<MyLeaderboardPosition>('/api/leaderboard/me');
  return response;
};

