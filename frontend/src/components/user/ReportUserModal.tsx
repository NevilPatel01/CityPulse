import React, { useState } from 'react';
import { X } from 'lucide-react';
import { reportUser } from '../../services/buddyService';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ReportUserModalProps {
  isOpen: boolean;
  targetUserId: number;
  targetUsername: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'fake_profile', label: 'Fake or impersonation account' },
  { value: 'safety', label: 'Safety concerns' },
  { value: 'other', label: 'Other' },
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  targetUserId,
  targetUsername,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      showError('Error', 'Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportUser(targetUserId, selectedReason, description || undefined);
      showSuccess(
        'Report Submitted',
        'Thank you for helping keep our community safe. We will review this report.'
      );
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
      showError('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-glass border border-subtle rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <h2 className="text-xl font-semibold text-primary">Report User</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-muted text-sm mb-4">
              You are reporting <span className="text-primary font-medium">@{targetUsername}</span>
            </p>
            <p className="text-muted text-xs">
              Please select a reason for your report. All reports are reviewed by our moderation team.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">
              Reason for report <span className="text-error">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center p-3 rounded-lg border border-subtle hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-3 accent-pulse"
                  />
                  <span className="text-sm text-primary">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-primary">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context that might help us review this report..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-surface-glass border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-transparent resize-none"
            />
            <p className="text-xs text-muted text-right">{description.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-white/10 text-primary rounded-lg font-medium border border-subtle hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="flex-1 px-4 py-3 bg-error text-white rounded-lg font-medium hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" variant="spinner" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
