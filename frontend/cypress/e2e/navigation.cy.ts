/// <reference types="cypress" />

describe('Navigation Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate between main pages', () => {
    // Set large viewport to see desktop navigation links
    cy.viewport(1920, 1080);
    
    cy.contains('Features').click();
    cy.url().should('include', '/features');
    
    cy.visit('/');
    cy.contains('About').click();
    cy.url().should('include', '/about');
  });

  it('should navigate using header logo', () => {
    cy.visit('/explore');
    cy.get('a[href="/"]').first().click();
    // Logo may redirect to home or explore depending on auth state
    cy.url().should('satisfy', (url) => {
      return url === Cypress.config().baseUrl + '/' || url.includes('/explore');
    });
  });

  it('should have working search functionality', () => {
    // Authenticate first to access search bar
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: { id: 1, username: 'testuser' }
        }
      }
    }).as('authCheck');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });
    
    cy.visit('/explore');
    cy.wait('@authCheck');
    
    // Set desktop viewport where search bar is visible
    cy.viewport(1280, 720);
    cy.get('input[placeholder*="Search" i]').should('exist');
  });

  it('should display mobile menu on small screens', () => {
    // Test on mobile-sized viewport
    cy.viewport(375, 667);
    cy.visit('/');
    
    cy.get('button[aria-label*="menu" i]').should('be.visible').click();
    cy.contains('Login').should('be.visible');
  });
});

describe('Protected Routes', () => {
  it('should redirect to login when accessing protected route', () => {
    cy.visit('/create-recommendation');
    cy.url().should('include', '/login');
  });

  it('should allow access to protected route when authenticated', () => {
    // Set up authentication to access protected routes
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: { 
        success: true, 
        data: { 
          user: { 
            id: 1, 
            username: 'testuser',
            fullName: 'Test User',
            email: 'test@example.com'
          } 
        } 
      }
    }).as('authCheck');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });
    
    cy.visit('/create-recommendation');
    cy.wait('@authCheck');
    cy.url().should('include', '/create-recommendation');
  });
});
