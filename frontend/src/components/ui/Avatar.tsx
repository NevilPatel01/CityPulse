import { apiConfig } from '../../config/api';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl'
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar = ({ src, alt, name, size = 'md', className = '' }: AvatarProps) => {
  const initials = getInitials(name || alt);
  const sizeClass = sizeClasses[size];

  // Handle relative URLs by prepending base URL
  const imageUrl = src && !src.startsWith('http') ? `${apiConfig.baseUrl}${src}` : src;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt || name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide the image on error and show initials instead
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <div 
        className={`w-full h-full bg-gradient-to-br from-pulse to-pulseLight flex items-center justify-center text-white font-semibold`}
        style={{ display: src ? 'none' : 'flex' }}
      >
        {initials}
      </div>
    </div>
  );
};

export default Avatar;
