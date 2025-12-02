/// <reference types="cypress" />

describe('Password Reset Flow', () => {
  beforeEach(() => {
    cy.visit('/reset-password');
  });

  it('should display reset password form', () => {
    cy.contains('Reset Your Password').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation error for invalid email', () => {
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.get('input[type="email"]:invalid').should('exist');
  });

  it('should handle password reset request', () => {
    cy.intercept('POST', '/api/auth/request-password-reset', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Reset code sent',
        resetToken: 'mock-reset-token'
      }
    }).as('requestReset');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    cy.wait('@requestReset');

    cy.contains('Check Your Email').should('be.visible');
  });

  it('should show error message on failed reset request', () => {
    cy.intercept('POST', '/api/auth/request-password-reset', {
      statusCode: 404,
      body: {
        success: false,
        message: 'Email not found'
      }
    }).as('requestResetFailed');

    cy.get('input[type="email"]').type('nonexistent@example.com');
    cy.get('button[type="submit"]').click();
    cy.wait('@requestResetFailed');

    cy.contains(/error|failed/i).should('be.visible');
  });

  it('should navigate back to login', () => {
    cy.contains('Back to Sign In').should('be.visible');
    cy.contains('Back to Sign In').click();
    cy.url().should('include', '/login');
  });
});

