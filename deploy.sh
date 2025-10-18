#!/bin/bash

# CityPulse Fast CI/CD Deployment Script
# Focused on code updates and container restarts only
# SSL certificates are handled by server-setup.sh (run once)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PRODUCTION_SERVER="root@206.189.65.221"
DEPLOYMENT_PATH="/opt/citypulse"

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }

echo -e "${GREEN}🚀 CityPulse Fast Deployment${NC}"
echo "============================="

# Step 1: Push latest changes
print_info "Pushing latest changes..."
if [[ -n $(git status --porcelain) ]]; then
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || true
fi
git push origin main

# Step 2: Deploy to production
print_info "Deploying to production server..."

ssh $PRODUCTION_SERVER << 'EOF'
set -e
cd /opt/citypulse

echo "� Pulling latest code..."
git pull origin main

echo "� Stopping services..."
docker compose -f docker-compose.prod.yml down

echo "� Building images..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services..."
sleep 30

echo "🔍 Service status:"
docker compose -f docker-compose.prod.yml ps

EOF

# Step 3: Quick health check
print_info "Verifying deployment..."
sleep 10

if curl -s https://api.city-pulse.app/api/health | grep -q "healthy"; then
    print_success "🎉 Deployment successful!"
    print_info "🌐 Site: https://city-pulse.app"
    print_info "🔗 API: https://api.city-pulse.app/api/health"
else
    echo "⚠️ Services may still be starting up"
fi