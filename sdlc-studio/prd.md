# Product Requirements Document

**Project:** inchagram
**Version:** 0.1.0
**Last Updated:** 2026-01-30
**Status:** Draft

---

## 1. Project Overview

### Product Name
inchagram

### Purpose
A simplified, photo-only social media platform that focuses on core photo sharing functionality without the complexity of modern social platforms. Users can upload and share photos, like others' content, and follow users they're interested in - no videos, no comments, just simple photo sharing.

### Tech Stack
- **Backend:** Node.js
- **Database:** MongoDB (NoSQL document database)
- **Photo Storage:** Cloud storage (AWS S3 or compatible)
- **Frontend:** JavaScript (TBD - to be specified in TRD)

### Architecture Pattern
Monolithic web application with RESTful API (to be detailed in TRD)

---

## 2. Problem Statement

### Problem Being Solved
Modern social media platforms like Instagram have become increasingly complex with features like Stories, Reels, live video, shopping, and extensive commenting systems. This complexity can be overwhelming for users who simply want to share photos and appreciate others' photography without the noise.

inchagram provides a back-to-basics photo sharing experience:
- Photo uploads only (no videos)
- Simple likes (no comments or complex reactions)
- Clean, distraction-free interface
- Focus on photography rather than engagement metrics

### Target Users
**Primary:** End consumers - individuals who want a simpler, less overwhelming photo-sharing experience

**User Personas:**
- Photography enthusiasts who want to focus on visual content
- Users seeking a less addictive, more mindful social media experience
- People who value simplicity over feature-richness
- Privacy-conscious users who prefer minimal platform complexity

### Context
This is a greenfield project targeting local development and small-scale deployment initially. The focus is on building a solid foundation with core features before considering scalability.

---

## 3. Feature Inventory

| Feature | Description | Status | Priority | Location |
|---------|-------------|--------|----------|----------|
| User Registration | Email/password account creation | Not Started | Must-Have | Backend API |
| User Login | Authentication and session management | Not Started | Must-Have | Backend API |
| User Profiles | Personal profile pages with user info and photo grid | Not Started | Must-Have | Frontend/Backend |
| Photo Upload | Upload photos to the platform (JPEG, PNG) | Not Started | Must-Have | Backend API + Storage |
| Photo Feed | Chronological feed of photos from followed users | Not Started | Must-Have | Frontend/Backend |
| Discovery Feed | Explore photos from all users | Not Started | Should-Have | Frontend/Backend |
| Like Photos | Heart/like photos you enjoy | Not Started | Must-Have | Backend API |
| Follow Users | Follow other users to see their content in feed | Not Started | Must-Have | Backend API |
| Unfollow Users | Stop following a user | Not Started | Must-Have | Backend API |
| View Likes | See who liked your photos | Not Started | Should-Have | Frontend/Backend |
| Profile Editing | Update profile picture, bio, and display name | Not Started | Should-Have | Frontend/Backend |

### Feature Details

#### User Registration

**User Story:** As a new user, I want to create an account with my email and password so that I can start using inchagram.

**Acceptance Criteria:**
- [ ] User can provide email, username, and password
- [ ] Email must be valid format and unique
- [ ] Username must be unique and alphanumeric (3-30 chars)
- [ ] Password must be at least 8 characters
- [ ] Password is hashed before storage (bcrypt)
- [ ] Successful registration creates user account and returns success response
- [ ] Validation errors are returned with clear messages

**Dependencies:** MongoDB connection, password hashing library
**Status:** Not Started
**Confidence:** [HIGH]

---

#### User Login

**User Story:** As a registered user, I want to log in with my credentials so that I can access my account and feed.

**Acceptance Criteria:**
- [ ] User can provide email/username and password
- [ ] System validates credentials against stored hash
- [ ] Successful login returns authentication token (JWT)
- [ ] Failed login returns appropriate error message
- [ ] Token includes user ID and expiration time
- [ ] Token can be used for subsequent authenticated requests

**Dependencies:** User Registration, JWT library
**Status:** Not Started
**Confidence:** [HIGH]

---

#### User Profiles

**User Story:** As a user, I want to view my profile and other users' profiles so that I can see their photos and information.

**Acceptance Criteria:**
- [ ] Profile displays username, bio, profile picture
- [ ] Profile shows grid of user's uploaded photos (newest first)
- [ ] Profile displays follower count and following count
- [ ] Profile displays total number of photos
- [ ] Users can view their own profile
- [ ] Users can view other users' profiles
- [ ] Profile page is accessible via /profile/:username route

**Dependencies:** User Registration, Photo Upload
**Status:** Not Started
**Confidence:** [HIGH]

---

#### Photo Upload

**User Story:** As a user, I want to upload photos to inchagram so that I can share them with others.

**Acceptance Criteria:**
- [ ] User can select and upload image file (JPEG, PNG, WebP)
- [ ] Maximum file size: 10MB
- [ ] Image is validated for type and size before upload
- [ ] Photo is uploaded to S3 or compatible cloud storage
- [ ] Photo metadata is saved to database (uploader ID, timestamp, S3 URL)
- [ ] User can optionally add a caption (max 2200 chars)
- [ ] Upload returns photo ID and URL
- [ ] Invalid file types or oversized files are rejected with error

**Dependencies:** AWS S3 setup, User Authentication
**Status:** Not Started
**Confidence:** [HIGH]

---

#### Photo Feed

**User Story:** As a user, I want to see a feed of photos from users I follow so that I can stay updated with their content.

**Acceptance Criteria:**
- [ ] Feed displays photos from followed users only
- [ ] Photos are ordered chronologically (newest first)
- [ ] Each photo shows: image, uploader username, upload time, like count
- [ ] Feed supports pagination (load more)
- [ ] User can like photos directly from feed
- [ ] Clicking on photo shows full-size view
- [ ] Empty state shown when not following anyone

**Dependencies:** Follow Users, Photo Upload, Like Photos
**Status:** Not Started
**Confidence:** [HIGH]

---

#### Discovery Feed

**User Story:** As a user, I want to discover photos from all users so that I can find new people to follow.

**Acceptance Criteria:**
- [ ] Discovery feed shows photos from all users (not just followed)
- [ ] Photos are ordered chronologically or by popularity
- [ ] Feed supports pagination
- [ ] User can like photos from discovery feed
- [ ] User can navigate to uploader's profile from discovery feed
- [ ] Discovery feed is accessible from main navigation

**Dependencies:** Photo Upload, Like Photos
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### Like Photos

**User Story:** As a user, I want to like photos I enjoy so that I can show appreciation to the photographer.

**Acceptance Criteria:**
- [ ] User can click heart icon to like a photo
- [ ] Like count increments immediately (optimistic UI update)
- [ ] User can unlike a photo by clicking heart again
- [ ] Unlike decrements like count
- [ ] User can only like each photo once
- [ ] Liked photos are visually distinguished (filled heart icon)
- [ ] Like status persists across sessions

**Dependencies:** Photo Upload, User Authentication
**Status:** Not Started
**Confidence:** [HIGH]

---

#### Follow Users

**User Story:** As a user, I want to follow other users so that their photos appear in my feed.

**Acceptance Criteria:**
- [ ] User can click "Follow" button on another user's profile
- [ ] Follow action creates relationship in database
- [ ] Follower/following counts update immediately
- [ ] User cannot follow themselves
- [ ] User cannot follow the same person twice
- [ ] Follow button changes to "Following" after successful follow
- [ ] Followed user's photos appear in user's feed

**Dependencies:** User Profiles, Photo Feed
**Status:** Not Started
**Confidence:** [HIGH]

---

#### Unfollow Users

**User Story:** As a user, I want to unfollow users so that their photos no longer appear in my feed.

**Acceptance Criteria:**
- [ ] User can click "Unfollow" button on followed user's profile
- [ ] Unfollow action removes relationship from database
- [ ] Follower/following counts update immediately
- [ ] Button changes back to "Follow" after unfollow
- [ ] Unfollowed user's photos no longer appear in feed
- [ ] Unfollow can be undone by following again

**Dependencies:** Follow Users
**Status:** Not Started
**Confidence:** [HIGH]

---

#### View Likes

**User Story:** As a user, I want to see who liked my photos so that I can understand who appreciates my content.

**Acceptance Criteria:**
- [ ] User can click on like count to see list of users who liked
- [ ] Like list shows usernames and profile pictures
- [ ] Like list is ordered by most recent first
- [ ] User can navigate to likers' profiles from the list
- [ ] Empty state shown when no likes exist

**Dependencies:** Like Photos, User Profiles
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### Profile Editing

**User Story:** As a user, I want to update my profile information so that I can personalize my account.

**Acceptance Criteria:**
- [ ] User can edit display name, bio, and profile picture
- [ ] Bio has maximum length of 150 characters
- [ ] Profile picture must be valid image format (JPEG, PNG)
- [ ] Profile picture is uploaded to S3 storage
- [ ] Changes are saved to database
- [ ] Profile updates are reflected immediately
- [ ] Validation errors are shown for invalid inputs

**Dependencies:** User Profiles, Photo Upload (reuse storage logic)
**Status:** Not Started
**Confidence:** [HIGH]

---

## 4. Functional Requirements

### Core Behaviours

**Authentication & Authorization:**
- Password-based authentication with secure hashing
- JWT token-based session management
- Protected routes require valid authentication token
- Users can only modify their own content

**Photo Management:**
- Support JPEG, PNG, WebP formats
- Maximum file size: 10MB
- Photos stored in cloud storage (S3)
- Photo metadata stored in MongoDB
- Photos are publicly viewable once uploaded
- Optional captions up to 2200 characters

**Social Graph:**
- Users can follow/unfollow any other user
- Bidirectional relationship tracking (followers/following)
- Follow relationships determine feed visibility
- No mutual follow requirement (asymmetric follows)

**Engagement:**
- Users can like/unlike any photo
- Each user can like a photo only once
- Like counts are aggregated and displayed
- Likes are reversible

**Feed Algorithm:**
- Personal feed: chronological from followed users only
- Discovery feed: chronological from all users
- Pagination support for infinite scroll
- No algorithmic ranking in v0.1.0

### Input/Output Specifications

**API Endpoints (RESTful):**

Authentication:
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and receive token

Users:
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile (authenticated)
- `GET /api/users/:userId/photos` - Get user's photos
- `GET /api/users/:userId/followers` - Get user's followers
- `GET /api/users/:userId/following` - Get users followed by user

Photos:
- `POST /api/photos` - Upload new photo (authenticated)
- `GET /api/photos/:photoId` - Get photo details
- `DELETE /api/photos/:photoId` - Delete photo (authenticated, owner only)
- `GET /api/photos/feed` - Get personalized feed (authenticated)
- `GET /api/photos/discover` - Get discovery feed

Social:
- `POST /api/users/:userId/follow` - Follow user (authenticated)
- `DELETE /api/users/:userId/follow` - Unfollow user (authenticated)
- `POST /api/photos/:photoId/like` - Like photo (authenticated)
- `DELETE /api/photos/:photoId/like` - Unlike photo (authenticated)
- `GET /api/photos/:photoId/likes` - Get users who liked photo

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

**Error Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Business Logic Rules

1. **Username Rules:**
   - Must be unique across platform
   - 3-30 characters
   - Alphanumeric and underscores only
   - Case-insensitive for uniqueness check

2. **Photo Rules:**
   - No videos allowed
   - Maximum 10MB file size
   - Supported formats: JPEG, PNG, WebP
   - One photo per upload (no multi-upload in v0.1.0)

3. **Privacy Rules:**
   - All photos are public
   - All profiles are public
   - No private accounts in v0.1.0
   - No blocking users in v0.1.0

4. **Content Rules:**
   - No moderation system in v0.1.0
   - No reporting mechanism in v0.1.0
   - Future consideration: content policy and moderation

---

## 5. Non-Functional Requirements

### Performance
- **Scope:** Basic local development performance
- **Target:** Works smoothly for 1-10 concurrent users
- **Response Time:** <2 seconds for most operations
- **Feed Loading:** <3 seconds for initial 20 photos
- **Photo Upload:** <10 seconds for uploads up to 10MB
- **Database Queries:** Basic indexing on user IDs and photo IDs

**Note:** Production-scale performance optimization is out of scope for v0.1.0. Focus is on functionality over scalability.

### Security
- **Password Storage:** bcrypt hashing (minimum 10 rounds)
- **Authentication:** JWT tokens with secure signing key
- **Input Validation:** Server-side validation for all user inputs
- **SQL Injection:** Prevented by MongoDB parameterized queries
- **XSS Prevention:** Sanitize user-generated content (captions, bios)
- **File Upload Security:** Validate file types and sizes server-side
- **HTTPS:** Recommended for production, not enforced in development

**Exclusions for v0.1.0:**
- Rate limiting
- Two-factor authentication
- Email verification
- Account recovery
- Session management (logout all devices)

### Scalability
**Current Scope:** Not a priority for v0.1.0

**Future Considerations:**
- Image CDN for photo delivery
- Database indexing optimization
- Caching layer (Redis)
- Load balancing
- Horizontal scaling

### Availability
**Current Scope:** Development environment only

**Future Considerations:**
- 99% uptime target for production
- Automated health checks
- Database backups
- Error monitoring and alerting

---

## 6. AI/ML Specifications

**Not Applicable** - inchagram does not include AI/ML features in v0.1.0.

**Future Considerations:**
- Content moderation using image classification
- Photo recommendations based on user interests
- Automatic photo tagging/categorization

---

## 7. Data Architecture

### Data Models

**User Schema:**
```javascript
{
  _id: ObjectId,
  username: String (unique, indexed),
  email: String (unique, indexed),
  passwordHash: String,
  displayName: String,
  bio: String (max 150 chars),
  profilePictureUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Photo Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed, ref: User),
  imageUrl: String (S3 URL),
  caption: String (max 2200 chars),
  likeCount: Number (denormalized),
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Like Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed, ref: User),
  photoId: ObjectId (indexed, ref: Photo),
  createdAt: Date
}
// Compound index on (userId, photoId) for uniqueness
```

**Follow Schema:**
```javascript
{
  _id: ObjectId,
  followerId: ObjectId (indexed, ref: User),
  followingId: ObjectId (indexed, ref: User),
  createdAt: Date
}
// Compound index on (followerId, followingId) for uniqueness
```

### Relationships and Constraints

**One-to-Many:**
- User → Photos (one user can upload many photos)
- User → Likes (one user can like many photos)
- User → Follows (one user can follow many users)

**Many-to-Many:**
- Users ↔ Photos (via Likes) - many users can like many photos
- Users ↔ Users (via Follows) - many users can follow many users

**Constraints:**
- Username must be unique
- Email must be unique
- Cannot like the same photo twice
- Cannot follow the same user twice
- Cannot follow yourself

### Storage Mechanisms

**MongoDB Collections:**
- `users` - User accounts and profiles
- `photos` - Photo metadata and references
- `likes` - Like relationships
- `follows` - Follow relationships

**AWS S3 Buckets:**
- `inchagram-photos-{env}` - Uploaded photo files
- `inchagram-avatars-{env}` - Profile picture files

**File Naming Convention:**
- Photos: `{userId}/{timestamp}-{uuid}.{ext}`
- Avatars: `{userId}/avatar-{timestamp}.{ext}`

**Indexing Strategy:**
```
users:
  - username (unique)
  - email (unique)

photos:
  - userId
  - createdAt (for feed queries)

likes:
  - userId
  - photoId
  - (userId, photoId) compound unique

follows:
  - followerId
  - followingId
  - (followerId, followingId) compound unique
```

---

## 8. Integration Map

### External Services

**AWS S3 (or compatible):**
- **Purpose:** Photo and avatar storage
- **Integration:** AWS SDK for JavaScript (v3)
- **Configuration:** Bucket name, region, access credentials
- **Operations:** Upload, read, delete objects

**No other external services required for v0.1.0**

**Future Integrations:**
- Email service (SendGrid, AWS SES) for verification emails
- CDN (CloudFront, Cloudflare) for photo delivery
- Image processing service (for thumbnails, optimization)
- Analytics service (user engagement metrics)

### Authentication Methods

**Primary:** JWT (JSON Web Tokens)
- Token payload: { userId, username, iat, exp }
- Expiration: 7 days
- Storage: Client-side (localStorage or httpOnly cookie)
- Validation: Middleware on protected routes

**No OAuth/SSO in v0.1.0** - Future consideration for Google/Facebook login

### Third-Party Dependencies

**Backend (Node.js):**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT generation/validation
- `aws-sdk` or `@aws-sdk/client-s3` - S3 integration
- `multer` - File upload handling
- `dotenv` - Environment configuration
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `express-validator` - Input validation

**Frontend (TBD):**
- React/Vue/vanilla JS - to be determined in TRD

---

## 9. Configuration Reference

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 7d |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes | - |
| `AWS_REGION` | AWS region | Yes | - |
| `S3_BUCKET_PHOTOS` | S3 bucket for photos | Yes | - |
| `S3_BUCKET_AVATARS` | S3 bucket for avatars | Yes | - |
| `MAX_FILE_SIZE` | Max upload size in bytes | No | 10485760 |
| `BCRYPT_ROUNDS` | Bcrypt hashing rounds | No | 10 |

### Feature Flags

**None defined for v0.1.0**

**Future Feature Flags:**
- `ENABLE_DISCOVERY_FEED` - Toggle discovery feed feature
- `ENABLE_PROFILE_EDITING` - Toggle profile editing
- `ENABLE_RATE_LIMITING` - Toggle API rate limiting

---

## 10. Quality Assessment

### Tested Functionality

**None - Project not started**

Future test coverage targets:
- Unit tests: API endpoints, data validation, authentication
- Integration tests: Database operations, S3 uploads
- E2E tests: User flows (register → login → upload → like)

### Untested Areas

**All features untested - greenfield project**

Priority areas for testing once development starts:
1. Authentication flows (registration, login, token validation)
2. Photo upload to S3
3. Feed generation and pagination
4. Like/unlike operations
5. Follow/unfollow operations

### Technical Debt

**None yet - project not started**

Areas to monitor for technical debt:
- Photo optimization (no thumbnail generation in v0.1.0)
- Denormalized like counts (may need sync mechanism)
- No caching layer (may impact performance later)
- No database migrations system planned

---

## 11. Open Questions

1. **Frontend Framework:** React, Vue, or vanilla JavaScript? (To be decided in TRD)

2. **Deployment Platform:** Where will this be deployed? (Local, Heroku, AWS, DigitalOcean?)

3. **Feed Algorithm:** Should discovery feed be chronological or show "popular" photos?

4. **Photo Formats:** Should we support GIF? Animated images?

5. **User Onboarding:** Should we require email verification before account activation?

6. **Image Processing:** Do we need automatic image resizing/compression on upload?

7. **Pagination:** How many photos per page? (Suggested: 20-30)

8. **Username Changes:** Should users be able to change their username after registration?

9. **Account Deletion:** Should users be able to delete their accounts? What happens to their photos?

10. **Content Policy:** What content is allowed/prohibited? (Deferred to future version)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-30 | 0.1.0 | Initial PRD created - greenfield project definition |

---

> **Status Values:** Complete | Partial | Stubbed | Broken | Not Started
>
> **Next Steps:**
> - `/sdlc-studio trd create` - Define technical architecture
> - `/sdlc-studio persona create` - Define user personas
> - `/sdlc-studio epic` - Break down features into epics
