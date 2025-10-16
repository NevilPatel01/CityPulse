#!/bin/sh

# Environment configuration for frontend
# This allows dynamic environment variables in production

# Replace environment variables in the template
envsubst '${VITE_API_URL}' < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

# Start nginx
exec nginx -g 'daemon off;'