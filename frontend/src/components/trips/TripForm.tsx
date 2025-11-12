import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Globe, Lock, Users } from 'lucide-react';
import type { Trip, CreateTripData } from '../../types/trip';

interface TripFormProps {
  trip?: Trip;
  onSubmit: (data: CreateTripData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TripForm: React.FC<TripFormProps> = ({ trip, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<CreateTripData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    privacy: 'buddies_only',
    currency: 'USD',
    is_collaborative: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trip) {
      setFormData({
        title: trip.title,
        description: trip.description,
        start_date: trip.start_date.split('T')[0],
        end_date: trip.end_date.split('T')[0],
        privacy: trip.privacy,
        total_budget: trip.total_budget,
        currency: trip.currency,
        is_collaborative: trip.is_collaborative,
        cover_photo_url: trip.cover_photo_url,
      });
    }
  }, [trip]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (formData.total_budget && formData.total_budget < 0) {
      newErrors.total_budget = 'Budget must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--base)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--base)]">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {trip ? 'Edit Trip' : 'Create New Trip'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Trip Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--pulse)] transition-colors"
              placeholder="e.g., European Summer Adventure"
              disabled={isLoading}
            />
            {errors.title && <p className="mt-1 text-sm text-[var(--error)]">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--pulse)] transition-colors resize-none"
              placeholder="Describe your trip, what you plan to do, places you want to visit..."
              disabled={isLoading}
            />
            {errors.description && <p className="mt-1 text-sm text-[var(--error)]">{errors.description}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--pulse)] transition-colors"
                disabled={isLoading}
              />
              {errors.start_date && <p className="mt-1 text-sm text-[var(--error)]">{errors.start_date}</p>}
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date *
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--pulse)] transition-colors"
                disabled={isLoading}
              />
              {errors.end_date && <p className="mt-1 text-sm text-[var(--error)]">{errors.end_date}</p>}
            </div>
          </div>

          {/* Budget and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="total_budget" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total Budget (Optional)
              </label>
              <input
                type="number"
                id="total_budget"
                name="total_budget"
                value={formData.total_budget || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--pulse)] transition-colors"
                placeholder="5000"
                disabled={isLoading}
              />
              {errors.total_budget && <p className="mt-1 text-sm text-[var(--error)]">{errors.total_budget}</p>}
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--pulse)] transition-colors"
                disabled={isLoading}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label htmlFor="privacy" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Privacy Setting
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`flex items-center gap-3 p-4 bg-[var(--surface-glass)] border ${formData.privacy === 'public' ? 'border-[var(--pulse)]' : 'border-[var(--border-subtle)]'} rounded-lg cursor-pointer hover:border-[var(--pulse)] transition-colors`}>
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={formData.privacy === 'public'}
                  onChange={handleChange}
                  className="sr-only"
                  disabled={isLoading}
                />
                <Globe className={`w-5 h-5 ${formData.privacy === 'public' ? 'text-[var(--pulse)]' : 'text-[var(--text-muted)]'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${formData.privacy === 'public' ? 'text-[var(--pulse)]' : 'text-[var(--text-primary)]'}`}>
                    Public
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Anyone can see</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 bg-[var(--surface-glass)] border ${formData.privacy === 'buddies_only' ? 'border-[var(--pulse)]' : 'border-[var(--border-subtle)]'} rounded-lg cursor-pointer hover:border-[var(--pulse)] transition-colors`}>
                <input
                  type="radio"
                  name="privacy"
                  value="buddies_only"
                  checked={formData.privacy === 'buddies_only'}
                  onChange={handleChange}
                  className="sr-only"
                  disabled={isLoading}
                />
                <Users className={`w-5 h-5 ${formData.privacy === 'buddies_only' ? 'text-[var(--pulse)]' : 'text-[var(--text-muted)]'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${formData.privacy === 'buddies_only' ? 'text-[var(--pulse)]' : 'text-[var(--text-primary)]'}`}>
                    Buddies Only
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Travel buddies</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 bg-[var(--surface-glass)] border ${formData.privacy === 'private' ? 'border-[var(--pulse)]' : 'border-[var(--border-subtle)]'} rounded-lg cursor-pointer hover:border-[var(--pulse)] transition-colors`}>
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={formData.privacy === 'private'}
                  onChange={handleChange}
                  className="sr-only"
                  disabled={isLoading}
                />
                <Lock className={`w-5 h-5 ${formData.privacy === 'private' ? 'text-[var(--pulse)]' : 'text-[var(--text-muted)]'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${formData.privacy === 'private' ? 'text-[var(--pulse)]' : 'text-[var(--text-primary)]'}`}>
                    Private
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Only you</p>
                </div>
              </label>
            </div>
          </div>

          {/* Collaborative */}
          <div className="flex items-center gap-3 p-4 bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-lg">
            <input
              type="checkbox"
              id="is_collaborative"
              name="is_collaborative"
              checked={formData.is_collaborative}
              onChange={handleChange}
              className="w-5 h-5 rounded border-[var(--border-subtle)] text-[var(--pulse)] focus:ring-[var(--pulse)] focus:ring-offset-0"
              disabled={isLoading}
            />
            <label htmlFor="is_collaborative" className="flex-1 cursor-pointer">
              <p className="text-sm font-medium text-[var(--text-primary)]">Collaborative Planning</p>
              <p className="text-xs text-[var(--text-muted)]">Allow companions to add and edit itinerary items</p>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-[var(--surface-glass)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-glass)]/80 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[var(--pulse)] text-white rounded-lg hover:bg-[var(--pulse)]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : trip ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripForm;
