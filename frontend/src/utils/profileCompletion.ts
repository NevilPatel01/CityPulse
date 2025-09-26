import type { UserProfile } from '../services/profileService';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  percentage: number;
  missingRequired: string[];
  missingOptional: string[];
  canBeDiscovered: boolean;
}

export function calculateProfileCompletion(profile: UserProfile | null): ProfileCompletionStatus {
  if (!profile) {
    return {
      isComplete: false,
      percentage: 0,
      missingRequired: ['currentLocation', 'hometown'],
      missingOptional: ['bio', 'profilePhotoUrl', 'socialLinks'],
      canBeDiscovered: false,
    };
  }

  const requiredFields = [
    { key: 'currentLocation', value: profile.currentLocation },
    { key: 'hometown', value: profile.hometown },
  ];

  const optionalFields = [
    { key: 'bio', value: profile.bio },
    { key: 'profilePhotoUrl', value: profile.profilePhotoUrl },
    { key: 'socialLinks', value: profile.socialLinks },
  ];

  const completedRequired = requiredFields.filter(field => field.value && field.value.trim());
  const completedOptional = optionalFields.filter(field => {
    if (field.key === 'socialLinks') {
      return field.value && Object.values(field.value).some(link => link && link.trim());
    }
    return field.value && field.value.trim();
  });

  const missingRequired = requiredFields
    .filter(field => !field.value || !field.value.trim())
    .map(field => field.key);

  const missingOptional = optionalFields
    .filter(field => {
      if (field.key === 'socialLinks') {
        return !field.value || !Object.values(field.value).some(link => link && link.trim());
      }
      return !field.value || !field.value.trim();
    })
    .map(field => field.key);

  const totalFields = requiredFields.length + optionalFields.length;
  const completedFields = completedRequired.length + completedOptional.length;
  const percentage = Math.round((completedFields / totalFields) * 100);

  const isComplete = missingRequired.length === 0;
  const canBeDiscovered = isComplete; // Only complete profiles can be discovered

  return {
    isComplete,
    percentage,
    missingRequired,
    missingOptional,
    canBeDiscovered,
  };
}

export function getCompletionMessage(status: ProfileCompletionStatus): string {
  if (status.isComplete) {
    return "Your profile is complete! You can now be discovered by other members.";
  }

  if (status.missingRequired.length > 0) {
    return `Complete your profile by adding: ${status.missingRequired.join(', ')}`;
  }

  return "Add more details to make your profile stand out!";
}

export function getCompletionColor(status: ProfileCompletionStatus): string {
  if (status.isComplete) return "text-green-400";
  if (status.percentage < 30) return "text-red-400";
  if (status.percentage < 70) return "text-yellow-400";
  return "text-blue-400";
}
