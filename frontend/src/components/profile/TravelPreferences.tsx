import { useState, useEffect } from 'react';
import { useSafeToast } from '../../hooks/useSafeToast';
import { apiRequest } from '../../config/api';
import { Button } from '../ui/button';

interface TravelPreference {
    travel_style: string[];
    activity_level: string;
    preferred_difficulty: string;
    interest_categories: number[];
}

const TRAVEL_STYLES = [
    { value: 'budget', label: 'Budget', icon: '💰', description: 'Cost-effective travel' },
    { value: 'luxury', label: 'Luxury', icon: '✨', description: 'Premium experiences' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️', description: 'Thrilling activities' },
    { value: 'cultural', label: 'Cultural', icon: '🏛️', description: 'Historical sites' },
    { value: 'relaxation', label: 'Relaxation', icon: '🏖️', description: 'Peaceful getaways' },
    { value: 'foodie', label: 'Foodie', icon: '🍜', description: 'Culinary experiences' },
];

const ACTIVITY_LEVELS = [
    { value: 'relaxed', label: 'Relaxed', description: 'Light activities' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced pace' },
    { value: 'active', label: 'Active', description: 'Lots of activities' },
    { value: 'extreme', label: 'Extreme', description: 'High intensity' },
];

const DIFFICULTY_LEVELS = [
    { value: 'easy', label: 'Easy', icon: '🟢', description: 'Beginner friendly' },
    { value: 'medium', label: 'Medium', icon: '🟡', description: 'Some experience needed' },
    { value: 'hard', label: 'Hard', icon: '🔴', description: 'Experienced travelers' },
];

export const TravelPreferences = () => {
    const { showSuccess, showError } = useSafeToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [preferences, setPreferences] = useState<TravelPreference>({
        travel_style: [],
        activity_level: 'moderate',
        preferred_difficulty: 'medium',
        interest_categories: [],
    });

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        setIsLoading(true);
        try {
            const response = await apiRequest<{ success: boolean; data: TravelPreference }>('/api/profile/travel-preferences');
            if (response.success && response.data) {
                setPreferences(response.data);
            }
        } catch (error: unknown) {
            console.error('Failed to load travel preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiRequest('/api/profile/travel-preferences', {
                method: 'PUT',
                body: JSON.stringify(preferences),
            });
            showSuccess('Success', 'Travel preferences updated successfully');
        } catch (error: unknown) {
            if (error instanceof Error) {
                showError(
                    'Error',
                    error.message || 'Failed to save travel preferences'
                );
            } else {
                showError(
                    'Error',
                    'Failed to save travel preferences'
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTravelStyle = (style: string) => {
        setPreferences(prev => ({
            ...prev,
            travel_style: prev.travel_style.includes(style)
                ? prev.travel_style.filter(s => s !== style)
                : [...prev.travel_style, style]
        }));
    };

    if (isLoading) {
        return (
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-20 bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Travel Preferences</h3>
                <p className="text-sm text-muted">Help us personalize your experience by sharing your travel style</p>
            </div>

            {/* Travel Styles */}
            <div>
                <label className="block text-sm font-medium text-primary mb-3">
                    Travel Styles <span className="text-muted">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {TRAVEL_STYLES.map((style) => (
                        <button
                            key={style.value}
                            onClick={() => toggleTravelStyle(style.value)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                                preferences.travel_style.includes(style.value)
                                    ? 'border-pulse bg-pulse/10'
                                    : 'border-subtle bg-surface-glass hover:border-pulse/50'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{style.icon}</span>
                                <span className="font-medium text-primary">{style.label}</span>
                            </div>
                            <p className="text-xs text-muted">{style.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Level */}
            <div>
                <label className="block text-sm font-medium text-primary mb-3">Activity Level</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ACTIVITY_LEVELS.map((level) => (
                        <button
                            key={level.value}
                            onClick={() => setPreferences(prev => ({ ...prev, activity_level: level.value }))}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                preferences.activity_level === level.value
                                    ? 'border-pulse bg-pulse/10'
                                    : 'border-subtle bg-surface-glass hover:border-pulse/50'
                            }`}
                        >
                            <div className="font-medium text-primary mb-1">{level.label}</div>
                            <p className="text-xs text-muted">{level.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty Level */}
            <div>
                <label className="block text-sm font-medium text-primary mb-3">Preferred Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTY_LEVELS.map((difficulty) => (
                        <button
                            key={difficulty.value}
                            onClick={() => setPreferences(prev => ({ ...prev, preferred_difficulty: difficulty.value }))}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                preferences.preferred_difficulty === difficulty.value
                                    ? 'border-pulse bg-pulse/10'
                                    : 'border-subtle bg-surface-glass hover:border-pulse/50'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{difficulty.icon}</span>
                                <span className="font-medium text-primary">{difficulty.label}</span>
                            </div>
                            <p className="text-xs text-muted">{difficulty.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-subtle">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    isLoading={isSaving}
                    className="w-full bg-pulse hover:bg-pulse/80"
                >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    );
};
