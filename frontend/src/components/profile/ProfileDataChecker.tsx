import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { validateProfileData, getProfileDataMessage, type ProfileDataStatus } from '../../utils/profileValidation';
import type { UserProfile } from '../../services/profileService';

interface ProfileDataCheckerProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  error: string | null;
  onShowCompletionForm: () => void;
  children: React.ReactNode;
}

export function ProfileDataChecker({ 
  profile, 
  isOwnProfile, 
  error,
  onShowCompletionForm, 
  children 
}: ProfileDataCheckerProps) {
  const dataStatus: ProfileDataStatus = validateProfileData(profile);

  // Handle API errors first
  if (error) {
    return (
      <Card className="bg-surface-glass border-subtle">
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <CardTitle as="h1" className="mb-4">
            {error.includes('not exist') ? 'Profile Not Found' : 
              error.includes('private') ? 'Private Profile' :
              error.includes('incomplete') ? 'Profile Incomplete' :
              error.includes('Too many requests') ? 'Rate Limited' :
              error.includes('temporarily unavailable') ? 'Service Unavailable' :
              error.includes('Server error') ? 'Server Error' :
              'Error Loading Profile'}
          </CardTitle>
          <p className="text-muted mb-6">
            {error}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-pulse text-white px-6 py-2 rounded-lg hover:opacity-90"
            >
              Try Again
            </button>
            {!error.includes('not exist') && !error.includes('private') && (
              <button
                onClick={() => window.history.back()}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:opacity-90"
              >
                Go Back
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no minimum data, show error
  if (!dataStatus.hasMinimumData) {
    return (
      <Card className="bg-surface-glass border-subtle">
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <CardTitle as="h1" className="mb-4">
            Profile Data Error
          </CardTitle>
          <p className="text-muted mb-6">
            Unable to load profile data. Please try refreshing the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-pulse text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            Refresh Page
          </button>
        </CardContent>
      </Card>
    );
  }

  // If own profile but missing required data, show completion form
  if (isOwnProfile && dataStatus.needsCompletion) {
    return (
      <Card className="bg-surface-glass border-subtle">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <span className="text-2xl">📝</span>
            Complete Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-pulse/10 border border-pulse/20 rounded-lg p-4">
            <p className="text-sm text-muted mb-3">
              {getProfileDataMessage(dataStatus)}
            </p>
            <div className="text-xs text-muted">
              Missing: {dataStatus.missingFields.join(', ')}
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onShowCompletionForm}
              className="w-full bg-pulse text-white py-3 px-6 rounded-lg font-medium hover:bg-pulse/80 transition-colors"
            >
              Complete Profile Now
            </button>
            
            <p className="text-xs text-muted text-center">
              Complete your profile to get discovered by other members and unlock all features!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If other user's profile is incomplete, show message
  if (!isOwnProfile && !dataStatus.canDisplayProfile) {
    return (
      <Card className="bg-surface-glass border-subtle">
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <CardTitle as="h1" className="mb-4">
            Profile Not Available
          </CardTitle>
          <p className="text-muted mb-6">
            This user hasn't completed their profile yet. Complete profiles are visible to help members discover each other.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-pulse text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            Go Back
          </button>
        </CardContent>
      </Card>
    );
  }

  // If profile data is sufficient, show the profile
  return <>{children}</>;
}
