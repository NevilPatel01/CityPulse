// Environment configuration template
// This file is processed by envsubst to inject environment variables
window.ENV = {
  VITE_API_URL: '${VITE_API_URL}',
  VITE_GOOGLE_CLIENT_ID: '${VITE_GOOGLE_CLIENT_ID}',
  VITE_GOOGLE_CLIENT_SECRET: '${VITE_GOOGLE_CLIENT_SECRET}',
  VITE_GOOGLE_REDIRECT_URI: '${VITE_GOOGLE_REDIRECT_URI}'
};

if (!window.ENV.VITE_API_URL) {
  window.ENV.VITE_API_URL = window.location.origin;
}
