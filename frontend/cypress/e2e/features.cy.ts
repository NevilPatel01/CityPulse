/// <reference types="cypress" />

describe('Features Page', () => {
  beforeEach(() => {
    cy.visit('/features');
  });

  it('should display features page content', () => {
    cy.contains('Features').should('be.visible');
    cy.contains('transform').should('be.visible');
  });

  it('should display main features', () => {
    cy.contains('City Recommendations').should('be.visible');
    cy.contains('Travel Buddy Connections').should('be.visible');
    cy.contains('Advanced Search').should('be.visible');
    cy.contains('Travel History & Achievements').should('be.visible');
    cy.contains('Find Travel Companions').should('be.visible');
    cy.contains('Community Moderation').should('be.visible');
  });

  it('should display additional features', () => {
    cy.contains('Like & Save').should('be.visible');
    cy.contains('Personalized Feed').should('be.visible');
    cy.contains('Discovery Feeds').should('be.visible');
    cy.contains('Smart Filtering').should('be.visible');
    cy.contains('Travel Planning').should('be.visible');
  });

  it('should display how it works section', () => {
    cy.contains('How CityPulse Works').should('be.visible');
    cy.contains('Create Your Profile').should('be.visible');
    cy.contains('Share Recommendations').should('be.visible');
    cy.contains('Connect & Discover').should('be.visible');
    cy.contains('Track & Achieve').should('be.visible');
  });

  it('should have call-to-action section', () => {
    cy.contains('Ready to explore').should('be.visible');
    cy.contains('Start Your Journey').should('be.visible');
  });

  it('should have navigation to other pages', () => {
    cy.get('header').should('exist');
    cy.get('footer').should('exist');
  });
});

