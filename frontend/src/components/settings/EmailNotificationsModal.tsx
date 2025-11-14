import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiRequest, buildApiUrl } from '../../config/api';
import { useSafeToast } from '../../hooks/useSafeToast';

interface EmailNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmailPreferences {
  buddyRequests: boolean;
  recommendations: boolean;
  trips: boolean;
  achievements: boolean;
  weeklyDigest: boolean;
  marketing: boolean;
}

export function EmailNotificationsModal({ isOpen, onClose }: EmailNotificationsModalProps) {
  const { showSuccess, showError } = useSafeToast();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    buddyRequests: true,
    recommendations: true,
    trips: true,
    achievements: true,
    weeklyDigest: false,
    marketing: false,
  });
  const [originalPreferences, setOriginalPreferences] = useState<EmailPreferences>({
    buddyRequests: true,
    recommendations: true,
    trips: true,
    achievements: true,
    weeklyDigest: false,
    marketing: false,
  });

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: EmailPreferences }>(
        buildApiUrl('api/profile/email-preferences'),
        { method: 'GET' }
      );
      if (response.success && response.data) {
        setPreferences(response.data);
        setOriginalPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
      // Continue with defaults if load fails
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest(
        buildApiUrl('api/profile/email-preferences'),
        {
          method: 'PUT',
          body: JSON.stringify(preferences),
        }
      );
      showSuccess('Success', 'Email preferences updated successfully');
      setOriginalPreferences(preferences);
      onClose();
    } catch (error) {
      console.error('Failed to save email preferences:', error);
      showError('Error', 'Failed to save email preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setPreferences(originalPreferences); // Reset to original on cancel
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-glass border border-subtle rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Email Notifications</h2>
          <button
            onClick={handleClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Activity Notifications */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Activity</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-primary font-medium">Buddy Requests</p>
                <p className="text-sm text-muted">When someone sends you a buddy request</p>
              </div>
              <button
                onClick={() => updatePreference('buddyRequests', !preferences.buddyRequests)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.buddyRequests ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.buddyRequests ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-primary font-medium">Recommendations</p>
                <p className="text-sm text-muted">Likes, comments, and saves on your posts</p>
              </div>
              <button
                onClick={() => updatePreference('recommendations', !preferences.recommendations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.recommendations ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.recommendations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-primary font-medium">Trips</p>
                <p className="text-sm text-muted">Trip invitations and updates</p>
              </div>
              <button
                onClick={() => updatePreference('trips', !preferences.trips)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.trips ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.trips ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-primary font-medium">Achievements</p>
                <p className="text-sm text-muted">When you unlock new badges</p>
              </div>
              <button
                onClick={() => updatePreference('achievements', !preferences.achievements)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.achievements ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.achievements ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Digest & Marketing */}
          <div className="space-y-3 pt-4 border-t border-subtle">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Digest & Updates</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-primary font-medium">Weekly Digest</p>
                <p className="text-sm text-muted">Weekly summary of activity</p>
              </div>
              <button
                onClick={() => updatePreference('weeklyDigest', !preferences.weeklyDigest)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.weeklyDigest ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-primary font-medium">Product Updates</p>
                <p className="text-sm text-muted">New features and tips</p>
              </div>
              <button
                onClick={() => updatePreference('marketing', !preferences.marketing)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.marketing ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-surface-glass border border-subtle text-primary rounded-lg text-sm font-medium hover:bg-pulse/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1 px-4 py-2 bg-pulse text-white rounded-lg text-sm font-medium hover:bg-pulse/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
