import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface MobileBackButtonProps {
    className?: string;
    fallbackPath?: string;
}

/**
 * Mobile back button component - shows only on mobile/tablet screens
 * Appears at the top of pages for easy navigation back
 */
export const MobileBackButton: React.FC<MobileBackButtonProps> = ({ 
    className = '',
    fallbackPath = '/explore'
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallbackPath);
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`lg:hidden inline-flex items-center gap-2 text-muted hover:text-primary transition-colors group ${className}`}
            aria-label="Go back"
        >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
        </button>
    );
};

export default MobileBackButton;
