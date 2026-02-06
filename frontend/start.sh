#!/bin/sh

# Environment configuration for frontend
# This allows dynamic environment variables in production

# Replace environment variables in the template; fall back to default file if substitution fails
TEMPLATE=/usr/share/nginx/html/env.template.js
OUTPUT=/usr/share/nginx/html/env.js

if [ -f "$TEMPLATE" ]; then
  if ! envsubst '${VITE_API_URL} ${VITE_GOOGLE_CLIENT_ID} ${VITE_GOOGLE_REDIRECT_URI}' < "$TEMPLATE" > "$OUTPUT"; then
    echo "envsubst failed, writing default env.js" >&2
    printf "window.ENV = { VITE_API_URL: '%s', VITE_GOOGLE_CLIENT_ID: '%s', VITE_GOOGLE_REDIRECT_URI: '%s' };\n" "${VITE_API_URL:-}" "${VITE_GOOGLE_CLIENT_ID:-}" "${VITE_GOOGLE_REDIRECT_URI:-}" > "$OUTPUT"
  fi
else
  echo "Template $TEMPLATE not found, creating default env.js" >&2
  printf "window.ENV = { VITE_API_URL: '%s', VITE_GOOGLE_CLIENT_ID: '%s', VITE_GOOGLE_REDIRECT_URI: '%s' };\n" "${VITE_API_URL:-}" "${VITE_GOOGLE_CLIENT_ID:-}" "${VITE_GOOGLE_REDIRECT_URI:-}" > "$OUTPUT"
fi

# Start nginx
exec nginx -g 'daemon off;'
