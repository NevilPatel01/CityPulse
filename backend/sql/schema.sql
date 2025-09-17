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

-- =====================================================
-- Password Reset Tokens Table
-- =====================================================

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
);

-- Indexes for performance
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_security_code ON password_reset_tokens(security_code);
CREATE INDEX idx_password_reset_tokens_reset_token ON password_reset_tokens(reset_token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
