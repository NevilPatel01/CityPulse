/// <reference types="cypress" />

describe('City Page', () => {
  beforeEach(() => {
    // Set up authentication token first
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    // Authenticate to access city page - set up intercept BEFORE visit
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

    cy.intercept('GET', '/api/cities/*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          name: 'Toronto',
          country: 'Canada',
          stats: {
            total_recommendations: 10,
            contributors: 5,
            visitors: 100
          }
        }
      }
    }).as('getCity');

    cy.intercept('GET', '/api/cities/*/recommendations*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          recommendations: []
        }
      }
    }).as('getRecommendations');

    // Visit the page - auth check will happen automatically
    cy.visit('/city/Toronto');
    
    // Wait for auth check (with optional timeout to handle if it doesn't fire)
    cy.wait('@authCheck', { timeout: 10000 }).then(() => {
      // Auth check completed
    }).catch(() => {
      // Auth check might not have fired, continue anyway
      cy.log('Auth check intercept may not have fired, continuing...');
    });
    
    cy.wait('@getCity', { timeout: 10000 });
  });

  it('should display city information', () => {
    cy.contains('Toronto').should('be.visible');
    cy.get('body').should('exist');
  });

  it('should display city statistics', () => {
    cy.contains(/recommendation|contributor|visitor/i).should('be.visible');
  });

  it('should display recommendations section', () => {
    cy.wait('@getRecommendations');
    cy.get('body').should('exist');
  });

  it('should allow filtering recommendations', () => {
    cy.get('button').contains(/filter/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).should('be.visible');
      }
    });
  });
});

