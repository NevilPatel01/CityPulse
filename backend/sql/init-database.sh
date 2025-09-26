#!/bin/bash

# CityPulse Database Initialization Script to start PostgreSQL in Docker and then set up the database schema and initial data.

set -e

echo "🚀 Starting CityPulse Database Initialization..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -p 5432 -U user; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist
echo "📋 Creating database if it doesn't exist..."
psql -h localhost -p 5432 -U user -d postgres -c "CREATE DATABASE citypulse_dev;" 2>/dev/null || echo "Database citypulse_dev already exists"

# Connect to the database and run schema
echo "🏗️  Running database schema..."
psql -h localhost -p 5432 -U user -d citypulse_dev -f /docker-entrypoint-initdb.d/01-schema.sql

# Verify tables were created
echo "🔍 Verifying database setup..."
TABLE_COUNT=$(psql -h localhost -p 5432 -U user -d citypulse_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "📊 Created $TABLE_COUNT tables"

# Check essential tables
echo "✅ Checking essential tables..."
psql -h localhost -p 5432 -U user -d citypulse_dev -c "
SELECT 
    CASE WHEN COUNT(*) >= 20 THEN '✅ All essential tables created' 
            ELSE '❌ Missing tables: ' || (20 - COUNT(*)) || ' tables missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'user_profiles', 'password_reset_tokens', 'travel_preferences',
    'interest_categories', 'user_interests', 'cities', 'user_city_visits',
    'recommendation_categories', 'recommendations', 'recommendation_cities',
    'recommendation_tags', 'recommendation_tag_links', 'recommendation_photos',
    'recommendation_ratings', 'recommendation_likes', 'user_favorites',
    'travel_buddy_connections', 'trips', 'trip_cities', 'trip_companions',
    'trip_itinerary', 'achievements', 'user_achievements', 'search_history',
    'saved_searches', 'notifications', 'moderator_actions', 'user_warnings',
    'content_reports'
);
"

# Check initial data
echo "📋 Checking initial data..."
ACHIEVEMENT_COUNT=$(psql -h localhost -p 5432 -U user -d citypulse_dev -t -c "SELECT COUNT(*) FROM achievements;")
INTEREST_COUNT=$(psql -h localhost -p 5432 -U user -d citypulse_dev -t -c "SELECT COUNT(*) FROM interest_categories;")
RECOMMENDATION_CATEGORY_COUNT=$(psql -h localhost -p 5432 -U user -d citypulse_dev -t -c "SELECT COUNT(*) FROM recommendation_categories;")

echo "📊 Initial data loaded:"
echo "   - Achievements: $ACHIEVEMENT_COUNT"
echo "   - Interest Categories: $INTEREST_COUNT"
echo "   - Recommendation Categories: $RECOMMENDATION_CATEGORY_COUNT"

echo "🎉 Database initialization completed successfully!"
echo "🌐 Database is ready for CityPulse application"
