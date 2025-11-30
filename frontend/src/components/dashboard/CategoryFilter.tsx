import { useState, useEffect } from 'react';
import { apiRequest } from '../../config/api';

interface CategoryFilterProps {
    selectedInterest: string | null;
    onSelectInterest: (interest: string | null) => void;
}

interface Category {
    id: number;
    name: string;
    description?: string;
}

export const CategoryFilter = ({ selectedInterest, onSelectInterest }: CategoryFilterProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await apiRequest<{ success: boolean; data: Category[] }>('/api/recommendations/categories');
                if (response.success && response.data) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 bg-white/10 rounded-lg animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* All button */}
            <button
                onClick={() => onSelectInterest(null)}
                className={`
                    w-full px-4 py-2.5 rounded-lg font-medium text-sm text-left
                    transition-all duration-200
                    ${!selectedInterest
                        ? 'bg-pulse text-white shadow-md shadow-pulse/20' 
                        : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary border border-subtle'
                    }
                `}
            >
                All Categories
            </button>

            {/* Category buttons - vertically stacked */}
            {categories.map((category) => {
                const isSelected = selectedInterest === category.name;
                
                return (
                    <button
                        key={category.id}
                        onClick={() => onSelectInterest(isSelected ? null : category.name)}
                        className={`
                            w-full px-4 py-2.5 rounded-lg font-medium text-sm text-left
                            transition-all duration-200
                            ${isSelected 
                                ? 'bg-pulse text-white shadow-md shadow-pulse/20' 
                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary border border-subtle'
                            }
                        `}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
};

