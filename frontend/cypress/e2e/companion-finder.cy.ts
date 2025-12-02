/// <reference types="cypress" />

describe('Companion Finder Page', () => {
  beforeEach(() => {
    // Authenticate to access companion finder page
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            fullName: 'Test User'
          }
        }
      }
    }).as('authCheck');

    cy.intercept('GET', '/api/trips/companions/find*', {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('findCompanions');

    cy.intercept('GET', '/api/trips/discover*', {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('discoverTrips');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    cy.visit('/trips/companions/find');
    cy.wait('@authCheck');
  });

  it('should display companion finder page', () => {
    cy.get('body').should('exist');
    cy.contains(/companion|travel.*buddy/i).should('be.visible');
  });

  it('should have find companions tab', () => {
    cy.contains(/find.*companion/i).should('be.visible');
  });

  it('should have discover trips tab', () => {
    cy.contains(/discover/i).should('be.visible');
  });

  it('should allow filtering by city', () => {
    cy.get('input[placeholder*="city" i]').then(($input) => {
      if ($input.length > 0) {
        cy.wrap($input).should('be.visible');
      }
    });
  });

  it('should allow filtering by date', () => {
    cy.get('input[type="date"]').then(($input) => {
      if ($input.length > 0) {
        cy.wrap($input).should('be.visible');
      }
    });
  });
});

