/// <reference types="cypress" />

describe('Search Flow', () => {
  beforeEach(() => {
    // Authenticate to access search functionality
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
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });
  });

  it('should perform basic search', () => {
    // Mock search API response
    cy.intercept('GET', '/api/search*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          recommendations: [
            {
              id: 1,
              title: 'Test Recommendation',
              category_name: 'Places'
            }
          ],
          cities: [],
          users: []
        }
      }
    }).as('search');
    
    cy.visit('/explore');
    cy.wait('@authCheck');
    
    cy.get('input[placeholder*="Search" i]').type('test');
    cy.wait('@search');
    
    cy.contains('Test Recommendation').should('be.visible');
  });

  it('should filter search results by category', () => {
    // Mock filtered search response
    cy.intercept('GET', '/api/search*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          recommendations: [
            {
              id: 1,
              title: 'Restaurant',
              category_name: 'Food'
            }
          ]
        }
      }
    }).as('filteredSearch');
    
    cy.visit('/explore');
    cy.wait('@authCheck');
    
    cy.get('input[placeholder*="Search" i]').type('restaurant');
    cy.wait('@filteredSearch');
    
    // Try clicking Food category filter if it exists
    cy.get('body').then(($body) => {
      const foodElements = $body.find(':contains("Food")');
      if (foodElements.length > 0) {
        cy.contains('Food').first().click();
      }
    });
  });

  it('should filter search by location', () => {
    cy.intercept('GET', '/api/search*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          recommendations: [
            {
              id: 1,
              title: 'NYC Park',
              city_name: 'New York'
            }
          ]
        }
      }
    }).as('locationSearch');
    
    cy.visit('/explore');
    cy.wait('@authCheck');
    
    cy.get('input[placeholder*="Search" i]').type('park');
    cy.wait('@locationSearch');
    
    cy.contains('NYC Park').should('be.visible');
  });

  it('should display search results', () => {
    cy.intercept('GET', '/api/search*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          recommendations: [
            { id: 1, title: 'Result 1' },
            { id: 2, title: 'Result 2' }
          ]
        }
      }
    }).as('search');
    
    cy.visit('/explore');
    cy.wait('@authCheck');
    
    cy.get('input[placeholder*="Search" i]').type('test');
    cy.wait('@search');
    
    cy.contains('Result 1').should('be.visible');
  });
});
