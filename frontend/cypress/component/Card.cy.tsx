import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../../src/components/ui/card';

describe('Card Component', () => {
  it('renders card with children', () => {
    cy.mount(<Card>Card Content</Card>);
    cy.contains('Card Content').should('be.visible');
  });

  it('applies custom className', () => {
    cy.mount(<Card className="custom-class">Content</Card>);
    cy.get('.custom-class').should('exist');
  });

  it('renders as different HTML element when as prop is provided', () => {
    cy.mount(<Card as="article">Content</Card>);
    cy.get('article').should('exist');
  });

  it('handles click when isInteractive is true', () => {
    const onClick = cy.stub();
    cy.mount(
      <Card isInteractive onClick={onClick}>
        Clickable Card
      </Card>
    );
    
    cy.contains('Clickable Card').click().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(onClick).to.have.been.calledOnce;
    });
  });

  it('supports keyboard navigation when interactive', () => {
    const onClick = cy.stub();
    cy.mount(
      <Card isInteractive onClick={onClick}>
        Keyboard Card
      </Card>
    );
    
    cy.get('[role="button"]').focus();
    cy.focused().type('{enter}').then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(onClick).to.have.been.calledOnce;
    });
  });

  it('applies ARIA attributes when provided', () => {
    cy.mount(
      <Card ariaLabel="Test Card" ariaDescribedBy="desc-1">
        Content
      </Card>
    );
    cy.get('[aria-label="Test Card"]').should('exist');
    cy.get('[aria-describedby="desc-1"]').should('exist');
  });
});

describe('Card Subcomponents', () => {
  it('renders CardHeader', () => {
    cy.mount(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    );
    cy.contains('Header').should('be.visible');
  });

  it('renders CardContent', () => {
    cy.mount(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );
    cy.contains('Content').should('be.visible');
  });

  it('renders CardFooter', () => {
    cy.mount(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    cy.contains('Footer').should('be.visible');
  });
});
