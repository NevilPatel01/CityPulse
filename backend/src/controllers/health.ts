import { Request, Response } from 'express';
import { query } from '../lib/database';

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
    try {
        // Test database connection
        const result = await query('SELECT NOW() as current_time');
        
        res.json({
            success: true,
            message: 'Server is healthy',
            data: {
                timestamp: new Date().toISOString(),
                database: {
                    connected: true,
                    currentTime: result.rows[0]?.current_time
                }
            }
        });
    } catch (error: any) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server health check failed',
            error: {
                message: error.message,
                code: error.code,
                detail: error.detail
            }
        });
    }
};

// Database schema check endpoint
export const schemaCheck = async (req: Request, res: Response) => {
    try {
        // Check if required tables exist
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'user_profiles')
            ORDER BY table_name
        `);
        
        const existingTables = tablesResult.rows.map(row => row.table_name);
        const requiredTables = ['users', 'user_profiles'];
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        res.json({
            success: true,
            message: 'Schema check completed',
            data: {
                existingTables,
                missingTables,
                allTablesPresent: missingTables.length === 0
            }
        });
    } catch (error: any) {
        console.error('Schema check error:', error);
        res.status(500).json({
            success: false,
            message: 'Schema check failed',
            error: {
                message: error.message,
                code: error.code,
                detail: error.detail
            }
        });
    }
};
