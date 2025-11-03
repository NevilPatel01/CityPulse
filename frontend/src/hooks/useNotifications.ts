import { useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';
import type { Notification } from '../services/notificationService';
import { useAuth } from './useAuth';
import { useNotificationSocket } from './useNotificationSocket';

const POLL_INTERVAL = 30000; // 30 seconds (fallback when WebSocket disconnects)

export const useNotifications = () => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const pollIntervalRef = useRef<number | null>(null);

    // Handle incoming WebSocket notifications
    const handleNewNotification = useCallback((notification: Record<string, unknown>) => {
        // Convert WebSocket notification to our Notification type
        const formattedNotification: Notification = {
            id: notification.id as number,
            title: notification.title as string,
            message: notification.message as string,
            notification_type: notification.notification_type as 'buddy_request' | 'buddy_accepted' | 'buddy_declined' | 'recommendation_like' | 'recommendation_comment' | 'recommendation_rating' | 'trip_invite' | 'achievement_unlocked' | 'system',
            related_id: notification.related_id as number | undefined,
            related_user_id: notification.related_user_id as number | undefined,
            action_url: notification.action_url as string | undefined,
            is_read: false,
            created_at: notification.created_at as string,
            read_at: undefined,
            related_user_username: notification.related_user_username as string | undefined,
            related_user_name: notification.related_user_name as string | undefined,
            related_user_photo: notification.related_user_photo as string | undefined
        };
        
        // Add to notifications list
        setNotifications(prev => [formattedNotification, ...prev]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Play notification sound (optional)
        try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Ignore autoplay errors
            });
        } catch {
            // Ignore audio errors
        }
    }, []);

    // Setup WebSocket connection
    useNotificationSocket({
        onConnect: () => {
            console.log('✅ WebSocket connected - real-time notifications enabled');
            // Stop polling when socket connects
            stopPolling();
        },
        onDisconnect: () => {
            console.log('❌ WebSocket disconnected - falling back to polling');
            // Resume polling when socket disconnects
            if (isAuthenticated) {
                startPolling();
            }
        },
        onNotification: handleNewNotification,
        onError: (err) => {
            console.error('WebSocket error:', err);
            setError(err.message);
        }
    });

    // Fetch notifications
    const fetchNotifications = useCallback(async (silent = false) => {
        if (!isAuthenticated) return;

        try {
            if (!silent) setIsLoading(true);
            setError(null);

            const response = await getNotifications(50, 0, false);
            if (response.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
            if (!silent) setError(errorMessage);
            console.error('Fetch notifications error:', err);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch unread count only (lighter operation for polling)
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await getUnreadCount();
            if (response.success) {
                setUnreadCount(response.data.unreadCount);
            }
        } catch (err) {
            console.error('Fetch unread count error:', err);
        }
    }, [isAuthenticated]);

    // Mark notification as read
    const markNotificationAsRead = useCallback(async (notificationId: number) => {
        try {
            await markAsRead(notificationId);
            
            // Update local state
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                        : notif
                )
            );
            
            // Decrease unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Mark as read error:', err);
            throw err;
        }
    }, []);

    // Mark all notifications as read
    const markAllNotificationsAsRead = useCallback(async () => {
        try {
            await markAllAsRead();
            
            // Update local state
            setNotifications(prev => 
                prev.map(notif => ({
                    ...notif,
                    is_read: true,
                    read_at: new Date().toISOString()
                }))
            );
            
            setUnreadCount(0);
        } catch (err) {
            console.error('Mark all as read error:', err);
            throw err;
        }
    }, []);

    // Start polling for notifications
    const startPolling = useCallback(() => {
        if (!isAuthenticated) return;

        // Clear existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        // Fetch immediately
        fetchUnreadCount();

        // Set up polling interval
        pollIntervalRef.current = setInterval(() => {
            fetchUnreadCount();
        }, POLL_INTERVAL);
    }, [isAuthenticated, fetchUnreadCount]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    // Start polling when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            startPolling();
        } else {
            stopPolling();
            setNotifications([]);
            setUnreadCount(0);
        }

        return () => stopPolling();
    }, [isAuthenticated, startPolling, stopPolling]);

    // Pause polling when tab is not visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else if (isAuthenticated) {
                startPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isAuthenticated, startPolling, stopPolling]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        refresh: () => fetchNotifications(true),
        isWebSocketEnabled: true // WebSocket is now integrated
    };
};

// Export helper for requesting browser notification permission
export { requestNotificationPermission } from './useNotificationSocket';
