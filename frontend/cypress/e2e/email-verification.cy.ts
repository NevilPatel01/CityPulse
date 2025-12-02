/// <reference types="cypress" />

describe('Email Verification Flow', () => {
  it('should display loading state initially', () => {
    cy.intercept('POST', '/api/auth/verify-email*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Email verified successfully'
      },
      delay: 500
    }).as('verifyEmail');

    cy.visit('/verify-email?token=mock-verification-token');
    
    cy.contains('Verifying your email').should('be.visible');
    cy.wait('@verifyEmail');
  });

  it('should display success message on successful verification', () => {
    cy.intercept('POST', '/api/auth/verify-email*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Email verified successfully'
      }
    }).as('verifyEmailSuccess');

    cy.visit('/verify-email?token=mock-verification-token');
    cy.wait('@verifyEmailSuccess');

    cy.contains('Email Verified').should('be.visible');
    cy.contains('Continue to Login').should('be.visible');
  });

  it('should display error message on failed verification', () => {
    cy.intercept('POST', '/api/auth/verify-email*', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Invalid or expired verification token'
      }
    }).as('verifyEmailFailed');

    cy.visit('/verify-email?token=invalid-token');
    cy.wait('@verifyEmailFailed');

    cy.contains('Verification Failed').should('be.visible');
    cy.contains('Back to Sign Up').should('be.visible');
  });

  it('should handle missing token', () => {
    cy.intercept('POST', '/api/auth/verify-email*', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Invalid verification link'
      }
    }).as('verifyEmailNoToken');

    cy.visit('/verify-email');
    
    cy.contains(/invalid|error/i).should('be.visible');
  });

  it('should navigate to login on success', () => {
    cy.intercept('POST', '/api/auth/verify-email*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Email verified successfully'
      }
    }).as('verifyEmailSuccess');

    cy.visit('/verify-email?token=mock-token');
    cy.wait('@verifyEmailSuccess');

    cy.contains('Continue to Login').click();
    cy.url().should('include', '/login');
  });
});

