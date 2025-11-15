import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Trophy, X } from 'lucide-react';
import type { UserAchievement } from '../../types/achievement';

interface BadgeUnlockModalProps {
    achievement: UserAchievement;
    onClose: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ achievement, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

    useEffect(() => {
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 100);

        // Generate confetti particles
        const particles = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.5,
        }));
        setConfetti(particles);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const getTierColor = (targetValue: number) => {
        if (targetValue <= 5) return { from: '#f59e0b', to: '#d97706' }; // Amber
        if (targetValue <= 15) return { from: '#94a3b8', to: '#64748b' }; // Slate
        if (targetValue <= 30) return { from: '#fbbf24', to: '#f59e0b' }; // Yellow
        return { from: '#fb7185', to: '#f43f5e' }; // Rose
    };

    const colors = getTierColor(achievement.target_value);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                    isVisible ? 'opacity-75' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-gray-900 rounded-3xl border-2 border-gray-700 shadow-2xl max-w-md w-full overflow-hidden transition-all duration-500 ${
                    isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}
                style={{
                    background: `linear-gradient(135deg, ${colors.from}15, ${colors.to}15)`,
                }}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Confetti Animation */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {confetti.map((particle) => (
                        <div
                            key={particle.id}
                            className="absolute top-0 w-2 h-2 animate-confetti"
                            style={{
                                left: `${particle.left}%`,
                                animationDelay: `${particle.delay}s`,
                                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                            }}
                        />
                    ))}
                </div>

                {/* Glow Effect */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${colors.from}, transparent)`,
                    }}
                />

                {/* Content */}
                <div className="relative p-8 text-center">
                    {/* Icon Header */}
                    <div className="flex justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Badge Unlocked!
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        You've earned a new achievement
                    </p>

                    {/* Badge Icon with Animation */}
                    <div className="flex justify-center mb-6">
                        <div
                            className={`w-32 h-32 rounded-full flex items-center justify-center animate-badge-unlock relative`}
                            style={{
                                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                                boxShadow: `0 0 40px ${colors.from}80`,
                            }}
                        >
                            {/* Pulse Rings */}
                            <div
                                className="absolute inset-0 rounded-full animate-ping opacity-75"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.from}40, ${colors.to}40)`,
                                }}
                            />
                            <div
                                className="absolute inset-0 rounded-full animate-pulse"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.from}20, ${colors.to}20)`,
                                }}
                            />

                            {achievement.badge_icon_url ? (
                                <img
                                    src={achievement.badge_icon_url}
                                    alt={achievement.name}
                                    className="w-20 h-20 object-contain relative z-10 animate-bounce"
                                />
                            ) : (
                                <Trophy className="w-16 h-16 text-white relative z-10 animate-bounce" />
                            )}
                        </div>
                    </div>

                    {/* Badge Name */}
                    <h3 className="text-2xl font-bold text-white mb-3">
                        {achievement.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-300 mb-6">
                        {achievement.description}
                    </p>

                    {/* Achievement Details */}
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <Award
                            className="w-5 h-5"
                            style={{ color: colors.from }}
                        />
                        <span className="text-gray-400">
                            Completed: {achievement.current_progress}/{achievement.target_value}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleClose}
                        className="mt-8 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                        }}
                    >
                        Awesome!
                    </button>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }

                @keyframes badge-unlock {
                    0% {
                        transform: scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2) rotate(180deg);
                    }
                    100% {
                        transform: scale(1) rotate(360deg);
                        opacity: 1;
                    }
                }

                .animate-confetti {
                    animation: confetti 3s ease-out forwards;
                }

                .animate-badge-unlock {
                    animation: badge-unlock 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }
            `}</style>
        </div>
    );
};
