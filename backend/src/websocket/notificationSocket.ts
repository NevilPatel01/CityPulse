import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: number;
    email: string;
}

interface AuthenticatedSocket extends Socket {
    userId?: number;
}

class NotificationSocketManager {
    private io: Server;
    private userSockets: Map<number, string[]> = new Map(); // userId -> socketIds (multiple tabs)

    constructor(httpServer: HTTPServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            },
            // Optimize for lower latency
            pingInterval: 10000,
            pingTimeout: 5000,
            transports: ['websocket', 'polling']
        });

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware() {
        // Authentication middleware
        this.io.use((socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth.token;
                
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
                socket.userId = decoded.userId;
                
                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            const userId = socket.userId!;
            
            // Track user socket connections (multiple tabs support)
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId)!.push(socket.id);


            // Join user's personal room
            socket.join(`user-${userId}`);

            // Handle disconnect
            socket.on('disconnect', () => {
                const sockets = this.userSockets.get(userId);
                if (sockets) {
                    const index = sockets.indexOf(socket.id);
                    if (index > -1) {
                        sockets.splice(index, 1);
                    }
                    if (sockets.length === 0) {
                        this.userSockets.delete(userId);
                    } else {
                    }
                }
            });

            // Send connection confirmation
            socket.emit('connected', { 
                userId,
                socketId: socket.id,
                message: 'Connected to notification server' 
            });
        });
    }

    // Emit notification to specific user (all their connected tabs)
    public notifyUser(userId: number, notification: any) {
        const sockets = this.userSockets.get(userId);
        if (sockets && sockets.length > 0) {
            this.io.to(`user-${userId}`).emit('notification', notification);
            return true;
        }
        return false;
    }

    // Emit to multiple users (e.g., all buddies)
    public notifyUsers(userIds: number[], notification: any) {
        userIds.forEach(userId => this.notifyUser(userId, notification));
    }

    // Get connected users count
    public getConnectedUsersCount(): number {
        return this.userSockets.size;
    }

    // Check if user is online
    public isUserOnline(userId: number): boolean {
        return this.userSockets.has(userId);
    }

    // Get user's connection count (number of tabs)
    public getUserConnectionCount(userId: number): number {
        return this.userSockets.get(userId)?.length || 0;
    }

    // Get server instance for other modules
    public getIO(): Server {
        return this.io;
    }
}

let notificationSocketManager: NotificationSocketManager | null = null;

export function setupNotificationSocket(httpServer: HTTPServer): NotificationSocketManager {
    if (!notificationSocketManager) {
        notificationSocketManager = new NotificationSocketManager(httpServer);
    }
    return notificationSocketManager;
}

export function getNotificationSocket(): NotificationSocketManager | null {
    return notificationSocketManager;
}

export { NotificationSocketManager };
