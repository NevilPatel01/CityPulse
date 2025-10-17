#!/bin/sh

# Environment configuration for frontend
# This allows dynamic environment variables in production

# Replace environment variables in the template; fall back to default file if substitution fails
TEMPLATE=/usr/share/nginx/html/env.template.js
OUTPUT=/usr/share/nginx/html/env.js

if [ -f "$TEMPLATE" ]; then
  if ! envsubst '${VITE_API_URL}' < "$TEMPLATE" > "$OUTPUT"; then
    echo "envsubst failed, writing default env.js" >&2
    printf "window.ENV = { VITE_API_URL: '%s' };\n" "${VITE_API_URL:-}" > "$OUTPUT"
  fi
else
  echo "Template $TEMPLATE not found, creating default env.js" >&2
  printf "window.ENV = { VITE_API_URL: '%s' };\n" "${VITE_API_URL:-}" > "$OUTPUT"
fi

# Start nginx
exec nginx -g 'daemon off;'
