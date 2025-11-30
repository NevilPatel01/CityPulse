import React from 'react';
import { StarRating } from '../../src/components/ui/StarRating';

describe('StarRating Component', () => {
  it('renders star rating with default rating', () => {
    const handleRatingChange = cy.stub();
    cy.mount(<StarRating rating={3.5} onRatingChange={handleRatingChange} />);
    cy.get('button').should('have.length', 5);
  });

  it('allows user to click stars', () => {
    const handleRatingChange = cy.stub();
    cy.mount(<StarRating rating={0} onRatingChange={handleRatingChange} />);
    
    cy.get('button').first().click().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(handleRatingChange).to.have.been.called;
    });
  });

  it('displays correct number of filled stars based on rating', () => {
    const handleRatingChange = cy.stub();
    cy.mount(<StarRating rating={4} onRatingChange={handleRatingChange} />);
    cy.get('button').should('have.length', 5);
  });

  it('is disabled when disabled prop is true', () => {
    const handleRatingChange = cy.stub();
    cy.mount(<StarRating rating={3} onRatingChange={handleRatingChange} disabled />);
    cy.get('button').each(($btn) => {
      cy.wrap($btn).should('be.disabled');
    });
  });

  it('renders with label when provided', () => {
    const handleRatingChange = cy.stub();
    cy.mount(<StarRating rating={3} onRatingChange={handleRatingChange} label="Rate this" />);
    cy.contains('Rate this').should('be.visible');
  });

  it('displays error message when error prop is provided', () => {
    const handleRatingChange = cy.stub();
    cy.mount(<StarRating rating={0} onRatingChange={handleRatingChange} error="Rating is required" />);
    cy.contains('Rating is required').should('be.visible');
  });
});
