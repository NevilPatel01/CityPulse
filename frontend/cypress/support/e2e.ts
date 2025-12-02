/// <reference types="cypress" />

import './commands';

// Prevent Cypress from failing on common browser errors that don't affect functionality
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});
