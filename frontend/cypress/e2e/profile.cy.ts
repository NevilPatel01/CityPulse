describe('Profile Flow', () => {
  beforeEach(() => {
    // Authenticate to access profile pages
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User'
          }
        }
      }
    }).as('authCheck');
    
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });
  });

  it('should display user profile page', () => {
    // Mock profile API response
    cy.intercept('GET', '/api/profile/testuser', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            full_name: 'Test User',
            bio: 'Test bio'
          },
          recommendations: [],
          stats: {
            recommendations_count: 0,
            likes_count: 0,
            followers_count: 0
          }
        }
      }
    }).as('getProfile');
    
    cy.visit('/profile/testuser');
    cy.wait('@authCheck');
    cy.wait('@getProfile');
    
    cy.contains('Test User').should('be.visible');
    cy.contains('testuser').should('be.visible');
  });

  it('should display user recommendations', () => {
    // Mock profile with recommendations
    cy.intercept('GET', '/api/profile/testuser', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            full_name: 'Test User'
          },
          recommendations: [
            {
              id: 1,
              title: 'My Recommendation',
              category_name: 'Places',
              likes_count: 5
            }
          ],
          stats: {
            recommendations_count: 1,
            likes_count: 5,
            followers_count: 0
          }
        }
      }
    }).as('getProfile');
    
    cy.visit('/profile/testuser');
    cy.wait('@authCheck');
    cy.wait('@getProfile');
    
    cy.contains('My Recommendation').should('be.visible');
  });

  it('should allow editing own profile', () => {
    cy.intercept('GET', '/api/profile/testuser', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            full_name: 'Test User',
            bio: 'Current bio'
          }
        }
      }
    }).as('getProfile');
    
    cy.visit('/profile/testuser');
    cy.wait('@authCheck');
    cy.wait('@getProfile');
    
    // Check if Edit Profile button exists and click it
    cy.contains('Edit Profile').then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();
        cy.url().should('satisfy', (url) => {
          return url.includes('/edit') || url.includes('/settings');
        });
      }
    });
  });

  it('should display saved recommendations', () => {
    cy.intercept('GET', '/api/profile/testuser', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'testuser',
            full_name: 'Test User'
          },
          recommendations: []
        }
      }
    }).as('getProfile');
    
    // Mock saved recommendations endpoint
    cy.intercept('GET', '/api/profile/testuser/saved*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          recommendations: [
            {
              id: 1,
              title: 'Saved Recommendation',
              category_name: 'Food'
            }
          ]
        }
      }
    }).as('getSaved');
    
    cy.visit('/profile/testuser');
    cy.wait('@authCheck');
    cy.wait('@getProfile');
    
    cy.contains('Saved').click();
    cy.wait('@getSaved');
    
    cy.contains('Saved Recommendation').should('be.visible');
  });
});
