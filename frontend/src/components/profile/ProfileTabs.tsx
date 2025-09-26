interface ProfileTabsProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  tabs: string[];
  children: React.ReactNode;
}

export function ProfileTabs({ activeTab, onTabChange, tabs, children }: ProfileTabsProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex gap-2 border-b border-gray-700 p-4 pb-0">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === index
                ? 'bg-pulse text-white'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
            }`}
            onClick={() => onTabChange(index)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}