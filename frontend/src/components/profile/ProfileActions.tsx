interface ProfileActionsProps {
  isOwnProfile: boolean;
  onSettings?: () => void;
  onShareProfile?: () => void;
}

export function ProfileActions({ isOwnProfile, onSettings, onShareProfile }: ProfileActionsProps) {
  const handleShareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my CityPulse profile',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
      console.log('Profile URL copied to clipboard');
    }
    onShareProfile?.();
  };

  return (
    <div className="space-y-3">
      {isOwnProfile && (
        <button
          onClick={onSettings}
          className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
        >
          Settings
        </button>
      )}
      <button
        onClick={handleShareProfile}
        className="w-full border border-pulse text-pulse py-3 rounded-xl hover:bg-pulse/10 transition-all duration-200 hover:scale-105"
      >
        Share Profile
      </button>
    </div>
  );
}