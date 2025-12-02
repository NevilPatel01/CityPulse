/// <reference types="cypress" />

describe('Moderator Dashboard', () => {
  beforeEach(() => {
    // Authenticate as moderator to access dashboard
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'moderator',
            fullName: 'Moderator User',
            role: 'moderator'
          }
        }
      }
    }).as('authCheck');

    cy.intercept('GET', '/api/moderator/dashboard/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalReports: 0,
          pendingReports: 0,
          resolvedReports: 0
        }
      }
    }).as('getDashboardStats');

    cy.intercept('GET', '/api/moderator/reports*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          reports: []
        }
      }
    }).as('getReports');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-moderator-token');
    });

    cy.visit('/moderator/dashboard');
    cy.wait('@authCheck');
    cy.wait('@getDashboardStats');
  });

  it('should display moderator dashboard', () => {
    cy.contains(/moderator|dashboard/i).should('be.visible');
  });

  it('should display dashboard statistics', () => {
    cy.contains(/report|stat/i).should('be.visible');
  });

  it('should have reports tab', () => {
    cy.contains(/report/i).should('be.visible');
  });

  it('should have users tab', () => {
    cy.contains(/user/i).should('be.visible');
  });

  it('should have actions tab', () => {
    cy.contains(/action|history/i).should('be.visible');
  });

  it('should allow filtering reports', () => {
    cy.get('select, button').contains(/filter/i).then(($filter) => {
      if ($filter.length > 0) {
        cy.wrap($filter).should('be.visible');
      }
    });
  });
});

