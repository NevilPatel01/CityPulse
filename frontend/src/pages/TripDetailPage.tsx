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
    } catch (error) {
      showError('Failed to load trip');
      console.error('Error loading trip:', error);
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await tripService.getTripComments(Number(id));
      setComments(data);
    } catch (error) {
      showError('Failed to load comments');
      console.error('Error loading comments:', error);
    }
  }, [id, showError]);

  useEffect(() => {
    if (id) {
      loadTrip();
    }
  }, [id, loadTrip]);

  useEffect(() => {
    if (activeTab === 'comments' && id) {
      loadComments();
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
            Comments ({trip.comment_count || 0})
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
                  {trip.companions.map((companion: TripCompanion) => (
                    <div key={companion.companion_id || companion.id} className="companion-card">
                      <Avatar
                        src={companion.profile_photo_url}
                        name={companion.username}
                        size="md"
                        className="companion-avatar"
                      />
                      <div className="companion-info">
                        <h3>{companion.username}</h3>
                        <span className={`role-badge ${companion.role}`}>
                          {companion.role}
                        </span>
                        <span className={`status-badge ${companion.status}`}>
                          {companion.status}
                        </span>
                      </div>
                      {isOrganizer && companion.status === 'accepted' && (
                        <button 
                          onClick={() => handleRemoveCompanion(companion.user_id)}
                          className="btn-danger btn-sm"
                          style={{ marginLeft: 'auto' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
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
                        name={comment.username}
                        size="sm"
                        className="comment-avatar"
                      />
                      <div className="comment-meta">
                        <strong>{comment.username}</strong>
                        <span className="comment-time">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="comment-text">{comment.comment_text}</p>
                    {comment.can_delete && (
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

      {showItineraryModal && id && (
        <ItineraryItemModal
          tripId={Number(id)}
          item={editingItineraryItem}
          onSubmit={handleSubmitItineraryItem}
          onCancel={() => {
            setShowItineraryModal(false);
            setEditingItineraryItem(undefined);
          }}
          isLoading={isSubmittingItinerary}
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
