import { createApp } from './app';
import { testConnection } from './lib/database';

const app = createApp();
const PORT = process.env.PORT || 5000;

// Test database connection on startup and then start server
testConnection()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 CityPulse API server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
        });
    })
    .catch((error) => {
        console.error('Failed to start server due to database connection error:', error);
        process.exit(1);
    });
