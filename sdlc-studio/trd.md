# Technical Requirements Document

**Project:** inchagram
**Version:** 0.1.0
**Status:** Draft
**Last Updated:** 2026-01-30
**PRD Reference:** [PRD](prd.md)

---

## 1. Executive Summary

### Purpose
This TRD defines the technical architecture for inchagram, a simplified photo-sharing social media platform. It bridges the product requirements (PRD) with implementation, specifying the technology stack, architecture patterns, API contracts, and infrastructure approach.

### Scope
**Covered:**
- Full-stack web application architecture (React frontend + Node.js backend)
- RESTful API design and contracts
- Data models and MongoDB schema design
- AWS S3 photo storage integration
- Authentication and security implementation
- Development and deployment workflows

**Not Covered:**
- Mobile native applications (iOS/Android)
- Content moderation systems (deferred to future version)
- Advanced features (Stories, Reels, messaging)
- Production scaling beyond single-instance deployment

### Key Decisions
- **Monolithic architecture** for simplicity and faster initial development
- **TypeScript** for type safety across frontend and backend
- **React + Vite** for modern, fast frontend development experience
- **Express.js** for flexible, well-understood API framework
- **MongoDB** for flexible document storage aligned with social graph patterns
- **JWT authentication** with localStorage for simplicity
- **URL-based API versioning** (/api/v1/*) for explicit version management

---

## 2. Project Classification

**Project Type:** Web Application

**Classification Rationale:**
inchagram is a full-stack web application that serves both a user-facing frontend (React SPA) and backend API (Node.js). Users interact through web browsers, and the system provides both UI and API layers. This classification aligns with:
- User-facing web interface requirement
- RESTful API for frontend-backend communication
- Monolithic deployment suitable for small-scale social platform

**Architecture Implications:**
- **Default Pattern:** Monolithic web application (recommended for Web Applications)
- **Pattern Used:** Monolithic web application
- **Deviation Rationale:** None - using recommended pattern. A monolith is ideal for:
  - Small team and greenfield development
  - Tightly coupled features (user → photo → feed relationships)
  - Simplified deployment and operational overhead
  - Easier debugging and development workflow
  - Can be refactored to microservices if scale demands it

---

## 3. Architecture Overview

### System Context

inchagram is a standalone web application that interacts with external services:

**Users:**
- End consumers access via web browsers (desktop/mobile)
- Authenticated users manage profiles, upload photos, view feeds

**External Systems:**
- **AWS S3**: Object storage for photos and profile images
- **MongoDB Atlas** (optional): Managed database service
- **Web Browsers**: Chrome, Firefox, Safari, Edge

**System Boundary:**
- Frontend: React SPA served via static hosting
- Backend: Node.js API server handling business logic
- Database: MongoDB for persistent data storage
- Storage: S3 for binary photo files

### Architecture Pattern

**Pattern:** Monolithic Web Application

**Rationale:**
- **Development Speed:** Faster iteration with single codebase and deployment
- **Operational Simplicity:** Single deployment artifact, easier to monitor and debug
- **Feature Cohesion:** Social features are tightly interconnected (users ↔ photos ↔ follows ↔ likes)
- **Team Size:** Appropriate for small teams or solo developers
- **Cost Efficiency:** Single server instance reduces infrastructure costs
- **Future Flexibility:** Can extract microservices later if specific components need independent scaling

**Trade-offs Accepted:**
- **Scaling:** Initially scales vertically (larger server) rather than horizontally
- **Deployment:** Single deployment means all features deploy together
- **Technology Lock-in:** Frontend and backend share Node.js ecosystem

### Component Overview

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Web UI** | User interface, routing, state management | React 18, TypeScript, React Router, Vite |
| **API Server** | Business logic, authentication, data validation | Node.js 20, Express 4, TypeScript |
| **Database** | Persistent data storage (users, photos metadata, social graph) | MongoDB 7 |
| **Object Storage** | Photo and avatar file storage | AWS S3 |
| **Authentication** | Token generation, validation, password hashing | JWT, bcrypt |

**Communication Flow:**
```
Browser → Web UI (React) → API Server (Express) → MongoDB
                                  ↓
                              AWS S3 (photos)
```

---

## 4. Technology Stack

### Core Technologies

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Language** | TypeScript | 5.x | Type safety reduces runtime errors, better IDE support, scales well as codebase grows. Standard choice for modern Node.js and React projects. |
| **Runtime** | Node.js | 20 LTS | Mature runtime, active LTS support, excellent npm ecosystem, unified language (TypeScript) for frontend and backend. |
| **Backend Framework** | Express.js | 4.x | Industry standard, minimal and unopinionated, huge middleware ecosystem, well-documented, easy to learn. |
| **Frontend Framework** | React | 18.x | Component-based architecture, large ecosystem, excellent tooling, hooks for state management, virtual DOM for performance. |
| **Database** | MongoDB | 7.x | Document model fits social data (users, posts, relationships), flexible schema for rapid iteration, horizontal scaling capability, good Node.js drivers (Mongoose). |
| **Object Storage** | AWS S3 | - | Reliable, scalable, cost-effective for binary files, CDN integration available, industry standard for photo storage. |

### Build & Development

| Tool | Purpose |
|------|---------|
| **Vite** | Frontend build tool - fast HMR, modern ESM-based builds, excellent DX |
| **TypeScript Compiler (tsc)** | Type checking and transpilation for backend |
| **tsx** (dev) | TypeScript execution for development without compilation step |
| **ESLint** | Code linting for both frontend and backend |
| **Prettier** | Code formatting to maintain consistency |
| **Jest** | Unit testing framework for backend and frontend |
| **React Testing Library** | Component testing for React UI |
| **ts-node** | TypeScript execution for scripts and development |

### Key Dependencies

**Backend:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT generation/validation
- `@aws-sdk/client-s3` - AWS S3 SDK v3
- `multer` - File upload handling
- `express-validator` - Request validation
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `dotenv` - Environment configuration
- `morgan` - HTTP request logging

**Frontend:**
- `react` - UI library
- `react-dom` - React rendering
- `react-router-dom` - Client-side routing
- `axios` - HTTP client for API calls
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `zustand` - Client state management (lightweight)
- `tailwindcss` - Utility-first CSS framework

### Infrastructure Services

| Service | Provider | Purpose |
|---------|----------|---------|
| **Compute** | AWS EC2 or similar | Host Node.js application server |
| **Database** | MongoDB Atlas (managed) or self-hosted | NoSQL document storage |
| **Object Storage** | AWS S3 | Photo and avatar file storage |
| **CDN** (future) | CloudFront | Fast photo delivery globally |

---

## 5. API Contracts

### API Style
**REST** (Representational State Transfer)

**Rationale:**
- Simple, well-understood by all developers
- Excellent browser and HTTP tooling support
- Stateless, cacheable responses
- CRUD operations map naturally to HTTP verbs
- No need for GraphQL complexity at this scale

### Authentication
**JWT (JSON Web Tokens)** stored in localStorage

**Flow:**
1. User submits credentials to `/api/v1/auth/login`
2. Server validates, returns JWT token (7-day expiration)
3. Client stores token in localStorage
4. Client includes token in Authorization header: `Bearer <token>`
5. Server validates token on protected routes

**Security Considerations:**
- XSS risk accepted (mitigated by input sanitization, CSP headers)
- HTTPS required in production to prevent token interception
- Future consideration: httpOnly cookies for enhanced security

### API Base URL
- **Development:** `http://localhost:3000/api/v1`
- **Production:** `https://api.inchagram.com/api/v1` (or similar)

### Versioning Strategy
**URL Path Versioning:** `/api/v1/*`

**Rationale:**
- Explicit and visible in URLs
- Easy to implement and route
- Simple for clients to understand
- Can run multiple versions simultaneously if needed

### Endpoints Overview

#### Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/register` | Create new user account | No |
| POST | `/api/v1/auth/login` | Authenticate and receive token | No |
| POST | `/api/v1/auth/logout` | Invalidate token (client-side) | Yes |
| GET | `/api/v1/auth/me` | Get current user profile | Yes |

#### Users

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/users/:userId` | Get user profile by ID | No |
| GET | `/api/v1/users/username/:username` | Get user profile by username | No |
| PUT | `/api/v1/users/:userId` | Update user profile | Yes (owner) |
| GET | `/api/v1/users/:userId/photos` | Get user's photos | No |
| GET | `/api/v1/users/:userId/followers` | Get user's followers | No |
| GET | `/api/v1/users/:userId/following` | Get users followed by user | No |

#### Photos

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/photos` | Upload new photo | Yes |
| GET | `/api/v1/photos/:photoId` | Get photo details | No |
| DELETE | `/api/v1/photos/:photoId` | Delete photo | Yes (owner) |
| GET | `/api/v1/photos/feed` | Get personalized feed | Yes |
| GET | `/api/v1/photos/discover` | Get discovery feed | No |

#### Social Interactions

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/users/:userId/follow` | Follow user | Yes |
| DELETE | `/api/v1/users/:userId/follow` | Unfollow user | Yes |
| POST | `/api/v1/photos/:photoId/like` | Like photo | Yes |
| DELETE | `/api/v1/photos/:photoId/like` | Unlike photo | Yes |
| GET | `/api/v1/photos/:photoId/likes` | Get users who liked photo | No |

### Request/Response Formats

**Content Type:** `application/json`

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Resource data
  },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Email format is invalid"
    }
  }
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNext": true
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists (e.g., duplicate username) |
| `PAYLOAD_TOO_LARGE` | 413 | File upload exceeds 10MB |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests (future) |
| `INTERNAL_ERROR` | 500 | Server error |

### Rate Limiting
**Not implemented in v0.1.0** - Future consideration

**Planned Approach:**
- Use `express-rate-limit` middleware
- Tiered limits: 100 req/15min (auth), 1000 req/15min (general)
- Per-IP or per-user basis

---

## 6. Data Architecture

### Data Models

#### User Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary key | MongoDB auto-generated ID |
| `username` | String | Unique, indexed, 3-30 chars, alphanumeric + underscore | User's display handle |
| `email` | String | Unique, indexed, valid email format | User's email address |
| `passwordHash` | String | Required, bcrypt hashed | Hashed password (never store plaintext) |
| `displayName` | String | Optional, max 50 chars | User's full name |
| `bio` | String | Optional, max 150 chars | Profile biography |
| `profilePictureUrl` | String | Optional | S3 URL to profile picture |
| `createdAt` | Date | Auto-generated | Account creation timestamp |
| `updatedAt` | Date | Auto-updated | Last profile update timestamp |

**Indexes:**
- `username` (unique)
- `email` (unique)

**Mongoose Schema:**
```typescript
const userSchema = new Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String },
  bio: { type: String, maxlength: 150 },
  profilePictureUrl: { type: String },
}, { timestamps: true });
```

---

#### Photo Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary key | MongoDB auto-generated ID |
| `userId` | ObjectId | Required, indexed, ref: User | Photo uploader's user ID |
| `imageUrl` | String | Required | S3 URL to photo file |
| `caption` | String | Optional, max 2200 chars | Photo caption |
| `likeCount` | Number | Default: 0 | Denormalized like count (for performance) |
| `createdAt` | Date | Auto-generated, indexed | Upload timestamp |
| `updatedAt` | Date | Auto-updated | Last update timestamp |

**Indexes:**
- `userId` (for user photo queries)
- `createdAt` (desc, for feed queries)

**Mongoose Schema:**
```typescript
const photoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  imageUrl: { type: String, required: true },
  caption: { type: String, maxlength: 2200 },
  likeCount: { type: Number, default: 0 },
}, { timestamps: true });

photoSchema.index({ createdAt: -1 }); // For chronological feed
```

---

#### Like Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary key | MongoDB auto-generated ID |
| `userId` | ObjectId | Required, indexed, ref: User | User who liked |
| `photoId` | ObjectId | Required, indexed, ref: Photo | Liked photo |
| `createdAt` | Date | Auto-generated | Like timestamp |

**Indexes:**
- Compound unique index: `(userId, photoId)` - prevents duplicate likes
- `photoId` (for fetching likers)
- `userId` (for fetching user's liked photos)

**Mongoose Schema:**
```typescript
const likeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  photoId: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
  createdAt: { type: Date, default: Date.now },
});

likeSchema.index({ userId: 1, photoId: 1 }, { unique: true });
likeSchema.index({ photoId: 1 });
```

**Like/Unlike Logic:**
- On like: Insert like document, increment `Photo.likeCount` (atomic)
- On unlike: Delete like document, decrement `Photo.likeCount` (atomic)
- Denormalized count prevents expensive aggregations on photo feeds

---

#### Follow Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Primary key | MongoDB auto-generated ID |
| `followerId` | ObjectId | Required, indexed, ref: User | User who follows |
| `followingId` | ObjectId | Required, indexed, ref: User | User being followed |
| `createdAt` | Date | Auto-generated | Follow timestamp |

**Indexes:**
- Compound unique index: `(followerId, followingId)` - prevents duplicate follows
- `followerId` (for getting user's following list)
- `followingId` (for getting user's followers)

**Mongoose Schema:**
```typescript
const followSchema = new Schema({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });
```

**Validation:**
- Prevent self-follows: `followerId !== followingId`

---

### Storage Strategy

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| User profiles, metadata | MongoDB | Document model fits user attributes, flexible schema for profile changes |
| Photo metadata (URL, caption, likes) | MongoDB | Queryable, indexed for feeds, allows aggregations |
| Social graph (follows, likes) | MongoDB | Many-to-many relationships, efficient with compound indexes |
| Photo files (JPEG, PNG, WebP) | AWS S3 | Cost-effective, scalable, CDN-ready, designed for binary storage |
| Profile pictures | AWS S3 | Same as photos, separate bucket/prefix possible |

**File Storage Naming Convention:**
- Photos: `photos/{userId}/{timestamp}-{uuid}.{ext}`
- Avatars: `avatars/{userId}/avatar-{timestamp}.{ext}`

**Example S3 URL:**
```
https://inchagram-photos.s3.amazonaws.com/photos/507f1f77bcf86cd799439011/1706612345678-a1b2c3d4.jpg
```

### Migrations

**Approach:** Mongoose schema versioning + manual migration scripts

**Process:**
1. Schema changes tracked in `migrations/` directory
2. Migration scripts use Mongoose to update documents
3. Idempotent migrations (can run multiple times safely)
4. No ORM auto-migrations in production (too risky)

**Example Migration:**
```typescript
// migrations/001-add-displayName.ts
export async function up() {
  await User.updateMany(
    { displayName: { $exists: false } },
    { $set: { displayName: '' } }
  );
}
```

**Future Considerations:**
- Use `migrate-mongo` package for migration management
- Backward-compatible schema changes preferred over breaking changes

---

## 7. Integration Patterns

### External Services

| Service | Purpose | Protocol | Auth |
|---------|---------|----------|------|
| **AWS S3** | Photo and avatar storage | HTTPS (AWS SDK) | IAM credentials (access key + secret) |
| **MongoDB Atlas** (optional) | Managed database | MongoDB protocol | Username/password or connection string |
| **SMTP Server** (future) | Email notifications | SMTP | Username/password |

### AWS S3 Integration

**SDK:** `@aws-sdk/client-s3` (AWS SDK v3)

**Operations:**
- `PutObjectCommand` - Upload photo
- `GetObjectCommand` - Retrieve photo (rare, usually use signed URLs)
- `DeleteObjectCommand` - Delete photo
- `HeadObjectCommand` - Check if photo exists

**Upload Flow:**
1. Frontend: User selects photo file
2. Frontend: Validates file size (<10MB) and type (JPEG/PNG/WebP)
3. Frontend: Sends file via multipart/form-data to `/api/v1/photos`
4. Backend: Multer middleware parses file upload
5. Backend: Validates file again (server-side validation)
6. Backend: Generates unique S3 key: `photos/{userId}/{timestamp}-{uuid}.{ext}`
7. Backend: Uploads to S3 using `PutObjectCommand`
8. Backend: Saves photo metadata (S3 URL, userId, caption) to MongoDB
9. Backend: Returns photo object to frontend

**Security:**
- S3 bucket: Private (not public read)
- Photos accessible via CloudFront signed URLs (future) or public read (simple approach)
- Bucket policy allows only authenticated API to write
- IAM user with minimal permissions (s3:PutObject, s3:DeleteObject on specific bucket)

**Configuration:**
```typescript
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

### Error Handling for Integrations

**S3 Upload Failures:**
- Retry logic: 3 attempts with exponential backoff
- If all retries fail, return 500 error to client
- Log failure details for investigation
- Clean up partial uploads (future: lifecycle policy for incomplete multipart uploads)

**MongoDB Connection Failures:**
- Mongoose auto-reconnect enabled
- Connection pool: min 5, max 50
- If connection lost, return 503 Service Unavailable
- Health check endpoint: `/api/v1/health` verifies DB connectivity

---

## 8. Infrastructure

### Deployment Topology

**Architecture:** Single-server monolithic deployment (v0.1.0)

**Components on Server:**
- Node.js API server (Express)
- Static file server for React build (or separate CDN)
- Reverse proxy (Nginx) for HTTPS termination and routing

**Deployment Diagram:**
```
                   Internet
                      ↓
              [CloudFront / CDN]
                 (static files)
                      ↓
           [Nginx Reverse Proxy]
              :80, :443 (HTTPS)
                      ↓
          [Node.js API Server]
                  :3000
                      ↓
            [MongoDB] ←→ [AWS S3]
```

**Initial Deployment:**
- **Platform:** AWS EC2 (t3.small or t3.medium) or DigitalOcean Droplet
- **OS:** Ubuntu 22.04 LTS
- **Process Manager:** PM2 (keeps Node.js running, auto-restart on crash)
- **Reverse Proxy:** Nginx (SSL termination, static file serving, rate limiting)
- **Database:** MongoDB Atlas (managed) or self-hosted MongoDB 7
- **Storage:** AWS S3 (separate service)

### Environment Strategy

| Environment | Purpose | Characteristics |
|-------------|---------|-----------------|
| **Development** | Local development on developer machines | Hot reload, detailed logging, mock S3 (LocalStack) optional, local MongoDB |
| **Staging** (future) | Pre-production testing | Production-like config, separate S3 bucket, separate DB, used for QA |
| **Production** | Live user-facing system | HTTPS enforced, error monitoring, minimal logging, backup strategies |

**Environment Variables:**
```bash
# Development (.env.development)
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/inchagram_dev
JWT_SECRET=dev-secret-change-in-production
AWS_REGION=us-east-1
S3_BUCKET_PHOTOS=inchagram-photos-dev
FRONTEND_URL=http://localhost:5173

# Production (.env.production)
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/inchagram_prod
JWT_SECRET=<strong-random-secret-from-secrets-manager>
AWS_REGION=us-east-1
S3_BUCKET_PHOTOS=inchagram-photos-prod
FRONTEND_URL=https://inchagram.com
```

### Scaling Strategy

**Initial (v0.1.0):** Vertical scaling
- Start with t3.small (2 vCPU, 2GB RAM)
- Scale up to t3.medium or t3.large as user base grows
- MongoDB Atlas auto-scales storage

**Future Horizontal Scaling:**
- Load balancer (ALB) in front of multiple API server instances
- Sticky sessions not required (stateless JWT auth)
- MongoDB replica set for read scaling
- S3 inherently scales horizontally
- Redis cache layer for frequently accessed data (feeds, user profiles)

**Bottlenecks to Monitor:**
- Feed generation queries (follows → photos joins)
- File upload throughput to S3
- MongoDB connection pool exhaustion

### Monitoring & Observability (Future)

**Metrics:**
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- S3 upload success/failure rates
- Active user connections

**Tools (planned):**
- CloudWatch (AWS metrics)
- Sentry (error tracking)
- DataDog or New Relic (APM)

### Backup & Disaster Recovery (Future)

**Database:**
- MongoDB Atlas: Automated daily backups
- Self-hosted: Daily mongodump + upload to S3

**Photos:**
- S3 versioning enabled (protect against accidental deletes)
- Cross-region replication (future, for high availability)

**RTO/RPO:**
- Not defined for v0.1.0 (development phase)
- Future target: RTO 4 hours, RPO 24 hours

---

## 9. Security Considerations

### Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| **XSS (Cross-Site Scripting)** | Medium | High | Sanitize user input (captions, bios), use React's built-in XSS protection, Content Security Policy headers |
| **SQL/NoSQL Injection** | Low | High | Use Mongoose parameterized queries, validate all inputs with express-validator |
| **Authentication Bypass** | Low | Critical | Strong password hashing (bcrypt), JWT signature verification, token expiration |
| **Brute Force Login** | Medium | Medium | Rate limiting on `/auth/login` (future), account lockout after failed attempts (future) |
| **File Upload Abuse** | Medium | Medium | Validate file type and size server-side, limit upload rate per user (future), scan for malware (future) |
| **Unauthorized Data Access** | Medium | High | Implement authorization checks (user can only edit own photos/profile), validate JWT on all protected routes |
| **CSRF (Cross-Site Request Forgery)** | Low | Medium | JWT in Authorization header (not cookies), SameSite cookie attribute (if using cookies in future) |
| **DDoS** | Low | High | Rate limiting (future), CloudFlare or AWS Shield (future) |

### Security Controls

| Control | Implementation |
|---------|----------------|
| **Authentication** | JWT tokens (7-day expiration), bcrypt password hashing (10 rounds) |
| **Authorization** | Middleware checks token validity, userId ownership for edit/delete operations |
| **Input Validation** | `express-validator` for all user inputs (email format, username regex, password length) |
| **Encryption at Rest** | MongoDB encryption at rest (Atlas default), S3 server-side encryption (SSE-S3) |
| **Encryption in Transit** | HTTPS enforced in production (Nginx with Let's Encrypt SSL), MongoDB connections use TLS |
| **Secure Headers** | `helmet` middleware (sets CSP, X-Frame-Options, etc.) |
| **CORS** | Restrict origins to frontend domain only in production |
| **Secrets Management** | Environment variables via `.env` (development), AWS Secrets Manager or Parameter Store (production future) |

### Data Classification

| Data Type | Classification | Protection |
|-----------|---------------|------------|
| **Passwords** | Sensitive | Hashed with bcrypt, never logged or transmitted |
| **Email Addresses** | PII | Stored encrypted (future), not publicly visible |
| **Photos** | Public | Accessible via S3 URLs, no auth required (users accept public sharing) |
| **Usernames, Bios** | Public | Visible to all users |
| **JWT Tokens** | Secret | Short expiration, validated on every request |

### Compliance

**Not applicable for v0.1.0** (small-scale, no commercial use)

**Future Considerations:**
- GDPR compliance: User data export, right to be forgotten (account deletion)
- COPPA: Age verification if users under 13 are allowed
- DMCA: Takedown process for copyrighted photos

---

## 10. Performance Requirements

### Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time (p50)** | <200ms | Median response time for all endpoints (excluding photo upload) |
| **API Response Time (p95)** | <500ms | 95th percentile response time |
| **Photo Upload Time** | <10s | For 5MB photo upload (including S3 transfer) |
| **Feed Load Time** | <1s | Initial 20 photos in feed (frontend + backend) |
| **Frontend Initial Load** | <2s | Time to interactive (Vite production build) |
| **Database Query Time** | <100ms | 95th percentile for MongoDB queries |
| **Concurrent Users** | 100+ | Support 100 concurrent users without degradation (v0.1.0 target) |

### Performance Optimizations

**Backend:**
- Database indexing on frequently queried fields (userId, createdAt)
- Denormalized like counts to avoid aggregations
- Connection pooling for MongoDB (min 5, max 50 connections)
- Async/await for non-blocking I/O
- Pagination for all list endpoints (default 20 items per page)

**Frontend:**
- Code splitting with React.lazy() for routes
- Image lazy loading for feed photos
- Optimistic UI updates for likes/unlikes
- React Query for caching API responses
- Debouncing for search inputs (future)

**Future Optimizations:**
- Redis cache for hot data (popular photos, user profiles)
- CDN for static assets and photos (CloudFront)
- Image thumbnails (multiple sizes) for faster feed loading
- Infinite scroll with virtualization (react-window)

### Load Testing

**Tool:** k6 or Artillery

**Scenarios:**
- 100 concurrent users browsing feeds
- 50 users uploading photos simultaneously
- 500 requests/second to API endpoints

**Target:** No errors, <500ms p95 response time under load

---

## 11. Architecture Decision Records

### ADR-001: Use Monolithic Architecture over Microservices

**Status:** Accepted

**Context:**
inchagram is a new social media platform in early development with a small team and uncertain scale. We need to choose between a monolithic architecture and microservices.

**Decision:**
Adopt a monolithic architecture with clear module boundaries that could later be extracted into services if needed.

**Rationale:**
- **Simplicity:** Single codebase, single deployment, easier debugging
- **Development Speed:** No distributed system complexity, faster iteration
- **Operational Overhead:** One server to monitor and maintain
- **Team Size:** Appropriate for small teams or solo developers
- **Feature Cohesion:** Social features are tightly coupled (users, photos, feeds all interconnected)
- **Cost:** Single server instance reduces infrastructure costs

**Consequences:**
- **Positive:**
  - Faster initial development and time to market
  - Simpler deployment and rollback process
  - Easier to ensure data consistency (single database transaction scope)
  - Lower operational complexity and cost
- **Negative:**
  - Vertical scaling only (initially)
  - Entire app deploys together (can't deploy features independently)
  - Technology stack locked to Node.js/TypeScript
- **Mitigation:** Design with clear module boundaries (services/, controllers/, repositories/) to enable future extraction to microservices if scale demands it

**Alternatives Considered:**
- **Microservices:** Rejected due to premature complexity and operational overhead
- **Serverless:** Rejected due to cold start latency and complexity of file uploads

---

### ADR-002: Use TypeScript for Full Stack

**Status:** Accepted

**Context:**
We need to choose between JavaScript and TypeScript for frontend and backend development.

**Decision:**
Use TypeScript across the entire stack (frontend and backend).

**Rationale:**
- **Type Safety:** Catch errors at compile time rather than runtime
- **IDE Support:** Better autocomplete, refactoring, and navigation
- **Code Quality:** Enforces interfaces and contracts between modules
- **Scalability:** Easier to maintain as codebase grows
- **Team Knowledge:** Modern best practice for Node.js and React projects
- **Ecosystem:** Excellent support in React, Express, and Mongoose

**Consequences:**
- **Positive:**
  - Fewer runtime errors due to type mismatches
  - Improved developer experience with IntelliSense
  - Self-documenting code (types serve as inline documentation)
  - Easier refactoring with confidence
- **Negative:**
  - Slightly more boilerplate (type definitions)
  - Learning curve for developers unfamiliar with TypeScript
  - Compilation step required (though Vite and tsx handle this well)
- **Mitigation:** Use `strict: true` in tsconfig.json to maximize benefits, provide team training resources

**Alternatives Considered:**
- **JavaScript (ES6+):** Rejected due to lack of type safety
- **TypeScript backend only:** Rejected to maintain consistency and share types between frontend and backend

---

### ADR-003: Use localStorage for JWT Token Storage

**Status:** Accepted

**Context:**
We need to decide where to store JWT authentication tokens on the client side. Options include localStorage, sessionStorage, or httpOnly cookies.

**Decision:**
Store JWT tokens in browser localStorage.

**Rationale:**
- **Simplicity:** Easy to implement, no server-side session management
- **Persistence:** Tokens persist across browser sessions (better UX)
- **CORS Simplicity:** No need for complex CORS cookie configuration
- **Client Control:** Frontend has full control over token lifecycle
- **Development Speed:** Faster to implement than cookie-based auth

**Consequences:**
- **Positive:**
  - Simple implementation (read/write to localStorage)
  - Works seamlessly with SPA architecture
  - No server-side session store needed
  - Easy to debug (visible in DevTools)
- **Negative:**
  - Vulnerable to XSS attacks (if attacker injects script, can steal token)
  - Not automatically sent with requests (must manually include in headers)
- **Mitigation:**
  - Sanitize all user inputs to prevent XSS
  - Set Content Security Policy headers with `helmet`
  - Future migration to httpOnly cookies if security requirements increase

**Alternatives Considered:**
- **httpOnly Cookies:** More secure (immune to XSS) but requires complex CORS setup and CSRF protection
- **sessionStorage:** More secure (cleared on tab close) but poor UX (users logged out when closing tab)

**Future Consideration:**
If inchagram handles sensitive data or achieves significant scale, migrate to httpOnly cookies for enhanced security.

---

### ADR-004: Use MongoDB over PostgreSQL

**Status:** Accepted

**Context:**
We need to choose a database for storing user data, photos metadata, and social graph (follows, likes).

**Decision:**
Use MongoDB (document database) as the primary data store.

**Rationale:**
- **Flexibility:** Schema-less design allows rapid iteration on user profiles and photo metadata
- **Social Graph Fit:** Many-to-many relationships (follows, likes) work well with document references
- **Node.js Ecosystem:** Excellent Mongoose ODM, native JSON handling
- **Horizontal Scaling:** Sharding support for future growth
- **Denormalization:** Easy to denormalize like counts and follower counts for performance
- **Development Speed:** No migrations needed for schema changes (trade-off: less enforcement)

**Consequences:**
- **Positive:**
  - Fast development with flexible schema
  - Good performance for read-heavy social queries
  - Native JSON support (no ORM impedance mismatch)
  - Easy to add new fields without migrations
- **Negative:**
  - No ACID transactions across collections (MongoDB 4+ has multi-document transactions, but limited)
  - Risk of data inconsistency if denormalized counts drift
  - Less query optimization tooling than PostgreSQL
- **Mitigation:**
  - Use atomic updates for like/follow counts
  - Implement background jobs to reconcile denormalized data (future)
  - Use compound indexes to optimize social graph queries

**Alternatives Considered:**
- **PostgreSQL:** Excellent for relational data and strong consistency, but more rigid schema and slower development for this use case
- **MySQL:** Similar to PostgreSQL, less modern features
- **DynamoDB:** Serverless and scalable, but less flexible query patterns and higher complexity

**Note:** If strong consistency or complex transactions become critical, consider PostgreSQL migration or hybrid approach (MongoDB for user data, PostgreSQL for financial/critical data).

---

### ADR-005: Use React over Vue or Vanilla JS

**Status:** Accepted

**Context:**
We need to choose a frontend framework for the web UI.

**Decision:**
Use React 18 with TypeScript.

**Rationale:**
- **Ecosystem:** Largest ecosystem of libraries and components
- **Community:** Most active community, abundant learning resources
- **Tooling:** Excellent dev tools (React DevTools, Redux DevTools)
- **TypeScript Support:** First-class TypeScript integration
- **Hiring:** Easier to find React developers than Vue
- **Performance:** Virtual DOM and React 18 concurrent features
- **Component Model:** Reusable, composable components with hooks

**Consequences:**
- **Positive:**
  - Rich ecosystem (React Query, React Router, UI libraries)
  - Strong TypeScript support
  - Large talent pool for hiring
  - Excellent documentation and community support
- **Negative:**
  - More boilerplate than Vue (especially for simple components)
  - JSX syntax (learning curve for some)
  - Library choices required (state management, routing, etc.)
- **Mitigation:** Use modern tools (Vite, React Query) to reduce boilerplate

**Alternatives Considered:**
- **Vue.js:** Easier learning curve, but smaller ecosystem and job market
- **Vanilla JavaScript:** Maximum control, but much slower development and higher maintenance burden

---

## 12. Open Technical Questions

- [ ] **Q:** Should we use a CDN (CloudFront) for serving photos, or serve directly from S3?
  **Context:** CDN improves global performance but adds complexity and cost. For v0.1.0 (local users), direct S3 might suffice.
  **Decision Needed By:** Before production deployment

- [ ] **Q:** How do we handle photo deletion and orphaned S3 files?
  **Context:** If photo delete fails in MongoDB but succeeds in S3 (or vice versa), we have inconsistency.
  **Options:** Two-phase commit, background cleanup jobs, accept eventual consistency
  **Decision Needed By:** Before implementing photo delete feature

- [ ] **Q:** Should we generate multiple photo sizes (thumbnails, medium, full) on upload?
  **Context:** Improves feed performance (smaller images) but increases upload time and storage cost.
  **Decision Needed By:** Before photo upload implementation

- [ ] **Q:** How do we paginate the feed efficiently for users following thousands of accounts?
  **Context:** Simple offset pagination becomes slow at high offsets. Cursor-based pagination is better but more complex.
  **Decision Needed By:** Before feed implementation

- [ ] **Q:** Should we implement real-time features (live like counts, new photo notifications)?
  **Context:** Requires WebSocket or SSE infrastructure, adds complexity.
  **Decision Needed By:** v0.2.0 planning

- [ ] **Q:** How do we prevent duplicate photo uploads (same file uploaded multiple times)?
  **Context:** Could hash file contents and check before upload, but adds latency.
  **Decision Needed By:** v0.2.0 or later

- [ ] **Q:** Should we allow users to edit captions after posting?
  **Context:** Instagram allows this, but adds audit trail complexity.
  **Decision Needed By:** v0.1.0 feature freeze

- [ ] **Q:** How do we handle timezone differences for photo timestamps?
  **Context:** Store timestamps in UTC and convert to user's local time on frontend?
  **Decision Needed By:** Before feed implementation

---

## 13. Implementation Constraints

### Must Have
- **HTTPS in production** - Required for JWT security and user trust
- **Input validation on all endpoints** - Prevent injection attacks and data corruption
- **Password hashing** - bcrypt with minimum 10 rounds
- **Unique usernames and emails** - Enforced by database indexes
- **File size limits** - Maximum 10MB per photo upload
- **JWT expiration** - Tokens must expire (7-day maximum)
- **Error logging** - Structured logging to aid debugging
- **Environment variable configuration** - No hardcoded secrets

### Should Have (v0.1.0)
- **Rate limiting on auth endpoints** - Prevent brute force attacks
- **Database backup strategy** - Protect against data loss
- **Monitoring and alerting** - Know when system is down
- **TypeScript strict mode** - Maximize type safety benefits

### Won't Have (This Version)
- **Email verification** - Deferred to v0.2.0
- **Password reset flow** - Deferred to v0.2.0
- **Content moderation** - Deferred to future version
- **Real-time notifications** - Deferred to v0.2.0
- **Mobile apps** - Web-only for v0.1.0
- **Internationalization (i18n)** - English only for v0.1.0
- **Advanced photo editing** - Upload as-is, no filters or cropping
- **Analytics/tracking** - No user behavior tracking in v0.1.0
- **A/B testing framework** - Too early for experimentation

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-30 | 0.1.0 | Initial TRD created - architecture, tech stack, API contracts, data models, and infrastructure defined |

---

**Next Steps:**
- `/sdlc-studio persona create` - Define user personas
- `/sdlc-studio epic` - Generate epics from PRD
- Begin implementation planning for first epic
