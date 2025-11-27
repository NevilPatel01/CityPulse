import { useState, useEffect } from 'react';
import { useSafeToast } from '../../hooks/useSafeToast';
import { apiRequest } from '../../config/api';
import { Sparkles, Wallet, Mountain, Check, Loader2, Utensils, Palmtree, Landmark, Tent, Heart, Camera, ChevronDown, ChevronUp } from 'lucide-react';

const TRAVEL_STYLES = [
    { 
        value: 'budget', 
        label: 'Budget', 
        icon: Wallet,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400',
        description: 'Save money, maximize value'
    },
    { 
        value: 'luxury', 
        label: 'Luxury', 
        icon: Sparkles,
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10',
        borderColor: 'border-purple-400',
        description: 'Premium & comfort'
    },
    { 
        value: 'adventure', 
        label: 'Adventure', 
        icon: Mountain,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        borderColor: 'border-orange-400',
        description: 'Thrilling experiences'
    },
    { 
        value: 'foodie', 
        label: 'Foodie', 
        icon: Utensils,
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400',
        description: 'Culinary experiences'
    },
    { 
        value: 'relaxation', 
        label: 'Relaxation', 
        icon: Palmtree,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/10',
        borderColor: 'border-cyan-400',
        description: 'Peaceful getaways'
    },
    { 
        value: 'cultural', 
        label: 'Cultural', 
        icon: Landmark,
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        borderColor: 'border-amber-400',
        description: 'Historical sites & art'
    },
    { 
        value: 'backpacking', 
        label: 'Backpacking', 
        icon: Tent,
        color: 'text-lime-400',
        bgColor: 'bg-lime-400/10',
        borderColor: 'border-lime-400',
        description: 'Off the beaten path'
    },
    { 
        value: 'romantic', 
        label: 'Romantic', 
        icon: Heart,
        color: 'text-pink-400',
        bgColor: 'bg-pink-400/10',
        borderColor: 'border-pink-400',
        description: 'Couples & honeymoons'
    },
    { 
        value: 'photography', 
        label: 'Photography', 
        icon: Camera,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-400/10',
        borderColor: 'border-indigo-400',
        description: 'Scenic & photogenic spots'
    },
];

const INITIAL_VISIBLE_COUNT = 3;

export const TravelStyleCard = () => {
    const { showError } = useSafeToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        setIsLoading(true);
        try {
            const response = await apiRequest<{ 
                success: boolean; 
                data: { travel_style: string[] } 
            }>('/api/profile/travel-preferences');
            
            if (response.success && response.data) {
                setSelectedStyles(response.data.travel_style || []);
            }
        } catch (error) {
            console.error('Failed to load travel preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStyle = async (style: string) => {
        const newStyles = selectedStyles.includes(style)
            ? selectedStyles.filter(s => s !== style)
            : [...selectedStyles, style];
        
        setSelectedStyles(newStyles);
        setIsSaving(true);

        try {
            await apiRequest('/api/profile/travel-preferences', {
                method: 'PUT',
                body: JSON.stringify({
                    travel_style: newStyles
                }),
            });
            
            // Silent success - no toast notification for quick interactions
        } catch (error) {
            // Revert on error
            setSelectedStyles(selectedStyles);
            showError(
                'Update Failed',
                'Could not save your preference. Please try again.'
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-white/10 rounded w-2/3"></div>
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-white/10 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                    <Sparkles size={18} className="text-pulse" />
                    Travel Style
                </h3>
                {isSaving && (
                    <Loader2 size={14} className="animate-spin text-pulse" />
                )}
            </div>
            
            <p className="text-xs text-muted">
                Select your preferred travel styles to personalize your feed
            </p>

            <div className="space-y-2">
                {(showAll ? TRAVEL_STYLES : TRAVEL_STYLES.slice(0, INITIAL_VISIBLE_COUNT)).map((style) => {
                    const Icon = style.icon;
                    const isSelected = selectedStyles.includes(style.value);
                    
                    return (
                        <button
                            key={style.value}
                            onClick={() => toggleStyle(style.value)}
                            disabled={isSaving}
                            className={`w-full p-3 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden ${
                                isSelected
                                    ? `${style.borderColor} ${style.bgColor}`
                                    : 'border-subtle bg-white/5 hover:bg-white/10 hover:border-white/30'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`flex-shrink-0 ${isSelected ? style.color : 'text-muted'} transition-colors`}>
                                    <Icon size={20} strokeWidth={2} />
                                </div>
                                
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium text-sm ${
                                            isSelected ? 'text-primary' : 'text-muted'
                                        } transition-colors`}>
                                            {style.label}
                                        </span>
                                        {isSelected && (
                                            <Check 
                                                size={14} 
                                                className={`${style.color} animate-in fade-in zoom-in duration-200`} 
                                                strokeWidth={3}
                                            />
                                        )}
                                    </div>
                                    <p className={`text-xs mt-0.5 ${
                                        isSelected ? 'text-muted' : 'text-muted/70'
                                    } transition-colors`}>
                                        {style.description}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Hover effect */}
                            <div className={`absolute inset-0 ${style.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                        </button>
                    );
                })}
            </div>

            {/* Show More/Less Button */}
            <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 px-3 rounded-lg border border-subtle bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2 text-sm text-muted hover:text-primary group"
            >
                <span>{showAll ? 'Show Less' : `Show ${TRAVEL_STYLES.length - INITIAL_VISIBLE_COUNT} More`}</span>
                {showAll ? (
                    <ChevronUp size={16} className="transition-transform group-hover:-translate-y-0.5" />
                ) : (
                    <ChevronDown size={16} className="transition-transform group-hover:translate-y-0.5" />
                )}
            </button>

            {selectedStyles.length > 0 && (
                <div className="pt-2 border-t border-subtle animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-xs text-muted text-center">
                        ✨ {selectedStyles.length} {selectedStyles.length === 1 ? 'style' : 'styles'} selected
                    </p>
                </div>
            )}
        </div>
    );
};

