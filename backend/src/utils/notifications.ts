import { PoolClient } from 'pg';
import pool from '../lib/database';
import { getNotificationSocket } from '../websocket/notificationSocket';

interface NotificationData {
    userId: number;
    title: string;
    message: string;
    type?: 'buddy_request' | 'buddy_accepted' | 'buddy_declined' | 'recommendation_like' | 'recommendation_comment' | 'recommendation_rating' | 'trip_invite' | 'trip_accepted' | 'trip_removed' | 'achievement_unlocked' | 'system';
    notificationType?: 'buddy_request' | 'buddy_accepted' | 'buddy_declined' | 'recommendation_like' | 'recommendation_comment' | 'recommendation_rating' | 'trip_invite' | 'trip_accepted' | 'trip_removed' | 'achievement_unlocked' | 'system';
    relatedId?: number;
    relatedUserId?: number;
    actionUrl?: string;
}

// Create a notification
export const createNotification = async (
    client: PoolClient,
    data: NotificationData
): Promise<void> => {
    try {
        const notifType = data.type || data.notificationType || 'system';
        const result = await client.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, related_id, related_user_id, action_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                data.userId,
                data.title,
                data.message,
                notifType,
                data.relatedId || null,
                data.relatedUserId || null,
                data.actionUrl || null
            ]
        );

        // Emit via WebSocket for instant delivery
        const socketManager = getNotificationSocket();
        if (socketManager && result.rows[0]) {
            // Fetch related user info for notification
            const userResult = await client.query(
                'SELECT username, full_name FROM users WHERE id = $1',
                [data.relatedUserId]
            );
            
            const notification = {
                ...result.rows[0],
                related_user_username: userResult.rows[0]?.username,
                related_user_name: userResult.rows[0]?.full_name
            };
            
            socketManager.notifyUser(data.userId, notification);
        }
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

// Create a notification without transaction (standalone)
export const createStandaloneNotification = async (
    data: NotificationData
): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await createNotification(client, data);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create standalone notification error:', error);
    } finally {
        client.release();
    }
};

// Helper to create buddy request notification
export const notifyBuddyRequest = async (
    client: PoolClient,
    requesterId: number,
    targetUserId: number,
    requesterName: string,
    requesterUsername: string,
    requestId: number
): Promise<void> => {
    await createNotification(client, {
        userId: targetUserId,
        title: 'New Buddy Request',
        message: `${requesterName} (@${requesterUsername}) sent you a buddy request`,
        notificationType: 'buddy_request',
        relatedId: requestId,
        relatedUserId: requesterId,
        actionUrl: '/buddies'
    });
};

// Helper to create buddy accepted notification
export const notifyBuddyAccepted = async (
    client: PoolClient,
    accepterId: number,
    requesterId: number,
    accepterName: string,
    accepterUsername: string,
    requestId: number
): Promise<void> => {
    await createNotification(client, {
        userId: requesterId,
        title: 'Buddy Request Accepted',
        message: `${accepterName} (@${accepterUsername}) accepted your buddy request`,
        notificationType: 'buddy_accepted',
        relatedId: requestId,
        relatedUserId: accepterId,
        actionUrl: '/buddies'
    });
};

// Helper to create recommendation like notification
export const notifyRecommendationLike = async (
    likerId: number,
    recommendationOwnerId: number,
    likerName: string,
    likerUsername: string,
    recommendationId: number,
    recommendationTitle: string
): Promise<void> => {
    // Don't notify if user likes their own recommendation
    if (likerId === recommendationOwnerId) {
        return;
    }

    await createStandaloneNotification({
        userId: recommendationOwnerId,
        title: 'New Like',
        message: `${likerName} (@${likerUsername}) liked your recommendation "${recommendationTitle}"`,
        notificationType: 'recommendation_like',
        relatedId: recommendationId,
        relatedUserId: likerId,
        actionUrl: `/recommendations/${recommendationId}`
    });
};

// Helper to create recommendation rating notification
export const notifyRecommendationRating = async (
    raterId: number,
    recommendationOwnerId: number,
    raterName: string,
    raterUsername: string,
    recommendationId: number,
    recommendationTitle: string,
    rating: number
): Promise<void> => {
    // Don't notify if user rates their own recommendation
    if (raterId === recommendationOwnerId) {
        return;
    }

    await createStandaloneNotification({
        userId: recommendationOwnerId,
        title: 'New Rating',
        message: `${raterName} (@${raterUsername}) gave your recommendation "${recommendationTitle}" ${rating} stars`,
        notificationType: 'recommendation_rating',
        relatedId: recommendationId,
        relatedUserId: raterId,
        actionUrl: `/recommendations/${recommendationId}`
    });
};

// Helper to create achievement unlocked notification
export const notifyAchievementUnlocked = async (
    userId: number,
    achievementName: string,
    achievementDescription: string
): Promise<void> => {
    await createStandaloneNotification({
        userId,
        title: 'Achievement Unlocked',
        message: `You've unlocked the "${achievementName}" achievement! ${achievementDescription}`,
        notificationType: 'achievement_unlocked',
        actionUrl: '/profile'
    });
};
