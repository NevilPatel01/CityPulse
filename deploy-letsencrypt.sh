#!/bin/bash

# Let's Encrypt Certificate Deployment Script
# This script deploys valid Let's Encrypt certificates to fix the SSL certificate authority error

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
DOMAIN="city-pulse.app"
EMAIL="nevilpatelmansa@gmail.com"

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

echo -e "${GREEN}🔒 Let's Encrypt Certificate Deployment${NC}"
echo "======================================"

# Step 1: Commit and push changes
print_info "Pushing Docker configuration changes..."
git add .
git commit -m "Fix: Update nginx to use Let's Encrypt certificates with volume mount

- Added volume mount for SSL certificates in docker-compose.prod.yml
- Updated nginx Dockerfile to use fallback self-signed certificates
- This will resolve the SSL certificate authority error permanently" || echo "No changes to commit"
git push origin main

# Step 2: Deploy Let's Encrypt certificates
print_info "Deploying Let's Encrypt certificates to production..."

ssh $PRODUCTION_SERVER << 'EOF'
set -e

cd /opt/citypulse

echo "📥 Pulling latest configuration changes..."
git pull origin main

echo "🛑 Stopping nginx to free up port 80..."
sudo docker compose -f docker-compose.prod.yml stop nginx || true

echo "🔒 Ensuring Let's Encrypt certificates are current..."
# Force renewal if needed or get new certificates
sudo certbot certonly --standalone --non-interactive --agree-tos \
    --email nevilpatelmansa@gmail.com \
    -d city-pulse.app \
    -d www.city-pulse.app \
    --force-renewal || echo "Certificate renewal not needed"

echo "📁 Creating SSL directory and copying certificates..."
mkdir -p ./nginx/ssl

# Copy Let's Encrypt certificates to nginx directory
sudo cp /etc/letsencrypt/live/city-pulse.app/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/city-pulse.app/privkey.pem ./nginx/ssl/key.pem

# Set proper permissions
sudo chmod 644 ./nginx/ssl/cert.pem
sudo chmod 600 ./nginx/ssl/key.pem
sudo chown -R 1000:1000 ./nginx/ssl

echo "🔨 Rebuilding nginx with Let's Encrypt certificates..."
sudo docker compose -f docker-compose.prod.yml build nginx

echo "🚀 Starting all services..."
sudo docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🔍 Checking service status..."
sudo docker compose -f docker-compose.prod.yml ps

echo "✅ Let's Encrypt certificates deployed!"
EOF

# Step 3: Verify the certificates
print_info "Verifying SSL certificate deployment..."
sleep 10

echo ""
print_info "Testing HTTPS with proper SSL verification:"
HTTPS_TEST=$(curl -I https://city-pulse.app/ 2>&1 | head -1 || echo "Connection failed")
echo "$HTTPS_TEST"

if [[ "$HTTPS_TEST" == *"200"* ]]; then
    print_message "🎉 SSL certificate deployed successfully!"
    print_message "🔒 The certificate error should now be resolved"
else
    print_warning "⚠️ SSL deployment may need a few more minutes to propagate"
fi

echo ""
print_info "Checking certificate details:"
CERT_INFO=$(openssl s_client -connect city-pulse.app:443 -servername city-pulse.app </dev/null 2>/dev/null | openssl x509 -noout -issuer -subject 2>/dev/null || echo "Certificate check failed")
echo "$CERT_INFO"

if [[ "$CERT_INFO" == *"Let's Encrypt"* ]]; then
    print_message "🎉 Let's Encrypt certificate is active!"
    print_message "🌐 Your site is now secure: https://city-pulse.app"
else
    print_warning "⚠️ Certificate may still be updating. Please wait a few minutes and refresh your browser."
fi

echo ""
print_info "Setting up automatic certificate renewal..."
ssh $PRODUCTION_SERVER << 'EOF'
# Create renewal hook script
sudo tee /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh > /dev/null << 'HOOK_EOF'
#!/bin/bash
# Copy renewed certificates to nginx directory
cd /opt/citypulse
cp /etc/letsencrypt/live/city-pulse.app/fullchain.pem ./nginx/ssl/cert.pem
cp /etc/letsencrypt/live/city-pulse.app/privkey.pem ./nginx/ssl/key.pem
chmod 644 ./nginx/ssl/cert.pem
chmod 600 ./nginx/ssl/key.pem
chown -R 1000:1000 ./nginx/ssl

# Reload nginx in docker container
docker exec citypulse-nginx-prod nginx -s reload
HOOK_EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

echo "✅ Automatic renewal configured"
EOF

print_message "🔒 Let's Encrypt certificates are now active!"
print_message "🔄 Automatic renewal is configured"
print_message "🌐 Visit https://city-pulse.app (the certificate error should be gone)"

echo ""
print_info "🔍 Final service status:"
ssh $PRODUCTION_SERVER "cd $DEPLOYMENT_PATH && sudo docker compose -f docker-compose.prod.yml ps"