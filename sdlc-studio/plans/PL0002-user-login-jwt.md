# PL0002: User Login API with JWT Token Generation - Implementation Plan

> **Status:** Completed
> **Story:** [US0002: User Login API with JWT Token Generation](../stories/US0002-user-login-jwt.md)
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Language:** TypeScript

## Overview

Implement user login functionality with JWT token generation. This builds on the User model from US0001 and establishes the authentication token system that will be used by all protected endpoints (US0003+).

**Key deliverables:**
- POST /api/v1/auth/login endpoint
- JWT token generation service (reusable)
- Password verification with bcrypt
- Support login via email OR username
- Comprehensive security (don't reveal which credential failed)

## Acceptance Criteria Summary

| AC | Name | Description |
|----|------|-------------|
| AC1 | Successful Login with Email | Valid email + password → 200 with JWT token |
| AC2 | Successful Login with Username | Valid username + password → 200 with JWT token |
| AC3 | Invalid Credentials (Wrong Password) | Wrong password → 401 "Invalid credentials" |
| AC4 | Invalid Credentials (Non-existent User) | Non-existent user → 401 "Invalid credentials" |
| AC5 | Token Validation | Token payload has userId, username, iat, exp; valid signature; 7-day expiration |

---

## Technical Context

### Language & Framework
- **Primary Language:** TypeScript 5.x
- **Framework:** Express 4.x
- **Test Framework:** Jest + Supertest
- **Libraries:** jsonwebtoken, bcrypt (already installed)

### Relevant Best Practices
- Use async/await for DB queries and password verification
- JWT secret MUST be in environment variable
- Token expiration configurable via environment
- Security: Generic error messages (don't reveal if email or password failed)
- Validate server starts only if JWT_SECRET is set

### Existing Patterns
- User model from US0001 (src/models/User.ts)
- Error response format from US0001
- Password hashing with bcrypt established
- MongoDB query patterns established

---

## Recommended Approach

**Strategy:** TDD (Test-Driven Development)

**Rationale:**
- API endpoint with clear contracts
- 12 test scenarios with specific expected outcomes
- Security-critical functionality (authentication)
- JWT token structure must match specification exactly
- Building on established patterns from US0001

### Test Priority
1. **Happy paths** - Login with email, login with username → valid tokens
2. **Security tests** - Wrong password, non-existent user → generic error
3. **Token structure** - Verify payload, signature, expiration
4. **Edge cases** - Missing fields, empty strings, case sensitivity

---

## Implementation Phases

### Phase 1: JWT Service (Reusable)
**Goal:** Create JWT token generation and verification service

- [ ] Create JWT service utility (src/services/jwtService.ts)
- [ ] Implement `generateToken(userId: string, username: string): string`
- [ ] Implement `verifyToken(token: string): { userId: string, username: string } | null`
- [ ] Use environment variables: JWT_SECRET, JWT_EXPIRES_IN (default: 7d)
- [ ] Add server startup validation (fail if JWT_SECRET not set)

**Files:**
- `src/services/jwtService.ts` - JWT token generation/verification

**Shared Service:** This will be used by US0003 (Auth Middleware) and beyond.

### Phase 2: Login Controller
**Goal:** Implement login endpoint with credential validation

- [ ] Create login function in authController.ts
- [ ] Accept email OR username + password
- [ ] Find user by email (case-insensitive) OR username (case-sensitive)
- [ ] Return 401 "Invalid credentials" if user not found
- [ ] Verify password with bcrypt.compare()
- [ ] Return 401 "Invalid credentials" if password wrong
- [ ] Generate JWT token using service
- [ ] Return 200 with token and user data

**Files:**
- `src/controllers/authController.ts` - Add login function (update existing file)

### Phase 3: Route Integration
**Goal:** Add login route to auth router

- [ ] Add POST /login route to auth router
- [ ] Mount in existing auth.ts file

**Files:**
- `src/routes/auth.ts` - Add login route (update existing file)

### Phase 4: Environment Configuration
**Goal:** Add JWT configuration to environment

- [ ] Update .env.example with JWT_SECRET and JWT_EXPIRES_IN
- [ ] Document JWT secret generation in README

**Files:**
- `.env.example` - Add JWT configuration (update)

### Phase 5: Testing & Validation
**Goal:** Verify all acceptance criteria with comprehensive tests

- [ ] Write integration tests for login endpoint
- [ ] Test happy paths (email login, username login)
- [ ] Test security (wrong password, non-existent user)
- [ ] Test token structure (decode and verify payload)
- [ ] Test token signature validation
- [ ] Test token expiration (7 days)
- [ ] Test edge cases (missing fields, empty strings, case sensitivity)

**Files:**
- `tests/integration/auth.login.test.ts` - Login endpoint tests

| AC | Verification Method | File Evidence | Status |
|----|---------------------|---------------|--------|
| AC1 | Integration test: POST with email+password → 200, valid token | `tests/integration/auth.login.test.ts:15` | Pending |
| AC2 | Integration test: POST with username+password → 200, valid token | `tests/integration/auth.login.test.ts:35` | Pending |
| AC3 | Integration test: POST with wrong password → 401 generic error | `tests/integration/auth.login.test.ts:55` | Pending |
| AC4 | Integration test: POST with non-existent user → 401 generic error | `tests/integration/auth.login.test.ts:75` | Pending |
| AC5 | Integration test: Decode token, verify payload structure, signature, expiration | `tests/integration/auth.login.test.ts:95` | Pending |

---

## Edge Case Handling

| # | Edge Case (from Story) | Handling Strategy | Phase |
|---|------------------------|-------------------|-------|
| 1 | Missing email/username field | Validate presence, return 400 Bad Request | Phase 2 |
| 2 | Missing password field | Validate presence, return 400 Bad Request | Phase 2 |
| 3 | Empty string for credentials | Treat as invalid, return 401 Invalid credentials | Phase 2 |
| 4 | Both email and username provided | Prioritize email (check email first) | Phase 2 |
| 5 | Case-insensitive email match | Query with email.toLowerCase() | Phase 2 |
| 6 | Username case-sensitive match | Query username exactly as provided | Phase 2 |
| 7 | JWT_SECRET not set | Validate on server startup, prevent server start | Phase 1 |
| 8 | Token generation fails | Try-catch, return 500 Internal Server Error | Phase 2 |
| 9 | MongoDB connection lost | Try-catch in controller, return 500, log error | Phase 2 |

**Coverage:** 9/9 edge cases handled

---

## Implementation Tasks

| # | Task | File | Depends On | Status |
|---|------|------|------------|--------|
| 1 | Create JWT service | `src/services/jwtService.ts` | - | [ ] |
| 2 | Add JWT_SECRET startup validation | `src/server.ts` | #1 | [ ] |
| 3 | Implement login controller | `src/controllers/authController.ts` | #1 | [ ] |
| 4 | Add login route | `src/routes/auth.ts` | #3 | [ ] |
| 5 | Update .env.example | `.env.example` | - | [ ] |
| 6 | Write integration tests | `tests/integration/auth.login.test.ts` | #1-#4 | [ ] |

### Parallel Execution Groups

| Group | Tasks | Prerequisite |
|-------|-------|--------------|
| Setup | #1, #5 | None - can start immediately |
| Implementation | #2, #3, #4 | Group "Setup" complete |
| Testing | #6 | Group "Implementation" complete |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT_SECRET leaked in code/git | Critical | Environment variable only, never commit, document in .env.example |
| Token expiration too short/long | Medium | Configurable via environment (default 7d reasonable) |
| bcrypt.compare timing attack | Low | bcrypt inherently resistant, acceptable for v0.1.0 |
| Generic error allows user enumeration | Low | Always return "Invalid credentials" regardless of failure reason |
| Token payload too large | Low | Only include userId and username (minimal payload) |

---

## Definition of Done

- [ ] All 5 acceptance criteria implemented
- [ ] All 9 edge cases handled
- [ ] 12+ test scenarios passing
- [ ] JWT token structure verified (payload, signature, expiration)
- [ ] Security verified (generic error messages)
- [ ] Code follows TypeScript best practices
- [ ] No linting errors
- [ ] .env.example updated
- [ ] README updated with JWT setup

---

## Notes

### TDD Implementation Order
1. Write test for login with email (happy path)
2. Implement minimal login logic
3. Write test for login with username
4. Extend login logic to support username
5. Write test for wrong password → generic error
6. Add password verification
7. Write test for non-existent user → generic error
8. Add user lookup error handling
9. Write test for token structure/signature/expiration
10. Implement JWT service

### Environment Variables Required
```
# Add to .env
JWT_SECRET=your-secret-key-min-32-chars-recommended
JWT_EXPIRES_IN=7d  # Optional, defaults to 7d
```

### JWT Secret Generation
```bash
# Generate secure secret (document in README)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### JWT Token Payload
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "iat": 1706612345,  // Issued at (unix timestamp)
  "exp": 1707217145   // Expires (7 days later)
}
```

### API Response Format (Consistent with US0001)
```json
// Success
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { "userId": "...", "username": "...", "email": "..." }
  },
  "message": "Login successful"
}

// Error
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

### Shared Service Created
This story creates **JWT Service** (`src/services/jwtService.ts`) which will be used by:
- US0003: JWT Auth Middleware (token verification)
- US0004+: All protected endpoints

Must document in SHARED_SERVICES.md after implementation.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial plan created for US0002 |
