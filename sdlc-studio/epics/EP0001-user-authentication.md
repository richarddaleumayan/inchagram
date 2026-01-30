# EP0001: User Authentication & Account Management

> **Status:** Draft
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Target Release:** v0.1.0

## Summary

Implement core user authentication and account management functionality, including user registration, login, JWT-based session management, and basic profile setup. This epic provides the foundation for all user-related features in inchagram.

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
|--------|------|------------|--------|
| PRD | Security | Passwords hashed with bcrypt (10+ rounds) | Must implement secure password storage |
| PRD | Performance | Basic performance (<2s for most operations) | Login/register must be fast enough for good UX |
| TRD | Architecture | Monolithic Node.js/Express API | Auth logic in backend, stateless JWT approach |
| TRD | Tech Stack | TypeScript, MongoDB, JWT | Use jsonwebtoken lib, Mongoose schemas |

---

## Business Context

### Problem Statement
Users need a simple, secure way to create accounts and access inchagram. Unlike complex platforms, inchagram focuses on email/password authentication without OAuth, 2FA, or email verification in v0.1.0.

**PRD Reference:** [User Registration](../prd.md#user-registration), [User Login](../prd.md#user-login)

### Value Proposition
- **Security:** Bcrypt-hashed passwords protect user accounts
- **Simplicity:** Minimal registration fields (email, username, password)
- **Speed:** JWT tokens eliminate server-side session lookups
- **Foundation:** Enables all other features that require authenticated users

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Registration Success Rate | N/A | >95% | Successful registrations / attempts |
| Login Response Time (p95) | N/A | <500ms | Server response time for /auth/login |
| Password Security | N/A | 100% bcrypt | All passwords hashed, never plaintext |
| Token Expiration | N/A | 7 days | JWT exp claim |

---

## Scope

### In Scope
- User registration with email, username, password
- Email and username uniqueness validation
- Password strength requirements (min 8 characters)
- Bcrypt password hashing (10 rounds minimum)
- User login with email/username + password
- JWT token generation and validation
- Token-based authentication middleware
- Basic user profile creation on registration
- User model and MongoDB schema

### Out of Scope
- OAuth/social login (Google, Facebook) - future version
- Email verification - future version
- Password reset flow - future version
- Two-factor authentication (2FA) - future version
- Account lockout after failed attempts - future version
- Remember me / persistent sessions - future version
- Multi-device session management - future version

### Affected Personas
- **All Personas:** Foundation for accessing the platform
- **Sam (Privacy-Conscious):** Values minimal data collection, appreciates no third-party OAuth
- **Jamie (Casual Sharer):** Needs simple, fast account creation

---

## Acceptance Criteria (Epic Level)

- [ ] Users can register with unique email, username, and password
- [ ] Passwords are hashed with bcrypt before storage (never stored plaintext)
- [ ] Users can log in with email or username + password
- [ ] Successful login returns JWT token valid for 7 days
- [ ] Protected API routes validate JWT token and reject invalid/expired tokens
- [ ] Registration validates email format, username constraints (3-30 chars, alphanumeric)
- [ ] Duplicate email or username returns clear error message
- [ ] Invalid credentials on login return appropriate error
- [ ] User model includes: _id, username, email, passwordHash, displayName, bio, profilePictureUrl, timestamps

---

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| None | N/A | N/A | N/A |

**Note:** This is a foundational epic with no blockers.

### Blocking

| Item | Type | Impact |
|------|------|--------|
| EP0002 (User Profiles) | Epic | Requires auth to view/edit own profile |
| EP0003 (Photo Upload) | Epic | Requires auth to upload photos |
| EP0004 (Social Interactions) | Epic | Requires auth to like/follow |

---

## Risks & Assumptions

### Assumptions
- MongoDB connection is established and working
- Environment variables (JWT_SECRET, BCRYPT_ROUNDS) are configured
- Frontend will store JWT in localStorage (TRD decision)
- 7-day token expiration is acceptable for v0.1.0

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| JWT secret leaked | Low | Critical | Use strong random secret, store in env vars, rotate if compromised |
| Weak password acceptance | Medium | High | Enforce min 8 chars, add strength validator |
| MongoDB connection failures | Low | High | Connection retry logic, health checks |
| Token expiration UX issues | Medium | Medium | Frontend handles token refresh gracefully |

---

## Technical Considerations

### Architecture Impact
- Introduces authentication middleware used across all protected routes
- Establishes User model as central entity referenced by other features
- JWT approach means stateless authentication (no server-side session store)

### Integration Points
- MongoDB: User collection for storing user documents
- bcrypt library: Password hashing
- jsonwebtoken library: JWT creation and verification
- Express middleware: Auth validation on protected routes
- Frontend: Receives and stores JWT, includes in Authorization header

### API Endpoints (from TRD)
- `POST /api/v1/auth/register` - Create new user account
- `POST /api/v1/auth/login` - Authenticate and receive JWT
- `GET /api/v1/auth/me` - Get current user profile (protected)

---

## Sizing

**Story Points:** 13
**Estimated Story Count:** 4-5 stories

**Complexity Factors:**
- Password hashing and security considerations
- JWT token generation and validation logic
- Middleware implementation for route protection
- MongoDB schema design with indexes
- Input validation and error handling

---

## Story Breakdown

- [x] [US0001: User Registration API Endpoint](../stories/US0001-user-registration-api.md) - 3 points - **Done**
- [x] [US0002: User Login API with JWT Token Generation](../stories/US0002-user-login-jwt.md) - 3 points - **Done**
- [x] [US0003: JWT Authentication Middleware](../stories/US0003-jwt-auth-middleware.md) - 2 points - **Done**
- [ ] [US0004: Input Validation Middleware](../stories/US0004-input-validation-middleware.md) - 2 points - Draft
- [ ] [US0005: Get Current User Endpoint (/auth/me)](../stories/US0005-get-current-user-endpoint.md) - 3 points - Draft

**Total Story Points:** 13
**Completed:** 8/13 points (61%)

---

## Test Plan

**Test Spec:** Will be created during story implementation

**Key Test Scenarios:**
- Successful registration with valid data
- Registration fails with duplicate email/username
- Password is hashed (not stored plaintext)
- Successful login returns valid JWT
- Invalid credentials rejected
- Expired token rejected by middleware
- Protected routes require valid token

---

## Team Assignment Notes

**Ideal Developer Profile:**
- Comfortable with Node.js/Express backend
- Understands JWT and authentication patterns
- Familiar with bcrypt and password security
- Can write Mongoose schemas and models

**Conflict Avoidance:**
- This epic is backend-focused (no frontend UI yet)
- Works independently of other epics (no dependencies)
- Clear file boundaries: `/src/routes/auth.ts`, `/src/models/User.ts`, `/src/middleware/auth.ts`
- Can be developed in parallel with EP0003 (Photo Upload) - different file scopes

**Suggested Assignment:** Richard or Mark (backend specialists)

---

## Open Questions

- [ ] Should we add rate limiting on /auth/login to prevent brute force? - Owner: TBD (Decision: Defer to v0.2.0 per TRD)
- [ ] Do we need username case-insensitive uniqueness? - Owner: TBD (Decision: Yes, convert to lowercase for comparison)
- [ ] Should tokens be refreshable before expiration? - Owner: TBD (Decision: Not in v0.1.0, accept 7-day expiration)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial epic created from PRD |
