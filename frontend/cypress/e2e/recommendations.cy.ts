describe('Recommendations Flow', () => {
  beforeEach(() => {
    // Set up authentication
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
    
    // Mock recommendation detail endpoint
    cy.intercept('GET', '/api/recommendations/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Test Recommendation',
          description: 'Test description',
          category_name: 'Places',
          city_name: 'New York',
          likes_count: 10,
          views_count: 50
        }
      }
    }).as('getRecommendation');
    
    cy.visit('/explore');
    cy.wait('@authCheck');
  });

  it('should display recommendations in feed', () => {
    // Mock feed with recommendation post
    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: 1,
              title: 'Test Recommendation',
              category_name: 'Places',
              username: 'testuser',
              likes_count: 10,
              content_type: 'recommendation'
            }
          ],
          hasMore: false
        }
      }
    }).as('getFeed');
    
    cy.wait('@getFeed');
    cy.contains('Test Recommendation').should('be.visible');
  });

  it('should navigate to recommendation detail page', () => {
    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: 1,
              title: 'Test Recommendation',
              content_type: 'recommendation'
            }
          ],
          hasMore: false
        }
      }
    }).as('getFeed');
    
    cy.wait('@getFeed');
    cy.contains('Test Recommendation').click();
    cy.url().should('include', '/recommendations/1');
  });

  it('should like a recommendation', () => {
    // Intercept like endpoint
    cy.intercept('POST', '/api/recommendations/1/like', {
      statusCode: 200,
      body: { success: true, data: { liked: true, likes_count: 11 } }
    }).as('likeRecommendation');
    
    cy.visit('/recommendations/1');
    cy.wait('@getRecommendation');
    
    cy.get('button').contains(/like|heart/i).first().click();
    cy.wait('@likeRecommendation');
  });

  it('should bookmark a recommendation', () => {
    // Intercept bookmark endpoint
    cy.intercept('POST', '/api/recommendations/1/bookmark', {
      statusCode: 200,
      body: { success: true, data: { bookmarked: true } }
    }).as('bookmarkRecommendation');
    
    cy.visit('/recommendations/1');
    cy.wait('@getRecommendation');
    
    cy.get('button').contains(/save|bookmark/i).first().click();
    cy.wait('@bookmarkRecommendation');
  });

  it('should create a new recommendation', () => {
    // Intercept create recommendation endpoint
    cy.intercept('POST', '/api/recommendations', {
      statusCode: 201,
      body: {
        success: true,
        data: { id: 2, title: 'New Recommendation' }
      }
    }).as('createRecommendation');
    
    cy.visit('/create-recommendation');
    
    cy.get('input[name="title"], input[placeholder*="title" i]').first().type('New Recommendation');
    cy.get('textarea[name="description"], textarea[placeholder*="description" i]').first().type('This is a test recommendation');
    
    cy.get('button[type="submit"]').click();
    cy.wait('@createRecommendation');
    
    // Expect redirect to new recommendation or back to explore
    cy.url().should('satisfy', (url) => {
      return url.includes('/recommendations/2') || url.includes('/explore');
    });
  });
});
