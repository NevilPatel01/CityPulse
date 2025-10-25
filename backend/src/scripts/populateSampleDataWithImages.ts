import pool from '../lib/database';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Updated categories for travel
const categories = [
    { name: 'Restaurant', description: 'Places to eat and drink', icon_url: '/icons/restaurant.svg' },
    { name: 'Hiking', description: 'Hiking trails and mountain adventures', icon_url: '/icons/hiking.svg' },
    { name: 'Beach', description: 'Beaches and coastal activities', icon_url: '/icons/beach.svg' },
    { name: 'Nightlife', description: 'Bars, clubs, and night entertainment', icon_url: '/icons/nightlife.svg' },
    { name: 'Museum', description: 'Museums and cultural centers', icon_url: '/icons/museum.svg' },
    { name: 'Park', description: 'Parks and green spaces', icon_url: '/icons/park.svg' },
    { name: 'Historical Site', description: 'Historical landmarks and monuments', icon_url: '/icons/historical.svg' },
    { name: 'Shopping', description: 'Shopping centers and markets', icon_url: '/icons/shopping.svg' },
    { name: 'Adventure', description: 'Adventure sports and activities', icon_url: '/icons/adventure.svg' },
    { name: 'Nature', description: 'Natural landscapes and wildlife', icon_url: '/icons/nature.svg' },
    { name: 'Lake', description: 'Lakes and water activities', icon_url: '/icons/lake.svg' },
    { name: 'Cafe', description: 'Coffee shops and cafes', icon_url: '/icons/cafe.svg' }
];

// Sample recommendations data
const recommendations = [
    // axispatel's recommendations
    {
        username: 'axispatel',
        title: 'Sunrise Peak Trail',
        description: 'An amazing hiking trail with breathtaking sunrise views. The trail is moderately challenging but absolutely worth it. You\'ll encounter diverse wildlife and stunning mountain vistas. Perfect for early morning adventures!',
        category: 'Hiking',
        city: 'Vancouver',
        country: 'Canada',
        address: '123 Mountain Road, North Vancouver, BC',
        latitude: 49.3237,
        longitude: -123.0765,
        price_range_min: 0,
        price_range_max: 0,
        difficulty_level: 'moderate',
        best_time_to_visit: 'May to September',
        duration_suggestion: '3-4 hours',
        tags: ['hiking', 'nature', 'sunrise', 'mountains', 'wildlife'],
        unsplashQuery: 'hiking trail mountains sunrise'
    },
    {
        username: 'axispatel',
        title: 'Ocean View Restaurant',
        description: 'Exceptional seafood restaurant with panoramic ocean views. Their lobster bisque is legendary, and the sunset dining experience is unforgettable. Fresh catch daily!',
        category: 'Restaurant',
        city: 'Vancouver',
        country: 'Canada',
        address: '456 Beach Avenue, Vancouver, BC',
        latitude: 49.2827,
        longitude: -123.1207,
        price_range_min: 30,
        price_range_max: 80,
        difficulty_level: 'easy',
        best_time_to_visit: 'Year-round',
        duration_suggestion: '1-2 hours',
        tags: ['seafood', 'ocean view', 'fine dining', 'romantic'],
        unsplashQuery: 'seafood restaurant ocean view'
    },
    {
        username: 'axispatel',
        title: 'Crystal Lake Adventure',
        description: 'A pristine alpine lake perfect for kayaking, swimming, and picnicking. The crystal-clear water reflects the surrounding mountains beautifully. Great for families and photographers!',
        category: 'Lake',
        city: 'Whistler',
        country: 'Canada',
        address: 'Highway 99, Whistler, BC',
        latitude: 50.1163,
        longitude: -122.9574,
        price_range_min: 0,
        price_range_max: 20,
        difficulty_level: 'easy',
        best_time_to_visit: 'June to August',
        duration_suggestion: '2-4 hours',
        tags: ['lake', 'kayaking', 'swimming', 'nature', 'photography'],
        unsplashQuery: 'crystal clear mountain lake'
    },
    {
        username: 'axispatel',
        title: 'Downtown Jazz Club',
        description: 'Intimate jazz club featuring live music every night. The atmosphere is electric, drinks are creative, and the acoustics are perfect. A must-visit for music lovers!',
        category: 'Nightlife',
        city: 'Toronto',
        country: 'Canada',
        address: '789 King Street West, Toronto, ON',
        latitude: 43.6426,
        longitude: -79.3871,
        price_range_min: 15,
        price_range_max: 40,
        difficulty_level: 'easy',
        best_time_to_visit: 'Year-round',
        duration_suggestion: '2-3 hours',
        tags: ['jazz', 'nightlife', 'live music', 'drinks', 'entertainment'],
        unsplashQuery: 'jazz club live music night'
    },
    {
        username: 'axispatel',
        title: 'Heritage Museum',
        description: 'World-class museum showcasing local history and culture. Interactive exhibits, knowledgeable guides, and fascinating artifacts. Educational and entertaining for all ages.',
        category: 'Museum',
        city: 'Toronto',
        country: 'Canada',
        address: '100 Queen Street West, Toronto, ON',
        latitude: 43.6529,
        longitude: -79.3849,
        price_range_min: 15,
        price_range_max: 25,
        difficulty_level: 'easy',
        best_time_to_visit: 'Year-round',
        duration_suggestion: '2-3 hours',
        tags: ['museum', 'history', 'culture', 'education', 'indoor'],
        unsplashQuery: 'museum interior exhibits'
    },
    {
        username: 'axispatel',
        title: 'Riverside Park Trail',
        description: 'Scenic riverside walking and biking trail with beautiful views. Perfect for morning jogs, family walks, or peaceful evening strolls. Well-maintained with plenty of benches and rest areas.',
        category: 'Park',
        city: 'Calgary',
        country: 'Canada',
        address: '500 Riverside Drive SE, Calgary, AB',
        latitude: 51.0447,
        longitude: -114.0719,
        price_range_min: 0,
        price_range_max: 0,
        difficulty_level: 'easy',
        best_time_to_visit: 'April to October',
        duration_suggestion: '1-2 hours',
        tags: ['park', 'walking', 'biking', 'riverside', 'nature'],
        unsplashQuery: 'riverside park trail walking'
    },

    // nevilpatellocal's recommendations
    {
        username: 'nevilpatellocal',
        title: 'Mountain Peak Adventure',
        description: 'Challenging but rewarding mountain climb with spectacular 360-degree views at the summit. Experienced hikers will love this trail. Don\'t forget your camera!',
        category: 'Adventure',
        city: 'Banff',
        country: 'Canada',
        address: 'Banff National Park, AB',
        latitude: 51.1784,
        longitude: -115.5708,
        price_range_min: 0,
        price_range_max: 15,
        difficulty_level: 'hard',
        best_time_to_visit: 'July to September',
        duration_suggestion: '6-8 hours',
        tags: ['mountain', 'climbing', 'adventure', 'challenging', 'views'],
        unsplashQuery: 'mountain peak climbing adventure'
    },
    {
        username: 'nevilpatellocal',
        title: 'Artisan Coffee House',
        description: 'Cozy cafe with locally roasted coffee and homemade pastries. The baristas are true artists, and the atmosphere is perfect for working or relaxing. Great WiFi too!',
        category: 'Cafe',
        city: 'Montreal',
        country: 'Canada',
        address: '234 Rue Saint-Denis, Montreal, QC',
        latitude: 45.5017,
        longitude: -73.5673,
        price_range_min: 5,
        price_range_max: 15,
        difficulty_level: 'easy',
        best_time_to_visit: 'Year-round',
        duration_suggestion: '1-2 hours',
        tags: ['coffee', 'cafe', 'pastries', 'cozy', 'wifi'],
        unsplashQuery: 'cozy coffee shop cafe interior'
    },
    {
        username: 'nevilpatellocal',
        title: 'Sandy Beach Paradise',
        description: 'Beautiful sandy beach with calm waters and stunning sunsets. Perfect for swimming, beach volleyball, and family picnics. Lifeguards on duty during summer.',
        category: 'Beach',
        city: 'Vancouver',
        country: 'Canada',
        address: 'English Bay, Vancouver, BC',
        latitude: 49.2886,
        longitude: -123.1425,
        price_range_min: 0,
        price_range_max: 0,
        difficulty_level: 'easy',
        best_time_to_visit: 'June to September',
        duration_suggestion: '2-4 hours',
        tags: ['beach', 'swimming', 'sunset', 'family', 'volleyball'],
        unsplashQuery: 'sandy beach sunset paradise'
    },
    {
        username: 'nevilpatellocal',
        title: 'Historic Castle Tour',
        description: 'Magnificent castle with rich history dating back centuries. Guided tours reveal fascinating stories, and the architecture is breathtaking. Don\'t miss the royal gardens!',
        category: 'Historical Site',
        city: 'Quebec City',
        country: 'Canada',
        address: '1 Rue des Carrières, Quebec City, QC',
        latitude: 46.8139,
        longitude: -71.2080,
        price_range_min: 20,
        price_range_max: 35,
        difficulty_level: 'easy',
        best_time_to_visit: 'May to October',
        duration_suggestion: '2-3 hours',
        tags: ['castle', 'history', 'architecture', 'guided tour', 'gardens'],
        unsplashQuery: 'historic castle architecture'
    },
    {
        username: 'nevilpatellocal',
        title: 'Forest Nature Trail',
        description: 'Peaceful forest trail with diverse flora and fauna. Perfect for nature photography and bird watching. The ancient trees create a magical atmosphere.',
        category: 'Nature',
        city: 'Victoria',
        country: 'Canada',
        address: 'Goldstream Provincial Park, BC',
        latitude: 48.4631,
        longitude: -123.5524,
        price_range_min: 0,
        price_range_max: 10,
        difficulty_level: 'moderate',
        best_time_to_visit: 'April to October',
        duration_suggestion: '2-3 hours',
        tags: ['forest', 'nature', 'photography', 'birds', 'peaceful'],
        unsplashQuery: 'forest trail nature path'
    },
    {
        username: 'nevilpatellocal',
        title: 'Urban Shopping District',
        description: 'Trendy shopping area with boutique stores, local designers, and unique finds. Great mix of fashion, art, and specialty shops. Perfect for gift shopping!',
        category: 'Shopping',
        city: 'Montreal',
        country: 'Canada',
        address: 'Rue Sainte-Catherine, Montreal, QC',
        latitude: 45.5088,
        longitude: -73.5615,
        price_range_min: 20,
        price_range_max: 200,
        difficulty_level: 'easy',
        best_time_to_visit: 'Year-round',
        duration_suggestion: '2-4 hours',
        tags: ['shopping', 'boutique', 'fashion', 'art', 'gifts'],
        unsplashQuery: 'shopping district boutique stores'
    }
];

async function downloadImage(url: string, outputPath: string): Promise<void> {
    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await sharp(buffer)
            .resize(800, 600, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath);

        console.log(`✓ Downloaded and processed image: ${path.basename(outputPath)}`);
    } catch (error: any) {
        console.error(`✗ Failed to download image from ${url}:`, error.message);
        throw error;
    }
}

async function fetchUnsplashImage(query: string): Promise<string> {
    try {
        // Using Unsplash Source API (no API key required for basic usage)
        const searchTerms = query.replace(/\s+/g, ',');
        const url = `https://source.unsplash.com/800x600/?${searchTerms}`;
        return url;
    } catch (error) {
        console.error(`Failed to fetch Unsplash image for query "${query}":`, error.message);
        // Fallback to a generic image
        return `https://source.unsplash.com/800x600/?travel`;
    }
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`✓ Created directory: ${dirPath}`);
    }
}

async function populateData(): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('\n🔄 Starting sample data population with images...\n');

        // 1. Update categories
        console.log('📁 Updating recommendation categories...');
        for (const category of categories) {
            await client.query(
                `INSERT INTO recommendation_categories (name, description, icon_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE
         SET description = EXCLUDED.description, icon_url = EXCLUDED.icon_url`,
                [category.name, category.description, category.icon_url]
            );
        }
        console.log(`✓ Updated ${categories.length} categories\n`);

        // 2. Get user IDs
        console.log('👥 Fetching user information...');
        const axisResult = await client.query(
            'SELECT id FROM users WHERE username = $1',
            ['axispatel']
        );
        const nevilResult = await client.query(
            'SELECT id FROM users WHERE username = $1',
            ['nevilpatellocal']
        );

        if (axisResult.rows.length === 0 || nevilResult.rows.length === 0) {
            throw new Error('Required users not found. Make sure axispatel and nevilpatellocal exist.');
        }

        const axisUserId = axisResult.rows[0].id;
        const nevilUserId = nevilResult.rows[0].id;
        console.log(`✓ Found users: axispatel (ID: ${axisUserId}), nevilpatellocal (ID: ${nevilUserId})\n`);

        // 3. Create recommendations with images
        console.log('🏞️  Creating recommendations with images...\n');

        for (const rec of recommendations) {
            // Get user ID
            const userId = rec.username === 'axispatel' ? axisUserId : nevilUserId;

            // Get city ID
            let cityResult = await client.query(
                'SELECT id FROM cities WHERE name = $1 AND country = $2',
                [rec.city, rec.country]
            );

            let cityId;
            if (cityResult.rows.length === 0) {
                // Create city if it doesn't exist
                const newCity = await client.query(
                    `INSERT INTO cities (name, country, created_at)
           VALUES ($1, $2, NOW())
           RETURNING id`,
                    [rec.city, rec.country]
                );
                cityId = newCity.rows[0].id;
                console.log(`  ➕ Created city: ${rec.city}, ${rec.country}`);
            } else {
                cityId = cityResult.rows[0].id;
            }

            // Get category ID
            const categoryResult = await client.query(
                'SELECT id FROM recommendation_categories WHERE name = $1',
                [rec.category]
            );
            const categoryId = categoryResult.rows[0].id;

            // Create recommendation
            const recommendationResult = await client.query(
                `INSERT INTO recommendations (
          user_id, title, description, category_id,
          address, latitude, longitude, price_range_min, price_range_max,
          difficulty_level, best_time_to_visit, duration_suggestion,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id`,
                [
                    userId, rec.title, rec.description, categoryId,
                    rec.address, rec.latitude, rec.longitude, rec.price_range_min, rec.price_range_max,
                    rec.difficulty_level, rec.best_time_to_visit, rec.duration_suggestion
                ]
            );

            const recommendationId = recommendationResult.rows[0].id;

            // Link recommendation to city
            await client.query(
                `INSERT INTO recommendation_cities (recommendation_id, city_id, created_at)
         VALUES ($1, $2, NOW())`,
                [recommendationId, cityId]
            );

            // Add tags
            for (const tagName of rec.tags) {
                // Create tag if doesn't exist
                const tagResult = await client.query(
                    `INSERT INTO recommendation_tags (name, created_at)
           VALUES ($1, NOW())
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
                    [tagName]
                );
                const tagId = tagResult.rows[0].id;

                // Link tag to recommendation
                await client.query(
                    `INSERT INTO recommendation_tag_links (recommendation_id, tag_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (recommendation_id, tag_id) DO NOTHING`,
                    [recommendationId, tagId]
                );
            }

            console.log(`  ✓ Created: "${rec.title}" (ID: ${recommendationId})`);

            // Create directory for images
            const uploadsDir = path.join(process.cwd(), 'uploads', String(userId), 'recommendations', String(recommendationId));
            await ensureDirectoryExists(uploadsDir);

            // Download and save 2-3 images for each recommendation
            const numImages = Math.floor(Math.random() * 2) + 2; // 2 or 3 images
            for (let i = 0; i < numImages; i++) {
                try {
                    const imageUrl = await fetchUnsplashImage(rec.unsplashQuery);
                    const filename = `image_${i + 1}_${Date.now()}.jpg`;
                    const filePath = path.join(uploadsDir, filename);

                    await downloadImage(imageUrl, filePath);

                    // Save to database
                    const photoUrl = `/uploads/${userId}/recommendations/${recommendationId}/${filename}`;
                    await client.query(
                        `INSERT INTO recommendation_photos (recommendation_id, photo_url, is_primary, display_order, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
                        [recommendationId, photoUrl, i === 0, i + 1]
                    );

                    console.log(`    📸 Added image ${i + 1}/${numImages}`);
                } catch (error) {
                    console.log(`    ⚠️  Failed to add image ${i + 1}/${numImages}: ${error.message}`);
                }
            }

            console.log('');
        }

        // 4. Add ratings from different users
        console.log('⭐ Adding ratings to recommendations...\n');

        // Get all recommendation IDs
        const recsResult = await client.query(
            'SELECT id, user_id FROM recommendations ORDER BY id'
        );

        for (const rec of recsResult.rows) {
            const recommendationId = rec.id;
            const ownerId = rec.user_id;

            // Add 2-4 ratings from other user
            const ratingUserId = ownerId === axisUserId ? nevilUserId : axisUserId;
            const numRatings = Math.floor(Math.random() * 3) + 2; // 2-4 ratings

            for (let i = 0; i < numRatings; i++) {
                const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
                await client.query(
                    `INSERT INTO recommendation_ratings (recommendation_id, user_id, rating, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (recommendation_id, user_id) DO NOTHING`,
                    [recommendationId, ratingUserId, rating]
                );
            }

            console.log(`  ✓ Added ratings for recommendation ID: ${recommendationId}`);
        }

        await client.query('COMMIT');

        console.log('\n✅ Sample data population completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`  - ${categories.length} categories updated`);
        console.log(`  - ${recommendations.length} recommendations created`);
        console.log(`  - ~${recommendations.length * 2.5} images downloaded`);
        console.log(`  - ${recsResult.rows.length} recommendations rated\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error populating data:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
populateData()
    .then(() => {
        console.log('✓ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ Script failed:', error);
        process.exit(1);
    });
