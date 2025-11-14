import { useState } from 'react';
import { X } from 'lucide-react';
import { apiRequest, buildApiUrl } from '../../config/api';
import { useSafeToast } from '../../hooks/useSafeToast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { showSuccess, showError } = useSafeToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await apiRequest(
        buildApiUrl('api/auth/change-password'),
        {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        }
      );

      showSuccess('Success', 'Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } catch (error) {
      console.error('Failed to change password:', error);
      showError('Error', error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-glass border border-subtle rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Change Password</h2>
          <button
            onClick={handleClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-primary mb-2">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 bg-surface-glass border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse"
              placeholder="Enter current password"
            />
            {errors.currentPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-primary mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-2 bg-surface-glass border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse"
              placeholder="Enter new password (min 8 characters)"
            />
            {errors.newPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 bg-surface-glass border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-surface-glass border border-subtle text-primary rounded-lg text-sm font-medium hover:bg-pulse/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-pulse text-white rounded-lg text-sm font-medium hover:bg-pulse/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
