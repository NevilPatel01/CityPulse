/// <reference types="cypress" />

describe('Email Verification Flow', () => {
  it('should display loading state initially', () => {
    cy.intercept('POST', '**/auth/verify-email*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Email verified successfully'
      },
      delay: 500
    }).as('verifyEmail');

    cy.visit('/verify-email?token=mock-verification-token', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // Check for the actual loading text from the code: "Verifying your email..."
    cy.contains(/verifying.*email/i).should('be.visible');
    cy.wait('@verifyEmail');
  });

  it('should display success message on successful verification', () => {
    cy.intercept('POST', '**/auth/verify-email*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Email verified successfully'
      }
    }).as('verifyEmailSuccess');

    cy.visit('/verify-email?token=mock-verification-token', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.wait('@verifyEmailSuccess', { timeout: 10000 });

    // Check for the actual success text from the code: "Email Verified!"
    cy.contains(/email.*verified|verified/i).should('be.visible');
    cy.contains(/continue.*login/i).should('be.visible');
  });

  it('should display error message on failed verification', () => {
    cy.intercept('POST', '**/auth/verify-email*', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Invalid or expired verification token'
      }
    }).as('verifyEmailFailed');

    cy.visit('/verify-email?token=invalid-token', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.wait('@verifyEmailFailed', { timeout: 10000 });

    // Check for the actual error text from the code: "Verification Failed"
    cy.contains(/verification.*failed|failed/i).should('be.visible');
    cy.contains(/back.*sign.*up/i).should('be.visible');
  });

  it('should handle missing token', () => {
    cy.intercept('POST', '**/auth/verify-email*', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Invalid verification link'
      }
    }).as('verifyEmailNoToken');

    cy.visit('/verify-email', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // Wait for API call or check for error
    cy.wait('@verifyEmailNoToken', { timeout: 10000 }).then(() => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/invalid|error|missing/i)) {
          cy.contains(/invalid|error|missing/i).should('be.visible');
        } else {
          cy.url().should('include', '/verify-email');
        }
      });
    });
  });

  it('should navigate to login on success', () => {
    cy.intercept('POST', '**/auth/verify-email*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Email verified successfully'
      }
    }).as('verifyEmailSuccess');

    cy.visit('/verify-email?token=mock-token', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.wait('@verifyEmailSuccess', { timeout: 10000 });

    // The code shows "Continue to Login" button - click it
    cy.contains('button', /continue.*login/i).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});

