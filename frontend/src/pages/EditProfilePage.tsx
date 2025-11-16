import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { ArrowLeft } from 'lucide-react';
import { profileService } from '../services/profileService';
import { buildApiUrl } from '../config/api';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    currentLocation: '',
    hometown: '',
    citiesVisited: [] as string[],
    socialLinks: {
      twitter: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      whatsapp: '',
      website: '',
    },
  });

  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile(user?.username || '');
        setFormData({
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
      } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user?.username]);

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
    setSaving(true);
    try {
      // Validate username if it changed
      if (formData.username !== user?.username) {
        // Check if username is available
        try {
          const response = await fetch(buildApiUrl(`api/profile/${formData.username}`));
          if (response.ok) {
            alert('Username already exists. Please choose a different username.');
            setSaving(false);
            return;
          }
        } catch (error) {
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
        citiesVisited: formData.citiesVisited,
        username: formData.username !== user?.username ? formData.username : undefined,
      };

      await profileService.updateProfile(updateData);
      
      // Navigate back to profile page
      navigate(`/${formData.username}`);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Cancel
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Edit Profile</h1>
          <p className="text-muted mt-2">Update your profile information</p>
        </div>

        {/* Form */}
        <div className="bg-base border border-subtle rounded-2xl p-6 space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse resize-none"
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
              className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
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
              className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
              placeholder="Where are you from?"
            />
          </div>

          {/* Cities Visited */}
          <div>
            <label className="block text-primary text-sm font-medium mb-2">Cities Visited</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCity()}
                className="flex-1 bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                placeholder="Add a city..."
              />
              <button
                onClick={addCity}
                className="bg-pulse text-white px-6 py-3 rounded-lg hover:bg-pulse/80 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.citiesVisited.map((city, index) => (
                <span
                  key={index}
                  className="bg-gray-700 text-primary px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  {city}
                  <button
                    onClick={() => removeCity(city)}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-primary text-sm font-medium mb-3">Social Links</label>
            <div className="space-y-4">
              <div>
                <label className="block text-muted text-xs mb-2">Twitter / X</label>
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://twitter.com/username or https://x.com/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-2">Instagram</label>
                <input
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-2">Facebook</label>
                <input
                  type="url"
                  value={formData.socialLinks.facebook}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://facebook.com/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={formData.socialLinks.whatsapp}
                  onChange={(e) => handleSocialLinkChange('whatsapp', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-muted text-xs mb-2">Website</label>
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 bg-gray-700 text-primary py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-pulse text-white py-3 rounded-lg font-medium hover:bg-pulse/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
