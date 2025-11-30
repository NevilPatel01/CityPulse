import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const BottomNavigation: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    
    const getIcon = (label: string, isActive: boolean) => {
        const iconClass = `w-6 h-6 ${isActive ? 'text-pulse' : 'text-muted group-hover:text-primary'}`;
        
        switch (label) {
            case 'Home':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                );
            case 'Search':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                );
            case 'Trips':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'Add':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                );
            case 'Profile':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            default:
                return null;
        }
    };
    
    const navItems = [
        { 
            label: "Home", 
            path: "/explore",
            active: location.pathname === "/explore" 
        },
        { 
            label: "Search", 
            path: "/search",
            active: location.pathname.startsWith("/search") 
        },
        { 
            label: "Trips", 
            path: "/trips",
            active: location.pathname.startsWith("/trips") 
        },
        { 
            label: "Add", 
            path: "/create-recommendation",
            active: location.pathname === "/create-recommendation" 
        },
        { 
            label: "Profile", 
            path: `/profile/${user?.username}`,
            active: location.pathname.startsWith("/profile") 
        },
    ];

    const handleNavigation = (path: string, label: string) => {
        if (label === "Search") {
            // Navigate to search page with search functionality
            navigate("/search");
        } else {
            navigate(path);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-base border-t border-subtle px-4 py-2 z-30">
            <div className="flex justify-around">
                {navItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => handleNavigation(item.path, item.label)}
                        className={`group flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors duration-200 ${
                            item.active ? 'text-pulse' : 'text-muted hover:text-primary'
                        }`}
                        aria-label={`Navigate to ${item.label}`}
                    >
                        {getIcon(item.label, item.active)}
                        <span className={`text-xs ${item.active ? 'text-pulse' : 'text-muted group-hover:text-primary'}`}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};