import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea, Select } from '../ui';
import { useSafeToast } from '../../hooks/useSafeToast';

interface CreateRecommendationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  description: string;
  category_id: string;
  city_id: string;
  price_range_min: string;
  price_range_max: string;
  difficulty_level: string;
  address: string;
  latitude: string;
  longitude: string;
  best_time_to_visit: string;
  duration_suggestion: string;
  user_rating: string;
  tags: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  category_id?: string;
  city_id?: string;
  price_range_min?: string;
  price_range_max?: string;
  difficulty_level?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  best_time_to_visit?: string;
  duration_suggestion?: string;
  user_rating?: string;
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

export function CreateRecommendationForm({
  onSuccess,
  onCancel,
}: CreateRecommendationFormProps) {
  const navigate = useNavigate();
  const { showSuccess } = useSafeToast();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category_id: '',
    city_id: '',
    price_range_min: '',
    price_range_max: '',
    difficulty_level: '',
    address: '',
    latitude: '',
    longitude: '',
    best_time_to_visit: '',
    duration_suggestion: '',
    user_rating: '',
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

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must not exceed 200 characters';
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

    // Price range validation
    if (formData.price_range_min && formData.price_range_max) {
      const minPrice = parseFloat(formData.price_range_min);
      const maxPrice = parseFloat(formData.price_range_max);

      if (minPrice < 0) {
        newErrors.price_range_min = 'Minimum price cannot be negative';
      }
      if (maxPrice < 0) {
        newErrors.price_range_max = 'Maximum price cannot be negative';
      }
      if (minPrice > maxPrice) {
        newErrors.price_range_min =
          'Minimum price cannot be greater than maximum price';
      }
    }

    // Rating validation
    if (formData.user_rating) {
      const rating = parseInt(formData.user_rating);
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
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        custom_category: customCategory.trim() || undefined,
        city_id: formData.city_id ? parseInt(formData.city_id) : undefined,
        custom_city: customCity.trim() || undefined,
        price_range_min: formData.price_range_min
          ? parseFloat(formData.price_range_min)
          : undefined,
        price_range_max: formData.price_range_max
          ? parseFloat(formData.price_range_max)
          : undefined,
        difficulty_level: formData.difficulty_level || undefined,
        address: formData.address.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude
          ? parseFloat(formData.longitude)
          : undefined,
        best_time_to_visit: formData.best_time_to_visit.trim() || undefined,
        duration_suggestion: formData.duration_suggestion.trim() || undefined,
        user_rating: formData.user_rating
          ? parseInt(formData.user_rating)
          : undefined,
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

          {/* Basic Information */}
          <div className='space-y-4'>
            <h2 className='text-lg font-semibold text-primary'>
              Basic Information
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                type='text'
                label='Title'
                placeholder='e.g., Cafe de Flore'
                value={formData.title}
                onChange={handleInputChange('title')}
                error={errors.title}
                disabled={isLoading}
                required
                className='bg-surface-glass border-subtle text-primary'
              />

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
            </div>

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
          </div>

          {/* Details */}
          <div className='space-y-4'>
            <h2 className='text-lg font-semibold text-primary'>Details</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                type='number'
                label='Minimum Price ($)'
                placeholder='0'
                value={formData.price_range_min}
                onChange={handleInputChange('price_range_min')}
                error={errors.price_range_min}
                disabled={isLoading}
                min='0'
                step='0.01'
                className='bg-surface-glass border-subtle text-primary'
              />

              <Input
                type='number'
                label='Maximum Price ($)'
                placeholder='100'
                value={formData.price_range_max}
                onChange={handleInputChange('price_range_max')}
                error={errors.price_range_max}
                disabled={isLoading}
                min='0'
                step='0.01'
                className='bg-surface-glass border-subtle text-primary'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Select
                label='Difficulty Level'
                value={formData.difficulty_level}
                onChange={handleInputChange('difficulty_level')}
                error={errors.difficulty_level}
                disabled={isLoading}
                className='bg-surface-glass border-subtle text-primary'
              >
                <option value=''>Select difficulty</option>
                <option value='easy'>Easy</option>
                <option value='medium'>Medium</option>
                <option value='hard'>Hard</option>
              </Select>

              <Input
                type='number'
                label='Your Rating (1-5)'
                placeholder='5'
                value={formData.user_rating}
                onChange={handleInputChange('user_rating')}
                error={errors.user_rating}
                disabled={isLoading}
                min='1'
                max='5'
                required
                className='bg-surface-glass border-subtle text-primary'
              />
            </div>

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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                type='text'
                label='Best Time to Visit'
                placeholder='Anytime'
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

            <Input
              type='text'
              label='Tags'
              placeholder='Add relevant tags (comma-separated)'
              value={formData.tags}
              onChange={handleInputChange('tags')}
              error={errors.tags}
              disabled={isLoading}
              className='bg-gray-800 border-gray-600 text-white'
            />
          </div>

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
