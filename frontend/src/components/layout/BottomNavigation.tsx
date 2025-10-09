import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const BottomNavigation: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    
    const navItems = [
        { 
            icon: "🏠", 
            label: "Home", 
            path: "/dashboard",
            active: location.pathname === "/dashboard" 
        },
        { 
            icon: "🔍", 
            label: "Search", 
            path: "/search",
            active: location.pathname.startsWith("/search") 
        },
        { 
            icon: "➕", 
            label: "Add", 
            path: "/recommendations/create",
            active: location.pathname === "/recommendations/create" 
        },
        { 
            icon: "💬", 
            label: "Chat", 
            path: "/chat",
            active: location.pathname.startsWith("/chat") 
        },
        { 
            icon: "👤", 
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
                        className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors duration-200 ${
                            item.active ? 'text-pulse' : 'text-muted hover:text-primary'
                        }`}
                        aria-label={`Navigate to ${item.label}`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-xs">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};