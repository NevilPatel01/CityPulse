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

### Week 2 (Sept 15)
- [x] User Profile Management (Basic profile setup, photo upload)
- [ ] Image upload functionality with Multer
- [ ] Image optimization and compression implementation
- [x] Add password reset & validation (regex, strong password)
- [x] Secure routes with JWT middleware
- [x] Parameterized SQL queries to prevent SQLi
- [x] Frontend validation and form accessibility
- [ ] Security tests: SQLi, XSS (OWASP ZAP)
- [x] Profile photo and cover photo management
- [x] Social media linking functionality
- [x] API endpoints for profile CRUD operations
- [x] Frontend React components for user registration and login

### Week 3 (Sept 22)
- [x] Create and submit progress report and demo video
- [x] City and Category Management (Cities, Recommendation_Categories tables)
- [ ] Basic recommendation creation functionality
- [x] Recommendation CRUD API endpoints
- [ ] photo upload for recommendations
- [ ] Frontend forms for recommendation creation
- [x] Basic search functionality implementation
- [ ] Integration tests for recommendation endpoints and E2E Test


NOTE: I will add as I go. 

## 🛠 Technical Architecture

### Technology Stack
- **Frontend**: React.js with TailwindCSS
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt password hashing
- **Containerization**: Docker
- **File Upload**: Multer with image optimization
- **Testing**: Jestfor API testing, React Testing Library for frontend
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

## Localhost URL
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- PostgreSQL: localhost:8080

*CityPulse - Connecting Travelers, Sharing Experiences, Building Communities* 🌍✈️

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/cqMWIy-z)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=18927558&assignment_repo_type=AssignmentRepo)
