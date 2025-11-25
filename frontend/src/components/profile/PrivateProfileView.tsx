import React from 'react';
import { UserPlus, Lock } from 'lucide-react';
import { sendBuddyRequest } from '../../services/buddyService';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface PrivateProfileViewProps {
  profile: {
    id: number;
    username: string;
    fullName: string;
    bio?: string;
    profilePhotoUrl?: string;
    buddyRequestStatus: 'none' | 'pending' | 'accepted' | 'declined';
  };
}

export const PrivateProfileView: React.FC<PrivateProfileViewProps> = ({ profile }) => {
  const [isSendingRequest, setIsSendingRequest] = React.useState(false);
  const [requestStatus, setRequestStatus] = React.useState(profile.buddyRequestStatus);
  const { showSuccess, showError } = useToast();

  const handleSendRequest = async () => {
    setIsSendingRequest(true);
    try {
      await sendBuddyRequest(profile.id);
      setRequestStatus('pending');
      showSuccess('Request Sent', `Buddy request sent to ${profile.fullName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send request';
      showError('Error', errorMessage);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-8 text-center">
          {/* Profile Photo */}
          <div className="flex justify-center mb-6">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-subtle"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-pulse flex items-center justify-center border-4 border-subtle">
                <span className="text-4xl font-bold text-white">
                  {getInitials(profile.fullName)}
                </span>
              </div>
            )}
          </div>

          {/* Username and Name */}
          <h1 className="text-2xl font-bold text-primary mb-1">{profile.fullName}</h1>
          <p className="text-muted mb-4">@{profile.username}</p>

          {/* Bio */}
          {profile.bio && (
            <p className="text-primary mb-6 max-w-md mx-auto">{profile.bio}</p>
          )}

          {/* Private Account Message */}
          <div className="bg-white/5 border border-subtle rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-muted" />
              <h2 className="text-lg font-semibold text-primary">This Account is Private</h2>
            </div>
            <p className="text-muted text-sm">
              Follow this account to see their recommendations, cities visited, and travel buddies.
            </p>
          </div>

          {/* Action Button */}
          {requestStatus === 'none' && (
            <button
              onClick={handleSendRequest}
              disabled={isSendingRequest}
              className="inline-flex items-center gap-2 px-6 py-3 bg-pulse text-white rounded-lg font-medium hover:bg-pulse/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingRequest ? (
                <>
                  <LoadingSpinner size="sm" variant="spinner" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Send Buddy Request</span>
                </>
              )}
            </button>
          )}

          {requestStatus === 'pending' && (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-primary rounded-lg font-medium border border-subtle">
              <span>Request Pending</span>
            </div>
          )}

          {requestStatus === 'accepted' && (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-success/20 text-success rounded-lg font-medium border border-success/30">
              <span>Already Buddies</span>
            </div>
          )}

          {requestStatus === 'declined' && (
            <button
              onClick={handleSendRequest}
              disabled={isSendingRequest}
              className="inline-flex items-center gap-2 px-6 py-3 bg-pulse text-white rounded-lg font-medium hover:bg-pulse/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingRequest ? (
                <>
                  <LoadingSpinner size="sm" variant="spinner" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Send Buddy Request</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
