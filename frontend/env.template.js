// Environment configuration template
// This file is processed by envsubst to inject environment variables
window.ENV = {
  VITE_API_URL: '${VITE_API_URL}'
};

if (!window.ENV.VITE_API_URL) {
  window.ENV.VITE_API_URL = window.location.origin;
}
