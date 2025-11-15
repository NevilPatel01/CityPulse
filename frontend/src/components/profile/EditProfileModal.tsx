import { useState } from 'react';
import { profileService } from '../../services/profileService';
import { buildApiUrl } from '../../config/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    fullName: string;
    username: string;
    bio?: string;
    currentLocation?: string;
    hometown?: string;
    citiesVisited?: string[];
    instagramUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    whatsappContact?: string;
    websiteUrl?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
      whatsapp?: string;
      website?: string;
    };
  };
  onSave: (updatedProfile: {
    fullName: string;
    username: string;
    bio: string;
    currentLocation: string;
    hometown: string;
    citiesVisited: string[];
    socialLinks: {
      twitter: string;
      instagram: string;
      facebook: string;
      linkedin: string;
      whatsapp: string;
      website: string;
    };
  }) => void;
}

export function EditProfileModal({ isOpen, onClose, profile, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    username: profile.username,
    bio: profile.bio || '',
    currentLocation: profile.currentLocation || '',
    hometown: profile.hometown || '',
    citiesVisited: profile.citiesVisited || [],
    socialLinks: {
      twitter: profile.twitterUrl || profile.socialLinks?.twitter || '',
      instagram: profile.instagramUrl || profile.socialLinks?.instagram || '',
      facebook: profile.facebookUrl || profile.socialLinks?.facebook || '',
      linkedin: profile.linkedinUrl || profile.socialLinks?.linkedin || '',
      whatsapp: profile.whatsappContact || '',
      website: profile.websiteUrl || '',
    },
  });

  const [newCity, setNewCity] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const addCity = () => {
    if (newCity.trim() && !formData.citiesVisited.includes(newCity.trim())) {
      setFormData(prev => ({
        ...prev,
        citiesVisited: [...prev.citiesVisited, newCity.trim()],
      }));
      setNewCity('');
    }
  };

  const removeCity = (cityToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      citiesVisited: prev.citiesVisited.filter(city => city !== cityToRemove),
    }));
  };

  const handleSave = async () => {
    try {
      // Validate username if it changed
      if (formData.username !== profile.username) {
        // Check if username is available
        try {
          // Try to get profile with new username to see if it exists
          const response = await fetch(buildApiUrl(`api/profile/${formData.username}`));
          if (response.ok) {
            alert('Username already exists. Please choose a different username.');
            return;
          }
        } catch (error) {
          // Username is available, continue
          console.log('Username is available:', formData.username);
          console.error('Error checking username availability:', error);
        }
      }

      // Transform form data to match API format
      const updateData = {
        bio: formData.bio,
        currentLocation: formData.currentLocation,
        hometown: formData.hometown,
        instagramUrl: formData.socialLinks.instagram?.trim() || undefined,
        facebookUrl: formData.socialLinks.facebook?.trim() || undefined,
        twitterUrl: formData.socialLinks.twitter?.trim() || undefined,
        linkedinUrl: formData.socialLinks.linkedin?.trim() || undefined,
        whatsappContact: formData.socialLinks.whatsapp?.trim() || undefined,
        websiteUrl: formData.socialLinks.website?.trim() || undefined,
        // Add cities visited data
        citiesVisited: formData.citiesVisited,
        // Add username if changed
        username: formData.username !== profile.username ? formData.username : undefined,
      };

      // Call API to update profile
      await profileService.updateProfile(updateData);
      
      // Call the parent callback with updated data
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      // You might want to show a toast notification here
      alert('Failed to save profile. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base border border-subtle rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-subtle">
          <h2 className="text-primary text-xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Current Location */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Current Location</label>
            <input
              type="text"
              value={formData.currentLocation}
              onChange={(e) => handleInputChange('currentLocation', e.target.value)}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
              placeholder="Where do you live now?"
            />
          </div>

          {/* Hometown */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Hometown</label>
            <input
              type="text"
              value={formData.hometown}
              onChange={(e) => handleInputChange('hometown', e.target.value)}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
              placeholder="Where are you from?"
            />
          </div>

          {/* Cities Visited */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Cities Visited</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCity()}
                className="flex-1 bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                placeholder="Add a city..."
              />
              <button
                onClick={addCity}
                className="bg-pulse text-white px-4 py-2 rounded-lg hover:bg-pulse/80 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.citiesVisited.map((city, index) => (
                <span
                  key={index}
                  className="bg-gray-700 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {city}
                  <button
                    onClick={() => removeCity(city)}
                    className="text-muted hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Social Links</label>
            <div className="space-y-3">
              <div>
                <label className="block text-muted text-xs mb-1">Twitter / X</label>
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://twitter.com/username or https://x.com/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-1">Instagram</label>
                <input
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-1">Facebook</label>
                <input
                  type="url"
                  value={formData.socialLinks.facebook}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://facebook.com/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={formData.socialLinks.whatsapp}
                  onChange={(e) => handleSocialLinkChange('whatsapp', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-1">Website</label>
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-subtle">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-primary py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-pulse text-white py-3 rounded-lg font-medium hover:bg-pulse/80 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
