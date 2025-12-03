import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useProfile } from '../hooks/useProfile';
import { profileService } from '../services/profileService';
import { apiRequest } from '../config/api';
import { getBookmarkedPosts } from '../services/feedService';
import { RecommendationsList } from '../components/recommendations/RecommendationsList';
import { 
  sendBuddyRequest, 
  removeBuddy, 
  cancelBuddyRequest,
  getSentBuddyRequests,
  type BuddyRequest
} from '../services/buddyService';
import { useSafeToast } from '../hooks/useSafeToast';
import { AchievementProgress } from '../components/achievements/AchievementProgress';
import { TravelHistoryTimeline } from '../components/profile/TravelHistoryTimeline';
import { BadgeUnlockModal } from '../components/achievements/BadgeUnlockModal';
import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { ImageCropper } from '../components/common/ImageCropper';
import { PrivateProfileView } from '../components/profile/PrivateProfileView';
import type { UserAchievement } from '../types/achievement';
import type { FeedPost } from '../services/feedService';
import { 
  Camera, MapPin, Home, Instagram, Facebook, Mail, Globe, 
  ChevronDown, ChevronUp, Users, Heart, 
  Calendar, Shield, MessageCircle, UserPlus, UserMinus, X, Send, RotateCcw
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser, checkAuthStatus } = useAuth();
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [showBuddyRequestModal, setShowBuddyRequestModal] = useState(false);
  const [buddyRequestMessage, setBuddyRequestMessage] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  
  useAuthGuard({ requireAuth: true });
  
  const { profile, stats, loading, error, refetch } = useProfile(username || '');
  const { showSuccess, showError } = useSafeToast();
  
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
  
  const [localImages, setLocalImages] = useState<{ profile?: string; cover?: string; }>({});
  const [recommendationCount, setRecommendationCount] = useState<number>(0);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [savedRecommendations, setSavedRecommendations] = useState<FeedPost[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedPage, setSavedPage] = useState(1);
  const [hasMoreSaved, setHasMoreSaved] = useState(true);
  const [croppingImage, setCroppingImage] = useState<{ src: string; type: 'profile' | 'cover'; } | null>(null);
  const [showAllCities, setShowAllCities] = useState(false);

  const isOwnProfile = Boolean(currentUser && currentUser.username === username);

  // Refresh auth status when username changes to ensure currentUser is up-to-date
  useEffect(() => {
    if (username && currentUser && currentUser.username !== username) {
      // Username in URL doesn't match current user - refresh auth status
      // This ensures auth context is updated if username was changed in profile edit
      checkAuthStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]); // Only depend on username param

  useEffect(() => {
    const maxTab = isOwnProfile ? 3 : 2;
    if (activeTab > maxTab) {
      setActiveTab(0);
    }
  }, [isOwnProfile, activeTab]);

  const getFullImageUrl = (imageUrl: string | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) return imageUrl;
    
    const baseUrl = import.meta.env.VITE_API_URL || 
                    (typeof window !== 'undefined' && window.location.origin) || 
                    'http://localhost:5001';
    
    const cacheBust = `?t=${Date.now()}`;
    return `${baseUrl}${imageUrl}${cacheBust}`;
  };

  // Format member since date
  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return 'Member';
    const date = new Date(dateString);
    return `Member since ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  useEffect(() => {
    const fetchRecommendationCount = async () => {
      try {
        const data = await apiRequest<{success: boolean; data: {pagination: {total: number}}}>(`/api/recommendations?user_id=${profile?.id || ''}`);
        
        if (data && data.success) {
          setRecommendationCount(data.data.pagination?.total || 0);
        } else {
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

  useEffect(() => {
    const fetchSavedRecommendations = async () => {
      if (!isOwnProfile || activeTab !== 3) return;
      
      try {
        setLoadingSaved(true);
        const response = await getBookmarkedPosts(savedPage, 12) as {
          success: boolean;
          data: {
            posts: FeedPost[];
            pagination: { currentPage: number; totalPages: number; totalItems: number; };
          };
        };
        
        if (response.success) {
          if (savedPage === 1) {
            setSavedRecommendations(response.data.posts);
          } else {
            setSavedRecommendations(prev => [...prev, ...response.data.posts]);
          }
          setHasMoreSaved(response.data.pagination.currentPage < response.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Error fetching saved recommendations:', error);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSavedRecommendations();
  }, [isOwnProfile, activeTab, savedPage]);

  useEffect(() => {
    const checkNewAchievements = async () => {
      if (!isOwnProfile || !profile?.id) return;

      try {
        const response = await apiRequest<{
          success: boolean;
          data: { completed: UserAchievement[]; inProgress: UserAchievement[]; };
        }>(`/api/achievements/user/${username}`);

        if (response.success && response.data.completed) {
          const shownAchievements = JSON.parse(
            localStorage.getItem(`shown_achievements_${profile.id}`) || '[]'
          );

          const newAchievements = response.data.completed.filter(
            (achievement) => !shownAchievements.includes(achievement.id)
          );

          if (newAchievements.length > 0) {
            setNewlyUnlockedAchievements(newAchievements);
            setCurrentAchievementIndex(0);

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

  const handleCloseAchievementModal = () => {
    if (currentAchievementIndex < newlyUnlockedAchievements.length - 1) {
      setCurrentAchievementIndex(currentAchievementIndex + 1);
    } else {
      setNewlyUnlockedAchievements([]);
      setCurrentAchievementIndex(0);
    }
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCroppingImage({
          src: reader.result as string,
          type
        });
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!croppingImage) return;

    try {
      const { type } = croppingImage;
      
      const previewUrl = URL.createObjectURL(croppedBlob);
      
      setLocalImages(prev => ({
        ...prev,
        [type]: previewUrl
      }));
      
      const file = new File([croppedBlob], `${type}.jpg`, { type: 'image/jpeg' });
      
      await profileService.uploadPhoto(file, type);
      await refetch();
      
      setCroppingImage(null);
    } catch (error) {
      console.error(`Error uploading ${croppingImage.type} photo:`, error);
      setLocalImages(prev => {
        const updated = { ...prev };
        delete updated[croppingImage.type];
        return updated;
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <Header />
        <main className="pt-16 pb-20 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse"></div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-base">
        <Header />
        <main className="pt-16 pb-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-primary mb-2">Profile Not Found</h2>
            <p className="text-muted">The profile you're looking for doesn't exist.</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (profile.profileVisibility === 'private' && !isOwnProfile) {
    return <PrivateProfileView profile={{
      ...profile,
      buddyRequestStatus: profile.buddyRequestStatus || 'none'
    }} />;
  }

  // Tabs with short labels for mobile
  const tabsData = isOwnProfile
    ? [
        { full: 'Recommendations', short: 'Recs' },
        { full: 'Travel History', short: 'History' },
        { full: 'Achievements', short: 'Badges' },
        { full: 'Saved', short: 'Saved' }
      ]
    : [
        { full: 'Recommendations', short: 'Recs' },
        { full: 'Travel History', short: 'History' },
        { full: 'Achievements', short: 'Badges' }
      ];

  const displayedCities = showAllCities 
    ? profile.citiesVisited 
    : profile.citiesVisited?.slice(0, 8);

  // Buddy request status helpers
  const isBuddyConnected = profile.buddyRequestStatus === 'accepted';
  const isPendingBuddy = profile.buddyRequestStatus === 'pending';
  const isPendingRequestSent = profile.buddyRequestStatus === 'pending' && profile.buddyRequestDirection === 'sent';

  const handleAddBuddy = () => {
    setShowBuddyRequestModal(true);
  };

  const handleSendBuddyRequest = async () => {
    if (!profile?.id) return;
    
    setIsSendingRequest(true);
    try {
      await sendBuddyRequest(profile.id, buddyRequestMessage.trim() || undefined);
      showSuccess('Success', 'Buddy request sent successfully');
      setBuddyRequestMessage('');
      setShowBuddyRequestModal(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      showError('Error', error.message || 'Failed to send buddy request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRemoveBuddy = async () => {
    if (!profile?.id) return;
    
    try {
      await removeBuddy(profile.id);
      showSuccess('Success', 'Travel buddy removed');
      setShowBuddyModal(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      showError('Error', error.message || 'Failed to remove buddy');
    }
  };

  const handleCancelRequest = async () => {
    if (!profile?.id) return;
    
    try {
      // Get sent requests to find the request ID for this user
      const response = await getSentBuddyRequests();
      
      if (response.success && response.data.requests) {
        const request = response.data.requests.find(
          (r: BuddyRequest) => r.requested_id === profile.id
        );
        
        if (request) {
          await cancelBuddyRequest(request.id);
          showSuccess('Success', 'Buddy request cancelled');
          refetch();
        } else {
          showError('Error', 'Request not found');
        }
      } else {
        showError('Error', 'Failed to fetch requests');
      }
    } catch (err) {
      const error = err as Error;
      showError('Error', error.message || 'Failed to cancel request');
    }
  };

  return (
    <div className="min-h-screen bg-base">
      <Header />
      <BottomNavigation />
      
      <main id="main-content" role="main" className="pt-16 pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          
          {/* Two Column Layout - Stats Sidebar + Profile Card */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Sidebar - Stats Cards (Desktop vertical, Mobile horizontal) */}
            <div className="order-2 lg:order-1 w-full lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-4">
                {/* Stats Cards - Horizontal on mobile, Vertical on desktop */}
                <div className="bg-surface-glass backdrop-blur-glass rounded-2xl overflow-hidden shadow-xl">
                  <div className="flex flex-row lg:flex-col divide-x lg:divide-x-0 lg:divide-y divide-white/5">
                    {/* Cities */}
                    <div className="flex-1 lg:flex-none p-4 lg:p-5 hover:bg-white/5 transition-all duration-300 cursor-pointer group">
                      <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-pulse/20 to-orange-500/10 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-pulse/20 transition-all duration-300">
                          <MapPin size={20} className="text-pulse" />
                        </div>
                        <div className="text-center lg:text-left">
                          <p className="text-xl lg:text-2xl font-bold text-primary">{profile.citiesVisited?.length || 0}</p>
                          <p className="text-[10px] lg:text-xs text-muted font-medium">Cities</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    <div className="flex-1 lg:flex-none p-4 lg:p-5 hover:bg-white/5 transition-all duration-300 cursor-pointer group">
                      <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
                          <Heart size={20} className="text-pink-500" />
                        </div>
                        <div className="text-center lg:text-left">
                          <p className="text-xl lg:text-2xl font-bold text-primary">{stats?.recommendations || 0}</p>
                          <p className="text-[10px] lg:text-xs text-muted font-medium">Recs</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Travel Buddies */}
                    <div className="flex-1 lg:flex-none p-4 lg:p-5 hover:bg-white/5 transition-all duration-300 cursor-pointer group">
                      <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                          <Users size={20} className="text-blue-500" />
                        </div>
                        <div className="text-center lg:text-left">
                          <p className="text-xl lg:text-2xl font-bold text-primary">{stats?.travelBuddies || 0}</p>
                          <p className="text-[10px] lg:text-xs text-muted font-medium">Buddies</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Member Since Card */}
                <div className="bg-surface-glass backdrop-blur-glass rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-muted" />
                    <span className="text-sm text-muted">{formatMemberSince(profile.createdAt)}</span>
                  </div>
                </div>

                {/* Social Links Card - Only visible on desktop */}
                {(isOwnProfile || isBuddyConnected) && (
                  <div className="hidden lg:block bg-surface-glass backdrop-blur-glass rounded-2xl p-4 shadow-xl">
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Connect</h3>
                    {(profile.instagramUrl || profile.facebookUrl || profile.email || profile.websiteUrl || profile.whatsappContact) ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.instagramUrl && (
                          <a
                            href={profile.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:border-white hover:shadow-lg transition-all"
                            title="Instagram"
                          >
                            <Instagram size={18} className="text-muted hover:text-white transition-colors" />
                          </a>
                        )}
                        {profile.facebookUrl && (
                          <a
                            href={profile.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-white hover:shadow-lg transition-all"
                            title="Facebook"
                          >
                            <Facebook size={18} className="text-muted hover:text-white transition-colors" />
                          </a>
                        )}
                        {profile.email && (
                          <a
                            href={`mailto:${profile.email}`}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-pulse hover:border-white hover:shadow-lg transition-all"
                            title="Email"
                          >
                            <Mail size={18} className="text-muted hover:text-white transition-colors" />
                          </a>
                        )}
                        {profile.websiteUrl && (
                          <a
                            href={profile.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-green-600 hover:border-white hover:shadow-lg transition-all"
                            title="Website"
                          >
                            <Globe size={18} className="text-muted hover:text-white" />
                          </a>
                        )}
                        {profile.whatsappContact && (
                          <a
                            href={`https://wa.me/${profile.whatsappContact.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-green-500 hover:border-transparent transition-all"
                            title="WhatsApp"
                          >
                            <MessageCircle size={18} className="text-muted hover:text-white" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted italic">No social networks available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Main Profile Card */}
            <div className="order-1 lg:order-2 flex-1">
              <div className="bg-surface-glass backdrop-blur-glass rounded-3xl overflow-hidden shadow-2xl">
                
          {/* Cover Photo */}
                <div className="relative w-full h-44 md:h-52 lg:h-56 bg-gradient-to-br from-gray-800/50 via-gray-700/30 to-gray-900/50">
            {(localImages.cover || profile.coverPhotoUrl) ? (
              <img 
                src={localImages.cover || getFullImageUrl(profile.coverPhotoUrl)} 
                alt="Cover" 
                      className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pulse/10 via-purple-900/20 to-blue-900/20">
                      <div className="text-white/5 text-8xl">🌍</div>
              </div>
            )}
            
            {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
                  {/* Cover Photo Upload */}
            {isOwnProfile && (
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>, 'cover');
                  input.click();
                }}
                      className="absolute top-4 right-4 p-2.5 rounded-full text-white bg-black/40 backdrop-blur-md border border-white/20 hover:bg-pulse hover:border-pulse transition-all duration-300 shadow-lg"
                aria-label="Upload cover photo"
              >
                      <Camera size={18} />
              </button>
            )}

                  {/* Verified Badge - Top Left */}
                  {(profile as { emailVerified?: boolean }).emailVerified && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 text-xs">
                        <Shield size={12} />
                        <span>Verified</span>
                      </div>
                    </div>
                  )}
          </div>

                {/* Profile Info Section - Relative container for absolute avatar */}
                <div className="relative px-5 md:px-6 pb-6">
                  {/* Avatar - Positioned absolutely to overlap cover */}
                  <div className="absolute -top-14 left-5 md:left-6 z-10">
                <div className="relative group">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-base overflow-hidden border-[3px] border-gray-700/50 shadow-2xl">
                    {(localImages.profile || profile.profilePhotoUrl) ? (
                      <img 
                        src={localImages.profile || getFullImageUrl(profile.profilePhotoUrl)} 
                        alt={profile.fullName}
                            className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pulse to-purple-600 flex items-center justify-center">
                            <span className="text-white text-2xl sm:text-3xl font-bold">
                          {profile.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                      {/* Profile Photo Upload */}
                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>, 'profile');
                        input.click();
                      }}
                          className="absolute bottom-1 right-1 p-1.5 rounded-xl text-white bg-pulse shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                      aria-label="Upload profile photo"
                    >
                          <Camera size={12} />
                    </button>
                  )}
                    </div>
                </div>

                  {/* Name, Username, Edit Button - With left padding for avatar space */}
                  <div className="pt-4 pl-28 sm:pl-36">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <h1 className="text-xl sm:text-2xl font-bold text-primary truncate">
                        {profile.fullName}
                      </h1>
                      
                      {/* Action Buttons - Inline on desktop */}
                      <div className="flex gap-2 sm:ml-auto flex-shrink-0">
                        {isOwnProfile ? (
                    <button
                      onClick={handleEditProfile}
                            className="px-5 py-2 rounded-xl text-white text-sm font-semibold bg-pulse hover:bg-pulse/90 transition-all duration-300 shadow-md shadow-pulse/20 hover:scale-105 active:scale-95"
                    >
                      Edit Profile
                          </button>
                        ) : (
                          <>
                            {isBuddyConnected ? (
                              <>
                                <button 
                                  onClick={() => setShowBuddyModal(true)}
                                  className="px-5 py-2 rounded-full text-white text-sm font-semibold bg-green-600 hover:bg-green-700 border border-green-500 flex items-center gap-1.5 transition-all duration-300 shadow-md shadow-green-600/20"
                                  title="Manage Travel Buddy"
                                >
                                  <Users size={14} />
                                  Buddy
                                </button>
                              </>
                            ) : isPendingBuddy ? (
                              isPendingRequestSent ? (
                                <button 
                                  onClick={handleCancelRequest}
                                  className="px-5 py-2 rounded-full text-white text-sm font-semibold bg-orange-600 hover:bg-orange-700 border border-orange-500 transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-orange-600/20"
                                  title="Cancel Buddy Request"
                                >
                                  <RotateCcw size={14} />
                                  Request Sent
                                </button>
                              ) : (
                                <button 
                                  className="px-5 py-2 rounded-full text-muted text-sm font-semibold bg-white/5 border border-white/20 cursor-default"
                                  title="Request Pending"
                                  disabled
                                >
                                  Pending
                                </button>
                              )
                            ) : (
                              <button 
                                onClick={handleAddBuddy}
                                className="px-5 py-2 rounded-full text-white text-sm font-semibold bg-pulse hover:bg-pulse/90 transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-pulse/20"
                              >
                                <UserPlus size={14} />
                                Add Buddy
                    </button>
                            )}
                          </>
                  )}
                </div>
              </div>

                    <p className="text-muted text-sm mt-1">@{profile.username}</p>
              </div>

              {/* Location Info */}
              {(profile.currentLocation || profile.hometown) && (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-muted">
                  {profile.currentLocation && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-pulse" />
                          Lives in <span className="text-primary font-medium ml-1">{profile.currentLocation}</span>
                        </span>
                  )}
                  {profile.hometown && (
                        <span className="flex items-center gap-1.5">
                          <Home size={14} className="text-pulse" />
                          From <span className="text-primary font-medium ml-1">{profile.hometown}</span>
                        </span>
                  )}
                </div>
              )}

                  {/* Cities Visited Chips */}
              {profile.citiesVisited && profile.citiesVisited.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted mb-2.5 font-medium uppercase tracking-wide">Cities Visited</p>
                  <div className="flex flex-wrap gap-2">
                    {displayedCities?.map((city, index) => (
                      <span 
                        key={index} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-primary hover:border-pulse/40 hover:bg-pulse/10 transition-all duration-300 cursor-pointer"
                            onClick={() => navigate(`/city/${city.split(',')[0].trim()}`)}
                      >
                            <MapPin size={10} className="text-pulse" />
                        {city}
                      </span>
                    ))}
                        {profile.citiesVisited.length > 8 && (
                      <button
                        onClick={() => setShowAllCities(!showAllCities)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-pulse/10 border border-pulse/30 text-pulse hover:bg-pulse/20 transition-all"
                      >
                        {showAllCities ? (
                              <>Show less <ChevronUp size={12} /></>
                        ) : (
                              <>+{profile.citiesVisited.length - 8} more <ChevronDown size={12} /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-primary text-sm leading-relaxed mt-4">
                      {profile.bio}
                    </p>
                  )}

                  {/* Mobile Social Links */}
                  {(isOwnProfile || isBuddyConnected) && (
                    <div className="lg:hidden mt-4 pt-4 border-t border-white/10">
                      {(profile.instagramUrl || profile.facebookUrl || profile.email || profile.websiteUrl || profile.whatsappContact) ? (
                        <div className="flex gap-2">
                          {profile.email && (
                            <a
                              href={`mailto:${profile.email}`}
                            className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-pulse hover:border-white hover:shadow-lg transition-all"
                            title="Email"
                          >
                            <Mail size={18} className="text-muted hover:text-white transition-colors" />
                          </a>
                          )}
                  {profile.instagramUrl && (
                    <a
                      href={profile.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                              className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:border-white hover:shadow-lg transition-all"
                      title="Instagram"
                    >
                              <Instagram size={18} className="text-muted hover:text-white transition-colors" />
                    </a>
                  )}
                  {profile.facebookUrl && (
                    <a
                      href={profile.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                              className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-white hover:shadow-lg transition-all"
                      title="Facebook"
                    >
                              <Facebook size={18} className="text-muted hover:text-white transition-colors" />
                    </a>
                  )}
                          {profile.websiteUrl && (
                    <a
                              href={profile.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-green-600 hover:border-white hover:shadow-lg transition-all"
                              title="Website"
                    >
                              <Globe size={18} className="text-muted hover:text-white" />
                    </a>
                  )}
                          {profile.whatsappContact && (
                    <a
                              href={`https://wa.me/${profile.whatsappContact.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                              className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-green-500 hover:border-transparent transition-all"
                              title="WhatsApp"
                    >
                              <MessageCircle size={18} className="text-muted" />
                    </a>
                  )}
                </div>
                      ) : (
                        <p className="text-sm text-muted italic">No social networks available</p>
                      )}
                    </div>
                )}
                </div>
              </div>
              </div>
            </div>

          {/* Tabs Section - Full Width Below Two-Column */}
          <div className="mt-6 bg-surface-glass backdrop-blur-glass rounded-3xl overflow-hidden shadow-2xl">
            {/* Tab Headers - Fixed width tabs that don't wrap */}
            <div className="border-b border-white/5 bg-white/[0.02]">
              <div className="flex w-full">
                {tabsData.map((tab, index) => (
                    <button
                    key={tab.full}
                      onClick={() => setActiveTab(index)}
                    className={`flex-1 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap ${
                        activeTab === index
                        ? 'text-pulse'
                          : 'text-muted hover:text-primary'
                      }`}
                    >
                    {/* Short label on mobile, full label on larger screens */}
                    <span className="sm:hidden">{tab.short}</span>
                    <span className="hidden sm:inline">{tab.full}</span>
                      {activeTab === index && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-pulse rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
            <div className="p-4 md:p-6 lg:p-8 min-h-[400px]">
                {activeTab === 0 && (
                <div className="animate-in fade-in duration-500">
                  {isOwnProfile && recommendationCount === 0 ? (
                    <div className="text-center py-12">
                      {/* Travel Illustration */}
                      <div className="mb-6 opacity-60">
                        <svg className="w-32 h-32 mx-auto text-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="50" cy="50" r="45" strokeDasharray="5 3" />
                          <path d="M50 5 C50 5, 95 50, 50 95 C5 50, 50 5, 50 5" fill="none" />
                          <path d="M5 50 H95" strokeDasharray="3 2" />
                          <circle cx="30" cy="35" r="3" fill="currentColor" />
                          <circle cx="70" cy="45" r="3" fill="currentColor" />
                          <circle cx="45" cy="65" r="3" fill="currentColor" />
                          <path d="M30 35 L45 28 L70 45" strokeWidth="1" strokeDasharray="2 2" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">No recommendations yet</h3>
                      <p className="text-muted text-sm mb-6 max-w-sm mx-auto">Share your favorite places with the travel community</p>
                        <button
                          onClick={() => navigate('/create-recommendation')}
                        className="bg-pulse hover:bg-pulse/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-pulse/30"
                        >
                        Add Your First Recommendation
                        </button>
                      </div>
                  ) : (
                    <div>
                      <RecommendationsList userId={profile.id} />
                      
                      {/* Add Recommendation Button - Below content */}
                      {isOwnProfile && (
                        <div className="mt-6 flex justify-center">
                        <button
                          onClick={() => navigate('/create-recommendation')}
                            className="w-12 h-12 bg-pulse hover:bg-pulse/90 text-white rounded-full shadow-lg shadow-pulse/30 flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:scale-110"
                            title="Add Recommendation"
                        >
                            +
                        </button>
                      </div>
                      )}
                    </div>
                    )}
                  </div>
                )}

                {activeTab === 1 && (
                <div className="animate-in fade-in duration-500">
                    <TravelHistoryTimeline username={profile.username} />
                  </div>
                )}

                {activeTab === 2 && (
                <div className="animate-in fade-in duration-500">
                    <AchievementProgress username={profile.username} />
                  </div>
                )}

                {activeTab === 3 && isOwnProfile && (
                <div className="animate-in fade-in duration-500">
                    {savedRecommendations.length === 0 && !loadingSaved ? (
                    <div className="text-center py-12">
                      {/* Bookmark Illustration */}
                      <div className="mb-6 opacity-60">
                        <svg className="w-28 h-28 mx-auto text-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="10" r="2" strokeDasharray="2 1" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">No saved recommendations</h3>
                      <p className="text-muted text-sm mb-6 max-w-sm mx-auto">Save recommendations from other travelers to plan your next adventure!</p>
                        <button
                          onClick={() => navigate('/explore')}
                        className="bg-pulse hover:bg-pulse/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-pulse/30"
                        >
                          Explore Recommendations
                        </button>
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedRecommendations.map((post) => (
                        <RecommendationCard
                            key={post.id}
                          recommendation={{
                            id: post.id,
                            title: post.title,
                            description: post.description,
                            views_count: post.views_count || 0,
                            likes_count: post.likes_count || 0,
                            created_at: post.created_at,
                            username: post.username,
                            full_name: post.full_name,
                            category_name: post.category_name || '',
                            city_name: post.city_name || '',
                            country: post.country || '',
                            photos: post.photos,
                            user_id: post.user_id,
                            is_liked: post.is_liked,
                            is_bookmarked: post.is_bookmarked
                          }}
                          onUpdate={(id, updates) => {
                            // If bookmark is removed, remove from list immediately
                            if (updates.is_bookmarked === false) {
                              setSavedRecommendations(prev => prev.filter(p => p.id !== id));
                            } else {
                              // Otherwise, update the item
                              const updated = savedRecommendations.map(p => 
                                p.id === id ? { ...p, ...updates } : p
                              );
                              setSavedRecommendations(updated);
                            }
                          }}
                            />
                        ))}
                        {hasMoreSaved && (
                          <button
                            onClick={() => setSavedPage(prev => prev + 1)}
                            disabled={loadingSaved}
                          className="w-full py-4 bg-white/5 hover:bg-pulse/10 border border-white/10 hover:border-pulse/30 rounded-xl text-pulse font-semibold transition-all duration-300 disabled:opacity-50"
                          >
                          {loadingSaved ? 'Loading...' : 'Load More'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Cropper Modal */}
      {croppingImage && (
        <ImageCropper
          imageSrc={croppingImage.src}
          onCropComplete={handleCropComplete}
          onCancel={() => setCroppingImage(null)}
          aspect={croppingImage.type === 'cover' ? 3 : 1}
          targetWidth={croppingImage.type === 'cover' ? 1200 : 400}
          targetHeight={croppingImage.type === 'cover' ? 400 : 400}
        />
      )}

      {/* Achievement Unlock Modal */}
      {newlyUnlockedAchievements.length > 0 && (
        <BadgeUnlockModal
          achievement={newlyUnlockedAchievements[currentAchievementIndex]}
          onClose={handleCloseAchievementModal}
        />
      )}

      {/* Buddy Request Modal */}
      <Modal
        isOpen={showBuddyRequestModal}
        onClose={() => {
          setShowBuddyRequestModal(false);
          setBuddyRequestMessage('');
        }}
        title="Send Buddy Request"
        size="md"
      >
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-pulse/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-pulse" />
              </div>
              <div>
                <p className="text-primary font-semibold">{profile?.fullName}</p>
                <p className="text-muted text-sm">@{profile?.username}</p>
              </div>
            </div>
            <p className="text-muted text-sm mb-4">
              Send a message with your buddy request to introduce yourself and explain why you'd like to connect.
            </p>
            
            <div className="space-y-2">
              <label htmlFor="buddy-message" className="block text-sm font-medium text-primary">
                Message (Optional)
              </label>
              <textarea
                id="buddy-message"
                value={buddyRequestMessage}
                onChange={(e) => setBuddyRequestMessage(e.target.value)}
                placeholder="Hey! I'd love to connect and share travel experiences..."
                className="w-full px-4 py-3 rounded-lg bg-base border border-subtle text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-transparent resize-none"
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-muted text-right">
                {buddyRequestMessage.length}/500 characters
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSendBuddyRequest}
              disabled={isSendingRequest}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-pulse hover:bg-pulse/90 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {isSendingRequest ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => {
                setShowBuddyRequestModal(false);
                setBuddyRequestMessage('');
              }}
              disabled={isSendingRequest}
              className="px-4 py-3 rounded-lg bg-surface-glass hover:bg-surface-glass/80 border border-subtle text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </Modal>

      {/* Buddy Management Modal */}
      <Modal
        isOpen={showBuddyModal}
        onClose={() => setShowBuddyModal(false)}
        title="Travel Buddy"
        size="sm"
      >
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-primary font-semibold">{profile?.fullName}</p>
                <p className="text-muted text-sm">@{profile?.username}</p>
              </div>
            </div>
            <p className="text-muted text-sm">
              You are connected as travel buddies. You can view each other's social networks and contact information.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRemoveBuddy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200"
            >
              <UserMinus size={18} />
              Remove Travel Buddy
            </button>
            <button
              onClick={() => setShowBuddyModal(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-glass hover:bg-surface-glass/80 border border-subtle text-primary transition-all duration-200"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
