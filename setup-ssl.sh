#!/bin/bash

# SSL Certificate Setup Script for CityPulse Production
# This script helps set up SSL certificates for the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-city-pulse.app}"
EMAIL="${SSL_EMAIL:-admin@city-pulse.app}"
SSL_DIR="./nginx/ssl"

echo -e "${GREEN}🔒 CityPulse SSL Certificate Setup${NC}"
echo "=================================="

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

# Check if running on production server
if [ -f "/.dockerenv" ] || [ "${NODE_ENV}" = "production" ]; then
    PRODUCTION_SERVER=true
else
    PRODUCTION_SERVER=false
fi

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "SSL Directory: $SSL_DIR"
echo "Production Server: $PRODUCTION_SERVER"
echo ""

# Option 1: Use existing certificates (if they exist)
if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    print_message "Existing SSL certificates found"
    
    # Check certificate expiry
    if openssl x509 -checkend 86400 -noout -in "$SSL_DIR/cert.pem" >/dev/null 2>&1; then
        print_message "Certificate is valid for at least 24 hours"
        exit 0
    else
        print_warning "Certificate will expire within 24 hours or is already expired"
    fi
fi

# Option 2: Generate self-signed certificates for development/initial setup
if [ "$PRODUCTION_SERVER" = false ]; then
    print_message "Generating self-signed certificates for development..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=CityPulse/OU=Development/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,DNS:localhost,IP:127.0.0.1"
    
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    print_message "Self-signed certificates generated successfully"
    print_warning "These are self-signed certificates - browsers will show security warnings"
    print_warning "For production, use Let's Encrypt certificates"
    exit 0
fi

# Option 3: Set up Let's Encrypt certificates for production
print_message "Setting up Let's Encrypt certificates for production..."

# Check if certbot is available
if ! command -v certbot &> /dev/null; then
    print_error "Certbot is not installed. Please install certbot first:"
    echo "  Ubuntu/Debian: sudo apt-get install certbot"
    echo "  CentOS/RHEL: sudo yum install certbot"
    echo "  macOS: brew install certbot"
    exit 1
fi

# Check if domain resolves to this server
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null || echo "")
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    print_warning "Domain $DOMAIN does not resolve to this server IP ($SERVER_IP)"
    print_warning "Please ensure DNS is configured correctly before proceeding"
    
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Generate Let's Encrypt certificates
print_message "Obtaining Let's Encrypt certificates..."

# Use standalone mode for initial certificate generation
certbot certonly --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domains "$DOMAIN,www.$DOMAIN" \
    --preferred-challenges http \
    --http-01-port 80

# Copy certificates to nginx directory
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    print_message "Let's Encrypt certificates installed successfully"
    
    # Set up automatic renewal
    print_message "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates twice daily
0 3,15 * * * root certbot renew --quiet --deploy-hook "docker-compose -f /opt/citypulse/docker-compose.prod.yml restart nginx"
EOF
    
    print_message "Automatic renewal configured"
    print_message "Certificates will be checked for renewal twice daily"
else
    print_error "Failed to obtain Let's Encrypt certificates"
    print_message "Falling back to self-signed certificates..."
    
    openssl req -x509 -nodes -days 90 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=CityPulse/OU=Production/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN"
    
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    print_warning "Using self-signed certificates as fallback"
fi

print_message "SSL setup complete!"