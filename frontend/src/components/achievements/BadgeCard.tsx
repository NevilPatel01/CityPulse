import React from 'react';
import type { UserAchievement } from '../../types/achievement';
import { Award, Lock, Trophy } from 'lucide-react';

interface BadgeCardProps {
    achievement: UserAchievement;
    showProgress?: boolean;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ achievement, showProgress = true }) => {
    const isCompleted = achievement.is_completed;
    const progress = achievement.current_progress || 0;
    const target = achievement.target_value;
    const progressPercentage = Number(achievement.progress_percentage || 0);

    // Format completion date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Get tier color based on target value using brand colors
    const getTierColor = (targetValue: number) => {
        if (targetValue <= 5) return 'from-amber-500 to-amber-600'; // Bronze
        if (targetValue <= 15) return 'from-slate-400 to-slate-500'; // Silver  
        if (targetValue <= 30) return 'from-yellow-400 to-yellow-500'; // Gold
        return 'from-rose-500 to-rose-600'; // Platinum (pulse theme)
    };

    const tierColor = getTierColor(target);

    return (
        <div
            className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                isCompleted
                    ? `bg-gradient-to-br ${tierColor} border-transparent shadow-lg`
                    : 'bg-gray-800 border-gray-700 opacity-60'
            }`}
        >
            {/* Badge Icon */}
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center ${
                            isCompleted
                                ? 'bg-white/20 backdrop-blur-sm'
                                : 'bg-gray-700'
                        }`}
                    >
                        {achievement.badge_icon_url ? (
                            <img
                                src={achievement.badge_icon_url}
                                alt={achievement.name}
                                className={`w-16 h-16 object-contain ${
                                    !isCompleted && progressPercentage === 0 ? 'opacity-30 grayscale' : ''
                                }`}
                            />
                        ) : isCompleted ? (
                            <Trophy className="w-10 h-10 text-white" />
                        ) : (
                            <Lock className="w-10 h-10 text-gray-500" />
                        )}
                    </div>
                </div>

                {/* Badge Name */}
                <h3
                    className={`text-lg font-bold text-center mb-2 ${
                        isCompleted ? 'text-white' : 'text-gray-400'
                    }`}
                >
                    {achievement.name}
                </h3>

                {/* Description */}
                <p
                    className={`text-sm text-center mb-4 ${
                        isCompleted ? 'text-white/90' : 'text-gray-500'
                    }`}
                >
                    {achievement.description}
                </p>

                {/* Progress Bar */}
                {showProgress && !isCompleted && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{progress} / {target}</span>
                            <span>{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Completion Date */}
                {isCompleted && achievement.completed_at && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-white/80 text-xs">
                        <Award className="w-4 h-4" />
                        <span>Earned {formatDate(achievement.completed_at)}</span>
                    </div>
                )}
            </div>

            {/* Completion Badge */}
            {isCompleted && (
                <div className="absolute top-2 right-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <Award className="w-5 h-5 text-white" />
                    </div>
                </div>
            )}
        </div>
    );
};
