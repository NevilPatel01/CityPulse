#!/bin/bash

# Script to update SSL certificate and fix nginx issues

echo "🔍 Checking DNS propagation..."
nslookup city-pulse.app

echo ""
echo "🔒 Setting up SSL certificates and fixing nginx configuration..."
ssh root@206.189.65.221 << 'EOF'
cd /opt/citypulse

# Stop services to free up ports
sudo docker compose -f docker-compose.prod.yml down

# Remove any existing nginx containers and images to force rebuild
sudo docker container rm -f citypulse-nginx-prod || true
sudo docker image rm -f citypulse-nginx-prod nginx:1.25-alpine || true

# Generate/update SSL certificates
mkdir -p ./nginx/ssl

# Try to get Let's Encrypt certificates first
if command -v certbot &> /dev/null; then
    echo "🔒 Attempting to obtain Let's Encrypt certificates..."
    
    # Stop any nginx processes that might be using port 80
    sudo systemctl stop nginx || true
    sudo pkill nginx || true
    
    # Get certificates using standalone mode
    sudo certbot certonly --standalone --non-interactive --agree-tos \
        --email nevilpatelmansa@gmail.com \
        -d city-pulse.app \
        -d www.city-pulse.app || {
        
        echo "⚠️ Let's Encrypt failed, creating self-signed certificates..."
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./nginx/ssl/key.pem \
            -out ./nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=CityPulse/OU=Production/CN=city-pulse.app" \
            -addext "subjectAltName=DNS:city-pulse.app,DNS:www.city-pulse.app"
    }
    
    # Copy Let's Encrypt certificates if they exist
    if [ -f "/etc/letsencrypt/live/city-pulse.app/fullchain.pem" ]; then
        sudo cp "/etc/letsencrypt/live/city-pulse.app/fullchain.pem" ./nginx/ssl/cert.pem
        sudo cp "/etc/letsencrypt/live/city-pulse.app/privkey.pem" ./nginx/ssl/key.pem
        echo "✅ Let's Encrypt certificates copied"
    fi
else
    echo "⚠️ Certbot not found, creating self-signed certificates..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ./nginx/ssl/key.pem \
        -out ./nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=CityPulse/OU=Production/CN=city-pulse.app" \
        -addext "subjectAltName=DNS:city-pulse.app,DNS:www.city-pulse.app"
fi

# Set proper permissions
sudo chmod 644 ./nginx/ssl/cert.pem
sudo chmod 600 ./nginx/ssl/key.pem
sudo chown -R 1000:1000 ./nginx/ssl

# Rebuild and start all services
echo "🔄 Rebuilding nginx with SSL certificates..."
sudo docker compose -f docker-compose.prod.yml build nginx
sudo docker compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
sudo docker compose -f docker-compose.prod.yml ps

echo "✅ SSL certificate setup complete!"
EOF

echo ""
echo "🧪 Testing endpoints..."
echo "Main site:"
curl -I https://city-pulse.app/ -k

echo ""
echo "API health check:"
curl -I https://city-pulse.app/health -k

echo ""
echo "✅ Deployment complete! Your site is ready at:"
echo "🌐 Main site: https://city-pulse.app"