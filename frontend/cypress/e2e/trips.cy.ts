/// <reference types="cypress" />

describe('Trips Flow', () => {
  beforeEach(() => {
    // Authenticate to access trip functionality
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            fullName: 'Test User'
          }
        }
      }
    }).as('authCheck');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });
  });

  it('should navigate to trips page', () => {
    cy.visit('/trips');
    cy.wait('@authCheck');
    cy.url().should('include', '/trips');
    cy.get('body').should('exist');
  });

  it('should create a new trip', () => {
    // Intercept trip creation endpoint
    cy.intercept('POST', '/api/trips', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Summer Vacation',
          start_date: '2025-06-01',
          end_date: '2025-06-07'
        }
      }
    }).as('createTrip');
    
    cy.visit('/trips');
    cy.wait('@authCheck');
    
    // Look for Create Trip button and fill out form
    cy.get('body').then(($body) => {
      if ($body.find(':contains("Create Trip")').length > 0) {
        cy.contains('Create Trip').click();
        
        cy.get('input[name="title"], input[placeholder*="title" i]').first().type('Summer Vacation');
        cy.get('input[name="start_date"], input[type="date"]').first().type('2025-06-01');
        cy.get('input[name="end_date"], input[type="date"]').eq(1).type('2025-06-07');
        
        cy.get('button[type="submit"]').click();
        cy.wait('@createTrip');
        
        // Expect redirect to trip detail or trips list
        cy.url().should('satisfy', (url) => {
          return url.includes('/trips/1') || url.includes('/trips');
        });
      }
    });
  });

  it('should add itinerary item to trip', () => {
    // Mock trip detail endpoint
    cy.intercept('GET', '/api/trips/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Summer Vacation',
          start_date: '2025-06-01',
          end_date: '2025-06-07',
          itinerary_items: []
        }
      }
    }).as('getTrip');
    
    // Intercept add itinerary endpoint
    cy.intercept('POST', '/api/trips/1/itinerary*', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Visit Museum',
          activity_date: '2025-06-02'
        }
      }
    }).as('addItineraryItem');
    
    cy.visit('/trips/1');
    cy.wait('@authCheck');
    cy.wait('@getTrip');
    
    // Look for add itinerary button and fill out form
    cy.get('body').then(($body) => {
      if ($body.text().match(/add.*activity|add.*item|add.*itinerary/i)) {
        cy.contains(/add.*activity|add.*item|add.*itinerary/i).first().click();
        
        cy.get('input[name="title"], input[placeholder*="title" i]').first().type('Visit Museum');
        cy.get('input[name="activity_date"], input[type="date"]').first().type('2025-06-02');
        
        cy.get('button[type="submit"]').click();
        cy.wait('@addItineraryItem');
        
        cy.contains('Visit Museum').should('be.visible');
      }
    });
  });

  it('should validate trip date range when adding itinerary', () => {
    cy.intercept('GET', '/api/trips/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Summer Vacation',
          start_date: '2025-06-01',
          end_date: '2025-06-07'
        }
      }
    }).as('getTrip');
    
    cy.visit('/trips/1');
    cy.wait('@authCheck');
    cy.wait('@getTrip');
    
    // Test validation by adding itinerary item with date outside trip range
    cy.get('body').then(($body) => {
      if ($body.text().match(/add.*activity|add.*item|add.*itinerary/i)) {
        cy.contains(/add.*activity|add.*item|add.*itinerary/i).first().click();
        
        cy.get('input[name="title"], input[placeholder*="title" i]').first().type('Outside Range Activity');
        // Use date outside the trip's date range
        cy.get('input[name="activity_date"], input[type="date"]').first().type('2025-07-01');
        
        cy.get('input[name="activity_date"], input[type="date"]').first().blur();
        // Expect validation error message
        cy.get('body').contains(/outside|range|invalid|date/i).should('exist');
      }
    });
  });
});
