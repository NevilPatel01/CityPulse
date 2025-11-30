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
    // Mock successful login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: 'mock-token',
          user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            fullName: 'Test User'
          }
        }
      }
    }).as('login');
    
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
    
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
  });

  it('should redirect to explore page after login', () => {
    cy.url().should('include', '/explore');
  });

  it('should display user dropdown when authenticated', () => {
    cy.get('button[aria-label*="User menu"]').should('be.visible');
  });

  it('should allow logout', () => {
    // Intercept logout endpoint
    cy.intercept('POST', '/api/auth/logout', { statusCode: 200 }).as('logout');
    
    cy.get('button[aria-label*="User menu"]').click();
    cy.contains('Logout').click();
    cy.wait('@logout');
    
    // Expect redirect to home or login page after logout
    cy.url().should('satisfy', (url) => {
      return url === Cypress.config().baseUrl + '/' || url.includes('/login');
    });
  });
});
