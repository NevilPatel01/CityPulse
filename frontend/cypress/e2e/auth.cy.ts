/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to login page', () => {
    // Set large viewport since Login button is only visible on desktop
    cy.viewport(1920, 1080);
    cy.contains('Login').click();
    cy.url().should('include', '/login');
    cy.contains('Email address').should('be.visible');
    cy.contains('Password').should('be.visible');
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    cy.contains('Sign in').should('be.visible');
  });

  it('should navigate to signup page', () => {
    // Set large viewport for desktop navigation
    cy.viewport(1920, 1080);
    cy.contains('Sign Up').click();
    cy.url().should('include', '/signup');
  });

  it('should display signup form', () => {
    cy.visit('/signup');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('Email address').should('be.visible');
    cy.contains('Password').should('be.visible');
  });

  it('should show validation errors on empty form submission', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.get('input[type="email"]:invalid').should('exist');
  });

  it('should handle login with invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    
    // Intercept login API to return error response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { success: false, message: 'Invalid credentials' }
    }).as('loginAttempt');
    
    cy.get('button[type="submit"]').click();
    cy.wait('@loginAttempt');
    cy.contains(/invalid|error|incorrect/i).should('be.visible');
  });
});

describe('Authenticated User Flow', () => {
  beforeEach(() => {
    // Set up authenticated state directly - more reliable than testing login flow
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });
    
    // Mock auth status check to return authenticated user
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            fullName: 'Test User'
          }
        }
      }
    }).as('authCheck');
    
    // Visit explore page directly (authenticated users see this)
    cy.visit('/explore');
    
    // Wait for auth check to complete
    cy.wait('@authCheck', { timeout: 10000 });
    
    // Wait for page to fully load
    cy.get('body').should('be.visible');
  });

  it('should display user dropdown when authenticated', () => {
    // User dropdown only renders when user exists in auth context
    // Look for the button with aria-label containing "User menu"
    cy.get('button[aria-label*="User menu"]', { timeout: 20000 }).should('be.visible');
  });

  it('should allow logout', () => {
    // Find and click user dropdown
    cy.get('button[aria-label*="User menu"]', { timeout: 20000 })
      .should('be.visible')
      .click();
    
    // Wait for dropdown menu to appear and click logout
    cy.contains('Logout', { timeout: 5000 }).should('be.visible').click();
    
    // Expect redirect to home page after logout
    cy.url({ timeout: 10000 }).should('satisfy', (url) => {
      return url === Cypress.config().baseUrl + '/' || url.includes('/login');
    });
  });
});
