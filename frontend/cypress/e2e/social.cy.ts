/// <reference types="cypress" />

describe('Social Features Workflow - Buddy Connections', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: string;
  let user1Username: string;
  let user2Username: string;

  before(() => {
    // Create test users via API
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL') || 'http://localhost:5001'}/api/auth/signup`,
      body: {
        email: `cypress.user1.${Date.now()}@test.com`,
        username: `cyuser1_${Date.now()}`,
        password: 'Test123!@#',
        fullName: 'Cypress User One'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      user1Token = response.body.data.accessToken || response.body.data.token;
      user1Id = response.body.data.user.id;
      user1Username = response.body.data.user.username;
    });

    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL') || 'http://localhost:5001'}/api/auth/signup`,
      body: {
        email: `cypress.user2.${Date.now()}@test.com`,
        username: `cyuser2_${Date.now()}`,
        password: 'Test123!@#',
        fullName: 'Cypress User Two'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      user2Token = response.body.data.accessToken || response.body.data.token;
      user2Id = response.body.data.user.id;
      user2Username = response.body.data.user.username;
    });
  });

  beforeEach(() => {
    // Set up authentication for user1
    cy.window().then((win) => {
      win.localStorage.setItem('token', user1Token);
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: user1Id,
            username: user1Username,
            fullName: 'Cypress User One'
          }
        }
      }
    }).as('authCheck');
  });

  it('should send buddy request from user1 to user2', () => {
    cy.visit('/buddies');
    cy.wait('@authCheck');

    // Mock the send buddy request API
    cy.intercept('POST', '/api/buddies/request', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Buddy request sent successfully',
        data: {
          request: {
            id: 1,
            requester_id: user1Id,
            requested_id: user2Id,
            status: 'pending'
          }
        }
      }
    }).as('sendRequest');

    // Click on "Find Buddies" or search for user2
    cy.contains('Find Buddies').click();
    cy.wait(500);

    // Search for user2
    cy.get('input[placeholder*="search" i], input[placeholder*="username" i]').type(user2Username);
    cy.wait(500);

    // Mock search results
    cy.intercept('GET', '/api/search/users*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          users: [
            {
              id: user2Id,
              username: user2Username,
              fullName: 'Cypress User Two',
              profile_photo_url: null
            }
          ]
        }
      }
    }).as('searchUsers');

    cy.wait('@searchUsers');

    // Click send request button
    cy.contains('Send Request').click();
    cy.wait('@sendRequest');

    cy.contains('Buddy request sent').should('be.visible');
  });

  it('should display pending buddy requests', () => {
    // Switch to user2 context
    cy.window().then((win) => {
      win.localStorage.setItem('token', user2Token);
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: user2Id,
            username: user2Username,
            fullName: 'Cypress User Two'
          }
        }
      }
    }).as('authCheck2');

    cy.intercept('GET', '/api/buddies/pending', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            requester_id: user1Id,
            requester: {
              username: user1Username,
              fullName: 'Cypress User One'
            },
            request_message: null,
            status: 'pending',
            requested_at: new Date().toISOString()
          }
        ]
      }
    }).as('getPendingRequests');

    cy.visit('/buddies');
    cy.wait('@authCheck2');

    // Navigate to pending requests
    cy.contains('Pending Requests').click();
    cy.wait('@getPendingRequests');

    // Verify request is displayed
    cy.contains(user1Username).should('be.visible');
    cy.contains('Cypress User One').should('be.visible');
  });

  it('should accept buddy request', () => {
    // Continue with user2 context
    cy.window().then((win) => {
      win.localStorage.setItem('token', user2Token);
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: user2Id,
            username: user2Username
          }
        }
      }
    }).as('authCheck2');

    cy.intercept('POST', '/api/buddies/accept/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Buddy request accepted'
      }
    }).as('acceptRequest');

    cy.intercept('GET', '/api/buddies/pending', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            requester_id: user1Id,
            requester: {
              username: user1Username,
              fullName: 'Cypress User One'
            },
            status: 'pending'
          }
        ]
      }
    }).as('getPendingRequests');

    cy.visit('/buddies');
    cy.wait('@authCheck2');

    cy.contains('Pending Requests').click();
    cy.wait('@getPendingRequests');

    // Click accept button
    cy.contains('Accept').click();
    cy.wait('@acceptRequest');

    cy.contains('accepted').should('be.visible');
  });

  it('should decline buddy request', () => {
    // Create another user for decline test
    cy.window().then((win) => {
      win.localStorage.setItem('token', user1Token);
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: user1Id,
            username: user1Username
          }
        }
      }
    }).as('authCheck');

    cy.intercept('POST', '/api/buddies/request', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          request: {
            id: 2,
            requester_id: user1Id,
            requested_id: user2Id,
            status: 'pending'
          }
        }
      }
    }).as('sendRequest');

    cy.intercept('POST', '/api/buddies/decline/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Buddy request declined'
      }
    }).as('declineRequest');

    cy.intercept('GET', '/api/buddies/pending', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 2,
            requester_id: user1Id,
            requester: {
              username: user1Username,
              fullName: 'Cypress User One'
            },
            status: 'pending'
          }
        ]
      }
    }).as('getPendingRequests');

    // Switch to user2 to decline
    cy.window().then((win) => {
      win.localStorage.setItem('token', user2Token);
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: user2Id,
            username: user2Username
          }
        }
      }
    }).as('authCheck2');

    cy.visit('/buddies');
    cy.wait('@authCheck2');

    cy.contains('Pending Requests').click();
    cy.wait('@getPendingRequests');

    // Click decline button
    cy.contains('Decline').click();
    cy.wait('@declineRequest');

    cy.contains('declined').should('be.visible');
  });

  it('should view connected buddies list', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', user1Token);
    });

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: user1Id,
            username: user1Username
          }
        }
      }
    }).as('authCheck');

    cy.intercept('GET', '/api/buddies', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: user2Id,
            username: user2Username,
            fullName: 'Cypress User Two',
            profile_photo_url: null,
            status: 'accepted'
          }
        ]
      }
    }).as('getBuddies');

    cy.visit('/buddies');
    cy.wait('@authCheck');

    cy.wait('@getBuddies');

    // Verify connected buddy is displayed
    cy.contains(user2Username).should('be.visible');
    cy.contains('Cypress User Two').should('be.visible');
  });
});

