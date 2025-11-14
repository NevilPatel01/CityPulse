import React, { useEffect, useState } from 'react';
import { Trophy, X, Award, Sparkles } from 'lucide-react';
import type { UserAchievement } from '../../types/achievement';

interface BadgeNotificationProps {
    achievement: UserAchievement;
    onClose: () => void;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ achievement, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    useEffect(() => {
        // Trigger animation
        const showTimeout = setTimeout(() => setIsVisible(true), 100);
        
        // Auto-close after 5 seconds
        const closeTimeout = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => {
            clearTimeout(showTimeout);
            clearTimeout(closeTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className={`fixed top-20 right-4 z-50 transition-all duration-300 transform ${
                isVisible && !isExiting
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
            }`}
        >
            <div className="relative bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-500 rounded-xl shadow-2xl p-1 max-w-md">
                {/* Animated sparkles */}
                <div className="absolute -top-2 -left-2 animate-pulse">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="absolute -top-2 -right-2 animate-pulse" style={{ animationDelay: '0.5s' }}>
                    <Sparkles className="w-6 h-6 text-pink-300" />
                </div>

                {/* Content */}
                <div className="bg-gray-900 rounded-lg p-6 relative">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full p-3">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Badge Earned!</h3>
                            <p className="text-sm text-gray-400">Achievement unlocked</p>
                        </div>
                    </div>

                    {/* Badge Details */}
                    <div className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500/30">
                        <div className="flex items-start gap-4">
                            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full p-4 flex-shrink-0">
                                {achievement.badge_icon_url ? (
                                    <img
                                        src={achievement.badge_icon_url}
                                        alt={achievement.name}
                                        className="w-10 h-10 object-contain"
                                    />
                                ) : (
                                    <Award className="w-10 h-10 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-white mb-1">
                                    {achievement.name}
                                </h4>
                                <p className="text-sm text-gray-400 mb-3">
                                    {achievement.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                    {achievement.target_value && (
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Trophy className="w-4 h-4" />
                                            <span>Target: {achievement.target_value}</span>
                                        </div>
                                    )}
                                    <div className="text-gray-400">
                                        {new Date().toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="mt-4 text-center">
                        <a
                            href="/achievements"
                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <Trophy className="w-4 h-4" />
                            View All Achievements
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Container component to manage multiple notifications
interface BadgeNotificationContainerProps {
    achievements: UserAchievement[];
    onDismiss: (achievementId: number) => void;
}

export const BadgeNotificationContainer: React.FC<BadgeNotificationContainerProps> = ({
    achievements,
    onDismiss,
}) => {
    return (
        <div className="fixed top-0 right-0 z-50 pointer-events-none">
            <div className="pointer-events-auto">
                {achievements.map((achievement, index) => (
                    <div
                        key={achievement.id}
                        style={{ marginTop: index * 20 }}
                    >
                        <BadgeNotification
                            achievement={achievement}
                            onClose={() => onDismiss(achievement.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
