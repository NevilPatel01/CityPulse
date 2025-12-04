import { createServer } from 'http';
import { createApp } from './app';
import { testConnection } from './lib/database';
import { setupNotificationSocket } from './websocket/notificationSocket';


const app = createApp();
const PORT = process.env.PORT || 5000;

// Create HTTP server for both Express and Socket.IO
const httpServer = createServer(app);

// Test database connection on startup and then start server
testConnection()
    .then(() => {
        
        // Setup WebSocket for notifications
        setupNotificationSocket(httpServer);
        
        httpServer.listen(PORT, () => {
            const apiOrigin = (process.env.API_BASE_URL || process.env.BACKEND_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
        });
    })
    .catch((error) => {
        console.error('❌ [SERVER] Failed to start server due to database connection error:', error);
        process.exit(1);
    });
