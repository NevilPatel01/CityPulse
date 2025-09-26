interface Badge {
  id: string;
  icon: string;
  label: string;
  description: string;
}

interface ProfileBadgesProps {
  badges: Badge[];
}

export function ProfileBadges({ badges }: ProfileBadgesProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Badges</h3>
      {badges.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-xl hover:bg-gray-600 transition-all duration-200 hover:scale-110 cursor-pointer"
              title={`${badge.label}: ${badge.description}`}
            >
              <span>{badge.icon}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm">No badges yet</p>
          <p className="text-xs">Start exploring to earn your first badge!</p>
        </div>
      )}
    </div>
  );
}