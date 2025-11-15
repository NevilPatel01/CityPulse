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

interface FeedPostCardProps {
    post: FeedPost;
    onUpdate: (postId: number, updates: Partial<FeedPost>) => void;
    onRemove?: (postId: number) => void;
}

/**
 * Feed post card component with social actions
 * Displays recommendation with like, bookmark, share, and report functionality
 */
export const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, onUpdate }) => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            if (post.is_liked) {
                await unlikeRecommendation(post.id);
                onUpdate(post.id, {
                    is_liked: false,
                    likes_count: post.likes_count - 1
                });
            } else {
                await likeRecommendation(post.id);
                onUpdate(post.id, {
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
            onUpdate(post.id, {
                is_bookmarked: result.data.isBookmarked
            });
            showSuccess(result.data.isBookmarked ? 'Post saved' : 'Post unsaved');
        } catch {
            showError('Failed to update bookmark');
        }
    };

    const handleShare = async (platform: string) => {
        try {
            await recordShare(post.id, platform);
            onUpdate(post.id, {
                shares_count: post.shares_count + 1
            });

            const url = `${window.location.origin}/${post.username}/recommendation/${post.id}`;
            const text = `Check out: ${post.title}`;

            switch (platform) {
                case 'twitter':
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                    break;
                case 'facebook':
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                    break;
                case 'whatsapp':
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                    break;
                case 'copy_link':
                    navigator.clipboard.writeText(url);
                    showSuccess('Link copied to clipboard');
                    break;
            }

            setShowShareMenu(false);
        } catch {
            showError('Failed to share');
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
                {post.photos && post.photos.length > 0 && (
                    <div className="relative w-full aspect-[4/3]">
                        <img 
                            src={post.photos[0]} 
                            alt={post.title}
                            className="w-full h-full object-cover"
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

                            {/* Share */}
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowShareMenu(!showShareMenu);
                                    }}
                                    className="flex items-center gap-1 text-text-secondary hover:text-accent-teal transition-colors"
                                >
                                    <Share2 size={20} />
                                    {post.shares_count > 0 && (
                                        <span className="text-sm">{post.shares_count}</span>
                                    )}
                                </button>

                                {/* Share Menu */}
                                {showShareMenu && (
                                    <div className="absolute bottom-full mb-2 left-0 bg-surface-glass backdrop-blur-lg border border-white/10 rounded-lg shadow-xl p-2 z-10 min-w-[150px]">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleShare('twitter'); }}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm"
                                        >
                                            Twitter
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleShare('facebook'); }}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm"
                                        >
                                            Facebook
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleShare('whatsapp'); }}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm"
                                        >
                                            WhatsApp
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleShare('copy_link'); }}
                                            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                )}
                            </div>
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
