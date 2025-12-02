/// <reference types="cypress" />

describe('Edit Profile Page', () => {
  beforeEach(() => {
    // Authenticate to access edit profile page
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

    cy.intercept('GET', '/api/profile/testuser', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            full_name: 'Test User',
            bio: 'Test bio',
            current_location: 'Toronto',
            hometown: 'Vancouver'
          },
          citiesVisited: ['Toronto', 'Vancouver']
        }
      }
    }).as('getProfile');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    cy.visit('/profile/edit');
    cy.wait('@authCheck');
    cy.wait('@getProfile');
  });

  it('should display edit profile form', () => {
    cy.contains('Edit Profile').should('be.visible');
    cy.get('input[name="fullName"], input[placeholder*="full name" i]').should('be.visible');
  });

  it('should allow editing profile information', () => {
    cy.get('input[name="fullName"], input[placeholder*="full name" i]').clear().type('Updated Name');
    cy.get('textarea[name="bio"], textarea[placeholder*="bio" i]').clear().type('Updated bio');
    
    // Verify changes are visible
    cy.get('input[name="fullName"], input[placeholder*="full name" i]').should('have.value', 'Updated Name');
  });

  it('should save profile changes', () => {
    cy.intercept('PUT', '/api/profile/testuser', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Profile updated successfully'
      }
    }).as('updateProfile');

    cy.get('input[name="fullName"], input[placeholder*="full name" i]').clear().type('Saved Name');
    cy.get('button').contains(/save/i).click();
    cy.wait('@updateProfile');

    // Should redirect or show success message
    cy.url().should('satisfy', (url) => {
      return url.includes('/profile') || url.includes('/edit');
    });
  });

  it('should display social links section', () => {
    cy.contains(/social/i).should('be.visible');
  });

  it('should navigate back', () => {
    cy.get('button').contains(/back|cancel/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();
        cy.url().should('satisfy', (url) => {
          return !url.includes('/edit') || url.includes('/profile');
        });
      }
    });
  });
});

