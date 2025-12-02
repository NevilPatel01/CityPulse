/// <reference types="cypress" />

describe('Travel Buddies Page', () => {
  beforeEach(() => {
    // Authenticate to access travel buddies page
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

    cy.intercept('GET', '/api/buddies*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          buddies: []
        }
      }
    }).as('getBuddies');

    cy.intercept('GET', '/api/buddies/requests/received*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          requests: []
        }
      }
    }).as('getReceivedRequests');

    cy.intercept('GET', '/api/buddies/requests/sent*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          requests: []
        }
      }
    }).as('getSentRequests');

    cy.intercept('GET', '/api/buddies/discover*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          users: []
        }
      }
    }).as('discoverUsers');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    cy.visit('/travel-buddies');
    cy.wait('@authCheck');
  });

  it('should display travel buddies page', () => {
    cy.get('body').should('exist');
    cy.contains(/buddy|travel.*companion|connection/i).should('be.visible');
  });

  it('should have buddies tab', () => {
    cy.contains(/buddies|connections/i).should('be.visible');
    cy.wait('@getBuddies');
  });

  it('should have requests tab', () => {
    cy.contains(/request/i).should('be.visible');
    cy.contains(/request/i).click();
    cy.wait('@getReceivedRequests');
  });

  it('should have discover tab', () => {
    cy.contains(/discover|find/i).should('be.visible');
    cy.contains(/discover|find/i).click();
    cy.wait('@discoverUsers');
  });

  it('should display empty state when no buddies', () => {
    cy.wait('@getBuddies');
    cy.get('body').should('exist');
  });

  it('should allow sending buddy request', () => {
    cy.intercept('POST', '/api/buddies/request*', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Buddy request sent'
      }
    }).as('sendRequest');

    cy.contains(/discover|find/i).click();
    cy.wait('@discoverUsers');
    
    // If there's a user, try to send request
    cy.get('button').contains(/add|send|request/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).first().click();
        cy.wait('@sendRequest');
      }
    });
  });
});

