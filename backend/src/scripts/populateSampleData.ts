import { query } from '../lib/database';

// Sample data for testing recommendations
const sampleCategories = [
    { name: 'Culture', description: 'Museums, art galleries, historical sites, and cultural experiences' },
    { name: 'Food', description: 'Restaurants, cafes, street food, and culinary experiences' },
    { name: 'Museums', description: 'Art museums, history museums, science centers, and exhibitions' },
    { name: 'Architecture', description: 'Famous buildings, monuments, and architectural landmarks' },
    { name: 'Nature', description: 'Parks, gardens, natural attractions, and outdoor activities' },
    { name: 'Entertainment', description: 'Theaters, concerts, shows, and entertainment venues' },
    { name: 'Shopping', description: 'Markets, malls, boutiques, and shopping districts' },
    { name: 'Nightlife', description: 'Bars, clubs, pubs, and evening entertainment' },
    { name: 'Adventure', description: 'Hiking, extreme sports, outdoor adventures, and thrill-seeking activities' },
    { name: 'Wellness', description: 'Spas, yoga studios, meditation centers, and wellness retreats' },
    { name: 'Photography', description: 'Scenic spots, photo opportunities, and Instagram-worthy locations' },
    { name: 'Family', description: 'Kid-friendly attractions, family activities, and children\'s entertainment' },
    { name: 'Religious', description: 'Churches, temples, mosques, and spiritual sites' },
    { name: 'Sports', description: 'Stadiums, sports venues, and athletic activities' },
    { name: 'Education', description: 'Universities, libraries, educational centers, and learning experiences' }
];

const sampleCities = [
    { name: 'Paris', country: 'France', state_province: 'Île-de-France', latitude: 48.8566, longitude: 2.3522 },
    { name: 'London', country: 'United Kingdom', state_province: 'England', latitude: 51.5074, longitude: -0.1278 },
    { name: 'New York', country: 'United States', state_province: 'New York', latitude: 40.7128, longitude: -74.0060 },
    { name: 'Tokyo', country: 'Japan', state_province: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    { name: 'Rome', country: 'Italy', state_province: 'Lazio', latitude: 41.9028, longitude: 12.4964 },
    { name: 'Barcelona', country: 'Spain', state_province: 'Catalonia', latitude: 41.3851, longitude: 2.1734 },
    { name: 'Amsterdam', country: 'Netherlands', state_province: 'North Holland', latitude: 52.3676, longitude: 4.9041 },
    { name: 'Berlin', country: 'Germany', state_province: 'Berlin', latitude: 52.5200, longitude: 13.4050 }
];

const sampleRecommendations = [
    {
        title: 'Eiffel Tower',
        description: 'Iconic iron tower offering breathtaking views of Paris. A must-visit landmark that symbolizes the city of lights. The tower stands 330 meters tall and offers three levels for visitors to explore.',
        category: 'Architecture',
        city: 'Paris',
        price_range_min: 25,
        price_range_max: 35,
        difficulty_level: 'easy',
        address: 'Champ de Mars, 7th arrondissement, Paris, France',
        latitude: 48.8584,
        longitude: 2.2945,
        best_time_to_visit: 'Early morning or evening for best views',
        duration_suggestion: '2-3 hours',
        user_rating: 5,
        tags: ['landmark', 'views', 'photography', 'romantic']
    },
    {
        title: 'Louvre Museum',
        description: 'World\'s largest art museum featuring the Mona Lisa and thousands of other masterpieces. Home to one of the most comprehensive collections of art and artifacts in the world.',
        category: 'Museums',
        city: 'Paris',
        price_range_min: 15,
        price_range_max: 20,
        difficulty_level: 'medium',
        address: 'Rue de Rivoli, 1st arrondissement, Paris, France',
        latitude: 48.8606,
        longitude: 2.3376,
        best_time_to_visit: 'Weekday mornings to avoid crowds',
        duration_suggestion: 'Half day',
        user_rating: 5,
        tags: ['art', 'history', 'culture', 'masterpieces']
    },
    {
        title: 'Café de Flore',
        description: 'Historic cafe famous for its literary clientele. A Parisian institution where intellectuals and artists have gathered for decades. Perfect for people-watching and experiencing authentic Parisian cafe culture.',
        category: 'Food',
        city: 'Paris',
        price_range_min: 8,
        price_range_max: 15,
        difficulty_level: 'easy',
        address: '172 Boulevard Saint-Germain, 6th arrondissement, Paris, France',
        latitude: 48.8542,
        longitude: 2.3319,
        best_time_to_visit: 'Morning for coffee, afternoon for people-watching',
        duration_suggestion: '1-2 hours',
        user_rating: 4,
        tags: ['cafe', 'literary', 'historic', 'people-watching']
    },
    {
        title: 'Tower Bridge',
        description: 'Iconic Victorian bridge over the River Thames. One of London\'s most recognizable landmarks with a unique bascule and suspension bridge design.',
        category: 'Architecture',
        city: 'London',
        price_range_min: 10,
        price_range_max: 15,
        difficulty_level: 'easy',
        address: 'Tower Bridge, London SE1 2UP, UK',
        latitude: 51.5055,
        longitude: -0.0754,
        best_time_to_visit: 'Early morning for photography',
        duration_suggestion: '1 hour',
        user_rating: 4,
        tags: ['landmark', 'bridge', 'victorian', 'photography']
    },
    {
        title: 'British Museum',
        description: 'World-renowned museum with vast collections spanning human history, art, and culture. Home to the Rosetta Stone and countless other treasures.',
        category: 'Museums',
        city: 'London',
        price_range_min: 0,
        price_range_max: 0,
        difficulty_level: 'easy',
        address: 'Great Russell St, London WC1B 3DG, UK',
        latitude: 51.5194,
        longitude: -0.1269,
        best_time_to_visit: 'Weekday mornings',
        duration_suggestion: 'Half day',
        user_rating: 5,
        tags: ['history', 'culture', 'free', 'treasures']
    },
    {
        title: 'Central Park',
        description: 'Massive urban park in the heart of Manhattan. A green oasis in the concrete jungle, perfect for walking, jogging, or simply relaxing.',
        category: 'Nature',
        city: 'New York',
        price_range_min: 0,
        price_range_max: 0,
        difficulty_level: 'easy',
        address: 'Central Park, New York, NY, USA',
        latitude: 40.7829,
        longitude: -73.9654,
        best_time_to_visit: 'Spring and fall for best weather',
        duration_suggestion: '2-4 hours',
        user_rating: 5,
        tags: ['park', 'nature', 'walking', 'free']
    }
];

export async function populateSampleData() {
    try {
        console.log('🌱 Starting to populate sample data...');

        // Insert categories
        console.log('📂 Inserting categories...');
        for (const category of sampleCategories) {
            await query(
                'INSERT INTO recommendation_categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
                [category.name, category.description]
            );
        }

        // Insert cities
        console.log('🏙️ Inserting cities...');
        for (const city of sampleCities) {
            await query(
                'INSERT INTO cities (name, country, state_province, latitude, longitude) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name, country) DO NOTHING',
                [city.name, city.country, city.state_province, city.latitude, city.longitude]
            );
        }

        // Get category and city IDs
        const categories = await query('SELECT id, name FROM recommendation_categories');
        const cities = await query('SELECT id, name, country FROM cities');
        
        const categoryMap = new Map(categories.rows.map(cat => [cat.name, cat.id]));
        const cityMap = new Map(cities.rows.map(city => [`${city.name}, ${city.country}`, city.id]));

        // Insert sample recommendations (assuming user ID 1 exists)
        console.log('📝 Inserting sample recommendations...');
        for (const rec of sampleRecommendations) {
            const categoryId = categoryMap.get(rec.category);
            const cityKey = `${rec.city}, ${sampleCities.find(c => c.name === rec.city)?.country}`;
            const cityId = cityMap.get(cityKey);

            if (categoryId && cityId) {
                // Insert recommendation
                const recResult = await query(
                    `INSERT INTO recommendations (
                        user_id, title, description, category_id, price_range_min, price_range_max,
                        difficulty_level, address, latitude, longitude, best_time_to_visit,
                        duration_suggestion, user_rating
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING id`,
                    [
                        1, // Assuming user ID 1 exists
                        rec.title,
                        rec.description,
                        categoryId,
                        rec.price_range_min,
                        rec.price_range_max,
                        rec.difficulty_level,
                        rec.address,
                        rec.latitude,
                        rec.longitude,
                        rec.best_time_to_visit,
                        rec.duration_suggestion,
                        rec.user_rating
                    ]
                );

                const recommendationId = recResult.rows[0].id;

                // Link to city
                await query(
                    'INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES ($1, $2)',
                    [recommendationId, cityId]
                );

                // Insert tags
                for (const tagName of rec.tags) {
                    // Check if tag exists, create if not
                    let tagResult = await query(
                        'SELECT id FROM recommendation_tags WHERE name = $1',
                        [tagName]
                    );

                    let tagId;
                    if (tagResult.rows.length === 0) {
                        const newTagResult = await query(
                            'INSERT INTO recommendation_tags (name) VALUES ($1) RETURNING id',
                            [tagName]
                        );
                        tagId = newTagResult.rows[0].id;
                    } else {
                        tagId = tagResult.rows[0].id;
                    }

                    // Link tag to recommendation
                    await query(
                        'INSERT INTO recommendation_tag_links (recommendation_id, tag_id) VALUES ($1, $2)',
                        [recommendationId, tagId]
                    );
                }
            }
        }

        console.log('✅ Sample data populated successfully!');
    } catch (error) {
        console.error('❌ Error populating sample data:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    populateSampleData()
        .then(() => {
            console.log('🎉 Sample data population completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Sample data population failed:', error);
            process.exit(1);
        });
}
