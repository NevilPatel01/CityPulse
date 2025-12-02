/// <reference types="cypress" />

describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display landing page content', () => {
    cy.get('body').should('exist');
    cy.contains(/CityPulse|discover|travel/i).should('be.visible');
  });

  it('should have hero section', () => {
    cy.get('main').should('exist');
    cy.contains(/discover|explore|travel/i).should('be.visible');
  });

  it('should have feature grid section', () => {
    cy.contains(/feature|recommendation|buddy|search/i).should('be.visible');
  });

  it('should have call-to-action section', () => {
    cy.contains(/sign up|get started|join|start/i).should('be.visible');
  });

  it('should have navigation header', () => {
    cy.get('header').should('exist');
    cy.contains(/login|sign up|features|about/i).should('be.visible');
  });

  it('should have footer', () => {
    cy.get('footer').should('exist');
  });

  it('should navigate to login from landing page', () => {
    cy.viewport(1920, 1080);
    cy.contains('Login').click();
    cy.url().should('include', '/login');
  });

  it('should navigate to signup from landing page', () => {
    cy.viewport(1920, 1080);
    cy.contains('Sign Up').click();
    cy.url().should('include', '/signup');
  });

  it('should navigate to features page', () => {
    cy.viewport(1920, 1080);
    cy.contains('Features').click();
    cy.url().should('include', '/features');
  });

  it('should navigate to about page', () => {
    cy.viewport(1920, 1080);
    cy.contains('About').click();
    cy.url().should('include', '/about');
  });

  it('should display mobile menu on small screens', () => {
    cy.viewport(375, 667);
    cy.get('button[aria-label*="menu" i]').should('be.visible');
  });
});

