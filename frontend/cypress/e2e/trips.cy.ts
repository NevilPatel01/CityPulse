/// <reference types="cypress" />

describe('Trips Flow', () => {
  beforeEach(() => {
    // Authenticate to access trip functionality
    // Intercept both possible auth endpoints
    cy.intercept('GET', '**/api/auth/profile*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            fullName: 'Test User',
            email: 'test@example.com'
          }
        }
      }
    }).as('authCheck');
    
    cy.intercept('GET', '**/api/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            fullName: 'Test User',
            email: 'test@example.com'
          }
        }
      }
    }).as('authCheckMe');
    
    // Mock trips API endpoints - handle both with and without query params
    cy.intercept('GET', '**/api/trips**', {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('getTrips');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
      win.localStorage.setItem('authToken', 'mock-token');
    });
  });

  it('should navigate to trips page', () => {
    cy.visit('/trips', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    // Wait a bit for page to load, then verify URL
    cy.wait(1000);
    cy.url().should('include', '/trips');
  });

  it('should create a new trip', () => {
    // Intercept trip creation endpoint
    cy.intercept('POST', '**/api/trips', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 1,
          user_id: 1,
          title: 'Summer Vacation',
          description: 'A fun summer trip',
          start_date: '2025-06-01',
          end_date: '2025-06-07',
          status: 'planning',
          privacy: 'buddies_only',
          currency: 'USD',
          is_collaborative: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      }
    }).as('createTrip');
    
    // Intercept the trips list refresh after creation
    cy.intercept('GET', '**/api/trips**', {
      statusCode: 200,
      body: {
        success: true,
        data: [{
          id: 1,
          user_id: 1,
          title: 'Summer Vacation',
          description: 'A fun summer trip',
          start_date: '2025-06-01',
          end_date: '2025-06-07',
          status: 'planning',
          privacy: 'buddies_only',
          currency: 'USD',
          is_collaborative: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }]
      }
    }).as('getTripsAfterCreate');
    
    cy.visit('/trips', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    // Wait a bit for page to load
    cy.wait(1000);
    
    // Click the "Create Trip" button - exact text match
    cy.contains('button', 'Create Trip').should('be.visible').click();
    
    // Wait for form modal to appear - check for "Create New Trip" title
    cy.contains('h2', 'Create New Trip').should('be.visible');
    
    // Fill out the form - the form has name="title", name="start_date", name="end_date", name="description"
    cy.get('input[name="title"]').should('be.visible').type('Summer Vacation');
    cy.get('textarea[name="description"]').should('be.visible').type('A fun summer trip');
    cy.get('input[name="start_date"]').should('be.visible').type('2025-06-01');
    cy.get('input[name="end_date"]').should('be.visible').type('2025-06-07');
    
    // Submit the form - button text is "Create Trip"
    cy.contains('button[type="submit"]', 'Create Trip').should('be.visible').click();
    cy.wait('@createTrip', { timeout: 10000 });
    
    // Wait for trips list to refresh
    cy.wait('@getTripsAfterCreate', { timeout: 10000 });
    
    // Verify the trip appears in the list or form closes (stays on trips page)
    cy.url().should('include', '/trips');
    // The form should close, so the modal should not be visible
    cy.contains('h2', 'Create New Trip').should('not.exist');
  });

  it('should add itinerary item to trip', () => {
    // Mock trip detail endpoint
    cy.intercept('GET', '**/api/trips/1**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          user_id: 1,
          title: 'Summer Vacation',
          description: 'A fun summer trip',
          start_date: '2025-06-01T00:00:00Z',
          end_date: '2025-06-07T00:00:00Z',
          status: 'planning',
          privacy: 'buddies_only',
          currency: 'USD',
          is_collaborative: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          itinerary_items: []
        }
      }
    }).as('getTrip');
    
    // Intercept add itinerary endpoint
    cy.intercept('POST', '**/api/trips/1/itinerary**', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Visit Museum',
          activity_date: '2025-06-02',
          day_number: 1
        }
      }
    }).as('addItineraryItem');
    
    cy.visit('/trips/1', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    // Wait for trip data to load
    cy.wait('@getTrip', { timeout: 10000 });
    cy.wait(1000); // Wait for page to render
    
    // Set up intercept for trip reload after adding itinerary item (after first request completes)
    cy.intercept('GET', '**/api/trips/1**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          user_id: 1,
          title: 'Summer Vacation',
          description: 'A fun summer trip',
          start_date: '2025-06-01T00:00:00Z',
          end_date: '2025-06-07T00:00:00Z',
          status: 'planning',
          privacy: 'buddies_only',
          currency: 'USD',
          is_collaborative: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          itinerary_items: [{
            id: 1,
            trip_id: 1,
            title: 'Visit Museum',
            activity_date: '2025-06-02',
            day_number: 1,
            activity_type: 'sightseeing',
            status: 'planned',
            added_by: 1,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }]
        }
      }
    }).as('getTripAfterAdd');
    
    // Click on the Itinerary tab first
    cy.contains('button', 'Itinerary').should('be.visible').click();
    cy.wait(500);
    
    // Look for "Add Activity" button - exact text match
    cy.contains('button', 'Add Activity').should('be.visible').click();
    
    // Wait for modal to appear - check for "Add Activity" title
    cy.contains('h2', 'Add Activity').should('be.visible');
    
    // Fill out the form - find inputs by their order or labels
    // Title input - first text input in the form
    cy.get('input[type="text"]').first().should('be.visible').clear().type('Visit Museum');
    
    // Day number is required - first number input
    cy.get('input[type="number"]').first().should('be.visible').clear().type('1');
    
    // Date input - first date input
    cy.get('input[type="date"]').first().should('be.visible').clear().type('2025-06-02');
    
    // Submit the form - button text is "Add Activity"
    cy.contains('button[type="submit"]', 'Add Activity').should('be.visible').click();
    cy.wait('@addItineraryItem', { timeout: 10000 });
    
    // Wait for trip to reload
    cy.wait('@getTripAfterAdd', { timeout: 10000 });
    cy.wait(1000); // Wait for UI to update
    
    // Verify we're still on the trip page and modal is closed
    cy.url().should('include', '/trips/1');
    cy.contains('h2', 'Add Activity').should('not.exist');
  });

  it('should validate trip date range when adding itinerary', () => {
    cy.intercept('GET', '**/api/trips/1**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          user_id: 1,
          title: 'Summer Vacation',
          description: 'A fun summer trip',
          start_date: '2025-06-01T00:00:00Z',
          end_date: '2025-06-07T00:00:00Z',
          status: 'planning',
          privacy: 'buddies_only',
          currency: 'USD',
          is_collaborative: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          itinerary_items: []
        }
      }
    }).as('getTrip');
    
    cy.visit('/trips/1', { timeout: 20000 });
    cy.get('body', { timeout: 10000 }).should('be.visible');
    // Wait for trip data to load
    cy.wait('@getTrip', { timeout: 10000 });
    cy.wait(1000); // Wait for page to render
    
    // Click on the Itinerary tab first
    cy.contains('button', 'Itinerary').should('be.visible').click();
    cy.wait(500);
    
    // Test validation by adding itinerary item with date outside trip range
    // Click "Add Activity" button - exact text match
    cy.contains('button', 'Add Activity').should('be.visible').click();
    
    // Wait for modal to appear - check for "Add Activity" title
    cy.contains('h2', 'Add Activity').should('be.visible');
    
    // Fill out the form
    cy.get('input[type="text"]').first().should('be.visible').clear().type('Outside Range Activity');
    cy.get('input[type="number"]').first().should('be.visible').clear().type('1');
    
    // Use date outside the trip's date range - the code validates this on blur
    // Set the date value directly using invoke to bypass browser date input restrictions
    // (July 1, 2025 when trip is June 1-7)
    cy.get('input[type="date"]').first().should('be.visible').invoke('val', '2025-07-01').trigger('change').trigger('blur');
    
    // Wait a bit for validation to run (the code validates on blur)
    cy.wait(1000);
    
    // Expect validation error message - the code shows: "⚠️ This date is outside your trip date range"
    // The error message format is: "⚠️ This date is outside your trip date range (Jun 1, 2025 - Jun 7, 2025). Please select a date within this range."
    cy.contains(/⚠️.*outside.*trip.*date.*range|outside.*trip.*range|⚠/i).should('be.visible');
  });
});
