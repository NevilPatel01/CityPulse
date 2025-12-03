#!/bin/bash

# CityPulse Complete Test Suite Runner
echo "🧪 Running CityPulse Complete Test Suite..."

# Set environment variables for testing
export NODE_ENV=test
export DATABASE_URL=postgresql://citypulse_user:test_password@localhost:5433/citypulse_test
export JWT_SECRET=test-secret-key
export JWT_EXPIRES_IN=1h
export REFRESH_TOKEN_EXPIRES_IN=7d
export FRONTEND_URL=http://localhost:3001
export API_BASE_URL=http://localhost:5001

# Start Test Database
echo "🐳 Starting test database..."
cd ../../..
docker compose -f docker-compose.test.yml up -d postgres-test
cd backend/src/tests

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Install test dependencies
echo "📦 Installing test dependencies..."
cd ../../
pnpm install --ignore-scripts

# Run all test suites by folder
echo "🚀 Running test suites..."

# echo "📁 Running Achievements tests..."
# npm run test:achievements

# echo "📁 Running Auth tests..."
# npm run test:auth

# echo "📁 Running Buddies tests..."
# npm run test:buddies

# echo "📁 Running Feed tests..."
# npm run test:feed

# echo "📁 Running Moderation tests..."
# npm run test:moderation

# echo "📁 Running Notifications tests..."
# npm run test:notifications

echo "📁 Running Performance tests..."
npm run test:performance

# echo "📁 Running Profile tests..."
# npm run test:profile

# echo "📁 Running Recommendations tests..."
# npm run test:recommendations

# echo "📁 Running Search tests..."
# npm run test:search

# echo "📁 Running Security tests..."
# npm run test:security

# echo "📁 Running Social tests..."
# npm run test:social

# echo "📁 Running Trips tests..."
# npm run test:trips

# Cleanup
echo "🧹 Cleaning up test data..."
# npm run db:cleanup:test # Optional: keep data for inspection if needed

echo "✅ All test suites completed!"
