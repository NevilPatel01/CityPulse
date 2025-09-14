-- =====================================================
-- CityPulse Database Schema
-- =====================================================

-- CREATE DATABASE citypulse;

-- Users table - Main authentication and user data added all fields edit later if anything missing
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- null for Google login by default
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    current_location VARCHAR(100),
    hometown VARCHAR(100),
    phone VARCHAR(20),
    is_google_user BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(100) UNIQUE,
    role VARCHAR(20) DEFAULT 'user', -- user, moderator
    account_status VARCHAR(20) DEFAULT 'active', -- active, suspended, banned, deactivated
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
