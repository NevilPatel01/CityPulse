import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Textarea, Select, StarRating, FileUpload } from '../ui';
import { useSafeToast } from '../../hooks/useSafeToast';
import { apiRequest } from '../../config/api';
import { RecommendationPreview } from './RecommendationPreview';

interface CreateRecommendationFormProps {
  onSuccess?: (id: number) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  recommendationId?: string;
  initialData?: Partial<FormData> & {
    photos?: Array<{
      id: number;
      photo_url: string;
      is_primary: boolean;
      display_order: number;
    }>;
  };
}

interface FormData {
  // Basic Information
  place_name: string; // maps to title
  category_id: string;
  city_id: string;
  address: string;
  
  // Details
  description: string;
  price_range_min: string;
  price_range_max: string;
  difficulty_level: string;
  
  // Additional Details
  best_time_to_visit: string;
  duration_suggestion: string;
  user_rating: number;
  
  // Geographic
  latitude: string;
  longitude: string;
}

interface FormErrors {
  place_name?: string;
  description?: string;
  category_id?: string;
  city_id?: string;
  address?: string;
  price_range_min?: string;
  price_range_max?: string;
  difficulty_level?: string;
  latitude?: string;
  longitude?: string;
  best_time_to_visit?: string;
  duration_suggestion?: string;
  user_rating?: string;
  general?: string;
}

// Travel Categories - matching database recommendation_categories table
const TRAVEL_CATEGORIES = [
  { id: 1, name: 'Restaurant' },
  { id: 2, name: 'Attraction' },
  { id: 3, name: 'Activity' },
  { id: 4, name: 'Accommodation' },
  { id: 5, name: 'Transportation' },
  { id: 6, name: 'Shopping' },
  { id: 7, name: 'Entertainment' },
  { id: 8, name: 'Nature' }
];

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children
}) => {
  return (
    <div className="border border-subtle rounded-lg bg-surface-glass backdrop-blur-glass">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-glass/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 focus:ring-offset-base rounded-lg"
      >
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <svg
          className={`w-5 h-5 text-muted transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 space-y-4 border-t border-subtle">
          {children}
        </div>
      )}
    </div>
  );
};

export function CreateRecommendationForm({
  onSuccess,
  isEditing = false,
  recommendationId,
  initialData,
}: CreateRecommendationFormProps) {
  const navigate = useNavigate();
  const { showSuccess } = useSafeToast();

  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    place_name: initialData?.place_name || '',
    category_id: initialData?.category_id || '',
    city_id: initialData?.city_id || '',
    address: initialData?.address || '',
    
    // Details
    description: initialData?.description || '',
    price_range_min: initialData?.price_range_min || '',
    price_range_max: initialData?.price_range_max || '',
    difficulty_level: initialData?.difficulty_level || '',
    
    // Additional Details
    best_time_to_visit: initialData?.best_time_to_visit || '',
    duration_suggestion: initialData?.duration_suggestion || '',
    user_rating: initialData?.user_rating || 0,
    
    // Geographic
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
  });  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Section states
  const [openSections, setOpenSections] = useState({
    basicInfo: true,
    details: false,
    photos: false,
    additionalDetails: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Array<{
    id: number;
    photo_url: string;
    is_primary: boolean;
    display_order: number;
  }>>(initialData?.photos || []);
  const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);



  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.place_name.trim()) {
      newErrors.place_name = 'Place name is required';
    } else if (formData.place_name.length < 3) {
      newErrors.place_name = 'Place name must be at least 3 characters long';
    } else if (formData.place_name.length > 200) {
      newErrors.place_name = 'Place name must not exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters';
    }

    // Category validation - either select from dropdown or custom
    if (!formData.category_id && !customCategory.trim()) {
      newErrors.category_id = 'Category is required';
    } else if (formData.category_id && isNaN(parseInt(formData.category_id, 10))) {
      newErrors.category_id = 'Invalid category selection';
    }

    // City validation
    if (!formData.city_id.trim()) {
      newErrors.city_id = 'City is required (format: City, Country)';
    }

    // Address validation - now required
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Rating validation - now required
    if (!formData.user_rating) {
      newErrors.user_rating = 'Rating is required';
    }

    // Price range validation
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min > max) {
        newErrors.price_range_min = 'Minimum price cannot be greater than maximum price';
      }
    }

    // Rating validation
    if (formData.user_rating) {
      const rating = formData.user_rating;
      if (rating < 1 || rating > 5) {
        newErrors.user_rating = 'Rating must be between 1 and 5';
      }
    }

    // Coordinate validation
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90';
      }
    }

    if (formData.longitude) {
      const lng = parseFloat(formData.longitude);
      if (lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180';
      }
    }

    return newErrors;
  };

  const handleInputChange =
    (field: keyof FormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      user_rating: rating
    }));

    if (errors.user_rating) {
      setErrors(prev => ({
        ...prev,
        user_rating: undefined
      }));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const requestData = {
        place_name: formData.place_name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        custom_category: customCategory.trim() || undefined,
        custom_city: formData.city_id.trim() || undefined,
        address: formData.address.trim() || undefined,
        price_range_min: formData.price_range_min ? parseFloat(formData.price_range_min) : undefined,
        price_range_max: formData.price_range_max ? parseFloat(formData.price_range_max) : undefined,
        difficulty_level: formData.difficulty_level.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        best_time_to_visit: formData.best_time_to_visit.trim() || undefined,
        duration_suggestion: formData.duration_suggestion.trim() || undefined,
        user_rating: formData.user_rating,
      };

      const endpoint = isEditing 
        ? `/api/recommendations/${recommendationId}` 
        : '/api/recommendations';
      const method = isEditing ? 'PUT' : 'POST';

      console.log(`[FRONTEND] ${isEditing ? 'Updating' : 'Creating'} recommendation:`, requestData);
      const data = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(requestData),
      }) as { success: boolean; data?: { id: number }; message?: string; errors?: Array<{ field: string; message: string }> };

      console.log(`[FRONTEND] ${isEditing ? 'Update' : 'Create'} recommendation response:`, data);
      if (data.success) {
        const targetId = isEditing 
          ? (recommendationId ? parseInt(recommendationId) : 0) 
          : (data.data?.id || 0);

        // Upload photos if any are selected
        if (selectedFiles.length > 0 && targetId) {
          try {
            const formData = new FormData();
            selectedFiles.forEach((file) => {
              formData.append('photos', file);
            });

            await apiRequest(`/api/recommendations/${targetId}/photos`, {
              method: 'POST',
              body: formData,
              isFormData: true
            });
            console.log('[FRONTEND] Photos uploaded successfully');
          } catch (photoError) {
            console.error('[FRONTEND] Failed to upload photos:', photoError);
            showSuccess(`Recommendation ${isEditing ? 'updated' : 'created'} but failed to upload some photos`);
          }
        }

        // Delete photos marked for deletion
        if (isEditing && photosToDelete.length > 0) {
          for (const photoId of photosToDelete) {
            try {
              await apiRequest(`/api/recommendations/${recommendationId}/photos/${photoId}`, {
                method: 'DELETE',
              });
            } catch (error) {
              console.error(`Failed to delete photo ${photoId}:`, error);
            }
          }
        }

        const successMessage = isEditing 
          ? 'Recommendation updated successfully!' 
          : 'Recommendation created successfully!';
        showSuccess(successMessage);
        
        if (onSuccess && targetId) {
          // Call onSuccess with the recommendation ID
          onSuccess(targetId);
        } else if (targetId) {
          // If no onSuccess callback, navigate to the recommendation detail page
          navigate(`/recommendations/${targetId}`);
        }
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors: FormErrors = {};
          data.errors.forEach((error: { field: string; message: string }) => {
            fieldErrors[error.field as keyof FormErrors] = error.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({
            general: data.message || `Failed to ${isEditing ? 'update' : 'create'} recommendation`,
          });
        }
      }
    } catch (error) {
      console.error(`[FRONTEND] ${isEditing ? 'Update' : 'Create'} recommendation error:`, error);
      console.error('[FRONTEND] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Get category name for preview
  const getCategoryName = () => {
    if (showCustomCategory && customCategory) return customCategory;
    if (formData.category_id) {
      const category = TRAVEL_CATEGORIES.find(c => c.id === parseInt(formData.category_id));
      return category?.name || '';
    }
    return '';
  };

  return (
    <div className='w-full max-w-[1600px] mx-auto'>
      {/* Header with Action Buttons */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>
            {isEditing ? 'Edit Recommendation' : 'Create Recommendation'}
          </h1>
          <p className='text-muted mt-2'>
            {isEditing 
              ? 'Update your recommendation details' 
              : 'Share your favorite places with the community'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className='flex gap-3'>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={isLoading}
            className='bg-pulse hover:bg-pulse/90 text-white px-8 py-3 font-medium shadow-lg text-base'
          >
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Publishing...') 
              : (isEditing ? 'Update' : 'Publish')}
          </Button>
        </div>
      </div>

      {/* Split Layout: Form + Preview */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Side: Form */}
        <div className='lg:col-span-2'>
          <div className='bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass border border-subtle'>

            <form onSubmit={handleSubmit} className='p-6 space-y-6'>
              {/* General error message */}
              {errors.general && (
                <div className='p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm'>
                  {errors.general}
                </div>
              )}

          {/* Basic Information Section */}
          <CollapsibleSection
            title="Basic Information"
            isOpen={openSections.basicInfo}
            onToggle={() => toggleSection('basicInfo')}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Select
                label='Category'
                value={showCustomCategory ? 'custom' : formData.category_id}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomCategory(true);
                    setFormData(prev => ({ ...prev, category_id: '' }));
                  } else {
                    setShowCustomCategory(false);
                    setCustomCategory('');
                    handleInputChange('category_id')(e);
                  }
                }}
                error={errors.category_id}
                disabled={isLoading}
                required
                className='bg-surface-glass border-subtle text-primary'
              >
                <option value=''>Select category</option>
                {TRAVEL_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value='custom'>Custom Category</option>
              </Select>

              <Input
                type='text'
                label='Place Name'
                placeholder='e.g., Cafe de Flore'
                value={formData.place_name}
                onChange={handleInputChange('place_name')}
                error={errors.place_name}
                disabled={isLoading}
                required
                className='bg-surface-glass border-subtle text-primary'
              />
            </div>
            
            {showCustomCategory && (
              <Input
                type='text'
                label='Custom Category'
                placeholder='Enter your custom category'
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={isLoading}
                className='bg-surface-glass border-subtle text-primary'
              />
            )}

            <Textarea
              label='City, Country'
              placeholder='e.g., Tokyo, Japan or Paris, France'
              value={formData.city_id}
              onChange={handleInputChange('city_id')}
              error={errors.city_id}
              disabled={isLoading}
              required
              rows={2}
              className='bg-surface-glass border-subtle text-primary'
              helperText='Enter city name followed by country (e.g., "Paris, France")'
            />

            <Input
              type='text'
              label='Address'
              placeholder='Street address or location details'
              value={formData.address}
              onChange={handleInputChange('address')}
              error={errors.address}
              disabled={isLoading}
              required
              className='bg-surface-glass border-subtle text-primary'
            />
          </CollapsibleSection>

          {/* Details Section */}
          <CollapsibleSection
            title="Details"
            isOpen={openSections.details}
            onToggle={() => toggleSection('details')}
          >
            <Textarea
              label='Description'
              placeholder='Describe what makes this place special...'
              value={formData.description}
              onChange={handleInputChange('description')}
              error={errors.description}
              disabled={isLoading}
              required
              rows={4}
              className='bg-surface-glass border-subtle text-primary'
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Minimum Price'
                type='number'
                placeholder='Minimum price (optional)'
                value={formData.price_range_min}
                onChange={handleInputChange('price_range_min')}
                error={errors.price_range_min}
                disabled={isLoading}
                className='bg-surface-glass border-subtle text-primary'
              />
              
              <Input
                label='Maximum Price'
                type='number'
                placeholder='Maximum price (optional)'
                value={formData.price_range_max}
                onChange={handleInputChange('price_range_max')}
                error={errors.price_range_max}
                disabled={isLoading}
                className='bg-surface-glass border-subtle text-primary'
              />
            </div>

            <Select
              label='Difficulty Level'
              value={formData.difficulty_level}
              onChange={handleInputChange('difficulty_level')}
              error={errors.difficulty_level}
              disabled={isLoading}
              className='bg-surface-glass border-subtle text-primary'
            >
              <option value=''>Select difficulty level (optional)</option>
              <option value='easy'>Easy</option>
              <option value='moderate'>Moderate</option>
              <option value='hard'>Hard</option>
              <option value='expert'>Expert</option>
            </Select>
          </CollapsibleSection>

          {/* Photos Section */}
          <CollapsibleSection
            title="Photos"
            isOpen={openSections.photos}
            onToggle={() => toggleSection('photos')}
          >
            {/* Existing photos for edit mode */}
            {isEditing && existingPhotos.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-primary mb-3">Current Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Recommendation"
                        className="w-full h-32 object-cover rounded-lg border-2 border-subtle"
                      />
                      {photo.is_primary && (
                        <div className="absolute top-2 left-2 bg-pulse text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPhotosToDelete([...photosToDelete, photo.id]);
                          setExistingPhotos(existingPhotos.filter(p => p.id !== photo.id));
                        }}
                        className="absolute top-2 right-2 bg-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {!photo.is_primary && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await apiRequest(`/api/recommendations/${recommendationId}/photos/${photo.id}/primary`, {
                                method: 'PATCH',
                              });
                              setExistingPhotos(existingPhotos.map(p => ({
                                ...p,
                                is_primary: p.id === photo.id
                              })));
                              showSuccess('Primary photo updated');
                            } catch (error) {
                              console.error('Failed to set primary photo:', error);
                            }
                          }}
                          className="absolute bottom-2 left-2 bg-surface-glass text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set as Primary
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <FileUpload
              label={isEditing ? "Add More Photos" : "Upload Photos"}
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxFileSize={5}
              acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
              disabled={isLoading}
            />
            
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted mb-3">Selected Photos:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-subtle"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="p-2 bg-error text-white rounded-full hover:bg-error/80 transition-colors"
                          title="Remove photo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-muted mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Additional Details Section */}
          <CollapsibleSection
            title="Additional Details"
            isOpen={openSections.additionalDetails}
            onToggle={() => toggleSection('additionalDetails')}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                type='text'
                label='Best Time to Visit'
                placeholder='e.g., Spring, Morning, Weekdays'
                value={formData.best_time_to_visit}
                onChange={handleInputChange('best_time_to_visit')}
                error={errors.best_time_to_visit}
                disabled={isLoading}
                className='bg-surface-glass border-subtle text-primary'
              />

              <Input
                type='text'
                label='Recommended Duration'
                placeholder='e.g., 2 hours, half-day, 30 mins'
                value={formData.duration_suggestion}
                onChange={handleInputChange('duration_suggestion')}
                error={errors.duration_suggestion}
                disabled={isLoading}
                className='bg-surface-glass border-subtle text-primary'
              />
            </div>

            <StarRating
              label="Your Rating"
              rating={formData.user_rating}
              onRatingChange={handleRatingChange}
              error={errors.user_rating}
              disabled={isLoading}
              isRequired
              size="lg"
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                type='number'
                label='Latitude'
                placeholder='48.8566'
                value={formData.latitude}
                onChange={handleInputChange('latitude')}
                error={errors.latitude}
                disabled={isLoading}
                step='any'
                className='bg-surface-glass border-subtle text-primary'
              />

              <Input
                type='number'
                label='Longitude'
                placeholder='2.3522'
                value={formData.longitude}
                onChange={handleInputChange('longitude')}
                error={errors.longitude}
                disabled={isLoading}
                step='any'
                className='bg-surface-glass border-subtle text-primary'
              />
            </div>
          </CollapsibleSection>

            </form>
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className='lg:col-span-1'>
          <RecommendationPreview
            place_name={formData.place_name}
            category_name={getCategoryName()}
            city_name={formData.city_id}
            description={formData.description}
            price_range_min={formData.price_range_min}
            price_range_max={formData.price_range_max}
            user_rating={formData.user_rating}
            best_time_to_visit={formData.best_time_to_visit}
            duration_suggestion={formData.duration_suggestion}
            difficulty_level={formData.difficulty_level}
            photos={selectedFiles}
            existingPhotos={existingPhotos}
          />
        </div>
      </div>
    </div>
  );
}
