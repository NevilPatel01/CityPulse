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

# Create nginx user if it doesn't exist
RUN addgroup -g 101 -S nginx || true \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Add curl for health checks
RUN apk add --no-cache curl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]