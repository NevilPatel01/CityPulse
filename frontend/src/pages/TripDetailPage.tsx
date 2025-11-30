import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Calendar, DollarSign, Users, Globe, Lock, MessageSquare, Plane, Plus } from 'lucide-react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useToast } from '../hooks/useToast';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import ItineraryView from '../components/trips/ItineraryView';
import TripForm from '../components/trips/TripForm';
import ItineraryItemModal from '../components/trips/ItineraryItemModal';
import { InviteCompanionsModal } from '../components/trips/InviteCompanionsModal';
import Avatar from '../components/ui/Avatar';
import { tripService } from '../services/tripService';
import type { Trip, TripCompanion, TripComment, CreateTripData, TripItineraryItem } from '../types/trip';
import { useAuth } from '../hooks/useAuth';
import '../styles/TripDetailPage.css';

type TabType = 'overview' | 'itinerary' | 'companions' | 'comments';

const TripDetailPage = () => {
  useAuthGuard();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<TripComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // Itinerary state
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [editingItineraryItem, setEditingItineraryItem] = useState<TripItineraryItem | undefined>();
  const [isSubmittingItinerary, setIsSubmittingItinerary] = useState(false);

  // Check if current user can edit the trip
  const canEditTrip = () => {
    if (!trip || !user) return false;
    
    const currentUserId = Number(user.id);
    
    // User is the creator
    if (trip.user_id === currentUserId) return true;
    
    // User is an accepted companion and trip is collaborative
    if (trip.is_collaborative && trip.companions) {
      return trip.companions.some(
        companion => companion.user_id === currentUserId && companion.status === 'accepted'
      );
    }
    
    return false;
  };

  const loadTrip = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await tripService.getTripById(Number(id));
      setTrip(data);
    } catch (error: any) {
      // Check if it's a 404 (not found) vs actual error
      const statusCode = error?.response?.status || error?.status;
      if (statusCode === 404) {
        // Trip not found - just set trip to null, UI handles the "not found" state
        setTrip(null);
      } else {
        // Actual error - show error message
        showError('Failed to load trip. Please try again.');
        console.error('Error loading trip:', error);
        setTrip(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await tripService.getTripComments(Number(id));
      // Always set comments to array (empty array if no comments)
      setComments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      // Check if it's a 404 (not found) or empty response - both are fine
      const statusCode = error?.response?.status || error?.status;
      if (statusCode === 404 || statusCode === 200) {
        // No comments exist yet or empty response - this is fine, just set empty array
        setComments([]);
      } else {
        // Only log actual errors, don't show error toast
        // Empty comments state is handled by the UI
        console.error('Error loading comments:', error);
        setComments([]);
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTrip();
      loadComments(); // Load comments immediately to get accurate count
    }
  }, [id, loadTrip, loadComments]);

  useEffect(() => {
    if (activeTab === 'comments' && id) {
      loadComments(); // Refresh comments when tab is opened
    }
  }, [activeTab, id, loadComments]);

  const handleUpdateTrip = async (data: CreateTripData) => {
    if (!id || !canEditTrip()) {
      showError('You do not have permission to edit this trip');
      return;
    }
    
    try {
      setIsUpdating(true);
      await tripService.updateTrip(Number(id), data);
      // Close the edit form first
      setShowEditForm(false);
      // Force reload by setting loading state
      setLoading(true);
      // Reload the complete trip data with companions, cities, etc.
      await loadTrip();
      // Reset to overview tab to show updated data
      setActiveTab('overview');
      showSuccess('Trip updated successfully!');
    } catch (error) {
      showError('Failed to update trip');
      console.error('Error updating trip:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    
    try {
      setIsPostingComment(true);
      const newComment = await tripService.addComment(Number(id), commentText);
      setComments([newComment, ...comments]);
      setCommentText('');
      showSuccess('Comment posted!');
    } catch (error) {
      showError('Failed to post comment');
      console.error('Error posting comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!id || !window.confirm('Delete this comment?')) return;
    
    try {
      await tripService.deleteComment(Number(id), commentId);
      setComments(comments.filter(c => c.id !== commentId));
      showSuccess('Comment deleted');
    } catch (error) {
      showError('Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  const handleAddItineraryItem = () => {
    setEditingItineraryItem(undefined);
    setShowItineraryModal(true);
  };

  const handleEditItineraryItem = (item: TripItineraryItem) => {
    setEditingItineraryItem(item);
    setShowItineraryModal(true);
  };

  const handleSubmitItineraryItem = async (data: Partial<TripItineraryItem>) => {
    if (!id) return;

    try {
      setIsSubmittingItinerary(true);
      if (editingItineraryItem) {
        // Update existing item
        await tripService.updateItineraryItem(Number(id), editingItineraryItem.id, data);
        showSuccess('Activity updated!');
      } else {
        // Create new item
        await tripService.addItineraryItem(Number(id), data);
        showSuccess('Activity added!');
      }
      setShowItineraryModal(false);
      setEditingItineraryItem(undefined);
      await loadTrip(); // Reload trip to get updated itinerary
    } catch (error) {
      showError('Failed to save activity');
      console.error('Error saving itinerary item:', error);
    } finally {
      setIsSubmittingItinerary(false);
    }
  };

  const handleDeleteItineraryItem = async (itemId: number) => {
    if (!id || !window.confirm('Delete this activity?')) return;

    try {
      await tripService.deleteItineraryItem(Number(id), itemId);
      showSuccess('Activity deleted');
      await loadTrip(); // Reload trip to get updated itinerary
    } catch (error) {
      showError('Failed to delete activity');
      console.error('Error deleting itinerary item:', error);
    }
  };

  const handleRemoveCompanion = async (companionId: number) => {
    if (!id || !window.confirm('Remove this companion from the trip?')) return;

    try {
      await tripService.removeCompanion(Number(id), companionId);
      showSuccess('Companion removed');
      await loadTrip(); // Reload trip to get updated companions
    } catch (error) {
      showError('Failed to remove companion');
      console.error('Error removing companion:', error);
    }
  };

  // Check if user is the trip organizer/creator
  const isOrganizer = user && trip && trip.user_id === Number(user.id);

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="icon" />;
      case 'buddies_only':
        return <Users className="icon" />;
      case 'private':
        return <Lock className="icon" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'planning':
        return 'status-badge planning';
      case 'active':
        return 'status-badge active';
      case 'completed':
        return 'status-badge completed';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <div className="trip-detail-page">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading trip...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="trip-detail-page">
        <Header />
        <div className="not-found-container">
          <h2>Trip not found</h2>
          <Link to="/trips" className="back-link">← Back to Trips</Link>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="trip-detail-page">
      <Header />
      
      <div className="trip-detail-content">
        {/* Hero Section */}
        <div className="trip-hero">
          {trip.cover_image_url ? (
            <img src={trip.cover_image_url} alt={trip.title} className="trip-cover" />
          ) : (
            <div className="trip-cover-placeholder">
              <Plane className="placeholder-icon" />
            </div>
          )}
          
          <div className="trip-hero-overlay">
            <div className="trip-header">
              <button onClick={() => navigate('/trips')} className="back-button">
                <ArrowLeft className="icon" />
                <span>Back</span>
              </button>
              
              {canEditTrip() && (
                <button onClick={() => setShowEditForm(true)} className="edit-button">
                  <Edit className="icon" />
                  <span>Edit Trip</span>
                </button>
              )}
            </div>
            
            <div className="trip-title-section">
              <h1>{trip.title}</h1>
              <div className="trip-meta">
                <span className={getStatusBadgeClass(trip.status)}>
                  {trip.status}
                </span>
                <span className="privacy-badge">
                  {getPrivacyIcon(trip.privacy)}
                  {trip.privacy.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="trip-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <MapPin className="tab-icon" />
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'itinerary' ? 'active' : ''}`}
            onClick={() => setActiveTab('itinerary')}
          >
            <Calendar className="tab-icon" />
            Itinerary ({trip.itinerary_items?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'companions' ? 'active' : ''}`}
            onClick={() => setActiveTab('companions')}
          >
            <Users className="tab-icon" />
            Companions ({trip.companions?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <MessageSquare className="tab-icon" />
            Comments ({comments.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="trip-tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Trip Info */}
              <div className="info-card">
                <h2>Trip Details</h2>
                <p className="trip-description">{trip.description}</p>
                
                <div className="info-grid">
                  <div className="info-item">
                    <Calendar className="info-icon" />
                    <div>
                      <span className="info-label">Duration</span>
                      <span className="info-value">
                        {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {trip.total_budget && (
                    <div className="info-item">
                      <DollarSign className="info-icon" />
                      <div>
                        <span className="info-label">Budget</span>
                        <span className="info-value">
                          {trip.currency} {trip.total_budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="info-item">
                    <Users className="info-icon" />
                    <div>
                      <span className="info-label">Type</span>
                      <span className="info-value">
                        {trip.is_collaborative ? 'Collaborative' : 'Personal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cities */}
              {trip.cities && trip.cities.length > 0 && (
                <div className="info-card">
                  <h2>Cities</h2>
                  <div className="cities-list">
                    {trip.cities.map(city => (
                      <div key={city.trip_city_id || city.id} className="city-item">
                        <MapPin className="city-icon" />
                        <div className="city-info">
                          <h3>{city.city_name || city.name}, {city.country}</h3>
                          <p>
                            {city.arrival_date && new Date(city.arrival_date).toLocaleDateString()} - {city.departure_date && new Date(city.departure_date).toLocaleDateString()}
                          </p>
                          {city.notes && <p className="city-notes">{city.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'itinerary' && (
            <div className="itinerary-tab">
              {canEditTrip() && (
                <div className="tab-header-actions">
                  <button onClick={handleAddItineraryItem} className="btn-primary">
                    <Plus className="btn-icon" />
                    Add Activity
                  </button>
                </div>
              )}
              
              {trip.itinerary_items && trip.itinerary_items.length > 0 ? (
                <ItineraryView 
                  items={trip.itinerary_items} 
                  onEdit={canEditTrip() ? handleEditItineraryItem : undefined}
                  onDelete={canEditTrip() ? handleDeleteItineraryItem : undefined}
                />
              ) : (
                <div className="empty-state">
                  <Calendar className="empty-icon" />
                  <p>No itinerary items yet</p>
                  {canEditTrip() && (
                    <button onClick={handleAddItineraryItem} className="btn-primary">
                      <Plus className="btn-icon" />
                      Add First Activity
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'companions' && (
            <div className="companions-tab">
              {isOrganizer && trip.privacy !== 'private' && (
                <div className="tab-header-actions">
                  <button onClick={() => setShowInviteModal(true)} className="btn-primary">
                    <Plus className="btn-icon" />
                    Invite Companions
                  </button>
                </div>
              )}
              
              {trip.companions && trip.companions.length > 0 ? (
                <div className="companions-list">
                  {trip.companions.map((companion: TripCompanion) => {
                    const isOrganizerRole = companion.role === 'organizer';
                    const statusLabel = isOrganizerRole 
                      ? null // Don't show status for organizer
                      : companion.status === 'invited' 
                        ? 'Invited' 
                        : companion.status === 'accepted' 
                          ? 'Member' 
                          : companion.status === 'declined'
                            ? 'Declined'
                            : companion.status;
                    
                    return (
                      <div key={companion.companion_id || companion.id} className="companion-card-enhanced">
                        <div className="companion-avatar-wrapper">
                          <Avatar
                            src={companion.profile_photo_url}
                            name={companion.full_name || companion.username}
                            size="lg"
                            className="companion-avatar"
                          />
                        </div>
                        <div className="companion-details">
                          <div className="companion-name-section">
                            <h3 className="companion-name">{companion.full_name || companion.username}</h3>
                            <span className="companion-username">@{companion.username}</span>
                          </div>
                          <div className="companion-badges">
                            {isOrganizerRole ? (
                              <span className="role-badge organizer">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                                </svg>
                                Organizer
                              </span>
                            ) : (
                              <span className={`status-badge-enhanced ${companion.status}`}>
                                {companion.status === 'invited' && (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                {companion.status === 'accepted' && (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                {companion.status === 'declined' && (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                {statusLabel}
                              </span>
                            )}
                          </div>
                        </div>
                        {isOrganizer && companion.status === 'accepted' && !isOrganizerRole && (
                          <button 
                            onClick={() => handleRemoveCompanion(companion.user_id)}
                            className="btn-remove-companion"
                            title="Remove companion"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p>No companions yet</p>
                  {isOrganizer && trip.privacy !== 'private' && (
                    <button onClick={() => setShowInviteModal(true)} className="btn-primary">
                      <Plus className="btn-icon" />
                      Invite Companions
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comments-tab">
              {/* Comment Form */}
              <form onSubmit={handlePostComment} className="comment-form">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  disabled={isPostingComment}
                />
                <button type="submit" disabled={!commentText.trim() || isPostingComment} className="btn-primary">
                  {isPostingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </form>

              {/* Comments List */}
              <div className="comments-list">
                {comments.map(comment => (
                  <div key={comment.comment_id || comment.id} className="comment-card">
                    <div className="comment-header">
                      <Avatar
                        src={comment.profile_photo_url}
                        name={comment.full_name || comment.username}
                        size="sm"
                        className="comment-avatar"
                      />
                      <div className="comment-meta">
                        <strong>{comment.full_name || comment.username}</strong>
                        {comment.full_name && (
                          <span className="text-xs text-muted ml-2">@{comment.username}</span>
                        )}
                        <span className="comment-time">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="comment-text">{comment.comment_text}</p>
                    {(comment.can_delete || (user && comment.user_id === Number(user.id))) && (
                      <button
                        onClick={() => handleDeleteComment(comment.comment_id || comment.id)}
                        className="delete-comment-btn"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <div className="empty-state">
                    <MessageSquare className="empty-icon" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditForm && trip && (
        <TripForm
          trip={trip}
          onSubmit={handleUpdateTrip}
          onCancel={() => setShowEditForm(false)}
          isLoading={isUpdating}
        />
      )}

      {showItineraryModal && id && trip && (
        <ItineraryItemModal
          tripId={Number(id)}
          item={editingItineraryItem}
          onSubmit={handleSubmitItineraryItem}
          onCancel={() => {
            setShowItineraryModal(false);
            setEditingItineraryItem(undefined);
          }}
          isLoading={isSubmittingItinerary}
          tripStartDate={trip.start_date}
          tripEndDate={trip.end_date}
          existingItineraryItems={trip.itinerary || trip.itinerary_items || []}
        />
      )}

      {showInviteModal && trip && id && (
        <InviteCompanionsModal
          tripId={Number(id)}
          existingCompanions={trip.companions?.filter(c => c.username).map(c => ({ 
            user_id: c.user_id, 
            username: c.username! 
          })) || []}
          onClose={() => setShowInviteModal(false)}
          onInvite={async (userId: number) => {
            await tripService.inviteCompanion(Number(id), userId);
            showSuccess('Companion invited!');
            await loadTrip();
          }}
        />
      )}
      
      <BottomNavigation />
    </div>
  );
};

export default TripDetailPage;
