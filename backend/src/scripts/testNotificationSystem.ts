/**
 * Comprehensive Notification System Test Script
 * 
 * This script tests the entire notification flow:
 * 1. Like notifications
 * 2. Rating notifications
 * 3. Buddy request notifications
 * 4. Buddy acceptance notifications
 */

import pool from '../lib/database';
import { 
    notifyRecommendationLike, 
    notifyRecommendationRating,
    notifyBuddyRequest,
    notifyBuddyAccepted
} from '../utils/notifications';

async function testNotificationSystem() {
    console.log('🔔 Starting Notification System Test\n');

    try {
        // Get test users
        const usersResult = await pool.query(
            'SELECT id, username, full_name FROM users ORDER BY id LIMIT 3'
        );

        if (usersResult.rows.length < 2) {
            console.error('❌ Need at least 2 users to test notifications');
            return;
        }

        const [user1, user2, user3] = usersResult.rows;
        console.log(`📝 Test Users:`);
        console.log(`   User 1: ${user1.username} (ID: ${user1.id}) - ${user1.full_name}`);
        console.log(`   User 2: ${user2.username} (ID: ${user2.id}) - ${user2.full_name}`);
        if (user3) {
            console.log(`   User 3: ${user3.username} (ID: ${user3.id}) - ${user3.full_name}\n`);
        } else {
            console.log('');
        }

        // Get a recommendation
        const recResult = await pool.query(
            'SELECT id, title, user_id FROM recommendations WHERE status = $1 LIMIT 1',
            ['active']
        );

        if (recResult.rows.length === 0) {
            console.error('❌ No active recommendations found');
            return;
        }

        const recommendation = recResult.rows[0];
        console.log(`📍 Test Recommendation: "${recommendation.title}" (ID: ${recommendation.id})`);
        console.log(`   Owner: User ID ${recommendation.user_id}\n`);

        // Test 1: Like Notification
        console.log('🧪 Test 1: Like Notification');
        console.log(`   ${user1.username} likes ${user2.username}'s recommendation`);
        
        try {
            await notifyRecommendationLike(
                user1.id,
                recommendation.user_id,
                user1.full_name,
                user1.username,
                recommendation.id,
                recommendation.title
            );
            console.log('   ✅ Like notification created\n');
        } catch (error: any) {
            console.log(`   ❌ Failed: ${error.message}\n`);
        }

        // Test 2: Rating Notification
        console.log('🧪 Test 2: Rating Notification');
        console.log(`   ${user1.username} rates ${user2.username}'s recommendation 5 stars`);
        
        try {
            await notifyRecommendationRating(
                user1.id,
                recommendation.user_id,
                user1.full_name,
                user1.username,
                recommendation.id,
                recommendation.title,
                5
            );
            console.log('   ✅ Rating notification created\n');
        } catch (error: any) {
            console.log(`   ❌ Failed: ${error.message}\n`);
        }

        // Test 3: Buddy Request Notification
        console.log('🧪 Test 3: Buddy Request Notification');
        console.log(`   ${user1.username} sends buddy request to ${user2.username}`);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Create dummy buddy request
            const requestResult = await client.query(
                `INSERT INTO travel_buddy_connections (requester_id, requested_id, status, request_message)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [user1.id, user2.id, 'pending', 'Hey! Let\'s connect as travel buddies!']
            );

            const requestId = requestResult.rows[0].id;

            await notifyBuddyRequest(
                client,
                user1.id,
                user2.id,
                user1.full_name,
                user1.username,
                requestId
            );

            await client.query('COMMIT');
            console.log('   ✅ Buddy request notification created\n');
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.log(`   ❌ Failed: ${error.message}\n`);
        } finally {
            client.release();
        }

        // Test 4: Buddy Accepted Notification
        if (user3) {
            console.log('🧪 Test 4: Buddy Accepted Notification');
            console.log(`   ${user2.username} accepts ${user3.username}'s buddy request`);
            
            const client2 = await pool.connect();
            try {
                await client2.query('BEGIN');
                
                // Create and accept buddy request
                const requestResult2 = await client2.query(
                    `INSERT INTO travel_buddy_connections (requester_id, requested_id, status, request_message)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id`,
                    [user3.id, user2.id, 'accepted', 'Let\'s travel together!']
                );

                const requestId2 = requestResult2.rows[0].id;

                await notifyBuddyAccepted(
                    client2,
                    user2.id,
                    user3.id,
                    user2.full_name,
                    user2.username,
                    requestId2
                );

                await client2.query('COMMIT');
                console.log('   ✅ Buddy accepted notification created\n');
            } catch (error: any) {
                await client2.query('ROLLBACK');
                console.log(`   ❌ Failed: ${error.message}\n`);
            } finally {
                client2.release();
            }
        }

        // Verify notifications were created
        console.log('📊 Verification: Checking Created Notifications\n');
        
        const notificationResult = await pool.query(
            `SELECT 
                n.id,
                n.user_id,
                u.username as recipient,
                n.title,
                n.message,
                n.notification_type,
                n.is_read,
                ru.username as from_user,
                n.created_at
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            LEFT JOIN users ru ON n.related_user_id = ru.id
            ORDER BY n.created_at DESC
            LIMIT 10`
        );

        console.log(`Found ${notificationResult.rows.length} recent notifications:`);
        notificationResult.rows.forEach((notif, index) => {
            console.log(`\n${index + 1}. ${notif.notification_type.toUpperCase()}`);
            console.log(`   To: ${notif.recipient} (User ID: ${notif.user_id})`);
            if (notif.from_user) {
                console.log(`   From: ${notif.from_user}`);
            }
            console.log(`   Title: ${notif.title}`);
            console.log(`   Message: ${notif.message}`);
            console.log(`   Read: ${notif.is_read ? '✓' : '✗'}`);
            console.log(`   Created: ${new Date(notif.created_at).toLocaleString()}`);
        });

        console.log('\n✅ Notification System Test Complete!\n');

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Run the test
testNotificationSystem().catch(console.error);
