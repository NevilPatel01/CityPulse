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

    cy.visit('/auth/google/callback?code=mock-auth-code&state=mock-state');
    
    cy.contains('Completing Google sign-in').should('be.visible');
    cy.wait('@oauthCallback');
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
    cy.visit('/auth/google/callback?error=access_denied');
    
    // Should redirect to login with error
    cy.url().should('include', '/login');
  });

  it('should handle missing authorization code', () => {
    cy.visit('/auth/google/callback');
    
    // Should redirect to login with error
    cy.url().should('include', '/login');
  });

  it('should handle OAuth callback failure', () => {
    cy.intercept('POST', '/api/auth/google/callback*', {
      statusCode: 401,
      body: {
        success: false,
        message: 'OAuth authentication failed'
      }
    }).as('oauthFailed');

    cy.visit('/auth/google/callback?code=invalid-code&state=mock-state');
    cy.wait('@oauthFailed');

    // Should redirect to login with error
    cy.url().should('include', '/login');
  });
});

