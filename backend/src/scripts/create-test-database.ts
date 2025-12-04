/**
 * Script to create test database
 * Run this to set up a separate test database for running tests
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const createTestDatabase = async () => {
    // Get the base database URL (without specific database name)
    const baseUrl = process.env.DATABASE_URL || '';
    
    if (!baseUrl) {
        console.error('❌ DATABASE_URL must be set');
        process.exit(1);
    }

    // Parse the connection string to get components
    const url = new URL(baseUrl);
    const dbName = url.pathname.slice(1); // Remove leading '/'
    const testDbName = 'citypulse_test';
    
    // Create base URL without database name
    url.pathname = '/postgres'; // Connect to default postgres database
    const adminUrl = url.toString();


    const adminPool = new Pool({ connectionString: adminUrl });

    try {
        // Check if test database already exists
        const checkResult = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [testDbName]
        );

        if (checkResult.rows.length > 0) {
            
            // Terminate existing connections
            await adminPool.query(`
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '${testDbName}'
                AND pid <> pg_backend_pid();
            `);
            
            await adminPool.end();
            return;
        }

        // Create test database
        await adminPool.query(`CREATE DATABASE ${testDbName}`);

        await adminPool.end();

        // Now apply schema to test database
        const testUrl = baseUrl.replace(`/${dbName}`, `/${testDbName}`);
        const testPool = new Pool({ connectionString: testUrl });

        // Read and execute schema.sql
        const schemaPath = path.resolve(__dirname, '../../sql/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf-8');
            // Split by semicolon and execute each statement
            const statements = schema
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                try {
                    await testPool.query(statement);
                } catch (err: any) {
                    // Ignore some common errors like "already exists"
                    if (!err.message.includes('already exists')) {
                        console.warn('Warning executing statement:', err.message);
                    }
                }
            }
        } else {
            console.warn('⚠️  Schema file not found at:', schemaPath);
        }

        await testPool.end();


    } catch (error: any) {
        console.error('❌ Error creating test database:', error.message);
        await adminPool.end();
        process.exit(1);
    }
};

createTestDatabase();

