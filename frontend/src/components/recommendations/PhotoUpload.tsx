import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { useSafeToast } from '../../hooks/useSafeToast';

interface UploadedPhoto {
  id: number;
  photo_url: string;
  is_primary: boolean;
}

interface UploadPhotosResponse {
  success: boolean;
  data: {
    photos: UploadedPhoto[];
  };
  message?: string;
}

interface PhotoUploadProps {
  recommendationId: number;
  onUploadSuccess?: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ recommendationId, onUploadSuccess, maxPhotos = 10 }: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useSafeToast();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        showError('Please select only image files');
        return false;
      }
      
      if (!isValidSize) {
        showError('File size must be less than 10MB');
        return false;
      }
      
      return true;
    });

    if (validFiles.length + selectedFiles.length > maxPhotos) {
      showError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select photos to upload');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      const response = await fetch(`/api/recommendations/${recommendationId}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json() as UploadPhotosResponse;

      if (response.ok) {
        const newPhotos = data.data?.photos ?? [];
        setUploadedPhotos(prev => [...prev, ...newPhotos]);
        setSelectedFiles([]);
        showSuccess('Photos uploaded successfully!');
        if (onUploadSuccess && newPhotos.length) {
          onUploadSuccess(newPhotos);
        }
      } else {
        showError(data.message || 'Failed to upload photos');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('An error occurred while uploading photos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Photos</h3>
        <p className="text-sm text-gray-400">
          Upload high-quality photos that showcase this place. The first photo will be used as the main image.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-gray-400">
            <svg
              className="mx-auto h-12 w-12"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-white font-medium">Upload photos</p>
            <p className="text-sm text-gray-400">
              Drag & drop or click to select ({selectedFiles.length}/{maxPhotos})
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleFileInputClick}
            disabled={isUploading}
            className="text-gray-400 hover:text-white"
          >
            Select Photos
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white">Selected Photos:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                  {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                </div>
              </div>
            ))}
          </div>
          
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-pulse hover:bg-pulse/80 text-white"
          >
            {isUploading ? 'Uploading...' : 'Upload Photos'}
          </Button>
        </div>
      )}

      {/* Uploaded Photos */}
      {uploadedPhotos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white">Uploaded Photos:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {uploadedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt={`Uploaded photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                {photo.is_primary && (
                  <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
