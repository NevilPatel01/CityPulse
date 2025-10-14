import React, { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  label?: string;
  error?: string;
  isRequired?: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxFileSize = 5, // 5MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  label,
  error,
  isRequired = false,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const fileArray = Array.from(files);

    setUploadError('');

    for (const file of fileArray) {
      // Check file type
      if (!acceptedFormats.includes(file.type)) {
        setUploadError(`${file.name} is not a supported format. Please use JPG, PNG, or WebP.`);
        continue;
      }

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        setUploadError(`${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        continue;
      }

      validFiles.push(file);
    }

    // Check max files
    if (validFiles.length > maxFiles) {
      setUploadError(`Too many files selected. Maximum ${maxFiles} files allowed.`);
      return validFiles.slice(0, maxFiles);
    }

    return validFiles;
  }, [acceptedFormats, maxFileSize, maxFiles]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatAcceptedTypes = acceptedFormats
    .map(format => format.split('/')[1].toUpperCase())
    .join(', ');

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-primary">
          {label}
          {isRequired && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${disabled 
            ? 'opacity-50 cursor-not-allowed border-subtle' 
            : 'cursor-pointer hover:border-pulse hover:bg-surface-glass/50'
          }
          ${isDragOver && !disabled
            ? 'border-pulse bg-surface-glass border-solid shadow-lg shadow-pulse/20'
            : 'border-subtle'
          }
          ${error || uploadError ? 'border-red-500' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-describedby={error || uploadError ? 'file-upload-error' : undefined}
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <svg
              className={`w-12 h-12 transition-colors duration-200 ${
                isDragOver && !disabled ? 'text-pulse' : 'text-muted'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            <p className="text-primary font-medium">
              {isDragOver && !disabled 
                ? 'Drop files here...' 
                : 'Click to browse or drag & drop'
              }
            </p>
            <p className="text-sm text-muted">
              {formatAcceptedTypes} up to {maxFileSize}MB each
              {maxFiles > 1 && ` (max ${maxFiles} files)`}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {(error || uploadError) && (
        <div 
          id="file-upload-error"
          role="alert" 
          aria-live="polite" 
          className="text-sm text-red-500 flex items-start gap-1"
        >
          <svg 
            className="w-4 h-4 mt-0.5 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          <span>{error || uploadError}</span>
        </div>
      )}
    </div>
  );
};