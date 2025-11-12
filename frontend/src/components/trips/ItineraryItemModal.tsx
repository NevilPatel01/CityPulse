import { useState, useEffect } from 'react';
import { X, MapPin, Clock, DollarSign, Calendar } from 'lucide-react';
import type { TripItineraryItem } from '../../types/trip';
import '../../styles/ItineraryItemModal.css';

interface ItineraryItemModalProps {
  tripId: number;
  item?: TripItineraryItem;
  dayNumber?: number;
  onSubmit: (data: Partial<TripItineraryItem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const activityTypes = [
  { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️' },
  { value: 'dining', label: 'Dining', icon: '🍽️' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'other', label: 'Other', icon: '📍' },
];

const ItineraryItemModal: React.FC<ItineraryItemModalProps> = ({
  tripId,
  item,
  dayNumber,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    day_number: item?.day_number || dayNumber || 1,
    activity_date: item?.activity_date || '',
    time_slot: item?.time_slot || '',
    activity_type: item?.activity_type || 'sightseeing',
    duration_minutes: item?.duration_minutes || undefined,
    estimated_cost: item?.estimated_cost || undefined,
    location_name: item?.location_name || '',
    location_address: item?.location_address || '',
    status: item?.status || 'planned',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.day_number < 1) {
      newErrors.day_number = 'Day number must be at least 1';
    }

    if (formData.duration_minutes && formData.duration_minutes < 0) {
      newErrors.duration_minutes = 'Duration must be positive';
    }

    if (formData.estimated_cost && formData.estimated_cost < 0) {
      newErrors.estimated_cost = 'Cost must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        trip_id: tripId,
        duration_minutes: formData.duration_minutes || undefined,
        estimated_cost: formData.estimated_cost || undefined,
      });
    } catch (error) {
      console.error('Error submitting itinerary item:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content itinerary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Edit Activity' : 'Add Activity'}</h2>
          <button onClick={onCancel} className="close-button" disabled={isLoading}>
            <X className="icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <div className="form-group">
            <label>
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Visit Eiffel Tower"
              disabled={isLoading}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add notes or details about this activity..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Day Number & Activity Type */}
          <div className="form-row">
            <div className="form-group">
              <label>
                Day <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.day_number}
                onChange={(e) => handleChange('day_number', parseInt(e.target.value))}
                disabled={isLoading}
              />
              {errors.day_number && <span className="error-message">{errors.day_number}</span>}
            </div>

            <div className="form-group">
              <label>Activity Type</label>
              <select
                value={formData.activity_type}
                onChange={(e) => handleChange('activity_type', e.target.value)}
                disabled={isLoading}
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <Calendar className="input-icon" />
                Date
              </label>
              <input
                type="date"
                value={formData.activity_date}
                onChange={(e) => handleChange('activity_date', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>
                <Clock className="input-icon" />
                Time
              </label>
              <input
                type="time"
                value={formData.time_slot}
                onChange={(e) => handleChange('time_slot', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Duration & Cost */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <Clock className="input-icon" />
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.duration_minutes || ''}
                onChange={(e) => handleChange('duration_minutes', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="e.g., 120"
                disabled={isLoading}
              />
              {errors.duration_minutes && <span className="error-message">{errors.duration_minutes}</span>}
            </div>

            <div className="form-group">
              <label>
                <DollarSign className="input-icon" />
                Estimated Cost
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost || ''}
                onChange={(e) => handleChange('estimated_cost', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="e.g., 25.00"
                disabled={isLoading}
              />
              {errors.estimated_cost && <span className="error-message">{errors.estimated_cost}</span>}
            </div>
          </div>

          {/* Location Name */}
          <div className="form-group">
            <label>
              <MapPin className="input-icon" />
              Location Name
            </label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => handleChange('location_name', e.target.value)}
              placeholder="e.g., Eiffel Tower"
              disabled={isLoading}
            />
          </div>

          {/* Location Address */}
          <div className="form-group">
            <label>
              <MapPin className="input-icon" />
              Address
            </label>
            <input
              type="text"
              value={formData.location_address}
              onChange={(e) => handleChange('location_address', e.target.value)}
              placeholder="e.g., Champ de Mars, 5 Avenue Anatole France, 75007 Paris"
              disabled={isLoading}
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={isLoading}
            >
              <option value="planned">📅 Planned</option>
              <option value="confirmed">⭕ Confirmed</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : item ? 'Update Activity' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItineraryItemModal;
