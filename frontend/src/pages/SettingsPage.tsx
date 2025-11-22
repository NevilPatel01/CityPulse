import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useSafeToast } from '../hooks/useSafeToast';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ChangePasswordModal } from '../components/settings/ChangePasswordModal';
import { EmailNotificationsModal } from '../components/settings/EmailNotificationsModal';
import { apiRequest, buildApiUrl } from '../config/api';

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  locationSharing: boolean;
  socialLinksVisible: boolean;
  travelBuddyRequestsEnabled: boolean;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useSafeToast();
  
  // Auth guard for protection
  useAuthGuard({ requireAuth: true });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEmailNotificationsModal, setShowEmailNotificationsModal] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    locationSharing: true,
    socialLinksVisible: true,
    travelBuddyRequestsEnabled: true,
  });
  const [originalPrivacySettings, setOriginalPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    locationSharing: true,
    socialLinksVisible: true,
    travelBuddyRequestsEnabled: true,
  });

  // Check if privacy settings have changed
  const hasPrivacyChanges = JSON.stringify(privacySettings) !== JSON.stringify(originalPrivacySettings);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone. Your account will be permanently deleted within 30 days.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(
        buildApiUrl('api/profile/request-deletion'),
        { method: 'POST' }
      );

      if (response.success) {
        showSuccess(response.message || 'Deletion request submitted successfully');
        // Log out user after deletion request
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        showError(response.message || 'Failed to submit deletion request');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      showError('Failed to submit deletion request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load privacy settings
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const response = await apiRequest<{ success: boolean; data: PrivacySettings }>(
          buildApiUrl('api/profile/privacy/settings'),
          { method: 'GET' }
        );
        if (response.success) {
          setPrivacySettings(response.data);
          setOriginalPrivacySettings(response.data); // Store original values
        }
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
      }
    };

    loadPrivacySettings();
  }, []);

  // Save privacy settings
  const handleSavePrivacySettings = async () => {
    setIsSavingPrivacy(true);
    try {
      await apiRequest(
        buildApiUrl('api/profile/privacy/settings'),
        {
          method: 'PUT',
          body: JSON.stringify(privacySettings),
        }
      );
      showSuccess('Success', 'Privacy settings updated successfully');
      setOriginalPrivacySettings(privacySettings); // Update original after successful save
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      showError('Error', 'Failed to save privacy settings');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const updatePrivacySetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-base">
      <Header />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Settings</h1>
              <p className="text-muted">Manage your account and preferences</p>
            </div>

            {/* Profile Settings */}
            <Card className="bg-surface-glass border-subtle">
              <CardHeader>
                <CardTitle className="text-primary">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">Edit Profile</h3>
                    <p className="text-sm text-muted">Update your personal information</p>
                  </div>
                  <button
                    onClick={() => navigate(`/profile/${user?.username}`)}
                    className="bg-pulse text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/80 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="bg-surface-glass border-subtle">
              <CardHeader>
                <CardTitle className="text-primary">Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Visibility */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-primary">Profile Visibility</h3>
                    <p className="text-sm text-muted">Control who can view your profile</p>
                  </div>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value as 'public' | 'private')}
                    className="bg-surface-glass border border-subtle text-primary px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pulse"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                {/* Location Sharing */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-primary">Location Sharing</h3>
                    <p className="text-sm text-muted">Share your current location with others</p>
                  </div>
                  <button
                    onClick={() => updatePrivacySetting('locationSharing', !privacySettings.locationSharing)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 ${
                      privacySettings.locationSharing ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.locationSharing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Social Links Visible */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-primary">Social Links Visible</h3>
                    <p className="text-sm text-muted">Show your social media links on your profile</p>
                  </div>
                  <button
                    onClick={() => updatePrivacySetting('socialLinksVisible', !privacySettings.socialLinksVisible)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 ${
                      privacySettings.socialLinksVisible ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.socialLinksVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Travel Buddy Requests */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-primary">Accept Buddy Requests</h3>
                    <p className="text-sm text-muted">Allow others to send you travel buddy requests</p>
                  </div>
                  <button
                    onClick={() => updatePrivacySetting('travelBuddyRequestsEnabled', !privacySettings.travelBuddyRequestsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 ${
                      privacySettings.travelBuddyRequestsEnabled ? 'bg-pulse' : 'bg-surface-glass border border-subtle'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.travelBuddyRequestsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-subtle">
                  <button
                    onClick={handleSavePrivacySettings}
                    disabled={isSavingPrivacy || !hasPrivacyChanges}
                    className="w-full bg-pulse text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-surface-glass border-subtle">
              <CardHeader>
                <CardTitle className="text-primary">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">Change Password</h3>
                    <p className="text-sm text-muted">Update your password</p>
                  </div>
                  <button 
                    onClick={() => setShowChangePasswordModal(true)}
                    className="bg-surface-glass border border-subtle text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/10 transition-colors"
                  >
                    Change
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">Email Settings</h3>
                    <p className="text-sm text-muted">Manage email notifications</p>
                  </div>
                  <button 
                    onClick={() => setShowEmailNotificationsModal(true)}
                    className="bg-surface-glass border border-subtle text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/10 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-surface-glass border-subtle border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-red-400">Logout</h3>
                    <p className="text-sm text-muted">Sign out of your account</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-red-400">Delete Account</h3>
                    <p className="text-sm text-muted">Permanently delete your account</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
      <EmailNotificationsModal 
        isOpen={showEmailNotificationsModal} 
        onClose={() => setShowEmailNotificationsModal(false)} 
      />
    </div>
  );
}
