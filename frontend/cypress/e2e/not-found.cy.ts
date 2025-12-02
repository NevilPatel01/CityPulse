/// <reference types="cypress" />

describe('404 Not Found Page', () => {
  it('should display 404 page for invalid routes', () => {
    cy.visit('/invalid-route-that-does-not-exist', { failOnStatusCode: false });
    
    cy.contains('404').should('be.visible');
    cy.contains('Page Not Found').should('be.visible');
  });

  it('should have go home button', () => {
    cy.visit('/invalid-route', { failOnStatusCode: false });
    
    cy.contains('Go Home').should('be.visible');
    cy.contains('Go Home').click();
    cy.url().should('equal', Cypress.config().baseUrl + '/');
  });

  it('should have go back button', () => {
    cy.visit('/');
    cy.visit('/invalid-route', { failOnStatusCode: false });
    
    cy.contains('Go Back').should('be.visible');
    cy.contains('Go Back').click();
    cy.url().should('equal', Cypress.config().baseUrl + '/');
  });

  it('should have navigation links', () => {
    cy.visit('/invalid-route', { failOnStatusCode: false });
    
    cy.contains('Go to Explore').should('be.visible');
    cy.contains('Features').should('be.visible');
    cy.contains('About').should('be.visible');
    cy.contains('Login').should('be.visible');
  });

  it('should navigate to explore from help text', () => {
    cy.visit('/invalid-route', { failOnStatusCode: false });
    
    cy.contains('Go to Explore').click();
    cy.url().should('include', '/explore');
  });
});

