/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      waitForApi(): Chainable<void>;
    }
  }
}

// Log in by visiting login page and filling credentials
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

// Log out by opening user dropdown and clicking logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-dropdown"]').click();
  cy.contains('Logout').click();
  cy.url().should('include', '/login');
});

// Wait for API requests to complete
Cypress.Commands.add('waitForApi', () => {
  cy.intercept('GET', '/api/**').as('apiRequest');
  cy.wait('@apiRequest', { timeout: 10000 });
});

export {};
