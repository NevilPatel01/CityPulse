/// <reference types="cypress" />

describe('About Page', () => {
  beforeEach(() => {
    cy.visit('/about');
  });

  it('should display about page content', () => {
    cy.contains('About').should('be.visible');
    cy.contains('CityPulse').should('be.visible');
  });

  it('should display mission and vision sections', () => {
    cy.contains('Our Mission').should('be.visible');
    cy.contains('Our Vision').should('be.visible');
  });

  it('should display values section', () => {
    cy.contains('Our Values').should('be.visible');
    cy.contains('Authentic Experiences').should('be.visible');
    cy.contains('Real Connections').should('be.visible');
    cy.contains('Local Knowledge').should('be.visible');
    cy.contains('Quality Content').should('be.visible');
  });

  it('should display user roles section', () => {
    cy.contains('Who Uses CityPulse?').should('be.visible');
    cy.contains('Normal Traveler').should('be.visible');
    cy.contains('Community Moderator').should('be.visible');
  });

  it('should display contact information', () => {
    cy.contains('Get In Touch').should('be.visible');
    cy.contains('hello@citypulse.com').should('be.visible');
  });

  it('should have navigation to other pages', () => {
    cy.get('header').should('exist');
    cy.get('footer').should('exist');
  });
});

