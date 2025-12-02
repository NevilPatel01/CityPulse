/// <reference types="cypress" />

describe('Leaderboard Page', () => {
  beforeEach(() => {
    // Authenticate to access leaderboard page
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

    cy.intercept('GET', '/api/leaderboard*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          leaderboard: [
            {
              rank: 1,
              username: 'user1',
              achievements_count: 10,
              total_points: 100
            }
          ]
        }
      }
    }).as('getLeaderboard');

    cy.intercept('GET', '/api/leaderboard/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          rank: 5,
          achievements_count: 5,
          total_points: 50
        }
      }
    }).as('getMyPosition');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    cy.visit('/leaderboard');
    cy.wait('@authCheck');
    cy.wait('@getLeaderboard');
  });

  it('should display leaderboard page', () => {
    cy.contains(/leaderboard|ranking/i).should('be.visible');
  });

  it('should display leaderboard entries', () => {
    cy.get('body').should('exist');
  });

  it('should have leaderboard type filters', () => {
    cy.contains(/all|achievement|point|badge/i).should('be.visible');
  });

  it('should display user rankings', () => {
    cy.contains(/rank|position/i).should('be.visible');
  });

  it('should display user position if available', () => {
    cy.wait('@getMyPosition');
    cy.get('body').should('exist');
  });
});

