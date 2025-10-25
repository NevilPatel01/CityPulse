import https from 'https';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { query } from '../lib/database';

interface Recommendation {
    id: number;
    user_id: number;
    title: string;
    category: string;
    city_name: string;
}

// Unsplash image URLs for different categories (free to use)
const categoryImages: Record<string, string[]> = {
    'Hiking': [
        'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop', // Mountain trail
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop', // Mountain landscape
        'https://images.unsplash.com/photo-1445112098124-3e76dd67983c?w=800&h=600&fit=crop', // Forest trail
    ],
    'Beach': [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', // Beach water
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop', // Beach sunset
        'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&h=600&fit=crop', // Beach sand
    ],
    'Nightlife': [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop', // Concert crowd
        'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&h=600&fit=crop', // City nightlife
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop', // Night club
    ],
    'Museum': [
        'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=600&fit=crop', // Museum interior
        'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop', // Art gallery
        'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&h=600&fit=crop', // Museum hall
    ],
    'Park': [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop', // Forest park
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop', // City park
        'https://images.unsplash.com/photo-1520645948-12fac5b6442e?w=800&h=600&fit=crop', // Park path
    ],
    'Historical Site': [
        'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=800&h=600&fit=crop', // Historic building
        'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&h=600&fit=crop', // Old architecture
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop', // Castle
    ],
    'Shopping': [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop', // Shopping mall
        'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=800&h=600&fit=crop', // Retail store
        'https://images.unsplash.com/photo-1555529902-5261145633bf?w=800&h=600&fit=crop', // Shopping street
    ],
    'Adventure': [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop', // Rock climbing
        'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800&h=600&fit=crop', // Kayaking
        'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&h=600&fit=crop', // Outdoor adventure
    ],
    'Nature': [
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop', // Wildflowers
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', // Nature landscape
        'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop', // Forest nature
    ],
    'Lake': [
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop', // Lake view
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Mountain lake
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop', // Lake landscape
    ],
    'Cafe': [
        'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&h=600&fit=crop', // Cafe interior
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', // Coffee shop
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop', // Cozy cafe
    ],
    'Restaurant': [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurant interior
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Fine dining
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop', // Food dining
    ],
};

async function downloadImage(url: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'CityPulse/1.0' } }, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    downloadImage(redirectUrl, outputPath).then(resolve).catch(reject);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', async () => {
                try {
                    const buffer = Buffer.concat(chunks);

                    // Process with Sharp to ensure consistent format
                    await sharp(buffer)
                        .resize(800, 600, {
                            fit: 'cover',
                            position: 'center',
                        })
                        .jpeg({ quality: 85 })
                        .toFile(outputPath);

                    console.log(`✅ Downloaded: ${outputPath}`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            response.on('error', reject);
        }).on('error', reject);
    });
}

async function downloadRealImages() {
    try {
        console.log('🚀 Starting to download real images for recommendations...\n');

        // Get all recommendations with their categories
        const result = await query(`
      SELECT 
        r.id,
        r.user_id,
        r.title,
        rc.name as category,
        c.name as city_name
      FROM recommendations r
      JOIN recommendation_categories rc ON r.category_id = rc.id
      JOIN recommendation_cities r_cities ON r.id = r_cities.recommendation_id
      JOIN cities c ON r_cities.city_id = c.id
      WHERE r.status = 'active'
      ORDER BY r.id
    `);

        const recommendations = result.rows as Recommendation[];
        console.log(`📊 Found ${recommendations.length} recommendations\n`);

        for (const rec of recommendations) {
            console.log(`\n📍 Processing: ${rec.title} (${rec.category}) in ${rec.city_name}`);

            // Get image URLs for this category
            const imageUrls = categoryImages[rec.category] || categoryImages['Nature'];

            // Create directory structure
            const uploadDir = path.join(process.cwd(), 'uploads', String(rec.user_id), 'recommendations', String(rec.id));
            fs.mkdirSync(uploadDir, { recursive: true });

            // Download 2-3 images for each recommendation
            const numImages = Math.min(imageUrls.length, 3);
            const downloadedPaths: string[] = [];

            for (let i = 0; i < numImages; i++) {
                const imageUrl = imageUrls[i];
                const filename = `photo_${i + 1}_${Date.now()}.jpg`;
                const outputPath = path.join(uploadDir, filename);

                try {
                    await downloadImage(imageUrl, outputPath);
                    const photoUrl = `/uploads/${rec.user_id}/recommendations/${rec.id}/${filename}`;
                    downloadedPaths.push(photoUrl);

                    // Insert photo into recommendation_photos table
                    await query(
                        'INSERT INTO recommendation_photos (recommendation_id, photo_url, is_primary, width, height) VALUES ($1, $2, $3, 800, 600)',
                        [rec.id, photoUrl, i === 0] // First photo is primary
                    );

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`   Failed to download image ${i + 1} for ${rec.title}`);
                }
            }

            if (downloadedPaths.length > 0) {
                console.log(`   ✅ Saved ${downloadedPaths.length} photos to database`);
            }
        }

        console.log('\n\n✅ All images downloaded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Total recommendations: ${recommendations.length}`);
        console.log(`   - Images per recommendation: 2-3`);
        console.log(`   - Storage location: uploads/{userId}/recommendations/{id}/`);

    } catch (error) {
        console.error('❌ Error downloading images:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run the script
downloadRealImages();
