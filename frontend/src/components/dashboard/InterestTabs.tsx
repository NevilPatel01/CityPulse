import { Coffee, UtensilsCrossed, Mountain, Building2, Palette, X } from 'lucide-react';

interface InterestTabsProps {
    selectedInterest: string | null;
    onSelectInterest: (interest: string | null) => void;
}

const INTERESTS = [
    { value: 'all', label: 'All', icon: null },
    { value: 'Coffee', label: 'Coffee', icon: Coffee, color: 'text-amber-600' },
    { value: 'Food', label: 'Food', icon: UtensilsCrossed, color: 'text-red-500' },
    { value: 'Hiking', label: 'Hiking', icon: Mountain, color: 'text-green-600' },
    { value: 'Places', label: 'Places', icon: Building2, color: 'text-blue-500' },
    { value: 'Culture', label: 'Culture', icon: Palette, color: 'text-purple-500' },
];

export const InterestTabs = ({ selectedInterest, onSelectInterest }: InterestTabsProps) => {
    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 sticky top-16 lg:top-20 z-10 shadow-lg">
            <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide pb-1">
                {INTERESTS.map((interest) => {
                    const Icon = interest.icon;
                    const isSelected = interest.value === 'all' 
                        ? !selectedInterest 
                        : selectedInterest === interest.value;
                    
                    return (
                        <button
                            key={interest.value}
                            onClick={() => onSelectInterest(interest.value === 'all' ? null : interest.value)}
                            className={`
                                relative px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0
                                transition-all duration-300 ease-out
                                ${isSelected 
                                    ? 'bg-pulse text-white shadow-lg shadow-pulse/20 scale-105' 
                                    : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary hover:scale-105'
                                }
                                active:scale-95 touch-manipulation
                            `}
                        >
                            <div className="flex items-center gap-2">
                                {Icon && (
                                    <Icon 
                                        size={16} 
                                        className={`${isSelected ? 'text-white' : interest.color} transition-colors`} 
                                    />
                                )}
                                <span>{interest.label}</span>
                            </div>
                            
                            {/* Active indicator */}
                            {isSelected && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full animate-in slide-in-from-top-2 fade-in duration-300" />
                            )}
                        </button>
                    );
                })}

                {/* Clear filter button (only when filtered) */}
                {selectedInterest && (
                    <button
                        onClick={() => onSelectInterest(null)}
                        className="flex-shrink-0 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200 active:scale-95"
                        title="Clear filter"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Results count (optional) */}
            {selectedInterest && (
                <div className="mt-2 pt-2 border-t border-subtle">
                    <p className="text-xs text-muted text-center animate-in fade-in slide-in-from-top-2 duration-300">
                        Showing <span className="text-pulse font-medium">{selectedInterest}</span> recommendations
                    </p>
                </div>
            )}
        </div>
    );
};

