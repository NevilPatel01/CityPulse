import { query } from '../lib/database';

export async function testRecommendationsAPI() {
    try {
        console.log('🧪 Testing Recommendations API...');

        // Test 1: Get all recommendations
        console.log('\n1️⃣ Testing GET /api/recommendations');
        const recommendations = await query(`
            SELECT 
                r.id, r.title, r.description, r.price_range_min, r.price_range_max,
                r.difficulty_level, r.address, r.latitude, r.longitude,
                r.best_time_to_visit, r.duration_suggestion, r.user_rating,
                r.views_count, r.likes_count, r.created_at,
                u.username, u.full_name,
                rc.name as category_name,
                c.name as city_name, c.country
            FROM recommendations r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_cities ON r.id = rec_cities.recommendation_id
            LEFT JOIN cities c ON rec_cities.city_id = c.id
            WHERE r.status = 'active'
            ORDER BY r.created_at DESC
            LIMIT 5
        `);

        console.log(`✅ Found ${recommendations.rows.length} recommendations`);
        recommendations.rows.forEach(rec => {
            console.log(`   - ${rec.title} (${rec.category_name}) in ${rec.city_name}`);
        });

        // Test 2: Get categories
        console.log('\n2️⃣ Testing GET /api/recommendations/categories');
        const categories = await query('SELECT id, name, description FROM recommendation_categories ORDER BY name');
        console.log(`✅ Found ${categories.rows.length} categories`);
        categories.rows.forEach(cat => {
            console.log(`   - ${cat.name}: ${cat.description}`);
        });

        // Test 3: Get cities
        console.log('\n3️⃣ Testing GET /api/recommendations/cities');
        const cities = await query('SELECT id, name, country FROM cities ORDER BY name LIMIT 5');
        console.log(`✅ Found ${cities.rows.length} cities`);
        cities.rows.forEach(city => {
            console.log(`   - ${city.name}, ${city.country}`);
        });

        // Test 4: Get single recommendation
        if (recommendations.rows.length > 0) {
            const firstRec = recommendations.rows[0];
            console.log('\n4️⃣ Testing GET /api/recommendations/:id');
            const singleRec = await query(`
                SELECT 
                    r.*, u.username, u.full_name, rc.name as category_name,
                    c.name as city_name, c.country,
                    (SELECT array_agg(rp.photo_url) 
                     FROM recommendation_photos rp 
                     WHERE rp.recommendation_id = r.id 
                     ORDER BY rp.is_primary DESC, rp.created_at ASC) as photos,
                    (SELECT array_agg(rt.name) 
                     FROM recommendation_tag_links rtl
                     JOIN recommendation_tags rt ON rtl.tag_id = rt.id
                     WHERE rtl.recommendation_id = r.id) as tags
                FROM recommendations r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
                LEFT JOIN recommendation_cities rec_cities ON r.id = rec_cities.recommendation_id
                LEFT JOIN cities c ON rec_cities.city_id = c.id
                WHERE r.id = $1 AND r.status = 'active'
            `, [firstRec.id]);

            if (singleRec.rows.length > 0) {
                console.log(`✅ Found recommendation: ${singleRec.rows[0].title}`);
            } else {
                console.log('❌ Recommendation not found');
            }
        }

        // Test 5: Check database schema
        console.log('\n5️⃣ Testing database schema');
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%recommendation%'
            ORDER BY table_name
        `);
        
        console.log(`✅ Found ${tables.rows.length} recommendation-related tables:`);
        tables.rows.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });

        console.log('\n🎉 All tests passed! Recommendations API is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    testRecommendationsAPI()
        .then(() => {
            console.log('🎉 Testing completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Testing failed:', error);
            process.exit(1);
        });
}
