import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';

export const createApp = (): express.Express => {
    const app = express();

    // Security middleware - I am using Helmet to adds security headers to prevent common attacks like XSS
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],           // Only load resources from same origin
                styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI frameworks
                scriptSrc: ["'self'"],           // Only scripts from same origin
                imgSrc: ["'self'", "data:", "https:"], // Images from self, data URLs, and HTTPS
            },
        },
        crossOriginEmbedderPolicy: false       // for Production need to enable
    }));

    // Added CORS configuration - Enables cross-origin requests from frontend
    // Credentials true allows cookies/auth headers, origin restricts to frontend URL
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL from env or dev default
        credentials: true,                 
        optionsSuccessStatus: 200       
    }));

    // Body parsing middleware - It handles incoming request data parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cookieParser());

    // Health check endpoint - It provides server status for monitoring/testing
    // It returns JSON with server status, message, timestamp, and environment info
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'OK',
            message: 'CityPulse API is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });

    // Authentication routes - it has all auth endpoints are under /api/auth
    // It handles registration for new users, login, logout, profile, password change operations
    app.use('/api/auth', authRoutes);

    // Global error handler - it catches all unhandled errors and formats responses
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('Global error handler:', err);

        //  It handles Prisma database constraint errors
        if (err.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'A record with this information already exists'
            });
        }

        //  It handles validation errors from Zod or other validation libraries
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: err.errors
            });
        }

        // Default error response - it handles all other unexpected errors
        res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Internal server error'
        });
    });

    // 404 Handler - it catches all undefined routes and returns JSON error
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });

    return app;
};
