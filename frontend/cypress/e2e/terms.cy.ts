/// <reference types="cypress" />

describe('Terms of Service Page', () => {
  beforeEach(() => {
    cy.visit('/terms');
  });

  it('should display terms of service page', () => {
    cy.contains('Terms of Service').should('be.visible');
  });

  it('should display acceptance of terms section', () => {
    cy.contains('Acceptance of Terms').should('be.visible');
  });

  it('should display description of service section', () => {
    cy.contains('Description of Service').should('be.visible');
    cy.contains('travel social network platform').should('be.visible');
  });

  it('should display user accounts section', () => {
    cy.contains('User Accounts').should('be.visible');
    cy.contains('Account Creation').should('be.visible');
  });

  it('should display user content section', () => {
    cy.contains('User Content').should('be.visible');
    cy.contains('Content Guidelines').should('be.visible');
  });

  it('should display disclaimers section', () => {
    cy.contains('Disclaimers').should('be.visible');
    cy.contains('Travel Recommendations').should('be.visible');
  });

  it('should display academic project disclaimer', () => {
    cy.contains('Academic Project Disclaimer').should('be.visible');
  });

  it('should have navigation to other pages', () => {
    cy.get('header').should('exist');
    cy.get('footer').should('exist');
  });
});

