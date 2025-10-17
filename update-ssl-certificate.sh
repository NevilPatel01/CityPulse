#!/bin/bash

# Script to update SSL certificate after adding api.city-pulse.app DNS record

echo "🔍 Checking DNS propagation for api.city-pulse.app..."
nslookup api.city-pulse.app

echo ""
echo "⏳ Waiting for DNS propagation (30 seconds)..."
sleep 30

echo ""
echo "🔒 Updating SSL certificate to include api.city-pulse.app..."
ssh root@206.189.65.221 << 'EOF'
# Stop nginx temporarily to free up port 80
sudo docker compose -f /opt/citypulse/docker-compose.prod.yml stop nginx

# Expand the certificate to include api subdomain
sudo certbot certonly --standalone --expand --non-interactive --agree-tos \
  --email nevilpatelmansa@gmail.com \
  -d city-pulse.app \
  -d www.city-pulse.app \
  -d api.city-pulse.app

# Restart all services
sudo docker compose -f /opt/citypulse/docker-compose.prod.yml up -d

echo "✅ SSL certificate updated and services restarted"
EOF

echo ""
echo "🧪 Testing all endpoints..."
echo "Main site:"
curl -I https://city-pulse.app/ -k

echo ""
echo "API health check:"
curl -I https://api.city-pulse.app/health -k

echo ""
echo "✅ Deployment complete! Your site is ready at:"
echo "🌐 Main site: https://city-pulse.app"
echo "🔗 API: https://api.city-pulse.app"