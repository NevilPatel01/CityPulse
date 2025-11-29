import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { ArrowLeft } from 'lucide-react';
import { profileService } from '../services/profileService';
import { buildApiUrl } from '../config/api';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, checkAuthStatus } = useAuth();
  
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

      console.log('[EditProfile] Sending update with cities:', formData.citiesVisited);
      await profileService.updateProfile(updateData);
      
      // Update auth context if username changed
      if (formData.username !== user?.username) {
        updateUser({ username: formData.username });
      }
      
      // Refresh auth status to get updated user data
      await checkAuthStatus();
      
      // Navigate back to profile page
      navigate(`/profile/${formData.username}`);
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
      
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Cancel
        </button>

        {/* Header with Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Edit Profile</h1>
            <p className="text-muted mt-2">Update your profile information</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bg-gray-700 text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-pulse text-white px-8 py-3 rounded-lg font-medium hover:bg-pulse/80 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Split Layout: Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Form */}
          <div className="lg:col-span-2">
            <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass border border-subtle p-6 space-y-6">
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
              rows={6}
              className="w-full bg-gray-700 border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-pulse resize-none"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-muted mt-1">{formData.bio.length} characters</p>
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
          </div>

          {/* Right Side: Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass border border-subtle p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Profile Preview</h3>
                
                <div className="space-y-4">
                  {/* Profile Header Preview */}
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-3 flex items-center justify-center text-3xl text-pulse font-bold">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : formData.username.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="text-lg font-semibold text-primary">
                      {formData.fullName || 'Your Name'}
                    </h4>
                    <p className="text-muted text-sm">@{formData.username || 'username'}</p>
                  </div>

                  {/* Bio Preview */}
                  {formData.bio && (
                    <div className="pt-4 border-t border-subtle">
                      <p className="text-sm text-primary whitespace-pre-wrap">{formData.bio}</p>
                    </div>
                  )}

                  {/* Location Preview */}
                  {(formData.currentLocation || formData.hometown) && (
                    <div className="pt-4 border-t border-subtle flex flex-wrap items-center gap-4">
                      {formData.currentLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-muted">Lives in</span>
                          <span className="text-primary font-medium">{formData.currentLocation}</span>
                        </div>
                      )}
                      {formData.hometown && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-muted">From</span>
                          <span className="text-primary font-medium">{formData.hometown}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cities Visited Preview */}
                  {formData.citiesVisited.length > 0 && (
                    <div className="pt-4 border-t border-subtle">
                      <p className="text-sm text-muted mb-2">Cities Visited ({formData.citiesVisited.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.citiesVisited.slice(0, 6).map((city, index) => (
                          <span key={index} className="text-xs bg-gray-700 text-primary px-2 py-1 rounded">
                            {city}
                          </span>
                        ))}
                        {formData.citiesVisited.length > 6 && (
                          <span className="text-xs bg-gray-700 text-muted px-2 py-1 rounded">
                            +{formData.citiesVisited.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Links Preview */}
                  {Object.values(formData.socialLinks).some(link => link) && (
                    <div className="pt-4 border-t border-subtle">
                      <p className="text-sm text-muted mb-2">Social Links</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.socialLinks.twitter && (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </div>
                        )}
                        {formData.socialLinks.instagram && (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </div>
                        )}
                        {formData.socialLinks.facebook && (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </div>
                        )}
                        {formData.socialLinks.linkedin && (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
