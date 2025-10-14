#!/bin/bash

# CityPulse Database Initialization Script - Final verification step

set -e

echo "🚀 Starting CityPulse Database Verification..."

# Verify tables were created
echo "🔍 Verifying database setup..."
TABLE_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

echo "📊 Created $TABLE_COUNT tables"

# Check initial data
echo "📋 Checking initial data..."
ACHIEVEMENT_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM achievements;" | tr -d ' ')
INTEREST_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM interest_categories;" | tr -d ' ')
RECOMMENDATION_CATEGORY_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM recommendation_categories;" | tr -d ' ')

echo "📊 Initial data loaded:"
echo "   - Achievements: $ACHIEVEMENT_COUNT"
echo "   - Interest Categories: $INTEREST_COUNT" 
echo "   - Recommendation Categories: $RECOMMENDATION_CATEGORY_COUNT"

echo "🎉 Database initialization completed successfully!"
echo "🌐 Database is ready for CityPulse application"
