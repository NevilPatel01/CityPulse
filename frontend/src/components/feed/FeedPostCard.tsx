import React, { useState } from 'react';
import { Heart, Bookmark, Share2, Flag, MapPin, Star } from 'lucide-react';
import type { FeedPost } from '../../services/feedService';
import Avatar from '../ui/Avatar';
import { 
    toggleBookmark, 
    recordShare, 
    reportPost,
    likeRecommendation,
    unlikeRecommendation 
} from '../../services/feedService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { ReportModal } from '../modals/ReportModal';
import { apiConfig } from '../../config/api';

interface FeedPostCardProps {
    post: FeedPost;
    onUpdate?: (postId: number, updates: Partial<FeedPost>) => void;
    onRemove?: (postId: number) => void;
}

/**
 * Feed post card component with social actions
 * Displays recommendation with like, bookmark, share, and report functionality
 */
export const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, onUpdate }) => {
    const handleUpdate = onUpdate || (() => {});
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [showReportModal, setShowReportModal] = useState(false);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            if (post.is_liked) {
                await unlikeRecommendation(post.id);
                handleUpdate(post.id, {
                    is_liked: false,
                    likes_count: post.likes_count - 1
                });
            } else {
                await likeRecommendation(post.id);
                handleUpdate(post.id, {
                    is_liked: true,
                    likes_count: post.likes_count + 1
                });
            }
        } catch {
            showError('Failed to update like');
        }
    };

    const handleBookmark = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            const result = await toggleBookmark(post.id) as { data: { isBookmarked: boolean } };
            handleUpdate(post.id, {
                is_bookmarked: result.data.isBookmarked
            });
            showSuccess(result.data.isBookmarked ? 'Post saved' : 'Post unsaved');
        } catch {
            showError('Failed to update bookmark');
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await recordShare(post.id, 'copy_link');
            handleUpdate(post.id, {
                shares_count: post.shares_count + 1
            });

            const url = `${window.location.origin}/${post.username}/recommendation/${post.id}`;
            await navigator.clipboard.writeText(url);
            showSuccess('Link copied to clipboard');
        } catch {
            showError('Failed to copy link');
        }
    };

    const handleReport = async (reason: string, description?: string) => {
        try {
            await reportPost(post.id, reason as 'spam' | 'inappropriate' | 'misleading' | 'offensive' | 'copyright' | 'other', description);
            showSuccess('Report submitted. Thank you for your feedback.');
            setShowReportModal(false);
        } catch {
            showError('Failed to submit report');
        }
    };

    const handleCardClick = () => {
        navigate(`/${post.username}/recommendation/${post.id}`);
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/profile/${post.username}`);
    };

    return (
        <>
            <div 
                className="bg-surface-glass backdrop-blur-lg rounded-xl overflow-hidden hover-lift cursor-pointer border border-white/10"
                onClick={handleCardClick}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3" onClick={handleProfileClick}>
                        <Avatar 
                            src={post.profile_picture_url} 
                            name={post.full_name}
                            size="sm"
                            className="border-2 border-accent-teal/30"
                        />
                        <div>
                            <p className="font-semibold text-text-primary">{post.full_name}</p>
                            <p className="text-xs text-text-secondary">@{post.username}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        post.source === 'buddy' ? 'bg-accent-teal/20 text-accent-teal' :
                        post.source === 'trending' ? 'bg-pulse/20 text-pulse' :
                        'bg-accent-amber/20 text-accent-amber'
                    }`}>
                        {post.source === 'buddy' ? '👥 Buddy' : 
                            post.source === 'trending' ? '🔥 Trending' : 
                            '⭐ For You'}
                    </span>
                </div>

                {/* Image */}
                {post.photos && post.photos.length > 0 && post.photos[0] && (
                    <div className="relative w-full aspect-[4/3]">
                        <img 
                            src={post.photos[0].startsWith('http') ? post.photos[0] : `${apiConfig.baseUrl}${post.photos[0]}`}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                console.error('Failed to load image:', post.photos?.[0]);
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23333"/%3E%3Ctext x="400" y="300" text-anchor="middle" fill="%23999" font-size="24" font-family="Arial"%3EImage not available%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        {post.photos.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white">
                                +{post.photos.length - 1} more
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">
                        {post.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-3 line-clamp-3">
                        {post.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
                        <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{post.city_name}, {post.country}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star size={14} className="text-accent-amber fill-accent-amber" />
                            <span>{post.user_rating}/5</span>
                        </div>
                        <span className="px-2 py-1 bg-surface-glass rounded text-accent-teal">
                            {post.category_name}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-4">
                            {/* Like */}
                            <button 
                                onClick={handleLike}
                                className={`flex items-center gap-1 transition-colors ${
                                    post.is_liked ? 'text-error' : 'text-text-secondary hover:text-error'
                                }`}
                            >
                                <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
                                <span className="text-sm">{post.likes_count}</span>
                            </button>

                            {/* Bookmark */}
                            <button 
                                onClick={handleBookmark}
                                className={`transition-colors ${
                                    post.is_bookmarked ? 'text-accent-amber' : 'text-text-secondary hover:text-accent-amber'
                                }`}
                            >
                                <Bookmark size={20} fill={post.is_bookmarked ? 'currentColor' : 'none'} />
                            </button>

                            {/* Share - Just copy link */}
                            <button 
                                onClick={handleShare}
                                className="flex items-center gap-1 text-text-secondary hover:text-accent-teal transition-colors"
                                title="Copy link"
                            >
                                <Share2 size={20} />
                                {post.shares_count > 0 && (
                                    <span className="text-sm">{post.shares_count}</span>
                                )}
                            </button>
                        </div>

                        {/* Report */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowReportModal(true);
                            }}
                            className="text-text-secondary hover:text-error transition-colors"
                        >
                            <Flag size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <ReportModal 
                    title="Report Post"
                    onClose={() => setShowReportModal(false)}
                    onSubmit={handleReport}
                />
            )}
        </>
    );
};
