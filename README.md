# CityPulse - Travel Social Network Platform

## Notes to remember
- As database schema is huge, try to add table as you need not all at once (Suggestion: Prof. Karen)

## 🌍 Project Tasks

### Milestone 1:
#### Week 1 (Sept 8) 
- [x] Setup Project Repo
- [x] configure development environment
- [x] Set up Git repository with initial commit
- [x] Setup PostgreSQL database connection
- [x] Create basic project structure (routes, controllers, models folders)
- [x] Implement basic user authentication (JWT, bcrypt, sessions, Google OAuth2)
- [x] complete frontend with auth forms (login/reset/signup)
- [x] Mobile-first responsive design setup with TailwindCSS
- [x] complete backend with auth api
- [x] complete unit tests for auth module using Jest
- [x] Basic user registration API endpoint with email validation
- [x] Begin accessibility tags (ARIA, alt text)

#### Week 2 (Sept 15)
- [x] User Profile Management (Basic profile setup, photo upload)
- [x] Image upload functionality with Multer
- [x] Image optimization and compression implementation
- [x] Add password reset & validation (regex, strong password)
- [x] Secure routes with JWT middleware
- [x] Parameterized SQL queries to prevent SQLi
- [x] Frontend validation and form accessibility
- [ ] Security tests: SQLi, XSS (OWASP ZAP)
- [x] Profile photo and cover photo management
- [x] Social media linking functionality
- [x] API endpoints for profile CRUD operations
- [x] Frontend React components for user registration and login

#### Week 3 (Sept 22)
- [x] Create and submit progress report and demo video
- [x] City and Category Management (Cities, Recommendation_Categories tables)
- [x] Basic recommendation creation functionality
- [x] Recommendation CRUD API endpoints
- [x] photo upload for recommendations
- [x] Frontend forms for recommendation creation
- [x] Basic search functionality implementation
- [ ] Integration tests for recommendation endpoints and E2E Test

### Milestone 2
#### Week 4 (Sept 29)
- [x] Advanced Search Implementation (multi-filter capability)
- [x] Search by location, category, price range, difficulty level
- [x] Tag system implementation (Recommendation_Tags, Tag_Links tables)
- [x] Search results pagination and infinite scroll
- [x] Frontend search interface with filter components
- [x] Database indexing for search optimization
- [x] Search performance testing and optimization

#### Week 5 (Oct 6)
- [x] Rating and Review System (Recommendation_Ratings table)
- [x] Like/Unlike functionality (Recommendation_Likes table)
- [x] User interaction tracking and analytics
- [x] Recommendation browsing and discovery feeds (Implemented personalized feed algorithm)
- [x] Content validation and sanitization (XSS protection)
- [x] SQL injection prevention testing
- [x] Frontend components for rating and reviewing

#### Week 6 (Oct 13)
- [x] Break Week: Catch-up, bug fixes, and refactoring
- [x] CI: GitHub Actions auto-run unit + integration + E2E tests (Note: Pipeline configured but test execution needs to be added to workflow)
- [ ] Add E2E test and Unit Test suite for remaining Test Cases (Social features, Feed, Comprehensive E2E)

#### Week 7 (Oct 20)
- [ ] Submit progress report + demo video
- [x] Deploy initial progress to hosting platform
- [x] Production environment setup
- [x] Database deployment and migration
- [x] Environment variables configuration
- [x] SSL certificate setup
- [x] Production testing and bug fixes

### Milestone 3 
#### Week 8 (Oct 27)
- [x] Begin implementing Travel Buddy System (Travel_Buddy_Connections table)
- [x] Connection request functionality
- [x] Accept/decline buddy requests
- [x] Privacy controls for social media sharing
- [x] User blocking and reporting system
- [x] Real-time notifications implementation (WebSocket with Socket.IO)
- [x] Frontend components for buddy management
- [x] Security testing for user connections with Unit Test and E2E test

#### Week 9
- [x] Trip Planning System (Trips, Trip_Cities, Trip_Companions tables)
- [x] Collaborative trip creation and management
- [x] Trip itinerary planning (Trip_Itinerary table)
- [x] Travel companion finder functionality
- [x] Trip sharing and privacy controls
- [x] Integration with recommendation system
- [x] Frontend trip planning interface

#### Week 10
- [x] Submit progress report + demo video
- [x] Achievement System (Achievements, User_Achievements tables)
- [x] Badge creation and tracking
- [x] Travel history tracking (User_City_Visits table)
- [x] User engagement metrics
- [x] Achievement notification system
- [x] Frontend achievement display components

#### Week 11 (Nov 17)
- [x] Milestone 4: Moderation System (Moderator_Actions, Content_Reports tables)
- [x] Content reporting functionality
- [x] Moderator dashboard for content review
- [x] User warning system (User_Warnings table)
- [x] Content removal and user management
- [x] Moderation queue and workflow
- [x] Admin analytics and reporting
- [ ] Security audit and penetration testing

#### Week 12 (Nov 17)
- [ ] Final polish: responsive layout, accessibility checks (Lighthouse/Axe)
- [ ] Recommendation algorithm optimization
- [x] Search history and saved searches (Search_History, Saved_Searches tables) - Backend API and Frontend UI implemented
- [x] Search history dropdown with auto-complete suggestions (shows matching history items while typing)
- [x] Full search history sidebar with date grouping (Today, Yesterday, This Week, Older)
- [x] Click history items to re-run searches with saved filters
- [x] Delete individual history items or clear all history
- [x] Keyboard navigation support (arrow keys, Enter, Escape)
- [x] Integrated into SearchInput, SearchBar, and AdvancedSearch components
- [x] Custom useSearchHistory hook for state management
- [ ] User favorites system (User_Favourites table)
- [ ] GitHub Actions: final test automation 
- [ ] critical bug fixes 
- [x] Test E2E and Unit Test of all the features - Comprehensive test suites added
- [ ] Run final CI/CD, test coverage reports, accessibility scan
- [ ] Accessibility compliance testing (WAVE, axe DevTools)
- [ ] Production deployment finalization
- [ ] Final deployment and tag release version

#### Week 13 (Dec 1)
- [ ] Write final report (include test, deployment, screenshots)
- [ ] Record and submit final demo video
- [ ] Showcase all major features + CI/CD, testing, accessibility

NOTE: I will add as I go. 

## 🛠 Technical Architecture

### Technology Stack
- **Frontend**: React.js with TailwindCSS
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt password hashing
- **Containerization**: Docker
- **File Upload**: Multer with image optimization
- **Testing**: Jest for API testing, React Testing Library for frontend
- **Deployment**: DigitalOcean

### Security Features
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization and validation
- **Session Security**: 15-minute timeout with secure JWT tokens
- **Password Security**: bcrypt hashing with strength validation
- **Data Protection**: Secure storage for personal information

## 🎨 User Interface

### Key Pages & URLs
- `/` - Landing page introduction
- `/signup` - New user registration
- `/login` - User authentication
- `/reset-password` - Reset Password
- `/dashboard` - Primary landing page after login

## Development URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- PostgreSQL: localhost:8080

## Production URLs
- Website: https://city-pulse.app
- API: https://api.city-pulse.app
- Health Check: https://api.city-pulse.app/health

*CityPulse - Connecting Travelers, Sharing Experiences, Building Communities* 🌍✈️

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/cqMWIy-z)

[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=18927558&assignment_repo_type=AssignmentRepo)