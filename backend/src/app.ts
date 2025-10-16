import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import recommendationRoutes from './routes/recommendations';
import searchRoutes from './routes/search';
import { healthCheck, schemaCheck } from './controllers/health';

export const createApp = (): express.Express => {
    console.log('[APP] Creating Express application...');
    const app = express();

    console.log('[APP] Setting up security middleware (Helmet)...');
    // Security middleware - I am using Helmet to adds security headers to prevent common attacks like XSS
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],           // Only load resources from same origin
                styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI frameworks
                scriptSrc: ["'self'"],           // Only scripts from same origin
                imgSrc: (() => {
                    const sources = ["'self'", "data:", "https:"];
                    const backendUrl = process.env.API_BASE_URL ?? process.env.BACKEND_URL;
                    const frontendUrlEnv = process.env.FRONTEND_URL;

                    if (backendUrl) {
                        sources.push(backendUrl);
                    }

                    if (frontendUrlEnv) {
                        sources.push(frontendUrlEnv);
                    }

                    return sources;
                })(), // Images from self, data URLs, HTTPS, and configured domains
            },
        },
        crossOriginEmbedderPolicy: false       // for Production need to enable
    }));

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    console.log('[APP] Setting up CORS with frontend URL:', frontendUrl);
    
    // Added CORS configuration
    // Credentials true allows cookies/auth headers, origin restricts to frontend URL
    app.use(cors({
        origin: [
            frontendUrl, 
            // 'http://localhost:3000',  // Vite dev server default port
        ],
        credentials: true,                 
        optionsSuccessStatus: 200       
    }));

    console.log('[APP] Setting up body parsing middleware...');
    // Body parsing middleware - It handles incoming request data parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cookieParser());

    // Add request logging middleware
    app.use((req, res, next) => {
        console.log(`[API] ${req.method} ${req.url} - IP: ${req.ip}`);
        if (req.body && Object.keys(req.body).length > 0) {
            // Log body but hide sensitive data
            const safeBody = { ...req.body };
            if (safeBody.password) safeBody.password = '***hidden***';
            if (safeBody.accessToken) safeBody.accessToken = '***hidden***';
            console.log(`📦 [API] Request body:`, safeBody);
        }
        next();
    });

    console.log('[APP] Setting up health check endpoints...');
    // Health check endpoint - It provides server status for monitoring/testing
    app.get('/api/health', healthCheck);
    
    // Database schema check endpoint
    app.get('/api/health/schema', schemaCheck);

    console.log('[APP] Setting up authentication routes...');
    // Authentication routes - it has all auth endpoints are under /api/auth
    // It handles registration for new users, login, logout, profile, password change operations
    app.use('/api/auth', authRoutes);

    console.log('[APP] Setting up profile routes...');
    // Profile routes - handles user profile management
    app.use('/api/profile', profileRoutes);

    console.log('[APP] Setting up recommendation routes...');
    // Recommendation routes - handles recommendation CRUD operations
    app.use('/api/recommendations', recommendationRoutes);

    console.log('[APP] Setting up search routes...');
    // Search routes - handles search across recommendations, users, and cities
    app.use('/api/search', searchRoutes);

    console.log('[APP] Setting up static file serving for uploads...');
    // Serve uploaded images statically with CORS headers
    app.use('/uploads', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', frontendUrl);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        next();
    }, express.static(path.join(process.cwd(), 'uploads')));

    console.log('[APP] Setting up error handlers...');
    // Global error handler - it catches all unhandled errors and formats responses
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('[ERROR] Global error handler:', err);

        //  It handles validation errors from Zod or other validation libraries
        if (err.name === 'ValidationError') {
            console.log('[ERROR] Validation error detected');
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
        console.log(`[404] Route not found: ${req.method} ${req.url}`);
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });

    console.log('[APP] Express application setup complete!');
    return app;
};
