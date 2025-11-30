/**
 * Input sanitization utilities for XSS prevention
 * These functions sanitize user input before storing in database
 */

/**
 * Sanitize HTML content by removing script tags and dangerous attributes
 * Note: For production, consider using DOMPurify library
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: URLs that could be dangerous
    sanitized = sanitized.replace(/data:text\/html/gi, '');
    
    return sanitized.trim();
}

/**
 * Strip all HTML tags from a string, returning plain text
 */
export function stripHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }
    
    // Remove all HTML tags
    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Escape special characters to prevent XSS in HTML context
 */
export function escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize string input by trimming and limiting length
 */
export function sanitizeString(input: string, maxLength?: number): string {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    let sanitized = input.trim();
    
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
}

/**
 * Check if a string contains potentially dangerous content
 */
export function containsDangerousContent(input: string): boolean {
    if (!input || typeof input !== 'string') {
        return false;
    }
    
    const dangerousPatterns = [
        /<script/gi,
        /javascript:/gi,
        /onerror\s*=/gi,
        /onload\s*=/gi,
        /onclick\s*=/gi,
        /data:text\/html/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
        return '';
    }
    
    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    if (trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:text/html') ||
        trimmed.startsWith('vbscript:') ||
        trimmed.startsWith('file:')) {
        return '';
    }
    
    // Only allow http, https, mailto, tel protocols
    if (trimmed.match(/^(https?|mailto|tel):/)) {
        return url.trim();
    }
    
    // If no protocol, assume https
    if (!trimmed.match(/^[a-z][a-z0-9+.-]*:/)) {
        return `https://${url.trim()}`;
    }
    
    return '';
}

/**
 * Sanitize recommendation description (allows some HTML but removes dangerous content)
 */
export function sanitizeDescription(description: string): string {
    if (!description || typeof description !== 'string') {
        return '';
    }
    
    // First sanitize dangerous content
    let sanitized = sanitizeHtml(description);
    
    // Allow basic formatting tags (p, br, strong, em, ul, ol, li)
    // But ensure they don't have dangerous attributes
    sanitized = sanitized.replace(/<(p|br|strong|em|ul|ol|li|b|i|u)([^>]*)>/gi, (match, tag, attrs) => {
        // Remove all attributes (except potentially safe ones in the future)
        return `<${tag}>`;
    });
    
    return sanitized.trim();
}

