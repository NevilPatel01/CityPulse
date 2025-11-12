import { useState, useEffect, useCallback } from 'react';
import { X, Plane, Calendar } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types/trip';
import '../../styles/AddToTripModal.css';

interface AddToTripModalProps {
  recommendationId: number;
  recommendationTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddToTripModal: React.FC<AddToTripModalProps> = ({
  recommendationTitle,
  onClose,
  onSuccess,
}) => {
  const { showSuccess, showError } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tripService.getUserTrips({ status: 'planning' });
      setTrips(data);
      if (data.length > 0) {
        setSelectedTripId(data[0].id);
      }
    } catch (error) {
      showError('Failed to load trips');
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTrips();
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [loadTrips]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTripId) {
      showError('Please select a trip');
      return;
    }

    try {
      setIsSubmitting(true);

      // Add as itinerary item linked to recommendation
      await tripService.addItineraryItem(selectedTripId, {
        title: recommendationTitle,
        description: notes || `Added from recommendations`,
        day_number: dayNumber,
        activity_type: 'sightseeing',
        status: 'planned',
        // Note: recommendation_id would need to be added to the API if you want to link them
      });

      showSuccess('Added to trip itinerary!');
      onSuccess?.();
      onClose();
    } catch (error) {
      showError('Failed to add to trip');
      console.error('Error adding to trip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-content add-to-trip-modal'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>Add to Trip</h2>
          <button
            onClick={onClose}
            className='close-button'
            disabled={isSubmitting}
          >
            <X className='icon' />
          </button>
        </div>

        {loading ? (
          <div className='loading-container'>
            <div className='spinner'></div>
            <p>Loading your trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className='empty-state'>
            <Plane className='empty-icon' />
            <p>You don't have any trips yet</p>
            <p className='hint'>
              Create a trip first to add recommendations to it
            </p>
            <button onClick={onClose} className='btn-secondary'>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='modal-form'>
            <div className='recommendation-preview'>
              <p className='preview-label'>Adding:</p>
              <p className='preview-title'>{recommendationTitle}</p>
            </div>

            {/* Select Trip */}
            <div className='form-group'>
              <label>
                <Plane className='input-icon' />
                Select Trip <span className='required'>*</span>
              </label>
              <select
                value={selectedTripId || ''}
                onChange={(e) => setSelectedTripId(Number(e.target.value))}
                disabled={isSubmitting}
                required
              >
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title} (
                    {new Date(trip.start_date).toLocaleDateString()} -{' '}
                    {new Date(trip.end_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Day Number */}
            <div className='form-group'>
              <label>
                <Calendar className='input-icon' />
                Day Number <span className='required'>*</span>
              </label>
              <input
                type='number'
                min='1'
                value={dayNumber}
                onChange={(e) => setDayNumber(parseInt(e.target.value))}
                disabled={isSubmitting}
                required
              />
              <span className='hint-text'>
                Which day of the trip should this activity be on?
              </span>
            </div>

            {/* Notes */}
            <div className='form-group'>
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Add any notes or special instructions...'
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className='modal-actions'>
              <button
                type='button'
                onClick={onClose}
                className='btn-cancel'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn-submit'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add to Trip'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddToTripModal;
