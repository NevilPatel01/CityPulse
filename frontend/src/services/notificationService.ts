import { apiRequest, buildApiUrl } from '../config/api';

export interface Notification {
    id: number;
    title: string;
    message: string;
    notification_type: 'buddy_request' | 'buddy_accepted' | 'buddy_declined' | 'recommendation_like' | 'recommendation_comment' | 'recommendation_rating' | 'trip_invite' | 'achievement_unlocked' | 'system';
    related_id?: number;
    related_user_id?: number;
    related_user_username?: string;
    related_user_name?: string;
    related_user_photo?: string;
    action_url?: string;
    is_read: boolean;
    created_at: string;
    read_at?: string;
}

export interface NotificationsResponse {
    success: boolean;
    data: {
        notifications: Notification[];
        unreadCount: number;
        total: number;
    };
}

export interface UnreadCountResponse {
    success: boolean;
    data: {
        unreadCount: number;
    };
}

// Get all notifications
export const getNotifications = async (limit = 50, offset = 0, unreadOnly = false): Promise<NotificationsResponse> => {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        unreadOnly: unreadOnly.toString()
    });

    return await apiRequest(buildApiUrl(`api/notifications?${params.toString()}`), {
        method: 'GET'
    });
};

// Get unread notification count
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
    return await apiRequest(buildApiUrl('api/notifications/unread-count'), {
        method: 'GET'
    });
};

// Mark notification as read
export const markAsRead = async (notificationId: number) => {
    return await apiRequest(buildApiUrl(`api/notifications/${notificationId}/read`), {
        method: 'PATCH'
    });
};

// Mark all notifications as read
export const markAllAsRead = async () => {
    return await apiRequest(buildApiUrl('api/notifications/read-all'), {
        method: 'PATCH'
    });
};

// Delete notification
export const deleteNotification = async (notificationId: number) => {
    return await apiRequest(buildApiUrl(`api/notifications/${notificationId}`), {
        method: 'DELETE'
    });
};

// Delete all read notifications
export const deleteAllRead = async () => {
    return await apiRequest(buildApiUrl('api/notifications/read/all'), {
        method: 'DELETE'
    });
};
