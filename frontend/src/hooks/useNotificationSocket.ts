import { useEffect, useRef, useCallback, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

interface NotificationSocketOptions {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onNotification?: (notification: Record<string, unknown>) => void;
    onError?: (error: Error) => void;
}

/**
 * Hook to manage WebSocket connection for real-time notifications
 * Automatically connects/disconnects based on auth state
 * Handles reconnection and error recovery
 */
export function useNotificationSocket(options: NotificationSocketOptions = {}) {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const socketRef = useRef<Socket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { onConnect, onDisconnect, onNotification, onError } = options;

    const connect = useCallback(() => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token || !user || socketRef.current?.connected) {
            return;
        }


        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            timeout: 10000
        });

        socket.on('connect', () => {
            onConnect?.();
        });

        socket.on('connected', () => {
            // Connection confirmed by server
        });

        socket.on('notification', (notification) => {
            onNotification?.(notification);

            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/logo.png',
                    badge: '/badge.png',
                    tag: `notification-${notification.id}`,
                    data: { 
                        url: notification.action_url,
                        notificationId: notification.id
                    }
                });
            }
        });

        socket.on('disconnect', (reason) => {
            onDisconnect?.();

            // Auto-reconnect if disconnected unexpectedly
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect after delay
                reconnectTimeoutRef.current = setTimeout(() => {
                    socket.connect();
                }, 2000);
            }
        });

        socket.on('connect_error', (error) => {
            console.error('🔴 Connection error:', error.message);
            onError?.(error);
        });

        socket.on('error', (error) => {
            console.error('🔴 Socket error:', error);
            onError?.(error);
        });

        socketRef.current = socket;
    }, [user, onConnect, onDisconnect, onNotification, onError]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    // Connect when auth state changes
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (token && user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [user, connect, disconnect]);

    return {
        socket: socketRef.current,
        isConnected: socketRef.current?.connected || false,
        reconnect: connect,
        disconnect
    };
}

/**
 * Request browser notification permission
 * Should be called after user interaction (e.g., button click)
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('Notification permission denied');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}
