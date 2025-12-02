/// <reference types="cypress" />

describe('Settings Page', () => {
  beforeEach(() => {
    // Authenticate to access settings page
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User'
          }
        }
      }
    }).as('authCheck');

    cy.intercept('GET', '/api/profile/privacy/settings', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          profileVisibility: 'public',
          locationSharing: true,
          socialLinksVisible: true,
          travelBuddyRequestsEnabled: true
        }
      }
    }).as('getPrivacySettings');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    cy.visit('/settings');
    cy.wait('@authCheck');
    cy.wait('@getPrivacySettings');
  });

  it('should display settings page', () => {
    cy.contains(/settings/i).should('be.visible');
  });

  it('should display privacy settings section', () => {
    cy.contains(/privacy/i).should('be.visible');
  });

  it('should allow changing privacy settings', () => {
    cy.get('select[name="profileVisibility"], select').first().select('private');
    
    cy.intercept('PUT', '/api/profile/privacy/settings', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Privacy settings updated'
      }
    }).as('updatePrivacy');

    cy.get('button').contains(/save/i).click();
    cy.wait('@updatePrivacy');
  });

  it('should display change password option', () => {
    cy.contains(/password/i).should('be.visible');
    cy.get('button').contains(/change.*password/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).should('be.visible');
      }
    });
  });

  it('should display email notifications option', () => {
    cy.contains(/notification/i).should('be.visible');
  });

  it('should display logout option', () => {
    cy.contains(/logout/i).should('be.visible');
  });

  it('should handle logout', () => {
    cy.intercept('POST', '/api/auth/logout', {
      statusCode: 200
    }).as('logout');

    cy.get('button').contains(/logout/i).click();
    cy.wait('@logout');

    cy.url().should('include', '/login');
  });
});

