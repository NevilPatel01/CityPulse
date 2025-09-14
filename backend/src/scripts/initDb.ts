import fs from 'fs';
import path from 'path';
import { query } from '../lib/database';

const initializeDatabase = async (): Promise<void> => {
    try {
        console.log('🚀 Initializing database schema...');

        // Read the schema SQL file
        const schemaPath = path.join(process.cwd(), 'sql/schema.sql');
        console.log('📂 Reading schema from:', schemaPath);

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split the SQL into individual statements and filter out comments and empty lines
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await query(statement);
                    console.log('✅ Executed:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
                } catch (error: any) {
                    // Skip if table already exists
                    if (error.code === '42P07') {
                        console.log('⚠️  Table already exists, skipping:', statement.substring(0, 50).replace(/\n/g, ' ') + '...');
                    } else {
                        throw error;
                    }
                }
            }
        }

        console.log('🎉 Database schema initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default initializeDatabase;