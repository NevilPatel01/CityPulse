import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '../../src/components/layout/Footer';

describe('Footer Component', () => {
  it('renders footer element', () => {
    cy.mount(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    cy.get('footer').should('exist');
  });

  it('renders footer content', () => {
    cy.mount(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    cy.contains('CityPulse').should('be.visible');
  });

  it('renders copyright information', () => {
    cy.mount(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    cy.contains('2025').should('be.visible');
    cy.contains('CityPulse').should('be.visible');
  });
});
