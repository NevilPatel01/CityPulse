import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Textarea, Select, StarRating, FileUpload, ProgressBar } from '../ui';
import { useSafeToast } from '../../hooks/useSafeToast';

interface CreateRecommendationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  // Basic Information
  place_name: string;
  category_id: string;
  city_id: string;
  location: string;
  address: string;
  
  // Details
  description: string;
  pros_points: string;
  progress_percentage: number;
  
  // Additional Details
  best_time_to_visit: string;
  duration_suggestion: string;
  user_rating: number;
  additional_notes: string;
  
  // Geographic
  latitude: string;
  longitude: string;
  tags: string;
}

interface FormErrors {
  place_name?: string;
  description?: string;
  category_id?: string;
  city_id?: string;
  location?: string;
  address?: string;
  pros_points?: string;
  progress_percentage?: string;
  latitude?: string;
  longitude?: string;
  best_time_to_visit?: string;
  duration_suggestion?: string;
  user_rating?: string;
  additional_notes?: string;
  tags?: string;
  general?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface City {
  id: number;
  name: string;
  country: string;
  state_province?: string;
}

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
  onCancel,
}: CreateRecommendationFormProps) {
  const navigate = useNavigate();
  const { showSuccess } = useSafeToast();

  const [formData, setFormData] = useState<FormData>({
    place_name: '',
    category_id: '',
    city_id: '',
    location: '',
    address: '',
    description: '',
    pros_points: '',
    progress_percentage: 0,
    best_time_to_visit: '',
    duration_suggestion: '',
    user_rating: 5,
    additional_notes: '',
    latitude: '',
    longitude: '',
    tags: '',
  });

  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [showCustomCity, setShowCustomCity] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);

  // Section states
  const [openSections, setOpenSections] = useState({
    basicInfo: true,
    details: false,
    photos: false,
    additionalDetails: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Load categories and cities on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const categoriesResponse = await fetch(
          '/api/recommendations/categories',
        );
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.data);
        }
        setLoadingCategories(false);

        // Load cities
        const citiesResponse = await fetch('/api/recommendations/cities');
        if (citiesResponse.ok) {
          const citiesData = await citiesResponse.json();
          setCities(citiesData.data);
        }
        setLoadingCities(false);
      } catch (error) {
        console.error('Error loading form data:', error);
        setLoadingCategories(false);
        setLoadingCities(false);
      }
    };

    loadData();
  }, []);

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
    }

    // City validation - either select from dropdown or custom
    if (!formData.city_id && !customCity.trim()) {
      newErrors.city_id = 'City is required';
    }

    // Address validation - now required
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Rating validation - now required
    if (!formData.user_rating) {
      newErrors.user_rating = 'Rating is required';
    }

    // Progress percentage validation
    if (formData.progress_percentage < 0 || formData.progress_percentage > 100) {
      newErrors.progress_percentage = 'Progress must be between 0 and 100';
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

  const handleProgressChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      progress_percentage: value
    }));

    if (errors.progress_percentage) {
      setErrors(prev => ({
        ...prev,
        progress_percentage: undefined
      }));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
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
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        custom_category: customCategory.trim() || undefined,
        city_id: formData.city_id ? parseInt(formData.city_id) : undefined,
        custom_city: customCity.trim() || undefined,
        location: formData.location.trim() || undefined,
        address: formData.address.trim() || undefined,
        pros_points: formData.pros_points.trim() || undefined,
        progress_percentage: formData.progress_percentage || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        best_time_to_visit: formData.best_time_to_visit.trim() || undefined,
        duration_suggestion: formData.duration_suggestion.trim() || undefined,
        user_rating: formData.user_rating,
        additional_notes: formData.additional_notes.trim() || undefined,
        tags: formData.tags.trim()
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : undefined,
      };

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Recommendation created successfully!');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/recommendations/${data.data.id}`);
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
            general: data.message || 'Failed to create recommendation',
          });
        }
      }
    } catch (error) {
      console.error('Create recommendation error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='bg-surface-glass backdrop-blur-glass rounded-2xl shadow-glass border border-subtle'>
        <div className='p-6 border-b border-subtle'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-primary'>
                Create Recommendation
              </h1>
              <p className='text-muted mt-1'>
                Share your favorite places with the community
              </p>
            </div>
            <Button
              variant='outline'
              onClick={handleCancel}
              disabled={isLoading}
              className='text-muted hover:text-primary border-subtle hover:border-pulse'
            >
              Cancel
            </Button>
          </div>
        </div>

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
                value={formData.category_id}
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
                disabled={isLoading || loadingCategories}
                required
                className='bg-surface-glass border-subtle text-primary'
              >
                <option value=''>Select category</option>
                {categories.map((category) => (
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Select
                label='City'
                value={formData.city_id}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomCity(true);
                    setFormData(prev => ({ ...prev, city_id: '' }));
                  } else {
                    setShowCustomCity(false);
                    setCustomCity('');
                    handleInputChange('city_id')(e);
                  }
                }}
                error={errors.city_id}
                disabled={isLoading || loadingCities}
                required
                className='bg-surface-glass border-subtle text-primary'
              >
                <option value=''>Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </option>
                ))}
                <option value='custom'>Add Other City</option>
              </Select>

              <Input
                type='text'
                label='Location'
                placeholder='e.g., Downtown, Near Central Park'
                value={formData.location}
                onChange={handleInputChange('location')}
                error={errors.location}
                disabled={isLoading}
                className='bg-surface-glass border-subtle text-primary'
              />
            </div>
            
            {showCustomCity && (
              <Textarea
                label='Custom City'
                placeholder='Enter city name, country (e.g., "Tokyo, Japan")'
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                disabled={isLoading}
                rows={2}
                className='bg-surface-glass border-subtle text-primary'
              />
            )}

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

            <Textarea
              label='Pros/Points'
              placeholder='What are the highlights of this place?'
              value={formData.pros_points}
              onChange={handleInputChange('pros_points')}
              error={errors.pros_points}
              disabled={isLoading}
              rows={3}
              className='bg-surface-glass border-subtle text-primary'
            />

            <ProgressBar
              label='Progress/Experience Level (%)'
              value={formData.progress_percentage}
              onChange={handleProgressChange}
              error={errors.progress_percentage}
              disabled={isLoading}
              showPercentage={true}
            />
          </CollapsibleSection>

          {/* Photos Section */}
          <CollapsibleSection
            title="Photos"
            isOpen={openSections.photos}
            onToggle={() => toggleSection('photos')}
          >
            <FileUpload
              label="Upload Photos"
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxFileSize={5}
              acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
              disabled={isLoading}
            />
            
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted mb-2">Selected files:</p>
                <ul className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-primary">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
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

            <Textarea
              label='Additional Notes'
              placeholder='Any additional information or tips...'
              value={formData.additional_notes}
              onChange={handleInputChange('additional_notes')}
              error={errors.additional_notes}
              disabled={isLoading}
              rows={3}
              className='bg-surface-glass border-subtle text-primary'
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

            <Input
              type='text'
              label='Tags'
              placeholder='Add relevant tags (comma-separated)'
              value={formData.tags}
              onChange={handleInputChange('tags')}
              error={errors.tags}
              disabled={isLoading}
              className='bg-surface-glass border-subtle text-primary'
            />
          </CollapsibleSection>

          {/* Submit Button */}
          <div className='flex justify-end space-x-4 pt-6 border-t border-subtle'>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isLoading}
              className='text-muted hover:text-primary border-subtle hover:border-pulse'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading}
              className='bg-pulse hover:bg-pulse/80 text-white'
            >
              {isLoading ? 'Creating...' : 'Create Recommendation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
