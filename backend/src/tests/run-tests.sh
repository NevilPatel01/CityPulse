#!/bin/bash

# Profile End-to-End Test Runner
echo "🧪 Running Profile End-to-End Tests..."

# Set environment variables for testing
export NODE_ENV=test
export DATABASE_URL=postgresql://user:password@localhost:5433/citypulse_test
export JWT_SECRET=test-secret-key
export JWT_EXPIRES_IN=1h
export REFRESH_TOKEN_EXPIRES_IN=7d
export FRONTEND_URL=http://localhost:3001
export API_BASE_URL=http://localhost:5001

# Install test dependencies
echo "📦 Installing test dependencies..."
npm install --save-dev jest supertest @types/supertest

# Run database setup
echo "🗄️ Setting up test database..."
npm run db:setup:test

# Run the tests
echo "🚀 Running profile tests..."
npm test -- --testPathPattern=profile.e2e.test.ts

# Cleanup
echo "🧹 Cleaning up test data..."
npm run db:cleanup:test

echo "✅ Profile tests completed!"
