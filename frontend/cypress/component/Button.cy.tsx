import React from 'react';
import { Button } from '../../src/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    cy.mount(<Button>Click me</Button>);
    cy.contains('Click me').should('be.visible');
  });

  it('calls onClick when clicked', () => {
    const onClick = cy.stub();
    cy.mount(<Button onClick={onClick}>Click me</Button>);
    cy.contains('Click me').click().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(onClick).to.have.been.calledOnce;
    });
  });

  it('is disabled when disabled prop is true', () => {
    cy.mount(<Button disabled>Disabled Button</Button>);
    cy.contains('Disabled Button').should('be.disabled');
  });

  it('applies custom className', () => {
    cy.mount(<Button className="custom-class">Test</Button>);
    cy.contains('Test').should('have.class', 'custom-class');
  });

  it('shows loading state when isLoading is true', () => {
    cy.mount(<Button isLoading>Loading Button</Button>);
    cy.contains('Loading Button').should('be.disabled');
    // Verify loading spinner is visible
    cy.get('svg').should('be.visible');
  });

  it('renders all button variants', () => {
    const variants = ['default', 'outline', 'ghost', 'secondary'] as const;
    
    variants.forEach((variant) => {
      cy.mount(<Button variant={variant}>{variant} Button</Button>);
      cy.contains(`${variant} Button`).should('be.visible');
    });
  });

  it('renders all button sizes', () => {
    const sizes = ['sm', 'default', 'lg', 'icon'] as const;
    
    sizes.forEach((size) => {
      cy.mount(<Button size={size}>{size} Button</Button>);
      cy.contains(`${size} Button`).should('be.visible');
    });
  });

  it('supports keyboard navigation', () => {
    cy.mount(<Button>Keyboard Button</Button>);
    cy.contains('Keyboard Button').focus();
    cy.contains('Keyboard Button').should('be.focused');
    cy.focused().type('{enter}');
  });
});
