import React from 'react';
import { Input } from '../../src/components/ui/input';

describe('Input Component', () => {
  it('renders input with label', () => {
    cy.mount(<Input label="Username" />);
    cy.get('label').contains('Username').should('be.visible');
    cy.get('input').should('exist');
  });

  it('displays error message when error prop is provided', () => {
    cy.mount(<Input label="Email" error="Invalid email" />);
    cy.contains('Invalid email').should('be.visible');
    cy.get('[role="alert"]').should('exist');
  });

  it('displays helper text when provided', () => {
    cy.mount(<Input label="Password" helperText="Must be at least 8 characters" />);
    cy.contains('Must be at least 8 characters').should('be.visible');
  });

  it('shows required indicator when isRequired is true', () => {
    cy.mount(<Input label="Email" isRequired />);
    cy.get('label').contains('Email');
    cy.get('[aria-label="required"]').should('exist');
  });

  it('calls onChange when user types', () => {
    cy.mount(<Input label="Test" />);
    cy.get('input').type('test input');
    cy.get('input').should('have.value', 'test input');
  });

  it('applies error styling when error is present', () => {
    cy.mount(<Input label="Test" error="Error message" />);
    cy.get('input').should('have.attr', 'aria-invalid', 'true');
  });

  it('is disabled when disabled prop is true', () => {
    cy.mount(<Input label="Test" disabled />);
    cy.get('input').should('be.disabled');
  });

  it('applies custom className', () => {
    cy.mount(<Input label="Test" className="custom-class" />);
    cy.get('input').should('have.class', 'custom-class');
  });

  it('supports different input types', () => {
    cy.mount(<Input label="Email" type="email" />);
    cy.get('input').should('have.attr', 'type', 'email');
    
    cy.mount(<Input label="Password" type="password" />);
    cy.get('input').should('have.attr', 'type', 'password');
  });
});
