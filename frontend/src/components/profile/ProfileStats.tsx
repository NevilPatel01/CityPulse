interface ProfileStatsProps {
  stats: {
    cities: number;
    recommendations: number;
    travelBuddies: number;
    points: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const statItems = [
    { label: 'Cities', value: stats.cities },
    { label: 'Recommendations', value: stats.recommendations },
    { label: 'Travel Buddies', value: stats.travelBuddies },
    { label: 'Points', value: stats.points.toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      {statItems.map((item, index) => (
        <div 
          key={index} 
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
        >
          <div className="text-3xl font-bold text-white mb-1">
            {item.value}
          </div>
          <div className="text-sm text-gray-400">{item.label}</div>
        </div>
      ))}
    </div>
  );
}