# Production Nginx Dockerfile for Reverse Proxy
FROM nginx:1.25-alpine

# Install openssl for SSL certificate generation
RUN apk add --no-cache openssl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy_params /etc/nginx/proxy_params

# Create directories for SSL certificates and logs
RUN mkdir -p /etc/nginx/ssl \
    && mkdir -p /var/www/certbot \
    && mkdir -p /var/log/nginx

# Create self-signed certificates for initial setup
# (Production should use Let's Encrypt)
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=city-pulse.app"

# Set proper permissions
RUN chown -R nginx:nginx /etc/nginx/ssl \
    && chmod 600 /etc/nginx/ssl/key.pem \
    && chmod 644 /etc/nginx/ssl/cert.pem

# Create nginx user if it doesn't exist
RUN addgroup -g 101 -S nginx || true \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f https://city-pulse.app/health || exit 1

# Add curl for health checks
RUN apk add --no-cache curl

EXPOSE 80 443

# Use nginx user
USER nginx

CMD ["nginx", "-g", "daemon off;"]