const { defineConfig } = require('cypress');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    // Frontend runs on 3001 in Docker (mapped from container port 3000)
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3001',
    setupNodeEvents(on, config) {
      return config;
    },
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    video: false,  // Disabled for faster tests
    screenshotOnRunFailure: false,  // Disabled for faster tests
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 8000,  // Reduced to avoid JWT timeout waits
    requestTimeout: 8000,  // Reduced to avoid JWT timeout waits
    responseTimeout: 8000,  // Reduced to avoid JWT timeout waits
    pageLoadTimeout: 30000,  // Increased for slower Docker environment
    execTimeout: 60000,  // Increase exec timeout
    // Retry disabled for faster tests
    retries: {
      runMode: 0,  // No retries for faster tests
      openMode: 0
    },
    // Environment variables for API URL
    env: {
      API_URL: process.env.CYPRESS_API_URL || 'http://localhost:5001'
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    setupNodeEvents(on, config) {
      return config;
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    video: false,  // Disabled for faster tests
    screenshotOnRunFailure: false,  // Disabled for faster tests
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
