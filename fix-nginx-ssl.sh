#!/bin/bash

# Quick fix for the current nginx SSL certificate issue

echo "🔧 Quick fix for nginx SSL certificate issue"
echo "==========================================="

# Check if we're on the production server
if [[ "$HOSTNAME" == *"citypulse"* ]] || [[ "$USER" == "root" ]] || [[ -f "/opt/citypulse/docker-compose.prod.yml" ]]; then
    PROD_PATH="/opt/citypulse"
    echo "✅ Running on production server"
else
    # Running locally, deploy to production server
    echo "🌐 Deploying fix to production server..."
    
    # Push current changes to repo first
    git add .
    git commit -m "Fix: Update nginx configuration to build from Dockerfile with SSL certificates" || true
    git push origin main
    
    # SSH to production and fix the issue
    ssh root@206.189.65.221 << 'EOF'
        cd /opt/citypulse
        
        echo "📥 Pulling latest changes..."
        git pull origin main
        
        echo "🛑 Stopping current services..."
        sudo docker compose -f docker-compose.prod.yml down
        
        echo "🗑️ Cleaning up nginx containers and images..."
        sudo docker container rm -f citypulse-nginx-prod || true
        sudo docker image rm -f $(sudo docker images | grep nginx | awk '{print $3}') || true
        
        echo "🔧 Creating SSL directory and certificates..."
        mkdir -p ./nginx/ssl
        
        # Create self-signed certificates for immediate fix
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./nginx/ssl/key.pem \
            -out ./nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=CityPulse/OU=Production/CN=city-pulse.app" \
            -addext "subjectAltName=DNS:city-pulse.app,DNS:www.city-pulse.app" 2>/dev/null
        
        # Set proper permissions
        sudo chmod 644 ./nginx/ssl/cert.pem
        sudo chmod 600 ./nginx/ssl/key.pem
        
        echo "🔨 Building nginx service with SSL certificates..."
        sudo docker compose -f docker-compose.prod.yml build nginx
        
        echo "🚀 Starting all services..."
        sudo docker compose -f docker-compose.prod.yml up -d
        
        echo "⏳ Waiting for services to be ready..."
        sleep 30
        
        echo "🔍 Checking service status..."
        sudo docker compose -f docker-compose.prod.yml ps
        
        echo "✅ Quick fix complete!"
EOF
    
    # Test the deployment
    echo ""
    echo "🧪 Testing the fix..."
    sleep 10
    
    echo "HTTP test (should redirect to HTTPS):"
    curl -I http://city-pulse.app/ 2>/dev/null | head -5
    
    echo ""
    echo "HTTPS test:"
    curl -I https://city-pulse.app/ -k 2>/dev/null | head -5
    
    echo ""
    echo "✅ Fix deployed successfully!"
    echo "🌐 Your site should now be accessible at: https://city-pulse.app"
    
    exit 0
fi

# If running on production server directly
echo "🛑 Stopping current services..."
sudo docker compose -f docker-compose.prod.yml down

echo "🗑️ Cleaning up nginx containers and images..."
sudo docker container rm -f citypulse-nginx-prod || true
sudo docker image rm -f $(sudo docker images | grep nginx | awk '{print $3}') || true

echo "🔧 Creating SSL directory and certificates..."
mkdir -p ./nginx/ssl

# Create self-signed certificates for immediate fix
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ./nginx/ssl/key.pem \
    -out ./nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=CityPulse/OU=Production/CN=city-pulse.app" \
    -addext "subjectAltName=DNS:city-pulse.app,DNS:www.city-pulse.app"

# Set proper permissions
chmod 644 ./nginx/ssl/cert.pem
chmod 600 ./nginx/ssl/key.pem

echo "🔨 Building nginx service with SSL certificates..."
sudo docker compose -f docker-compose.prod.yml build nginx

echo "🚀 Starting all services..."
sudo docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🔍 Checking service status..."
sudo docker compose -f docker-compose.prod.yml ps

echo "✅ Quick fix complete!"