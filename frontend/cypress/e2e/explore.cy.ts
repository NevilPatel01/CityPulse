/// <reference types="cypress" />

describe('Explore Page Flow', () => {
  beforeEach(() => {
    // Set up authentication for explore page
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
    
    // Mock empty feed initially
    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [],
          hasMore: false
        }
      }
    }).as('getFeed');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });
    
    cy.visit('/explore');
    cy.wait('@authCheck');
  });

  it('should display explore page with tabs', () => {
    cy.url().should('include', '/explore');
    
    cy.contains('Top Places This Month').should('be.visible');
    cy.contains("Friends' Updates").should('be.visible');
    cy.contains('Your Feed').should('be.visible');
  });

  it('should switch between feed tabs', () => {
    cy.contains('Top Places This Month').click();
    cy.contains('Top Places This Month').should('be.visible');
    
    cy.contains("Friends' Updates").click();
    cy.contains("Friends' Updates").should('be.visible');
    
    cy.contains('Your Feed').click();
    cy.contains('Your Feed').should('be.visible');
  });

  it('should filter feed by category', () => {
    // Mock filtered feed response with Food category
    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: 1,
              title: 'Food Recommendation',
              category_name: 'Food',
              content_type: 'recommendation'
            }
          ]
        }
      }
    }).as('filteredFeed');
    
    cy.contains('Food').first().click();
    cy.wait('@filteredFeed');
  });

  it('should load more recommendations on scroll', () => {
    // Set up feed with multiple posts and hasMore flag
    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            title: `Recommendation ${i + 1}`,
            content_type: 'recommendation'
          })),
          hasMore: true
        }
      }
    }).as('getFeed');
    
    cy.wait('@getFeed');
    // Scroll to trigger infinite scroll
    cy.scrollTo('bottom');
    cy.wait('@getFeed');
  });

  it('should display quick actions', () => {
    cy.contains('Quick Actions').should('be.visible');
    cy.contains('Add Recommendation').should('be.visible');
  });

  it('should navigate to create recommendation from quick actions', () => {
    cy.contains('Add Recommendation').click();
    cy.url().should('include', '/create-recommendation');
  });
});
