import type { UserProfile } from '../services/profileService';

export interface ProfileDataStatus {
  hasMinimumData: boolean;
  hasRequiredData: boolean;
  hasOptionalData: boolean;
  missingFields: string[];
  completionPercentage: number;
  canDisplayProfile: boolean;
  needsCompletion: boolean;
}

export interface ProfileRequirements {
  minimum: string[];
  required: string[];
  optional: string[];
}

// Define what data is needed for different profile states
export const PROFILE_REQUIREMENTS: ProfileRequirements = {
  minimum: ['id', 'username', 'fullName'], // Basic user data from auth
  required: ['currentLocation', 'hometown'], // Required for profile completion
  optional: ['bio', 'profilePhotoUrl', 'coverPhotoUrl', 'socialLinks'] // Optional enhancements
};

export function validateProfileData(profile: UserProfile | null): ProfileDataStatus {
  if (!profile) {
    return {
      hasMinimumData: false,
      hasRequiredData: false,
      hasOptionalData: false,
      missingFields: [...PROFILE_REQUIREMENTS.minimum, ...PROFILE_REQUIREMENTS.required],
      completionPercentage: 0,
      canDisplayProfile: false,
      needsCompletion: true,
    };
  }

  // Check minimum data (should always be present from auth)
  const hasMinimumData = PROFILE_REQUIREMENTS.minimum.every(field => {
    const value = profile[field as keyof UserProfile];
    return value !== undefined && value !== null && value !== '';
  });

  // Check required data for profile completion
  const hasRequiredData = PROFILE_REQUIREMENTS.required.every(field => {
    const value = profile[field as keyof UserProfile];
    return value !== undefined && value !== null && value !== '';
  });

  // Check optional data
  const hasOptionalData = PROFILE_REQUIREMENTS.optional.some(field => {
    if (field === 'socialLinks') {
      return profile.socialLinks && Object.values(profile.socialLinks).some(link => link && link.trim());
    }
    const value = profile[field as keyof UserProfile];
    return value !== undefined && value !== null && value !== '';
  });

  // Calculate missing fields
  const missingFields: string[] = [];
  
  if (!hasMinimumData) {
    missingFields.push(...PROFILE_REQUIREMENTS.minimum.filter(field => {
      const value = profile[field as keyof UserProfile];
      return !value || value === '';
    }));
  }
  
  if (!hasRequiredData) {
    missingFields.push(...PROFILE_REQUIREMENTS.required.filter(field => {
      const value = profile[field as keyof UserProfile];
      return !value || value === '';
    }));
  }

  // Calculate completion percentage
  const totalFields = PROFILE_REQUIREMENTS.required.length + PROFILE_REQUIREMENTS.optional.length;
  const completedFields = PROFILE_REQUIREMENTS.required.filter(field => {
    const value = profile[field as keyof UserProfile];
    return value && value !== '';
  }).length + PROFILE_REQUIREMENTS.optional.filter(field => {
    if (field === 'socialLinks') {
      return profile.socialLinks && Object.values(profile.socialLinks).some(link => link && link.trim());
    }
    const value = profile[field as keyof UserProfile];
    return value && value !== '';
  }).length;

  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  // Determine if profile can be displayed
  const canDisplayProfile = hasMinimumData && hasRequiredData;
  const needsCompletion = !hasRequiredData;

  return {
    hasMinimumData,
    hasRequiredData,
    hasOptionalData,
    missingFields,
    completionPercentage,
    canDisplayProfile,
    needsCompletion,
  };
}

export function getProfileDataMessage(status: ProfileDataStatus): string {
  if (!status.hasMinimumData) {
    return "Profile data is incomplete. Please contact support.";
  }
  
  if (!status.hasRequiredData) {
    return "Please complete your profile by adding your current location and hometown to get started.";
  }
  
  if (status.completionPercentage < 50) {
    return "Your profile is basic. Add more details to make it stand out!";
  }
  
  if (status.completionPercentage < 100) {
    return "Your profile is looking good! Add a few more details to make it complete.";
  }
  
  return "Your profile is complete and ready to go!";
}

export function shouldShowCompletionForm(status: ProfileDataStatus, isOwnProfile: boolean): boolean {
  return isOwnProfile && status.needsCompletion;
}

export function shouldShowProfile(status: ProfileDataStatus, isOwnProfile: boolean): boolean {
  if (isOwnProfile) {
    return status.hasMinimumData; // Own profile always shows if minimum data exists
  }
  return status.canDisplayProfile; // Other profiles only show if complete
}
