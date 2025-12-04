import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';
import { getUploadsBaseDir } from './paths';

// Supported image formats
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'];

// File size limits (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Create multer storage configuration
const storage = multer.memoryStorage(); // Store in memory for processing

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileExt || !SUPPORTED_FORMATS.includes(fileExt)) {
        return cb(new Error(`Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`));
    }
    
    // Check mimetype as well
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('File must be an image'));
    }
    
    cb(null, true);
};

// Create multer upload instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1 // Only allow 1 file at a time
    }
});

// Create multer upload instance for multiple files (recommendations)
export const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10 // Allow up to 10 files for recommendations
    }
});

/**
 * Get upload directory path based on type
 * Structure: uploads/{userId}/{type}/{id}/
 */
const getUploadPath = (
    userId: number,
    type: 'profile' | 'cover' | 'recommendation' | 'city',
    id?: number
): string => {
    const baseDir = path.join(getUploadsBaseDir(), userId.toString());
    
    switch (type) {
        case 'profile':
            return path.join(baseDir, 'profile');
        case 'cover':
            return path.join(baseDir, 'cover');
        case 'recommendation':
            if (!id) throw new Error('Recommendation ID required');
            return path.join(baseDir, 'recommendations', id.toString());
        case 'city':
            if (!id) throw new Error('City ID required');
            return path.join(baseDir, 'cities', id.toString());
        default:
            throw new Error('Invalid upload type');
    }
};

/**
 * Get URL path for uploaded file
 */
const getUrlPath = (
    userId: number,
    type: 'profile' | 'cover' | 'recommendation' | 'city',
    filename: string,
    id?: number
): string => {
    switch (type) {
        case 'profile':
            return `/uploads/${userId}/profile/${filename}`;
        case 'cover':
            return `/uploads/${userId}/cover/${filename}`;
        case 'recommendation':
            if (!id) throw new Error('Recommendation ID required');
            return `/uploads/${userId}/recommendations/${id}/${filename}`;
        case 'city':
            if (!id) throw new Error('City ID required');
            return `/uploads/${userId}/cities/${id}/${filename}`;
        default:
            throw new Error('Invalid upload type');
    }
};

/**
 * Delete all old files in a directory
 */
const deleteOldFiles = async (dirPath: string): Promise<void> => {
    try {
        const files = await fs.readdir(dirPath);
        await Promise.all(files.map(file => fs.unlink(path.join(dirPath, file))));
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            console.error('Error deleting old files:', error);
        }
    }
};

// Image processing and optimization
export const processImage = async (
    buffer: Buffer,
    userId: number,
    type: 'profile' | 'cover' | 'recommendation' | 'city',
    filename: string,
    id?: number
): Promise<string> => {
    let resizeOptions: { width: number; height: number; fit: 'cover' | 'inside'; position: string };
    let jpegOptions: { quality: number; progressive: boolean };

    // Configure resize options based on type
    if (type === 'profile') {
        resizeOptions = { width: 400, height: 400, fit: 'cover', position: 'center' };
        jpegOptions = { quality: 90, progressive: true };
    } else if (type === 'cover') {
        resizeOptions = { width: 1200, height: 400, fit: 'cover', position: 'center' };
        jpegOptions = { quality: 85, progressive: true };
    } else if (type === 'city') {
        resizeOptions = { width: 1200, height: 800, fit: 'cover', position: 'center' };
        jpegOptions = { quality: 85, progressive: true };
    } else {
        // Recommendation photos: resize to 800x600, optimize
        resizeOptions = { width: 800, height: 600, fit: 'cover', position: 'center' };
        jpegOptions = { quality: 85, progressive: true };
    }
    
    // Get upload directory
    const uploadsDir = getUploadPath(userId, type, id);
    
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Delete old files for profile/cover (single file only)
    if (type === 'profile' || type === 'cover') {
        await deleteOldFiles(uploadsDir);
    }
    
    const outputPath = path.join(uploadsDir, filename);
    
    try {
        await sharp(buffer)
            .rotate() // Automatically handle EXIF orientation to fix rotation issues
            .resize(resizeOptions.width, resizeOptions.height, {
                fit: resizeOptions.fit,
                position: resizeOptions.position
            })
            .jpeg(jpegOptions)
            .toFile(outputPath);
        
        return getUrlPath(userId, type, filename, id);
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image');
    }
};

// Generate unique filename
export const generateFilename = (originalName: string, type: 'profile' | 'cover' | 'recommendation' | 'city'): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = 'jpg'; // Always save as JPEG after processing
    
    // For profile and cover, use simple names (since we delete old ones)
    if (type === 'profile') {
        return `avatar.${extension}`;
    } else if (type === 'cover') {
        return `cover.${extension}`;
    }
    
    // For recommendations and cities, use timestamp to allow multiple files
    return `${type}_${timestamp}_${randomString}.${extension}`;
};

// Delete old image file
export const deleteOldImage = async (imagePath: string): Promise<void> => {
    if (!imagePath) return;
    
    try {
        // Remove leading /uploads/ prefix if present, then join with base dir
        const relativePath = imagePath.startsWith('/uploads/') 
            ? imagePath.substring('/uploads/'.length) 
            : imagePath;
        const fullPath = path.join(getUploadsBaseDir(), relativePath);
        await fs.unlink(fullPath);
    } catch (error) {
        console.error('Error deleting old image:', error);
        // Don't throw error, just log it
    }
};

/**
 * Delete entire folder and its contents
 */
export const deleteFolder = async (folderPath: string): Promise<void> => {
    try {
        await fs.rm(folderPath, { recursive: true, force: true });
    } catch (error) {
        console.error('Error deleting folder:', error);
    }
};

/**
 * Delete user's recommendation folder
 */
export const deleteRecommendationFolder = async (userId: number, recommendationId: number): Promise<void> => {
    const folderPath = getUploadPath(userId, 'recommendation', recommendationId);
    await deleteFolder(folderPath);
};

/**
 * Delete user's city folder
 */
export const deleteCityFolder = async (userId: number, cityId: number): Promise<void> => {
    const folderPath = getUploadPath(userId, 'city', cityId);
    await deleteFolder(folderPath);
};

// Validate image dimensions and size
export const validateImageFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: `File size too large. Maximum allowed: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
        };
    }
    
    // Check file extension
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExt || !SUPPORTED_FORMATS.includes(fileExt)) {
        return {
            isValid: false,
            error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
        };
    }
    
    return { isValid: true };
};

// Get image metadata
export const getImageMetadata = async (buffer: Buffer) => {
    try {
        const metadata = await sharp(buffer).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size
        };
    } catch (error) {
        console.error('Error getting image metadata:', error);
        throw new Error('Invalid image file');
    }
};