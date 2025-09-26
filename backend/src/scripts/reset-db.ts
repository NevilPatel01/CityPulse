import { query } from '../lib/database';

/**
 * Reset Database Script
 * This script drops and recreates the database schema
 * WARNING: This will delete all data!
 */
export async function resetDatabase(): Promise<void> {
    console.log('⚠️  WARNING: This will delete all data in the database!');
    console.log('🔄 Starting database reset...');
    
    try {
        // Drop existing tables in reverse order of dependencies
        console.log('🗑️  Dropping existing tables...');
        
        await query('DROP TABLE IF EXISTS user_profiles CASCADE');
        await query('DROP TABLE IF EXISTS password_reset_tokens CASCADE');
        await query('DROP TABLE IF EXISTS users CASCADE');
        
        // Drop functions and triggers
        await query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
        
        console.log('✅ Existing tables dropped');
        
        // Recreate the schema
        console.log('🏗️  Creating new schema...');
        
        // Users table
        await query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                full_name VARCHAR(100) NOT NULL,
                bio TEXT,
                current_location VARCHAR(100),
                hometown VARCHAR(100),
                phone VARCHAR(20),
                is_google_user BOOLEAN DEFAULT FALSE,
                google_id VARCHAR(100) UNIQUE,
                role VARCHAR(20) DEFAULT 'user',
                account_status VARCHAR(20) DEFAULT 'active',
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_login TIMESTAMP WITH TIME ZONE
            )
        `);
        
        // Password reset tokens table
        await query(`
            CREATE TABLE password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                security_code VARCHAR(6) NOT NULL,
                reset_token VARCHAR(64) NOT NULL UNIQUE,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                used_at TIMESTAMP WITH TIME ZONE
            )
        `);
        
        // User profiles table
        await query(`
            CREATE TABLE user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                profile_photo_url VARCHAR(255),
                cover_photo_url VARCHAR(255),
                instagram_url VARCHAR(255),
                facebook_url VARCHAR(255),
                whatsapp_contact VARCHAR(50),
                profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
                location_sharing BOOLEAN DEFAULT TRUE,
                social_links_visible BOOLEAN DEFAULT TRUE,
                travel_buddy_requests_enabled BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        
        // Create indexes
        console.log('📋 Creating indexes...');
        await query('CREATE INDEX idx_users_email ON users(email)');
        await query('CREATE INDEX idx_users_username ON users(username)');
        await query('CREATE INDEX idx_users_google_id ON users(google_id)');
        await query('CREATE INDEX idx_users_created_at ON users(created_at)');
        
        await query('CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)');
        await query('CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email)');
        await query('CREATE INDEX idx_password_reset_tokens_security_code ON password_reset_tokens(security_code)');
        await query('CREATE INDEX idx_password_reset_tokens_reset_token ON password_reset_tokens(reset_token)');
        await query('CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)');
        
        await query('CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id)');
        await query('CREATE INDEX idx_user_profiles_visibility ON user_profiles(profile_visibility)');
        await query('CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at)');
        
        // Create functions and triggers
        console.log('⚙️  Creating functions and triggers...');
        await query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);
        
        await query(`
            CREATE TRIGGER update_users_updated_at 
                BEFORE UPDATE ON users 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column()
        `);
        
        await query(`
            CREATE TRIGGER update_user_profiles_updated_at 
                BEFORE UPDATE ON user_profiles 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column()
        `);
        
        console.log('✅ Database reset completed successfully!');
        console.log('🎉 Database is ready for use');
        
    } catch (error: any) {
        console.error('❌ Database reset failed:', error);
        throw error;
    }
}

// Run reset if this script is executed directly
if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log('Database reset completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database reset failed:', error);
            process.exit(1);
        });
}
