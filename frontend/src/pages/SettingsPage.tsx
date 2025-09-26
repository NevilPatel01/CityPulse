import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Auth guard for protection
  useAuthGuard({ requireAuth: true });
  
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log('Delete account clicked');
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
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">Privacy Settings</h3>
                    <p className="text-sm text-muted">Control who can see your profile</p>
                  </div>
                  <button className="bg-surface-glass border border-subtle text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/10 transition-colors">
                    Manage
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
                  <button className="bg-surface-glass border border-subtle text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/10 transition-colors">
                    Change
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">Email Settings</h3>
                    <p className="text-sm text-muted">Manage email notifications</p>
                  </div>
                  <button className="bg-surface-glass border border-subtle text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/10 transition-colors">
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
    </div>
  );
}
