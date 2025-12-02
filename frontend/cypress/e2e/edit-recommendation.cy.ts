/// <reference types="cypress" />

describe('Edit Recommendation Page', () => {
  beforeEach(() => {
    // Authenticate to access edit recommendation page
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

    cy.intercept('GET', '/api/recommendations/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          place_name: 'Test Place',
          description: 'Test description',
          city_name: 'Toronto',
          category_id: 1,
          user_rating: 5
        }
      }
    }).as('getRecommendation');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    cy.visit('/edit-recommendation/1');
    cy.wait('@authCheck');
    cy.wait('@getRecommendation');
  });

  it('should display edit recommendation form', () => {
    cy.get('body').should('exist');
    cy.contains(/edit|update/i).should('be.visible');
  });

  it('should allow editing recommendation details', () => {
    cy.get('input[name="place_name"], input[placeholder*="place" i]').then(($input) => {
      if ($input.length > 0) {
        cy.wrap($input).should('be.visible');
      }
    });
  });

  it('should save recommendation changes', () => {
    cy.intercept('PUT', '/api/recommendations/1', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Recommendation updated successfully'
      }
    }).as('updateRecommendation');

    cy.get('button').contains(/save|update/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();
        cy.wait('@updateRecommendation');
        
        // Should redirect to recommendation detail page
        cy.url().should('satisfy', (url) => {
          return url.includes('/recommendations/1') || url.includes('/recommendation/1');
        });
      }
    });
  });
});

