import { createApp } from './app';
import { testConnection } from './lib/database';

console.log('🚀 [SERVER] Starting CityPulse Backend Server...');
console.log('🔧 [SERVER] Node.js version:', process.version);
console.log('🔧 [SERVER] Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 [SERVER] Database URL:', process.env.DATABASE_URL ? '***configured***' : '❌ NOT SET');
console.log('🔧 [SERVER] JWT Secret:', process.env.JWT_SECRET ? '***configured***' : '❌ NOT SET');
console.log('🔧 [SERVER] Frontend URL:', process.env.FRONTEND_URL || 'NOT SET');

const app = createApp();
const PORT = process.env.PORT || 5000;

// Test database connection on startup and then start server
testConnection()
    .then(() => {
        console.log('✅ [SERVER] Database connection successful, starting HTTP server...');
        
        app.listen(PORT, () => {
            console.log(`🚀 CityPulse API server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            const apiOrigin = (process.env.API_BASE_URL || process.env.BACKEND_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
            console.log(`🌐 Health check: ${apiOrigin}/api/health`);
            console.log(`🔗 API Base: ${apiOrigin}/api`);
            console.log('✅ [SERVER] Server startup complete!');
        });
    })
    .catch((error) => {
        console.error('❌ [SERVER] Failed to start server due to database connection error:', error);
        process.exit(1);
    });
