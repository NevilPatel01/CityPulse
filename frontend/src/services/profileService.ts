import { apiRequest, apiEndpoints } from '../config/api';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  bio?: string;
  currentLocation?: string;
  hometown?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  citiesVisited?: string[];
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  whatsappContact?: string;
  websiteUrl?: string;
  email?: string;
  createdAt: string;
  lastLogin?: string;
  stats: {
    cities: number;
    recommendations: number;
    travelBuddies: number;
    points: number;
  };
  badges: Array<{
    id: string;
    icon: string;
    label: string;
    description: string;
  }>;
  profileCompletion: {
    isComplete: boolean;
    percentage: number;
    canBeDiscovered: boolean;
    hasMinimumData?: boolean;
    needsCompletion?: boolean;
    missingFields?: string[];
  };
  phone?: string;
  profileVisibility?: 'public' | 'private';
  locationSharing?: boolean;
  socialLinksVisible?: boolean;
  travelBuddyRequestsEnabled?: boolean;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  isOwnProfile: boolean;
  isPrivate?: boolean;
  buddyRequestStatus?: 'none' | 'pending' | 'accepted' | 'declined';
}

export interface UserStats {
  cities: number;
  recommendations: number;
  travelBuddies: number;
  points: number;
}

export interface UserBadge {
  id: string;
  icon: string;
  label: string;
  description: string;
}

export interface ProfileUpdateData {
  bio?: string;
  currentLocation?: string;
  hometown?: string;
  phone?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  whatsappContact?: string;
  websiteUrl?: string;
  profileVisibility?: 'public' | 'private';
  locationSharing?: boolean;
  socialLinksVisible?: boolean;
  travelBuddyRequestsEnabled?: boolean;
}

class ProfileService {
  /**
   * Get user profile by username
   */
  async getProfile(username: string): Promise<UserProfile> {
    try {
      const response = await apiRequest<{ success: boolean; data: { user: UserProfile } }>(
        apiEndpoints.profile.get(username)
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch profile');
      }
      
      return response.data.user;
    } catch (error: unknown) {
      // Handle specific error codes
      const err = error as { status?: number; data?: { code?: string }; message?: string };
      
      if (err.status === 404) {
        throw new Error('User not found');
      } else if (err.status === 403) {
        if (err.data?.code === 'PROFILE_INCOMPLETE') {
          // For incomplete profiles, I need to check if this is the user's own profile
          // If it is, I should show the completion form instead of an error
          throw new Error('PROFILE_INCOMPLETE_OWNER');
        }
        throw new Error('This profile is private');
      } else if (err.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (err.status === 503) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      } else if (err.status && err.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(err.message || 'Failed to fetch profile');
      }
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest<{ success: boolean; message: string }>(
      apiEndpoints.profile.update,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response;
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStats> {
    const response = await apiRequest<{ success: boolean; data: UserStats }>(
      apiEndpoints.profile.getStats
    );
    return response.data;
  }

  /**
   * Get user badges
   */
  async getBadges(): Promise<UserBadge[]> {
    const response = await apiRequest<{ success: boolean; data: { badges: UserBadge[] } }>(
      apiEndpoints.profile.getBadges
    );
    return response.data.badges;
  }

  /**
   * Upload profile or cover photo
   */
  async uploadPhoto(file: File, type: 'profile' | 'cover'): Promise<{ success: boolean; message: string; data: { imageUrl: string; metadata: unknown } }> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);

    const response = await apiRequest<{ success: boolean; message: string; data: { imageUrl: string; metadata: unknown } }>(
      apiEndpoints.profile.uploadPhoto,
      {
        method: 'POST',
        body: formData,
        headers: {
          // let browser set it with boundary for FormData
        },
      }
    );
    return response;
  }

  /**
   * Delete profile or cover photo
   */
  async deletePhoto(type: 'profile' | 'cover'): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest<{ success: boolean; message: string }>(
      apiEndpoints.profile.deletePhoto(type),
      {
        method: 'DELETE',
      }
    );
    return response;
  }
}

export const profileService = new ProfileService();
