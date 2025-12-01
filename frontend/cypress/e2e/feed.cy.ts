describe('Feed Interactions - Like, Bookmark, Share', () => {
  let authToken: string;
  let userId: number;
  let recommendationId: number;

  before(() => {
    // Create test user and get auth token
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL') || 'http://localhost:5001'}/api/auth/signup`,
      body: {
        email: `cypress.feed.${Date.now()}@test.com`,
        username: `cyfeed_${Date.now()}`,
        password: 'Test123!@#',
        fullName: 'Cypress Feed User'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      authToken = response.body.data.accessToken || response.body.data.token;
      userId = response.body.data.user.id;

      // Create a test recommendation
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL') || 'http://localhost:5001'}/api/recommendations`,
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          place_name: 'Test Feed Recommendation',
          description: 'Test description for feed interactions',
          category_id: 1,
          city_name: 'Toronto',
          user_rating: 5
        }
      }).then((recResponse) => {
        recommendationId = recResponse.body.data.id;
      });
    });
  });

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', authToken);
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: userId,
            username: 'cyfeed',
            fullName: 'Cypress Feed User'
          }
        }
      }
    }).as('authCheck');
  });

  it('should like a recommendation', () => {
    cy.intercept('POST', `/api/recommendations/${recommendationId}/like`, {
      statusCode: 200,
      body: {
        success: true,
        message: 'Recommendation liked',
        data: {
          isLiked: true,
          likesCount: 1
        }
      }
    }).as('likeRecommendation');

    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: recommendationId,
              title: 'Test Feed Recommendation',
              description: 'Test description',
              likes_count: 0,
              isLiked: false,
              content_type: 'recommendation'
            }
          ],
          hasMore: false
        }
      }
    }).as('getFeed');

    cy.visit('/explore');
    cy.wait('@authCheck');
    cy.wait('@getFeed');

    // Find and click like button
    cy.get(`[data-testid="like-btn-${recommendationId}"], button[aria-label*="like" i], button:contains("Like")`).first().click();
    cy.wait('@likeRecommendation');

    cy.contains('liked').should('be.visible');
  });

  it('should unlike a recommendation', () => {
    cy.intercept('DELETE', `/api/recommendations/${recommendationId}/like`, {
      statusCode: 200,
      body: {
        success: true,
        message: 'Recommendation unliked',
        data: {
          isLiked: false,
          likesCount: 0
        }
      }
    }).as('unlikeRecommendation');

    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: recommendationId,
              title: 'Test Feed Recommendation',
              likes_count: 1,
              isLiked: true,
              content_type: 'recommendation'
            }
          ],
          hasMore: false
        }
      }
    }).as('getFeed');

    cy.visit('/explore');
    cy.wait('@authCheck');
    cy.wait('@getFeed');

    // Click unlike button
    cy.get(`[data-testid="like-btn-${recommendationId}"], button[aria-label*="like" i]`).first().click();
    cy.wait('@unlikeRecommendation');

    cy.contains('unliked').should('be.visible');
  });

  it('should bookmark a recommendation', () => {
    cy.intercept('POST', `/api/social/bookmarks/${recommendationId}`, {
      statusCode: 200,
      body: {
        success: true,
        message: 'Recommendation bookmarked',
        data: {
          isBookmarked: true
        }
      }
    }).as('bookmarkRecommendation');

    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: recommendationId,
              title: 'Test Feed Recommendation',
              isBookmarked: false,
              content_type: 'recommendation'
            }
          ],
          hasMore: false
        }
      }
    }).as('getFeed');

    cy.visit('/explore');
    cy.wait('@authCheck');
    cy.wait('@getFeed');

    // Click bookmark button
    cy.get(`[data-testid="bookmark-btn-${recommendationId}"], button[aria-label*="bookmark" i], button[aria-label*="save" i]`).first().click();
    cy.wait('@bookmarkRecommendation');

    cy.contains('bookmarked').should('be.visible');
  });

  it('should unbookmark a recommendation', () => {
    cy.intercept('POST', `/api/social/bookmarks/${recommendationId}`, {
      statusCode: 200,
      body: {
        success: true,
        message: 'Bookmark removed',
        data: {
          isBookmarked: false
        }
      }
    }).as('unbookmarkRecommendation');

    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: recommendationId,
              title: 'Test Feed Recommendation',
              isBookmarked: true,
              content_type: 'recommendation'
            }
          ],
          hasMore: false
        }
      }
    }).as('getFeed');

    cy.visit('/explore');
    cy.wait('@authCheck');
    cy.wait('@getFeed');

    // Click unbookmark button
    cy.get(`[data-testid="bookmark-btn-${recommendationId}"], button[aria-label*="bookmark" i], button[aria-label*="save" i]`).first().click();
    cy.wait('@unbookmarkRecommendation');

    cy.contains('removed').should('be.visible');
  });

  it('should share a recommendation', () => {
    cy.intercept('POST', `/api/recommendations/${recommendationId}/share`, {
      statusCode: 200,
      body: {
        success: true,
        message: 'Link copied to clipboard'
      }
    }).as('shareRecommendation');

    cy.intercept('GET', '/api/feed/**', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          posts: [
            {
              id: recommendationId,
              title: 'Test Feed Recommendation',
              content_type: 'recommendation'
            }
          ],
          hasMore: false
        }
      }
    }).as('getFeed');

    // Mock clipboard API
    cy.window().then((win) => {
      (win.navigator.clipboard as Clipboard).writeText = cy.stub().resolves();
    });

    cy.visit('/explore');
    cy.wait('@authCheck');
    cy.wait('@getFeed');

    // Click share button
    cy.get(`[data-testid="share-btn-${recommendationId}"], button[aria-label*="share" i]`).first().click();
    cy.wait('@shareRecommendation');

    cy.contains('copied').should('be.visible');
  });

  it('should display bookmarked recommendations', () => {
    cy.intercept('GET', '/api/social/bookmarks', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          recommendations: [
            {
              id: recommendationId,
              title: 'Test Feed Recommendation',
              description: 'Test description',
              category_name: 'Restaurant',
              city_name: 'Toronto'
            }
          ]
        }
      }
    }).as('getBookmarks');

    cy.visit('/profile');
    cy.wait('@authCheck');

    // Navigate to bookmarks/saved section
    cy.contains('Saved').click();
    cy.wait('@getBookmarks');

    cy.contains('Test Feed Recommendation').should('be.visible');
  });

  it('should complete full user journey from signup to content creation', () => {
    // This test covers the complete workflow
    const timestamp = Date.now();
    const testEmail = `journey.${timestamp}@test.com`;
    const testUsername = `journey_${timestamp}`;

    // Step 1: Signup
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL') || 'http://localhost:5001'}/api/auth/signup`,
      body: {
        email: testEmail,
        username: testUsername,
        password: 'Journey123!@#',
        fullName: 'Journey Test User'
      }
    }).then((signupResponse) => {
      expect(signupResponse.status).to.eq(201);
      const journeyToken = signupResponse.body.data.accessToken || signupResponse.body.data.token;
      const journeyUserId = signupResponse.body.data.user.id;

      cy.window().then((win) => {
        win.localStorage.setItem('token', journeyToken);
      });

      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: {
              id: journeyUserId,
              username: testUsername,
              fullName: 'Journey Test User'
            }
          }
        }
      }).as('authCheck');

      // Step 2: Visit dashboard/explore
      cy.visit('/explore');
      cy.wait('@authCheck');

      // Step 3: Create a recommendation
      cy.contains('Add Recommendation').click();
      cy.url().should('include', '/create-recommendation');

      // Mock recommendation creation
      cy.intercept('POST', '/api/recommendations', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 999,
            title: 'Journey Test Recommendation',
            description: 'Created during E2E journey test'
          }
        }
      }).as('createRecommendation');

      cy.get('input[name="place_name"], input[placeholder*="name" i]').type('Journey Test Place');
      cy.get('textarea[name="description"], textarea[placeholder*="description" i]').type('Test description');

      cy.get('button[type="submit"], button:contains("Create")').click();
      cy.wait('@createRecommendation');

      cy.contains('created').should('be.visible');
    });
  });
});

