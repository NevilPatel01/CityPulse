interface ProfileContentProps {
  activeTab: number;
}

export function ProfileContent({ activeTab }: ProfileContentProps) {
  // Mock data for demonstration - replace with API calls
  const mockRecommendations = [
    {
      id: 1,
      title: 'Mount Snowdon Summit Trail',
      location: 'Tokyo, Japan',
      category: 'Hiking & Trails',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      title: 'Shibuya Sky Observatory',
      location: 'Tokyo, Japan',
      category: 'Viewpoints',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 3,
      title: 'Tsukiji Outer Market',
      location: 'Tokyo, Japan',
      category: 'Food & Markets',
      image: 'https://images.unsplash.com/photo-1519864600265-abb224a0e3c7?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const mockTravelHistory = [
    {
      id: 1,
      location: 'Snowdonia, Wales',
      dates: 'Dec 10-17, 2024',
      highlights: ['Mount Snowdon Summit', 'Llanberis Railway', 'Betws-y-Coed'],
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      location: 'Tokyo, Japan',
      dates: 'Nov 15 - Dec 5, 2024',
      highlights: ['Shibuya Sky', 'Tsukiji Market', 'Senso-ji Temple'],
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 3,
      location: 'Seoul, South Korea',
      dates: 'Oct 10-25, 2024',
      highlights: ['Han River Park', 'Bukchon Village', 'Namsan Tower'],
      image: 'https://images.unsplash.com/photo-1519864600265-abb224a0e3c7?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const mockAchievements = [
    {
      id: 1,
      title: 'Badge: Globetrotter',
      description: 'Visited 20+ countries',
    },
    {
      id: 2,
      title: 'Badge: Local Expert',
      description: 'Top-rated recommendations in Tokyo',
    },
  ];

  const mockSaved = [
    {
      id: 1,
      title: 'Saved: Brooklyn Bridge Park',
      location: 'New York, NY',
    },
  ];

  const renderRecommendations = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockRecommendations.map((item) => (
        <div key={item.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 group">
          <div className="relative">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="bg-gray-800/80 text-white px-2 py-1 rounded-lg text-xs font-medium">
                {item.category}
              </span>
            </div>
            <button className="absolute top-3 right-3 w-8 h-8 bg-gray-800/80 rounded-full flex items-center justify-center text-white hover:bg-gray-700/80 transition-all duration-200">
              ❤️
            </button>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-pulse transition-colors">
              {item.title}
            </h3>
            <p className="text-gray-400 text-sm mb-3">{item.location}</p>
            <button className="text-pulse text-sm font-medium hover:text-pulse/80 transition-colors">
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTravelHistory = () => (
    <div className="space-y-6">
      <div className="text-2xl font-bold text-white mb-4">2024</div>
      {mockTravelHistory.map((trip) => (
        <div key={trip.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200">
          <div className="flex gap-4">
            <img
              src={trip.image}
              alt={trip.location}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {trip.location}
              </h3>
              <p className="text-gray-400 text-sm mb-2">{trip.dates}</p>
              <div className="text-sm text-gray-400 mb-2">Highlights</div>
              <div className="flex flex-wrap gap-2">
                {trip.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      {mockAchievements.map((achievement) => (
        <div key={achievement.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200">
          <h3 className="text-lg font-semibold text-white mb-1">
            {achievement.title}
          </h3>
          <p className="text-gray-400 text-sm">{achievement.description}</p>
        </div>
      ))}
    </div>
  );

  const renderSaved = () => (
    <div className="space-y-6">
      {mockSaved.map((item) => (
        <div key={item.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200">
          <h3 className="text-lg font-semibold text-white mb-1">
            {item.title}
          </h3>
          <p className="text-gray-400 text-sm">{item.location}</p>
        </div>
      ))}
    </div>
  );

  switch (activeTab) {
    case 0:
      return renderRecommendations();
    case 1:
      return renderTravelHistory();
    case 2:
      return renderAchievements();
    case 3:
      return renderSaved();
    default:
      return null;
  }
}