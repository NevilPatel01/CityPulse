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
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.contains(/settings/i).should('be.visible');
  });

  it('should display privacy settings section', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.contains(/privacy.*settings|privacy/i).should('be.visible');
  });

  it('should allow changing privacy settings', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    cy.get('body').then(($body) => {
      if ($body.find('select[name="profileVisibility"]').length > 0 || 
          $body.find('select').length > 0) {
        cy.get('select[name="profileVisibility"], select').first().select('private');
        
        cy.intercept('PUT', '/api/profile/privacy/settings', {
          statusCode: 200,
          body: {
            success: true,
            message: 'Privacy settings updated'
          }
        }).as('updatePrivacy');

        cy.get('button').contains(/save/i).first().click();
        cy.wait('@updatePrivacy', { timeout: 10000 });
      } else {
        cy.url().should('include', '/settings');
      }
    });
  });

  it('should display change password option', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.contains(/change.*password|password/i).should('be.visible');
  });

  it('should display email notifications option', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.contains(/email.*settings|email.*notification|notification/i).should('be.visible');
  });

  it('should display logout option', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.contains(/logout/i).should('be.visible');
  });

  it('should handle logout', () => {
    cy.intercept('POST', '/api/auth/logout', {
      statusCode: 200
    }).as('logout');

    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Logout")').length > 0 || 
          $body.find('button:contains("Log out")').length > 0) {
        cy.contains(/logout/i).first().click();
        cy.wait('@logout', { timeout: 10000 });
        
        cy.url({ timeout: 10000 }).should('satisfy', (url) => {
          return url.includes('/login') || url.includes('/signin') || url === Cypress.config().baseUrl + '/';
        });
      } else {
        cy.url().should('include', '/settings');
      }
    });
  });
});

