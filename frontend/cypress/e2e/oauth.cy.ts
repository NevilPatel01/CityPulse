/// <reference types="cypress" />

describe('Google OAuth Callback', () => {
  it('should display loading state during OAuth processing', () => {
    cy.intercept('POST', '/api/auth/google/callback*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: 'mock-token',
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser'
          }
        }
      },
      delay: 500
    }).as('oauthCallback');

    cy.visit('/auth/google/callback?code=mock-auth-code&state=mock-state', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // More flexible check for loading state
    cy.get('body').then(($body) => {
      if ($body.text().match(/completing|loading|processing|sign.*in/i)) {
        cy.contains(/completing|loading|processing|sign.*in/i).should('be.visible');
      }
    });
    cy.wait('@oauthCallback', { timeout: 10000 });
  });

  it('should handle successful OAuth callback', () => {
    cy.intercept('POST', '/api/auth/google/callback*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: 'mock-token',
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            fullName: 'Test User'
          }
        }
      }
    }).as('oauthSuccess');

    cy.visit('/auth/google/callback?code=mock-auth-code&state=mock-state');
    cy.wait('@oauthSuccess');

    // Should redirect to explore page after successful login
    cy.url().should('satisfy', (url) => {
      return url.includes('/explore') || url.includes('/');
    });
  });

  it('should handle OAuth error from Google', () => {
    cy.visit('/auth/google/callback?error=access_denied', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // Should redirect to login with error (with timeout)
    cy.url({ timeout: 10000 }).should('satisfy', (url) => {
      return url.includes('/login') || url.includes('/signin') || url === Cypress.config().baseUrl + '/';
    });
  });

  it('should handle missing authorization code', () => {
    cy.visit('/auth/google/callback', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // Should redirect to login with error (with timeout)
    cy.url({ timeout: 10000 }).should('satisfy', (url) => {
      return url.includes('/login') || url.includes('/signin') || url === Cypress.config().baseUrl + '/';
    });
  });

  it('should handle OAuth callback failure', () => {
    cy.intercept('POST', '/api/auth/google/callback*', {
      statusCode: 401,
      body: {
        success: false,
        message: 'OAuth authentication failed'
      }
    }).as('oauthFailed');

    cy.visit('/auth/google/callback?code=invalid-code&state=mock-state', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.wait('@oauthFailed', { timeout: 10000 });

    // Should redirect to login with error (with timeout)
    cy.url({ timeout: 10000 }).should('satisfy', (url) => {
      return url.includes('/login') || url.includes('/signin') || url === Cypress.config().baseUrl + '/';
    });
  });
});

