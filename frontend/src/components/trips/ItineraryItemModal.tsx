import { useState, useEffect } from 'react';
import { X, MapPin, Clock, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import type { TripItineraryItem } from '../../types/trip';
import '../../styles/ItineraryItemModal.css';

interface ItineraryItemModalProps {
  tripId: number;
  item?: TripItineraryItem;
  dayNumber?: number;
  onSubmit: (data: Partial<TripItineraryItem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  tripStartDate?: string;
  tripEndDate?: string;
  existingItineraryItems?: TripItineraryItem[];
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
  tripStartDate,
  tripEndDate,
  existingItineraryItems = [],
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
  const [showCollisionConfirm, setShowCollisionConfirm] = useState(false);
  const [collisionItems, setCollisionItems] = useState<TripItineraryItem[]>([]);
  const [pendingSubmitData, setPendingSubmitData] = useState<Partial<TripItineraryItem> | null>(null);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Helper function to check if two time slots overlap
  const checkTimeOverlap = (
    time1: string,
    duration1: number | undefined,
    time2: string,
    duration2: number | undefined
  ): boolean => {
    if (!time1 || !time2) return false;
    
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes; // Convert to minutes since midnight
    };
    
    const start1 = parseTime(time1);
    const end1 = start1 + (duration1 || 60); // Default 1 hour if no duration
    
    const start2 = parseTime(time2);
    const end2 = start2 + (duration2 || 60);
    
    // Check if times overlap
    return (start1 < end2 && start2 < end1);
  };
  
  // Check for time collisions with existing itinerary items
  const checkTimeCollisions = (submitData: Partial<TripItineraryItem>): TripItineraryItem[] => {
    if (!submitData.activity_date || !submitData.time_slot) {
      return [];
    }
    
    // Filter existing items that are:
    // 1. Not the current item being edited
    // 2. On the same date
    // 3. Have a time slot
    const sameDateItems = existingItineraryItems.filter(
      existingItem => 
        existingItem.id !== item?.id &&
        existingItem.activity_date === submitData.activity_date &&
        existingItem.time_slot
    );
    
    if (sameDateItems.length === 0) {
      return [];
    }
    
    // Check for time overlaps
    const collisions = sameDateItems.filter(existingItem => {
      return checkTimeOverlap(
        submitData.time_slot!,
        submitData.duration_minutes,
        existingItem.time_slot!,
        existingItem.duration_minutes
      );
    });
    
    return collisions;
  };

  const handleChange = (field: string, value: string | number) => {
    // For activity_date, validate immediately if date is outside trip range
    if (field === 'activity_date' && typeof value === 'string' && value) {
      if (tripStartDate && tripEndDate) {
        const activityDate = new Date(value);
        const startDate = new Date(tripStartDate.split('T')[0]);
        const endDate = new Date(tripEndDate.split('T')[0]);
        
        // Reset time to start of day for accurate comparison
        activityDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (activityDate < startDate || activityDate > endDate) {
          // Date is outside trip range - show alert and error
          const formattedStart = startDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          const formattedEnd = endDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          setErrors(prev => ({
            ...prev,
            activity_date: `⚠️ This date is outside your trip date range (${formattedStart} - ${formattedEnd}). Please select a date within this range.`
          }));
          
          // Still update the field so user can see what they selected
          setFormData(prev => ({ ...prev, [field]: value }));
          return; // Don't clear the error
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
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
    
    // Validate activity_date is within trip date range
    if (formData.activity_date && tripStartDate && tripEndDate) {
      const activityDate = new Date(formData.activity_date);
      const startDate = new Date(tripStartDate.split('T')[0]);
      const endDate = new Date(tripEndDate.split('T')[0]);
      
      if (activityDate < startDate || activityDate > endDate) {
        newErrors.activity_date = `Activity date must be between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleConfirmCollision = async () => {
    if (pendingSubmitData) {
      setShowCollisionConfirm(false);
      try {
        await onSubmit(pendingSubmitData);
      } catch (error) {
        console.error('Error submitting itinerary item:', error);
      }
      setPendingSubmitData(null);
      setCollisionItems([]);
    }
  };
  
  const handleCancelCollision = () => {
    setShowCollisionConfirm(false);
    setPendingSubmitData(null);
    setCollisionItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate date range before other validations
    if (formData.activity_date && tripStartDate && tripEndDate) {
      const activityDate = new Date(formData.activity_date);
      const startDate = new Date(tripStartDate.split('T')[0]);
      const endDate = new Date(tripEndDate.split('T')[0]);
      
      // Reset time to start of day for accurate comparison
      activityDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (activityDate < startDate || activityDate > endDate) {
        const formattedStart = startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const formattedEnd = endDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        setErrors({
          activity_date: `⚠️ Cannot save: Activity date is outside your trip date range (${formattedStart} - ${formattedEnd}). Please select a date within this range.`
        });
        
        // Scroll to the date input to show the error
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        if (dateInput) {
          dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          dateInput.focus();
        }
        
        return;
      }
    }

    if (!validate()) {
      return;
    }

    try {
      // Combine description and address into notes if address is provided
      let notesText = formData.description.trim();
      if (formData.location_address.trim()) {
        notesText = notesText 
          ? `${notesText}\n\nAddress: ${formData.location_address.trim()}`
          : `Address: ${formData.location_address.trim()}`;
      }
      
      const submitData: Partial<TripItineraryItem> = {
        trip_id: tripId,
        title: formData.title.trim(),
        description: notesText || undefined,
        day_number: Number(formData.day_number),
        activity_date: formData.activity_date || undefined,
        time_slot: formData.time_slot || undefined,
        activity_type: formData.activity_type,
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : undefined,
        estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : undefined,
        location_name: formData.location_name.trim() || undefined,
        status: formData.status,
      };
      
      // Check for time collisions
      const collisions = checkTimeCollisions(submitData);
      
      if (collisions.length > 0) {
        // Show confirmation dialog
        setCollisionItems(collisions);
        setPendingSubmitData(submitData);
        setShowCollisionConfirm(true);
        return;
      }
      
      // No collisions, proceed with submission
      await onSubmit(submitData);
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
                {tripStartDate && tripEndDate && (
                  <span className="text-xs text-[var(--text-muted)] ml-2 font-normal">
                    (Valid: {new Date(tripStartDate.split('T')[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(tripEndDate.split('T')[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                  </span>
                )}
              </label>
              <input
                type="date"
                value={formData.activity_date}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  handleChange('activity_date', selectedDate);
                  
                  // Check if browser auto-corrected the date (value changed after user selected)
                  // This handles the case where user tries to select Jan 8 but browser clamps to Jan 7
                  if (selectedDate && tripStartDate && tripEndDate) {
                    const maxDate = tripEndDate.split('T')[0];
                    const minDate = tripStartDate.split('T')[0];
                    
                    // If the selected date equals the max or min, check if user might have tried to go beyond
                    // This is a heuristic - we can't perfectly detect browser clamping, but we validate on blur
                    setTimeout(() => {
                      const input = e.target as HTMLInputElement;
                      if (input.value === maxDate || input.value === minDate) {
                        // Could be auto-corrected - validate to be sure
                        const date = new Date(input.value);
                        const max = new Date(maxDate);
                        const min = new Date(minDate);
                        date.setHours(0, 0, 0, 0);
                        max.setHours(0, 0, 0, 0);
                        min.setHours(0, 0, 0, 0);
                        
                        if (date < min || date > max) {
                          const formattedStart = min.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                          const formattedEnd = max.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                          
                          setErrors(prev => ({
                            ...prev,
                            activity_date: `⚠️ Date must be between ${formattedStart} and ${formattedEnd}. Please select a valid date.`
                          }));
                        }
                      }
                    }, 100);
                  }
                }}
                onBlur={(e) => {
                  // Validate on blur to catch any auto-corrections
                  const selectedDate = e.target.value;
                  if (selectedDate && tripStartDate && tripEndDate) {
                    const date = new Date(selectedDate);
                    const max = new Date(tripEndDate.split('T')[0]);
                    const min = new Date(tripStartDate.split('T')[0]);
                    date.setHours(0, 0, 0, 0);
                    max.setHours(0, 0, 0, 0);
                    min.setHours(0, 0, 0, 0);
                    
                    if (date < min || date > max) {
                      const formattedStart = min.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      const formattedEnd = max.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      
                      setErrors(prev => ({
                        ...prev,
                        activity_date: `⚠️ This date is outside your trip range (${formattedStart} - ${formattedEnd}). Please select a date within this range.`
                      }));
                    }
                  }
                }}
                min={tripStartDate ? tripStartDate.split('T')[0] : undefined}
                max={tripEndDate ? tripEndDate.split('T')[0] : undefined}
                disabled={isLoading}
                className={errors.activity_date ? 'border-red-500 border-2' : ''}
              />
              {errors.activity_date && (
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <span className="error-message text-amber-600 dark:text-amber-400 font-medium">{errors.activity_date}</span>
                </div>
              )}
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
        
        {/* Time Collision Confirmation Modal */}
        {showCollisionConfirm && collisionItems.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[var(--base)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-amber-500/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    Time Conflict Detected
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    You already have {collisionItems.length} {collisionItems.length === 1 ? 'activity' : 'activities'} planned at this time:
                  </p>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {collisionItems.map((collisionItem) => (
                      <div key={collisionItem.id} className="p-3 bg-[var(--surface-glass)] rounded-lg border border-[var(--border-subtle)]">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-[var(--pulse)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {collisionItem.title}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {collisionItem.time_slot}
                              {collisionItem.duration_minutes && 
                                ` • ${Math.floor(collisionItem.duration_minutes / 60)}h ${collisionItem.duration_minutes % 60}m`
                              }
                            </p>
                            {collisionItem.location_name && (
                              <p className="text-xs text-[var(--text-muted)] mt-1">
                                📍 {collisionItem.location_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Are you sure you want to add this activity with overlapping time?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelCollision}
                  className="flex-1 px-4 py-2 bg-[var(--surface-glass)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-glass)]/80 transition-colors font-medium"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCollision}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  Yes, Add Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryItemModal;
