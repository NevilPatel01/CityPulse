# Production Nginx Dockerfile for Reverse Proxy
FROM nginx:1.25-alpine

# Copy nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy_params /etc/nginx/proxy_params

# Create necessary directories and install curl for health checks
RUN mkdir -p /var/www/certbot \
    && mkdir -p /var/log/nginx \
    && apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]