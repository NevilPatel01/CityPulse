import { useState } from 'react';

interface VisibilitySelectorProps {
    value: 'public' | 'private' | 'friends_only';
    onChange: (value: 'public' | 'private' | 'friends_only') => void;
    disabled?: boolean;
}

const VISIBILITY_OPTIONS = [
    {
        value: 'public' as const,
        label: 'Public',
        icon: '🌍',
        description: 'Everyone can see this',
        color: 'text-green-400'
    },
    {
        value: 'friends_only' as const,
        label: 'Friends Only',
        icon: '👥',
        description: 'Only your buddies can see this',
        color: 'text-blue-400'
    },
    {
        value: 'private' as const,
        label: 'Private',
        icon: '🔒',
        description: 'Only you can see this',
        color: 'text-gray-400'
    },
];

export const VisibilitySelector = ({ value, onChange, disabled = false }: VisibilitySelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = VISIBILITY_OPTIONS.find(opt => opt.value === value) || VISIBILITY_OPTIONS[0];

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-muted mb-2">
                Visibility
            </label>
            
            {/* Selected Option Display */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 bg-surface-glass border border-subtle rounded-lg text-left transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-pulse/50 cursor-pointer'
                }`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedOption.icon}</span>
                    <div>
                        <div className={`font-medium ${selectedOption.color}`}>
                            {selectedOption.label}
                        </div>
                        <div className="text-xs text-muted">
                            {selectedOption.description}
                        </div>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Options */}
            {isOpen && !disabled && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Options */}
                    <div className="absolute z-20 w-full mt-2 bg-gray-900 border border-subtle rounded-lg shadow-xl overflow-hidden">
                        {VISIBILITY_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                    value === option.value
                                        ? 'bg-pulse/20 border-l-4 border-pulse'
                                        : 'hover:bg-surface-glass border-l-4 border-transparent'
                                }`}
                            >
                                <span className="text-2xl">{option.icon}</span>
                                <div className="flex-1">
                                    <div className={`font-medium ${option.color}`}>
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-muted">
                                        {option.description}
                                    </div>
                                </div>
                                {value === option.value && (
                                    <svg className="w-5 h-5 text-pulse" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
