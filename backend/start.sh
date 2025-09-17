# This script I created to start the backend server with a single command.

#!/bin/sh
echo "🚀 Starting CityPulse Backend..."
echo "⏳ Waiting for database to be ready..."
sleep 5
echo "📊 Initializing database schema..."
if ! pnpm run db:init 2>/dev/null; then
  echo "⚠️  Database already initialized or error occurred"
fi
echo "🚀 Starting development server..."
pnpm run dev