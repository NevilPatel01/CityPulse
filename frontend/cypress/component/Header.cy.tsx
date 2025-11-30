import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../src/components/layout/Header';

describe('Header Component', () => {
  it('should mount without crashing', () => {
    cy.mount(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    cy.get('body').should('exist');
  });
});
