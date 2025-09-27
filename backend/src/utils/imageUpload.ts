import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';

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

// Image processing and optimization
export const processImage = async (
    buffer: Buffer,
    type: 'profile' | 'cover' | 'recommendation',
    filename: string
): Promise<string> => {
    let uploadsDir: string;
    let resizeOptions: { width: number; height: number; fit: 'cover' | 'inside'; position: string };
    let jpegOptions: { quality: number; progressive: boolean };

    if (type === 'profile') {
        uploadsDir = path.join(process.cwd(), 'uploads', 'profiles');
        resizeOptions = { width: 400, height: 400, fit: 'cover', position: 'center' };
        jpegOptions = { quality: 90, progressive: true };
    } else if (type === 'cover') {
        uploadsDir = path.join(process.cwd(), 'uploads', 'covers');
        resizeOptions = { width: 1200, height: 400, fit: 'cover', position: 'center' };
        jpegOptions = { quality: 85, progressive: true };
    } else {
        // Recommendation photos: resize to 800x600, optimize
        uploadsDir = path.join(process.cwd(), 'uploads', 'recommendations');
        resizeOptions = { width: 800, height: 600, fit: 'cover', position: 'center' };
        jpegOptions = { quality: 85, progressive: true };
    }
    
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const outputPath = path.join(uploadsDir, filename);
    
    try {
        await sharp(buffer)
            .resize(resizeOptions.width, resizeOptions.height, {
                fit: resizeOptions.fit,
                position: resizeOptions.position
            })
            .jpeg(jpegOptions)
            .toFile(outputPath);
        
        return `/uploads/${type === 'profile' ? 'profiles' : type === 'cover' ? 'covers' : 'recommendations'}/${filename}`;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image');
    }
};

// Generate unique filename
export const generateFilename = (originalName: string, userId: number, type: 'profile' | 'cover' | 'recommendation'): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = 'jpg'; // Always save as JPEG after processing
    
    return `${type}_${userId}_${timestamp}_${randomString}.${extension}`;
};

// Delete old image file
export const deleteOldImage = async (imagePath: string): Promise<void> => {
    if (!imagePath) return;
    
    try {
        const fullPath = path.join(process.cwd(), imagePath);
        await fs.unlink(fullPath);
        console.log(`Deleted old image: ${imagePath}`);
    } catch (error) {
        console.error('Error deleting old image:', error);
        // Don't throw error, just log it
    }
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