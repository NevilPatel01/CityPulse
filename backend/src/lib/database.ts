import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000, 
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