import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine which database to use based on NODE_ENV
const getDatabaseUrl = (): string => {
    // For tests, use a separate test database
    if (process.env.NODE_ENV === 'test') {
        const testDbUrl = process.env.TEST_DATABASE_URL || 
            process.env.DATABASE_URL?.replace(/\/([^\/]+)$/, '/citypulse_test');
        if (!testDbUrl) {
            throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for test environment');
        }
        return testDbUrl;
    }
    
    // For development and production, use the regular database
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL must be set');
    }
    return process.env.DATABASE_URL;
};

// Database connection configuration
const pool = new Pool({
    connectionString: getDatabaseUrl(),
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased to 10 seconds to allow time for postgres to be ready
});

// Handle pool errors
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client:', err);
    process.exit(-1);
});

// Test database connection
export const testConnection = async (): Promise<void> => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected successfully at:', result.rows[0].now);
        client.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        throw err;
    }
};

// Execute a query with connection from pool
export const query = async (text: string, params?: any[]): Promise<any> => {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    } finally {
        client.release();
    }
};

// Get a client from the pool for transactions
export const getClient = async (): Promise<PoolClient> => {
    return await pool.connect();
};

// Close the pool and all its connections
export const closePool = async (): Promise<void> => {
    await pool.end();
};

export default pool;