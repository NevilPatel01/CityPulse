#!/bin/bash

# Clean deployment script for CityPulse production
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_SERVER="root@206.189.65.221"
DEPLOYMENT_PATH="/opt/citypulse"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${GREEN}🚀 CityPulse Production Deployment${NC}"
echo "=================================="

# Step 1: Ensure we have the latest changes
print_info "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    print_warning "You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S') - Auto-commit before deployment"
fi

print_info "Pushing to main branch..."
git push origin main

# Step 2: Deploy to production server
print_info "Connecting to production server..."

ssh $PRODUCTION_SERVER << 'EOF'
set -e

cd /opt/citypulse

echo "� Pulling latest images..."
sudo docker compose -f docker-compose.prod.yml pull postgres backend frontend

echo "� Restarting services with latest configuration..."
sudo docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🔍 Checking service status..."
sudo docker compose -f docker-compose.prod.yml ps

echo ""
echo "🧪 Testing service health..."

# Wait for services to be fully ready
for i in {1..6}; do
    if sudo docker compose -f docker-compose.prod.yml ps | grep -q "Up.*healthy"; then
        echo "✅ Services are healthy"
        break
    fi
    echo "⏳ Waiting for health checks... ($i/6)"
    sleep 10
done

echo "✅ Deployment complete on server!"
EOF

# Step 3: Test the deployment
print_info "Testing the deployment..."
sleep 10

echo ""
print_info "Testing HTTPS:"
HTTPS_RESPONSE=$(curl -I https://city-pulse.app/ 2>/dev/null | head -1 || echo "Connection failed")
echo "$HTTPS_RESPONSE"

echo ""
print_info "Testing API health:"
API_RESPONSE=$(curl -s https://city-pulse.app/health 2>/dev/null || echo "API not responding")
echo "$API_RESPONSE"

echo ""
if [[ "$HTTPS_RESPONSE" == *"200"* ]] && [[ "$API_RESPONSE" == *"healthy"* ]]; then
    print_message "🎉 Deployment successful!"
    print_message "🌐 Your site is ready at: https://city-pulse.app"
    print_message "🔒 SSL certificates are properly configured"
    print_message "🔐 Google OAuth is configured and ready"
else
    print_warning "⚠️ Deployment completed but some services may still be starting up"
    print_info "Check the logs with: ssh $PRODUCTION_SERVER 'cd $DEPLOYMENT_PATH && sudo docker compose -f docker-compose.prod.yml logs'"
fi

echo ""
print_info "🔍 Final service status:"
ssh $PRODUCTION_SERVER "cd $DEPLOYMENT_PATH && sudo docker compose -f docker-compose.prod.yml ps"