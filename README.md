<div align="center">

# 🌍 CityPulse

### *Connecting Travelers, Sharing Experiences, Building Communities*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-city--pulse.app-4CAF50?style=for-the-badge)](https://city-pulse.app)
[![API Status](https://img.shields.io/badge/🚀_API-Online-success?style=for-the-badge)](https://api.city-pulse.app/health)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**A comprehensive social network platform for travelers to discover, share, and plan authentic city experiences**

[Features](#-key-features) • [Tech Stack](#-technology-stack) • [Getting Started](#-getting-started) • [Architecture](#-system-architecture) • [DevOps](#-deployment)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Testing](#-testing)
- [DevOps & Deployment](#-deployment)
- [Security & Accessibility](#-security--accessibility)
- [Project Statistics](#-project-statistics)

---

## 🎯 Overview

**CityPulse** is a full-stack web application designed to revolutionize how travelers discover and share authentic city experiences. Built as a Software Development Capstone project, it combines modern web technologies with robust security practices and comprehensive testing.

### 🎭 The Problem We Solve

Traditional travel guides often miss the authentic, local experiences that make each city unique. CityPulse bridges this gap by:

- 🗺️ **Enabling** travelers to share genuine recommendations beyond tourist traps
- 🤝 **Connecting** like-minded travelers through a Travel Buddy system
- 📅 **Facilitating** collaborative trip planning with detailed itineraries
- 🏆 **Gamifying** travel experiences through achievements and badges
- 🛡️ **Maintaining** community quality through robust moderation tools

### 👥 User Roles

**Travelers** - Create recommendations, connect with buddies, plan trips, and earn achievements

**Moderators** - Review reports, manage content, issue warnings, and maintain community standards

---

## ✨ Key Features

<details open>
<summary><b>🔐 Authentication & Account Management</b></summary>

- ✅ Secure registration with email verification
- ✅ JWT-based authentication (15-minute sessions)
- ✅ Google OAuth 2.0 integration
- ✅ Password reset with 6-digit security codes
- ✅ Remember Me with refresh tokens
- ✅ Account deactivation & reactivation
- ✅ GDPR-compliant data deletion requests

</details>

<details>
<summary><b>👤 User Profile Management</b></summary>

- ✅ Comprehensive profile customization
- ✅ Profile & cover photo upload with cropping
- ✅ Social media integration (Instagram, Facebook, LinkedIn, etc.)
- ✅ Travel preferences & interests
- ✅ Privacy controls (profile visibility, location sharing)
- ✅ Cities visited tracking with statistics
- ✅ Profile completion indicator

</details>

<details>
<summary><b>🏙️ City Recommendations System</b></summary>

- ✅ Create rich recommendations with:
  - Title, description, category, location (lat/long)
  - Up to 5 photos with captions & reordering
  - Price range, difficulty level, duration
  - Best time to visit & seasonal tips
- ✅ Full CRUD operations for own content
- ✅ Visibility controls (public/private/friends-only)
- ✅ Category tagging (food, attractions, nature, entertainment)

</details>

<details>
<summary><b>🔍 Advanced Search & Discovery</b></summary>

- ✅ Multi-filter search (location, category, price, difficulty, tags)
- ✅ Real-time autocomplete with search history
- ✅ Saved searches for quick access
- ✅ Infinite scroll pagination
- ✅ Sort by relevance, rating, date, popularity
- ✅ Date range filtering
- ✅ Keyboard navigation support

</details>

<details>
<summary><b>💬 Content Interaction</b></summary>

- ✅ Like/Unlike with real-time counters
- ✅ Save/Bookmark to personal collections
- ✅ Star ratings (1-5 stars)
- ✅ View count tracking
- ✅ Social media sharing
- ✅ Content reporting system

</details>

<details>
<summary><b>🤝 Travel Buddy System</b></summary>

- ✅ Send/accept/decline connection requests
- ✅ View connected buddies list
- ✅ Access social media links (connections only)
- ✅ Real-time buddy request notifications
- ✅ Block & report users
- ✅ Privacy-first contact sharing

</details>

<details>
<summary><b>✈️ Trip Planning Features</b></summary>

- ✅ Create collaborative trips with:
  - Trip name, dates, destinations, description
  - Multi-city itinerary support
  - Day-by-day activity planning
- ✅ Add travel companions
- ✅ Link saved recommendations to trips
- ✅ Trip privacy controls
- ✅ Companion finder feature
- ✅ Share trips with non-users

</details>

<details>
<summary><b>🏆 Achievement System</b></summary>

- ✅ Unlock badges based on milestones
- ✅ Visual progress tracking
- ✅ AI-generated badge images
- ✅ Display badges on profile
- ✅ Real-time unlock notifications
- ✅ Leaderboard for top contributors
- ✅ Multiple achievement types (cities visited, recommendations created, likes received)

</details>

<details>
<summary><b>📱 Personalized Experience</b></summary>

- ✅ Algorithm-based personalized feed
- ✅ Discovery feeds (trending, popular, seasonal)
- ✅ Real-time WebSocket notifications
- ✅ Activity history tracking
- ✅ User engagement metrics

</details>

<details>
<summary><b>🛡️ Moderation System</b></summary>

- ✅ Dedicated moderator dashboard
- ✅ Content report queue with review workflow
- ✅ Approve/reject reports with notes
- ✅ Remove inappropriate content
- ✅ Three-tier warning system
- ✅ Temporary suspensions with durations
- ✅ Permanent bans with appeal process
- ✅ User reinstatement capabilities
- ✅ Complete audit trail of moderation actions

</details>

---

## 🚀 Technology Stack

### **Frontend**
```
React 19.1.1                  - Modern UI framework
React Router Dom 7.9.1        - Client-side routing
TailwindCSS 4.1.13           - Utility-first CSS framework
Vite                          - Lightning-fast build tool
Socket.io-client 4.8.1       - Real-time WebSocket communication
Lucide React 0.544.0         - Beautiful icon library
React Easy Crop 5.5.5        - Image cropping functionality
Cypress                       - E2E testing framework
```

### **Backend**
```
Node.js                       - Runtime environment
Express.js                    - Web application framework
TypeScript                    - Type-safe JavaScript
PostgreSQL                    - Relational database
JWT & bcrypt                  - Authentication & encryption
Socket.io 4.8.1              - WebSocket server
Multer                        - File upload handling
Sharp                         - Image processing & optimization
SendGrid                      - Email service
Jest                          - Unit & integration testing
```

### **DevOps & Infrastructure**
```
Docker & Docker Compose       - Containerization
GitHub Actions                - CI/CD pipelines
DigitalOcean                  - Cloud hosting
Nginx                         - Reverse proxy & load balancing
SSL/TLS                       - Secure HTTPS connections
pnpm                          - Fast, disk-efficient package manager
```

### **Security & Quality**
```
OWASP ZAP                     - Security testing
Axe & Lighthouse             - Accessibility auditing
ESLint & Prettier            - Code quality & formatting
Parameterized SQL queries     - SQL injection prevention
Helmet.js                     - Security headers
Rate limiting                 - DDoS protection
```

---

## 🏗️ System Architecture

### **High-Level Architecture**


```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CI/CD PIPELINE (GitHub Actions)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Code   │→ │  Lint &  │→ │   Test   │→ │  Build   │→ │  Deploy  │       │
│  │   Push   │  │  Format  │  │ (230+ )  │  │  Docker  │  │  to Prod │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│       Security Scanning (OWASP ZAP) • Accessibility Audits (Axe/Lighthouse) │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT (DigitalOcean)                     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │                    CLOUDFLARE CDN                                  │      │
│  │              DNS • DDoS Protection • Edge Caching                  │      │
│  └─────────────────────────────┬──────────────────────────────────────┘      │
│                                 │                                            │
│  ┌──────────────────────────────▼──────────────────────────────────────┐     │
│  │                    NGINX REVERSE PROXY                              │     │
│  │  • SSL/TLS Termination (Let's Encrypt)  • Load Balancing            │     │
│  │  • Rate Limiting  • Gzip Compression  • Static File Serving         │     │
│  └───────────────────┬─────────────────────┬────────────────────────────┘    │
│                      │                     │                                 │
│        ┌─────────────▼──────────┐  ┌──────▼────────────────┐                 │
│        │   FRONTEND CONTAINER    │  │   BACKEND CONTAINER    │               │
│        │  ┌──────────────────┐  │  │  ┌─────────────────┐  │                 │
│        │  │  React SPA       │  │  │  │  Express.js API │  │                 │
│        │  │  • Vite Build    │  │  │  │  • TypeScript   │  │                 │
│        │  │  • TailwindCSS   │  │  │  │  • REST Routes  │  │                 │
│        │  │  • React Router  │  │  │  │  • Middleware   │  │                 │
│        │  └──────────────────┘  │  │  └─────────────────┘  │                 │
│        │  Port: 3001            │  │  ┌─────────────────┐  │                 │
│        └────────────────────────┘  │  │  Socket.io WSS  │  │                 │
│                                     │  │  • Real-time    │  │                │
│                                     │  │  • Notifications│  │                │
│                                     │  └─────────────────┘  │                │
│                                     │  Port: 5001           │                │
│                                     └───────────┬───────────┘                │
│                                                 │                            │
│  ┌──────────────────────────────────────────────▼───────────────────────┐    │
│  │                    DATABASE LAYER (PostgreSQL 14+)                   │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │  📊 21+ Tables  •  Indexed  •  Parameterized Queries           │  │    │
│  │  ├────────────────────────────────────────────────────────────────┤  │    │
│  │  │  • Users & Authentication    • Recommendations & Media         │  │    │
│  │  │  • Trip Planning & Itinerary • Social Connections              │  │    │
│  │  │  • Achievements & Badges     • Content Moderation              │  │    │
│  │  │  • Notifications & Alerts    • Activity Tracking               │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │  Managed Service • Automated Backups • Point-in-Time Recovery        │    │
│  └────────────────────────────────────────────────────────────────────--┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │                    FILE STORAGE & SERVICES                         │      │
│  │  • Multer File Uploads  • Sharp Image Processing                   │      │
│  │  • SendGrid Email Service  • Local/Volume Storage                  │      │
│  └────────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────-┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTAINERIZATION (Docker)                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  frontend:prod   │  │  backend:prod    │  │  postgres:14     │           │
│  │  Multi-stage     │  │  Multi-stage     │  │  Official Image  │           │
│  │  Optimized Build │  │  Optimized Build │  │  + Custom Schema │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│           Docker Compose Orchestration • Volume Management                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING & SECURITY (DevOps Best Practices)            │
│  • Health Check Endpoints (/health)  • Automated Logging                    │
│  • JWT Token Management (15min expiry)  • Rate Limiting                     │
│  • SQL Injection Protection (Parameterized)  • XSS Prevention               │
│  • CORS Configuration  • Helmet.js Security Headers                         │
│  • Environment Variable Management  • Secret Management                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Technology Stack Breakdown**

#### **Frontend Architecture**
- **React 19.1** with functional components and hooks
- **React Router v7** for client-side routing
- **TailwindCSS v4** for responsive, utility-first styling
- **Vite** for fast development and optimized production builds
- **Socket.io Client** for real-time bidirectional communication

#### **Backend Architecture**
- **Node.js + Express.js** RESTful API server
- **TypeScript** for type safety and better developer experience
- **PostgreSQL 14+** with 21 normalized tables
- **Socket.io Server** for WebSocket connections
- **JWT Authentication** with bcrypt password hashing
- **Multer + Sharp** for file uploads and image processing

#### **DevOps & Infrastructure**
- **Docker Multi-Stage Builds** for optimized container images
- **Docker Compose** for orchestrating microservices
- **Nginx** as reverse proxy with SSL/TLS termination
- **GitHub Actions** for automated CI/CD pipelines
- **DigitalOcean** for cloud hosting and managed PostgreSQL
- **Let's Encrypt** for free, automated SSL certificates

### **Database Schema Overview**

- **21+ Tables** with proper normalization and indexing
- **Core Entities**: Users, Recommendations, Trips, Achievements
- **Social Features**: Buddy Connections, Likes, Saves, Ratings
- **Moderation**: Reports, Warnings, Actions, Audit Trails
- **No ORM** - Direct parameterized SQL for optimal performance

### **Key Design Patterns**

- **MVC Architecture** - Separation of concerns
- **RESTful API Design** - Standard HTTP methods and status codes
- **JWT Token-Based Auth** - Stateless authentication
- **Middleware Pipeline** - Request validation and error handling
- **Service Layer Pattern** - Business logic encapsulation
- **Repository Pattern** - Data access abstraction

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** 18+ and **pnpm** 10.10.0+
- **Docker** and **Docker Compose**
- **PostgreSQL** 14+
- **Git**

### Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd capstone-project-NevilPatel01
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend (.env)
   cp backend/.env.example backend/.env
   
   # Frontend (.env)
   cp frontend/.env.example frontend/.env
   ```

4. **Start Docker services**
   ```bash
   pnpm docker:dev
   ```

5. **Initialize the database**
   ```bash
   pnpm --filter backend db:init
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5001
   - API Health: http://localhost:5001/health

### Docker Deployment

#### Development Environment
```bash
# Start all services with live reload
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down
```

#### Production Environment
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up --build -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

#### Test Environment
```bash
# Run tests in isolated environment
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

---

## 💻 Development

### Workspace Structure

```
capstone-project/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── routes/       # API routes
│   │   ├── validators/   # Input validation schemas
│   │   ├── websocket/    # Socket.io handlers
│   │   └── tests/        # Jest test suites
│   ├── sql/              # Database schemas & migrations
│   └── uploads/          # User-uploaded files
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level pages
│   │   ├── contexts/     # React Context providers
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Helper functions
│   └── cypress/          # E2E test specs
├── nginx/                # Reverse proxy configuration
└── docs/                 # Project documentation
```

### Available Scripts

#### Monorepo Commands
```bash
pnpm dev                  # Start frontend + backend in dev mode
pnpm build                # Build both projects for production
pnpm lint                 # Run linters on both projects
pnpm lint:fix             # Auto-fix linting issues
```

#### Backend Commands
```bash
pnpm --filter backend dev              # Start dev server with hot reload
pnpm --filter backend build            # Compile TypeScript
pnpm --filter backend test             # Run all tests
pnpm --filter backend test:coverage    # Generate coverage report
pnpm --filter backend db:init          # Initialize database schema
pnpm --filter backend db:reset         # Reset and re-seed database
```

#### Frontend Commands
```bash
pnpm --filter frontend dev             # Start Vite dev server
pnpm --filter frontend build           # Production build
pnpm --filter frontend test:e2e        # Run Cypress E2E tests
pnpm --filter frontend test:open       # Open Cypress UI
pnpm --filter frontend a11y:check      # Run accessibility audit
```

### Database Management

```bash
# Initialize schema
pnpm --filter backend db:init

# Reset database (⚠️ Deletes all data)
pnpm --filter backend db:reset

# Run migrations
cd backend/sql && ./reset-and-seed-database.sh

# Create moderator account
psql $DATABASE_URL -f backend/sql/create-moderator.sql
```

---

## 🧪 Testing

### Test Coverage Summary

| Component | Coverage | Tests | Status |
|-----------|----------|-------|--------|
| **Backend API** | 85%+ | 150+ | ✅ Passing |
| **Frontend E2E** | 90%+ | 80+ | ✅ Passing |
| **Security** | 100% | 25+ | ✅ Passing |
| **Accessibility** | WCAG AA | Full | ✅ Compliant |

### Running Tests

#### Backend Unit & Integration Tests
```bash
# Run all backend tests
pnpm --filter backend test

# Run specific test suites
pnpm --filter backend test:auth
pnpm --filter backend test:recommendations
pnpm --filter backend test:social
pnpm --filter backend test:security

# Generate coverage report
pnpm --filter backend test:coverage

# View HTML coverage report
pnpm --filter backend test:coverage:html
```

#### Frontend E2E Tests
```bash
# Run all Cypress tests (headless)
pnpm --filter frontend test:e2e

# Open Cypress UI
pnpm --filter frontend test:open

# Run specific test suites
pnpm --filter frontend test:auth
pnpm --filter frontend test:profile
pnpm --filter frontend test:social
```

#### Accessibility Testing
```bash
# Run Axe accessibility audit
pnpm --filter frontend a11y:check

# Run Lighthouse audit
pnpm --filter frontend a11y:lighthouse:local
```

#### Security Testing
```bash
# Run security audit
pnpm --filter backend security:audit

# Check dependency vulnerabilities
pnpm --filter backend security:deps

# Full security test suite
pnpm --filter backend security:full
```

### Test Reports

Coverage reports are automatically generated in:
- **Backend**: `backend/coverage/lcov-report/index.html`
- **Frontend**: `frontend/coverage/index.html`

---

## 🌐 Deployment

### Production Environment

**Live URLs**
- 🌐 Website: https://city-pulse.app
- 🚀 API: https://api.city-pulse.app
- 💚 Health Check: https://api.city-pulse.app/health

### Infrastructure

- **Hosting**: DigitalOcean Droplets
- **Database**: Managed PostgreSQL
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt (Auto-renewal)
- **CDN**: Cloudflare

### Deployment Process

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Push to container registry**
   ```bash
   docker tag citypulse-backend:latest registry/citypulse-backend:v1.0.0
   docker push registry/citypulse-backend:v1.0.0
   ```

3. **Deploy to production server**
   ```bash
   ssh production-server
   cd /opt/citypulse
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Run database migrations**
   ```bash
   docker exec citypulse-backend pnpm db:migrate
   ```

### CI/CD Pipeline (DevOps Excellence)

**GitHub Actions Workflows**

```yaml
# Automated Pipeline Stages:
1. Code Quality
   ├─ ESLint & Prettier formatting
   ├─ TypeScript type checking
   └─ Code standards enforcement

2. Testing Suite (230+ Tests)
   ├─ Backend: Jest unit & integration tests
   ├─ Frontend: Cypress E2E tests
   ├─ Security: OWASP ZAP penetration testing
   └─ Accessibility: Axe & Lighthouse audits

3. Build Process
   ├─ Multi-stage Docker builds
   ├─ Image optimization & compression
   ├─ Frontend bundling with Vite
   └─ Backend TypeScript compilation

4. Deployment
   ├─ Automated on tagged releases
   ├─ Zero-downtime deployment
   ├─ Database migration checks
   └─ Health check verification

5. Post-Deployment
   ├─ Smoke tests
   ├─ Performance monitoring
   └─ Error tracking & logging
```

**Container Registry & Version Control**
- Docker images tagged with git SHA and version numbers
- Rollback capability to previous stable versions
- Automated vulnerability scanning of dependencies

---

## 🔒 Security & Accessibility

### Security Features

#### Authentication & Authorization
- 🔐 **JWT tokens** with 15-minute expiration
- 🔄 **Refresh tokens** for persistent sessions
- 🔑 **bcrypt password hashing** (10 rounds)
- 🛡️ **Role-based access control** (User, Moderator)
- 🚫 **Rate limiting** to prevent brute force attacks

#### Data Protection
- 💉 **SQL injection prevention** via parameterized queries
- 🧹 **XSS protection** through input sanitization
- 🛡️ **CSRF protection** with SameSite cookies
- 🔒 **Helmet.js** for security headers
- 📝 **Input validation** using Joi/Zod schemas

#### Privacy & Compliance
- 🇪🇺 **GDPR compliant** data deletion
- 🔐 **Encrypted sensitive data** in database
- 🕵️ **Anonymous analytics** only
- 📧 **Email verification** for account creation
- 🚫 **User blocking** and privacy controls

### Accessibility (WCAG AA Compliant)

#### Screen Reader Support
- ✅ Semantic HTML5 structure
- ✅ ARIA labels and descriptions
- ✅ Skip navigation links
- ✅ Alt text for all images
- ✅ Form labels and error messages

#### Keyboard Navigation
- ✅ Tab order optimization
- ✅ Focus indicators
- ✅ Keyboard shortcuts
- ✅ Escape to close modals
- ✅ Arrow key navigation in lists

#### Visual Accessibility
- ✅ Color contrast ratios (4.5:1 minimum)
- ✅ Resizable text (up to 200%)
- ✅ Dark mode support
- ✅ Focus-visible indicators
- ✅ No reliance on color alone

#### Testing Tools
- **Axe DevTools** - Automated a11y testing
- **Lighthouse** - Performance & accessibility audits
- **WAVE** - Web accessibility evaluation
- **Screen readers** - NVDA, JAWS, VoiceOver

---

## 🎨 Key Application Routes

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Landing page with app showcase |
| `/login` | User authentication |
| `/signup` | New user registration |
| `/reset-password` | Password reset flow |

### Protected Routes (Requires Authentication)
| Route | Description |
|-------|-------------|
| `/dashboard` | Main feed with recommendations |
| `/profile/:username` | User profile view/edit |
| `/recommendations/create` | Create new recommendation |
| `/recommendations/:id` | View recommendation details |
| `/search` | Advanced search interface |
| `/trips` | Trip planning dashboard |
| `/trips/create` | Create new trip |
| `/buddies` | Travel buddy connections |
| `/achievements` | View badges & progress |
| `/notifications` | Real-time notifications |

### Moderator Routes
| Route | Description |
|-------|-------------|
| `/moderator/dashboard` | Moderation overview |
| `/moderator/reports` | Review content reports |
| `/moderator/users` | User management |
| `/moderator/actions` | Moderation history |

---

## 📊 Project Statistics

### Development Metrics
- **Total Lines of Code**: 50,000+
- **Backend API Endpoints**: 80+
- **React Components**: 120+
- **Database Tables**: 21
- **Test Suites**: 230+
- **Development Time**: 13 weeks
- **Git Commits**: 500+

### Feature Completion
- ✅ **100%** of proposed features implemented
- ✅ **5+ additional features** beyond proposal
- ✅ **85%+ test coverage** across codebase
- ✅ **WCAG AA compliant** accessibility
- ✅ **Zero critical security** vulnerabilities

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Professor Karen ** - Project guidance and mentorship
---

<div align="center">

### 🌟 Star this repository if you find it helpful!

**Made with ❤️ and lots of ☕**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/NevilPatel01)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-4CAF50?style=for-the-badge&logo=google-chrome)](https://nevilpatel.com)

*CityPulse - Connecting Travelers, Sharing Experiences, Building Communities* 🌍✈️

</div>