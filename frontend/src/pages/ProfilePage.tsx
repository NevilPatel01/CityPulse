import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useProfile } from '../hooks/useProfile';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { profileService } from '../services/profileService';
import { apiRequest } from '../config/api';
import { RecommendationsList } from '../components/recommendations/RecommendationsList';
import { AchievementProgress } from '../components/achievements/AchievementProgress';
import { TravelHistoryTimeline } from '../components/profile/TravelHistoryTimeline';
import { Modal } from '../components/ui/Modal';
import { CreateRecommendationForm } from '../components/recommendations/CreateRecommendationForm';
import { BadgeUnlockModal } from '../components/achievements/BadgeUnlockModal';
import type { UserAchievement } from '../types/achievement';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  
  // Additional auth guard for extra protection
  useAuthGuard({ requireAuth: true });
  
  const { profile, stats, loading, error, refetch } = useProfile(username || '');
  
  // Read tab from URL params on initial load
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        return tabIndex;
      }
    }
    return 0;
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [localImages, setLocalImages] = useState<{
    profile?: string;
    cover?: string;
  }>({});
  const [recommendationCount, setRecommendationCount] = useState<number>(0);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  const isOwnProfile = Boolean(currentUser && currentUser.username === username);

  // Fetch recommendation count
  useEffect(() => {
    const fetchRecommendationCount = async () => {
      try {
        const data = await apiRequest<{success: boolean; data: {pagination: {total: number}}}>(`/api/recommendations?user_id=${profile?.id || ''}`);
        
        if (data && data.success) {
          setRecommendationCount(data.data.pagination?.total || 0);
        } else {
          console.warn('Failed to fetch recommendation count');
          setRecommendationCount(0);
        }
      } catch (error) {
        console.error('Error fetching recommendation count:', error);
        setRecommendationCount(0);
      }
    };

    if (profile?.id) {
      fetchRecommendationCount();
    }
  }, [profile?.id]);

  // Check for newly unlocked achievements
  useEffect(() => {
    const checkNewAchievements = async () => {
      if (!isOwnProfile || !profile?.id) return;

      try {
        // Get user's achievements
        const response = await apiRequest<{
          success: boolean;
          data: {
            completed: UserAchievement[];
            inProgress: UserAchievement[];
          };
        }>(`/api/achievements/user/${username}`);

        if (response.success && response.data.completed) {
          // Get previously shown achievements from localStorage
          const shownAchievements = JSON.parse(
            localStorage.getItem(`shown_achievements_${profile.id}`) || '[]'
          );

          // Find newly unlocked achievements
          const newAchievements = response.data.completed.filter(
            (achievement) => !shownAchievements.includes(achievement.id)
          );

          if (newAchievements.length > 0) {
            setNewlyUnlockedAchievements(newAchievements);
            setCurrentAchievementIndex(0);

            // Mark them as shown
            const updatedShown = [
              ...shownAchievements,
              ...newAchievements.map((a) => a.id),
            ];
            localStorage.setItem(
              `shown_achievements_${profile.id}`,
              JSON.stringify(updatedShown)
            );
          }
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    };

    checkNewAchievements();
  }, [isOwnProfile, profile?.id, username]);

  // Handle closing achievement modal and showing next one
  const handleCloseAchievementModal = () => {
    if (currentAchievementIndex < newlyUnlockedAchievements.length - 1) {
      setCurrentAchievementIndex(currentAchievementIndex + 1);
    } else {
      setNewlyUnlockedAchievements([]);
      setCurrentAchievementIndex(0);
    }
  };

  // Handle recommendation creation success
  const handleRecommendationSuccess = () => {
    setShowRecommendationModal(false);
    refetch(); // Refresh profile data
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (updatedProfile: {
    fullName: string;
    username: string;
    bio?: string;
    currentLocation?: string;
    hometown?: string;
    citiesVisited?: string[];
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
      whatsapp?: string;
      website?: string;
    };
  }) => {
    try {
      console.log('Profile updated:', updatedProfile);
      
      // Check if username changed and redirect if needed
      if (updatedProfile.username && updatedProfile.username !== username) {
        // Redirect to new username URL
        navigate(`/profile/${updatedProfile.username}`);
      } else {
        // Refresh profile data to reflect changes
        await refetch();
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      
      // Store locally for immediate display
      setLocalImages(prev => ({
        ...prev,
        [type]: previewUrl
      }));
      
      // Upload to server and get permanent URL
      const response = await profileService.uploadPhoto(file, type);
      
      if (response.success) {
        // Update the profile data with the new image URL
        console.log(`${type} image uploaded successfully:`, response.data.imageUrl);
        
        // Refresh profile data to get the updated URLs
        await refetch();
        
        // Clean up local preview URL
        URL.revokeObjectURL(previewUrl);
        setLocalImages(prev => ({
          ...prev,
          [type]: undefined
        }));
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      // Remove the preview on error
      setLocalImages(prev => ({
        ...prev,
        [type]: undefined
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <Header />
        <main className="pt-16 px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-8">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse"></div>
                <span className="text-primary">Loading profile...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-base">
        <Header />
        <main className="pt-16 px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-8 text-center">
              <h1 className="text-2xl font-bold text-primary mb-4">Profile Not Found</h1>
              <p className="text-muted mb-6">
                {error || 'The profile you are looking for does not exist.'}
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-pulse text-white px-6 py-2 rounded-lg hover:opacity-90"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    'My Recommendations',
    'Travel History', 
    'Achievements',
    'Saved'
  ];

  return (
    <div className="min-h-screen bg-base">
      <Header />
      
      {/* Main Content Layout - Exact Alex Kim Design */}
      <main className="pt-16 pb-20 lg:pb-8"> {/* Add bottom padding for mobile navigation */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
            {/* Left Sidebar - Statistics and Actions - Hidden on mobile */}
            <aside className="hidden lg:block space-y-6">
                      {/* Statistics Cards - Vertical Layout like Alex Kim */}
                      {stats && (
                        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6">
                          <div className="space-y-3">
                            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                              <div className="text-primary text-2xl font-bold">{profile.citiesVisited?.length || 0}</div>
                              <div className="text-muted text-sm">Cities</div>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                              <div className="text-primary text-2xl font-bold">{stats.recommendations || 0}</div>
                              <div className="text-muted text-sm">Recommendations</div>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                              <div className="text-primary text-2xl font-bold">{stats.travelBuddies || 0}</div>
                              <div className="text-muted text-sm">Travel Buddies</div>
                            </div>
                          </div>
                        </div>
                      )}
            </aside>

            {/* Right Content - Profile Info and Tabs */}
            <section className="space-y-6">
              {/* Cover Image */}
              <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-br from-gray-800/20 to-gray-700/20 rounded-2xl overflow-hidden group">
                {(localImages.cover || profile.coverPhotoUrl) ? (
                  <img 
                    src={localImages.cover || profile.coverPhotoUrl} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800/30 to-gray-700/30 flex items-center justify-center">
                    <div className="text-white/40 text-6xl">🌍</div>
                  </div>
                )}
                
                {/* Upload button for cover photo - only on hover */}
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageUpload(file, 'cover');
                      };
                      input.click();
                    }}
                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    📷
                  </button>
                )}
              </div>

              {/* Profile Picture and Info */}
              <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6 -mt-20 relative z-10">
                <div className="flex items-start space-x-6">
                  {/* Profile Photo */}
                  <div className="relative group">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-base overflow-hidden bg-gray-700 flex items-center justify-center shadow-2xl">
                      {(localImages.profile || profile.profilePhotoUrl) ? (
                        <img 
                          src={localImages.profile || profile.profilePhotoUrl} 
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-white text-2xl md:text-3xl font-bold">
                            {profile.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload button for profile photo - only on hover */}
                    {isOwnProfile && (
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImageUpload(file, 'profile');
                          };
                          input.click();
                        }}
                        className="absolute -bottom-2 -right-2 bg-pulse text-white p-2 rounded-full hover:bg-pulse/80 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        📷
                      </button>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-primary">
                        {profile.fullName}
                      </h1>
                      {isOwnProfile && (
                        <button
                          onClick={handleEditProfile}
                          className="bg-pulse text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pulse/80 transition-all duration-200"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <p className="text-muted text-lg mb-3">@{profile.username}</p>
                    
                    {/* Location tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.hometown && (
                        <span className="bg-gray-700/50 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {profile.hometown}
                        </span>
                      )}
                      {profile.currentLocation && (
                        <span className="bg-gray-700/50 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {profile.currentLocation}
                        </span>
                      )}
                    </div>

                    {/* Cities Visited */}
                    {profile.citiesVisited && profile.citiesVisited.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-muted text-sm font-medium mb-2">Cities Visited</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.citiesVisited.map((city, index) => (
                            <span key={index} className="bg-gray-700/50 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {city}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Bio */}
                    <div className="mb-4">
                      {profile.bio ? (
                        <p className="text-muted text-lg leading-relaxed">{profile.bio}</p>
                      ) : (
                        <p className="text-gray-500 text-lg leading-relaxed italic">
                          Tell us about yourself... Share your travel experiences, interests, and what makes you unique!
                        </p>
                      )}
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3">
                      {profile.instagramUrl && (
                        <a
                          href={profile.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center text-primary hover:bg-pulse hover:text-white transition-all duration-200"
                          title="Instagram"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                      )}
                      {profile.facebookUrl && (
                        <a
                          href={profile.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center text-primary hover:bg-pulse hover:text-white transition-all duration-200"
                          title="Facebook"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                      )}
                      {profile.whatsappContact && (
                        <a
                          href={`https://wa.me/${profile.whatsappContact}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center text-primary hover:bg-pulse hover:text-white transition-all duration-200"
                          title="WhatsApp"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                          </svg>
                        </a>
                      )}
                      {profile.email && (
                        <a
                          href={`mailto:${profile.email}`}
                          className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center text-primary hover:bg-pulse hover:text-white transition-all duration-200"
                          title="Email"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </a>
                      )}
                      {profile.websiteUrl && (
                        <a
                          href={profile.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center text-primary hover:bg-pulse hover:text-white transition-all duration-200"
                          title="Website"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards for Mobile View - Hidden on desktop */}
              {stats && (
                <div className="lg:hidden bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6">
                  <h3 className="text-primary text-lg font-semibold mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-primary text-2xl font-bold">{profile.citiesVisited?.length || 0}</div>
                      <div className="text-muted text-sm">Cities</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-primary text-2xl font-bold">{stats.recommendations || 0}</div>
                      <div className="text-muted text-sm">Recommendations</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-primary text-2xl font-bold">{stats.travelBuddies || 0}</div>
                      <div className="text-muted text-sm">Travel Buddies</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs Section */}
              <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6">
                {/* Mobile-optimized scrollable tabs */}
                <div className="overflow-x-auto scrollbar-hide mb-6">
                  <div className="flex space-x-1 min-w-max">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          activeTab === index
                            ? 'bg-pulse text-white'
                            : 'text-muted hover:text-primary hover:bg-gray-700/50'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-primary">My Recommendations</h3>
                        {isOwnProfile && recommendationCount > 0 && (
                          <button
                            onClick={() => setShowRecommendationModal(true)}
                            className="bg-pulse hover:bg-pulse/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 hover-lift"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Recommendation
                          </button>
                        )}
                      </div>
                      
                      {isOwnProfile ? (
                        recommendationCount === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-muted mb-4">
                              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.709A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-medium text-primary mb-2">No recommendations yet</h4>
                            <p className="text-muted mb-4">Share your favorite places with the community</p>
                            <button
                              onClick={() => setShowRecommendationModal(true)}
                              className="bg-pulse hover:bg-pulse/80 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto hover-lift"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create Your First Recommendation
                            </button>
                          </div>
                        ) : (
                          <RecommendationsList 
                            userId={profile?.id} 
                            showUser={false}
                            showActions={isOwnProfile}
                            className="mt-4"
                          />
                        )
                      ) : (
                        <RecommendationsList 
                          userId={profile?.id} 
                          showUser={false}
                          showActions={isOwnProfile}
                          className="mt-4"
                        />
                      )}
                    </div>
                  )}
                  {activeTab === 1 && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-6">Travel History</h3>
                      <TravelHistoryTimeline 
                        userId={profile?.id} 
                        username={username}
                      />
                    </div>
                  )}
                  {activeTab === 2 && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-6">Achievements</h3>
                      <AchievementProgress username={isOwnProfile ? undefined : username} />
                    </div>
                  )}
                  {activeTab === 3 && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Saved</h3>
                      <p className="text-muted">Your saved items will appear here...</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={{
            fullName: profile.fullName,
            username: profile.username,
            bio: profile.bio,
            currentLocation: profile.currentLocation,
            hometown: profile.hometown,
            citiesVisited: profile.citiesVisited || [],
            socialLinks: {
              twitter: profile.twitterUrl || '',
              instagram: profile.instagramUrl || '',
              facebook: profile.facebookUrl || '',
              linkedin: profile.linkedinUrl || '',
              whatsapp: profile.whatsappContact || '',
              website: profile.websiteUrl || '',
            },
          }}
          onSave={handleSaveProfile}
        />
      )}

      {/* Recommendation Creation Modal */}
      {isOwnProfile && (
        <Modal
          isOpen={showRecommendationModal}
          onClose={() => setShowRecommendationModal(false)}
          title="Create Recommendation"
          size="xl"
        >
          <CreateRecommendationForm
            onSuccess={handleRecommendationSuccess}
            onCancel={() => setShowRecommendationModal(false)}
          />
        </Modal>
      )}

      {/* Achievement Unlock Modal */}
      {newlyUnlockedAchievements.length > 0 && (
        <BadgeUnlockModal
          achievement={newlyUnlockedAchievements[currentAchievementIndex]}
          onClose={handleCloseAchievementModal}
        />
      )}

      <BottomNavigation />
    </div>
  );
}
