import pool from '../lib/database';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Generate a colored placeholder image with text
async function generatePlaceholderImage(
    text: string,
    color: { r: number; g: number; b: number },
    outputPath: string
): Promise<void> {
    try {
        // Create an SVG with text
        const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="rgb(${color.r},${color.g},${color.b})"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="36" fill="white" 
              text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;

        await sharp(Buffer.from(svg))
            .jpeg({ quality: 85 })
            .toFile(outputPath);

        console.log(`  📸 Created placeholder image: ${path.basename(outputPath)}`);
    } catch (error: any) {
        console.error(`  ✗ Failed to create placeholder: ${error.message}`);
    }
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

// Different colors for variety
const colors = [
    { r: 52, g: 152, b: 219 },   // Blue
    { r: 46, g: 204, b: 113 },   // Green
    { r: 155, g: 89, b: 182 },   // Purple
    { r: 52, g: 73, b: 94 },     // Dark Blue
    { r: 230, g: 126, b: 34 },   // Orange
    { r: 231, g: 76, b: 60 },    // Red
    { r: 26, g: 188, b: 156 },   // Teal
    { r: 241, g: 196, b: 15 },   // Yellow
];

async function addPlaceholderImages(): Promise<void> {
    const client = await pool.connect();

    try {
        console.log('\n🎨 Adding placeholder images to recommendations...\n');

        // Get all recommendations
        const result = await client.query(
            `SELECT r.id, r.title, r.user_id, u.username
       FROM recommendations r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.id`
        );

        for (const rec of result.rows) {
            const { id: recommendationId, title, user_id: userId, username } = rec;

            console.log(`Processing: "${title}" (ID: ${recommendationId}) by ${username}`);

            // Create directory for images
            const uploadsDir = path.join(
                process.cwd(),
                'uploads',
                String(userId),
                'recommendations',
                String(recommendationId)
            );
            await ensureDirectoryExists(uploadsDir);

            // Generate 2-3 placeholder images
            const numImages = Math.floor(Math.random() * 2) + 2; // 2 or 3 images

            for (let i = 0; i < numImages; i++) {
                const color = colors[recommendationId % colors.length];
                const filename = `photo_${i + 1}_${Date.now() + i}.jpg`;
                const filePath = path.join(uploadsDir, filename);
                const photoUrl = `/uploads/${userId}/recommendations/${recommendationId}/${filename}`;

                // Generate placeholder
                await generatePlaceholderImage(
                    `${title}\nPhoto ${i + 1}`,
                    color,
                    filePath
                );

                // Save to database
                await client.query(
                    `INSERT INTO recommendation_photos (
            recommendation_id, photo_url, is_primary, created_at
          ) VALUES ($1, $2, $3, NOW())
          ON CONFLICT DO NOTHING`,
                    [recommendationId, photoUrl, i === 0]
                );
            }

            console.log(`  ✓ Added ${numImages} placeholder images\n`);
        }

        console.log('✅ All placeholder images added successfully!\n');

    } catch (error) {
        console.error('❌ Error adding placeholder images:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
addPlaceholderImages()
    .then(() => {
        console.log('✓ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ Script failed:', error);
        process.exit(1);
    });
