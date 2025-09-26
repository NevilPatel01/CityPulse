import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { profileService, type ProfileUpdateData } from '../../services/profileService';

interface ProfileCompletionFormProps {
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    currentLocation?: string;
    hometown?: string;
    bio?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    whatsappContact?: string;
  };
  onProfileComplete: () => void;
}

export function ProfileCompletionForm({ user, onProfileComplete }: ProfileCompletionFormProps) {
  const [formData, setFormData] = useState({
    currentLocation: user.currentLocation || '',
    hometown: user.hometown || '',
    bio: user.bio || '',
    instagramUrl: user.instagramUrl || '',
    facebookUrl: user.facebookUrl || '',
    whatsappContact: user.whatsappContact || '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000); // Auto-save after 1 second of no typing

      return () => clearTimeout(timeoutId);
    }
  }, [formData, isDirty]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentLocation.trim()) {
      newErrors.currentLocation = 'Current location is required';
    }
    
    if (!formData.hometown.trim()) {
      newErrors.hometown = 'Hometown is required';
    }

    // Validate social media URLs if provided
    if (formData.instagramUrl && !formData.instagramUrl.includes('instagram.com')) {
      newErrors.instagramUrl = 'Please enter a valid Instagram URL';
    }
    
    if (formData.facebookUrl && !formData.facebookUrl.includes('facebook.com')) {
      newErrors.facebookUrl = 'Please enter a valid Facebook URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData: ProfileUpdateData = {
        currentLocation: formData.currentLocation,
        hometown: formData.hometown,
        bio: formData.bio || undefined,
        instagramUrl: formData.instagramUrl || undefined,
        facebookUrl: formData.facebookUrl || undefined,
        whatsappContact: formData.whatsappContact || undefined,
      };

      await profileService.updateProfile(updateData);
      setIsDirty(false);
      
      // Check if profile is now complete
      const isComplete = formData.currentLocation.trim() && formData.hometown.trim();
      if (isComplete) {
        onProfileComplete();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await handleSave();
      onProfileComplete();
    } catch (error) {
      console.error('Profile completion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isProfileComplete = formData.currentLocation.trim() && formData.hometown.trim();

  return (
    <Card className="bg-surface-glass border-subtle">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <span className="text-2xl">👋</span>
          Complete Your Profile
        </CardTitle>
        <p className="text-muted text-sm">
          Add your details to get discovered by other members and unlock all features!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Required Information</h3>
          
          <div>
            <label htmlFor="currentLocation" className="block text-sm font-medium text-primary mb-2">
              Current Location *
            </label>
            <input
              id="currentLocation"
              type="text"
              value={formData.currentLocation}
              onChange={(e) => handleInputChange('currentLocation', e.target.value)}
              placeholder="e.g., Tokyo, Japan"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.currentLocation 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-subtle bg-surface-glass focus:border-pulse'
              } text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse/20`}
            />
            {errors.currentLocation && (
              <p className="text-red-400 text-sm mt-1">{errors.currentLocation}</p>
            )}
          </div>

          <div>
            <label htmlFor="hometown" className="block text-sm font-medium text-primary mb-2">
              Hometown *
            </label>
            <input
              id="hometown"
              type="text"
              value={formData.hometown}
              onChange={(e) => handleInputChange('hometown', e.target.value)}
              placeholder="e.g., Seoul, South Korea"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.hometown 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-subtle bg-surface-glass focus:border-pulse'
              } text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse/20`}
            />
            {errors.hometown && (
              <p className="text-red-400 text-sm mt-1">{errors.hometown}</p>
            )}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Optional Information</h3>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-primary mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself... (e.g., Tech nomad exploring Asia. Coffee lover and startup enthusiast.)"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-subtle bg-surface-glass text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse/20 focus:border-pulse resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="instagramUrl" className="block text-sm font-medium text-primary mb-2">
                Instagram URL
              </label>
              <input
                id="instagramUrl"
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/yourusername"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.instagramUrl 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-subtle bg-surface-glass focus:border-pulse'
                } text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse/20`}
              />
              {errors.instagramUrl && (
                <p className="text-red-400 text-sm mt-1">{errors.instagramUrl}</p>
              )}
            </div>

            <div>
              <label htmlFor="facebookUrl" className="block text-sm font-medium text-primary mb-2">
                Facebook URL
              </label>
              <input
                id="facebookUrl"
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/yourusername"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.facebookUrl 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-subtle bg-surface-glass focus:border-pulse'
                } text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse/20`}
              />
              {errors.facebookUrl && (
                <p className="text-red-400 text-sm mt-1">{errors.facebookUrl}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="whatsappContact" className="block text-sm font-medium text-primary mb-2">
              WhatsApp Contact
            </label>
            <input
              id="whatsappContact"
              type="text"
              value={formData.whatsappContact}
              onChange={(e) => handleInputChange('whatsappContact', e.target.value)}
              placeholder="+1234567890"
              className="w-full px-4 py-3 rounded-lg border border-subtle bg-surface-glass text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse/20 focus:border-pulse"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-subtle">
          <button
            onClick={handleCompleteProfile}
            disabled={!isProfileComplete || isLoading}
            className="flex-1 bg-pulse text-white py-3 px-6 rounded-lg font-medium hover:bg-pulse/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Complete Profile'}
          </button>
          
          {isDirty && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <div className="w-2 h-2 bg-pulse rounded-full animate-pulse"></div>
              Auto-saving...
            </div>
          )}
        </div>

        {/* Profile Completion Status */}
        <div className="bg-pulse/10 border border-pulse/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-pulse">📋</span>
            <span className="text-sm font-medium text-primary">Profile Completion</span>
          </div>
          <div className="text-xs text-muted">
            {isProfileComplete 
              ? '✅ Your profile is complete! You can now be discovered by other members.'
              : '⚠️ Complete the required fields to make your profile visible to others.'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
