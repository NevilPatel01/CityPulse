import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { validateProfileData, type ProfileDataStatus } from '../utils/profileValidation';
import type { UserProfile, UserStats, UserBadge } from '../services/profileService';

interface UseProfileReturn {
  profile: UserProfile | null;
  stats: UserStats | null;
  badges: UserBadge[];
  loading: boolean;
  error: string | null;
  dataStatus: ProfileDataStatus;
  refetch: () => Promise<void>;
}

export function useProfile(username: string): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Single API call that includes all data (profile, stats, badges)
      const profileData = await profileService.getProfile(username);

      setProfile(profileData);
      // Extract stats and badges from the profile data
      setStats(profileData.stats);
      setBadges(profileData.badges);
    } catch (err: unknown) {
      console.error('Profile fetch error:', err);

      // Handle specific error types with user-friendly messages
      const error = err as { message?: string };

      if (error.message?.includes('User not found')) {
        setError('This user profile does not exist');
      } else if (error.message?.includes('PROFILE_INCOMPLETE_OWNER')) {
        // For incomplete own profile, don't set error - let the component handle it
        setError(null);
        // Set a special profile object to indicate incomplete profile
        const incompleteProfile: UserProfile = {
          id: 0,
          username,
          fullName: '',
          bio: '',
          currentLocation: '',
          hometown: '',
          profilePhotoUrl: '',
          coverPhotoUrl: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          stats: { cities: 0, recommendations: 0, travelBuddies: 0, points: 0 },
          badges: [],
          profileCompletion: {
            isComplete: false,
            percentage: 0,
            canBeDiscovered: false,
            hasMinimumData: true,
            needsCompletion: true,
            missingFields: ['currentLocation', 'hometown']
          },
          isOwnProfile: true
        };

        setProfile(incompleteProfile);
        setStats(incompleteProfile.stats);
        setBadges(incompleteProfile.badges);
        return;
      } else if (error.message?.includes('Too many requests')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (error.message?.includes('Service temporarily unavailable')) {
        setError('Service is temporarily unavailable. Please try again later.');
      } else if (error.message?.includes('Server error')) {
        setError('Server error occurred. Please try again later.');
      } else {
        setError(error.message || 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, fetchProfile]);

  // Calculate data status
  const dataStatus = validateProfileData(profile);

  return {
    profile,
    stats,
    badges,
    loading,
    error,
    dataStatus,
    refetch: fetchProfile,
  };
}
