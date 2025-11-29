import path from 'path';

/**
 * Get the base uploads directory path
 * - In Docker: /workspace/backend/uploads (mounted volume)
 * - Locally: {cwd}/uploads
 * 
 * This is the single source of truth for uploads directory location
 */
export const getUploadsBaseDir = (): string => {
    const cwd = process.cwd();
    
    // Docker environment detection: if we're in /workspace, use Docker volume path
    if (cwd.startsWith('/workspace')) {
        return '/workspace/backend/uploads';
    }
    
    // Local development: use uploads in current working directory
    return path.join(cwd, 'uploads');
};

