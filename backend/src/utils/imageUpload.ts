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

// Image processing and optimization
export const processImage = async (
    buffer: Buffer,
    type: 'profile' | 'cover',
    filename: string
): Promise<string> => {
    const uploadsDir = path.join(process.cwd(), 'uploads', type === 'profile' ? 'profiles' : 'covers');
    
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const outputPath = path.join(uploadsDir, filename);
    
    try {
        if (type === 'profile') {
            // Profile photos: resize to 400x400, optimize
            await sharp(buffer)
                .resize(400, 400, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({
                    quality: 90,
                    progressive: true
                })
                .toFile(outputPath);
        } else {
            // Cover photos: resize to 1200x400, optimize
            await sharp(buffer)
                .resize(1200, 400, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({
                    quality: 85,
                    progressive: true
                })
                .toFile(outputPath);
        }
        
        return `/uploads/${type === 'profile' ? 'profiles' : 'covers'}/${filename}`;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image');
    }
};

// Generate unique filename
export const generateFilename = (originalName: string, userId: number, type: 'profile' | 'cover'): string => {
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