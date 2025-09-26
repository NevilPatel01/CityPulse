import { useState } from 'react';

interface ProfileHeaderProps {
  profile: {
    fullName: string;
    username: string;
    bio?: string;
    currentLocation?: string;
    hometown?: string;
    citiesVisited?: string[];
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      email?: string;
      website?: string;
    };
    stats?: {
      cities: number;
      recommendations: number;
      buddies: number;
      points: number;
    };
    isOwnProfile: boolean;
    profileCompletion?: {
      isComplete: boolean;
      percentage: number;
      canBeDiscovered: boolean;
    };
  };
  onEditProfile?: () => void;
}

export function ProfileHeader({ profile, onEditProfile }: ProfileHeaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<'profile' | 'cover' | null>(null);
  const [localImages, setLocalImages] = useState<{
    profile?: string;
    cover?: string;
  }>({});

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    setIsUploading(true);
    setUploadingType(type);
    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      
      // Store locally for now
      setLocalImages(prev => ({
        ...prev,
        [type]: previewUrl
      }));
      
      console.log('Uploading', type, 'image:', file.name);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadingType(null);
    }
  };


  return (
    <div className="bg-base min-h-screen">
      {/* Cover Photo Section - Exact Alex Kim Design */}
      <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-br from-gray-800/20 to-gray-700/20">
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
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white tracking-tight">CityPulse</span>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-6 0 3 3 0 006 0zM9 8a3 3 0 10-6 0 3 3 0 006 0zM12 15a6 6 0 00-6 6h12a6 6 0 00-6-6z" />
                </svg>
              </button>
              {profile.isOwnProfile && (
                <>
                  <button 
                    onClick={onEditProfile}
                    className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload button for cover photo - only on hover */}
        {profile.isOwnProfile && (
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
            disabled={isUploading}
          >
            {uploadingType === 'cover' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '📷'
            )}
          </button>
        )}

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
          <div className="max-w-7xl mx-auto flex items-end space-x-6">
            {/* Profile Photo */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/20 overflow-hidden bg-gray-700">
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
              {profile.isOwnProfile && (
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
                  disabled={isUploading}
                >
                  {uploadingType === 'profile' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    '📷'
                  )}
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 pb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {profile.fullName}
              </h1>
              <p className="text-white/70 text-sm md:text-base mb-2">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="text-white/80 text-sm md:text-base max-w-2xl">
                  {profile.bio}
                </p>
              )}
              {(profile.currentLocation || profile.hometown) && (
                <div className="flex items-center space-x-4 mt-3 text-white/60 text-sm">
                  {profile.currentLocation && (
                    <span className="flex items-center">
                      📍 {profile.currentLocation}
                    </span>
                  )}
                  {profile.hometown && (
                    <span className="flex items-center">
                      🏠 {profile.hometown}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}