# US0002: User Login API with JWT Token Generation

> **Status:** Draft
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** registered user (any persona)
**I want** to log in with my credentials and receive an authentication token
**So that** I can access protected features of inchagram

## Context

### Persona Reference
**All Personas** - Required for accessing the platform after registration.

[Full persona details](../personas.md)

### Background
After registration, users need to authenticate to access protected features. This API endpoint validates credentials (email/username + password), generates a JWT token, and returns it to the client for subsequent authenticated requests.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| TRD | Auth | JWT tokens with 7-day expiration | Token must include exp claim |
| TRD | Security | bcrypt password verification | Must use bcrypt.compare() |
| PRD | Performance | Login response time <500ms (p95) | Optimize query and hash verification |

---

## Acceptance Criteria

### AC1: Successful Login with Email
- **Given** I provide registered email and correct password
- **When** I POST to `/api/v1/auth/login`
- **Then** response returns 200 with JWT token
- **And** token payload includes userId, username, iat, exp
- **And** token expires in 7 days

### AC2: Successful Login with Username
- **Given** I provide registered username and correct password
- **When** I POST to `/api/v1/auth/login`
- **Then** response returns 200 with JWT token (same as email login)

### AC3: Invalid Credentials (Wrong Password)
- **Given** I provide valid email but incorrect password
- **When** I POST to `/api/v1/auth/login`
- **Then** response returns 401 Unauthorized
- **And** error message is "Invalid credentials" (don't reveal which field is wrong)

### AC4: Invalid Credentials (Non-existent User)
- **Given** I provide email/username that doesn't exist
- **When** I POST to `/api/v1/auth/login`
- **Then** response returns 401 Unauthorized
- **And** error message is "Invalid credentials" (same as wrong password for security)

### AC5: Token Validation
- **Given** I receive a JWT token from login
- **When** I decode the token
- **Then** payload contains `{ userId, username, iat, exp }`
- **And** token signature is valid when verified with JWT_SECRET
- **And** expiration is 7 days from issuance

---

## Scope

### In Scope
- POST `/api/v1/auth/login` endpoint
- Accept email OR username + password
- Bcrypt password verification
- JWT token generation with jsonwebtoken library
- Token payload: userId, username, iat, exp
- 7-day token expiration
- Error responses for invalid credentials
- Security: Don't reveal whether email or password is wrong

### Out of Scope
- Token refresh mechanism (deferred)
- "Remember me" functionality (deferred)
- Multi-device session management (deferred)
- Account lockout after failed attempts (deferred)
- Rate limiting (deferred)

---

## Technical Notes

**JWT Generation:**
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    userId: user._id,
    username: user.username
  },
  process.env.JWT_SECRET!,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);
```

**Password Verification:**
```typescript
import bcrypt from 'bcrypt';
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Login Logic:**
1. Find user by email OR username (case-insensitive for email)
2. If user not found → return 401 "Invalid credentials"
3. Verify password with bcrypt.compare()
4. If password incorrect → return 401 "Invalid credentials"
5. Generate JWT token
6. Return token and user info

### API Contracts

**Request:**
```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",  // OR "username": "johndoe"
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "user@example.com"
    }
  },
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

### Data Requirements
- User model from US0001
- Environment variables: JWT_SECRET, JWT_EXPIRES_IN (optional, default: 7d)

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Missing email/username field | Return 400 Bad Request |
| Missing password field | Return 400 Bad Request |
| Empty string for credentials | Return 401 Invalid credentials |
| Both email and username provided | Accept email (prioritize email) |
| Case-insensitive email match | Match email regardless of case |
| Username case-sensitive match | Match username case-sensitively |
| JWT_SECRET not set | Throw error on server startup, don't start server |
| Token generation fails | Return 500 Internal Server Error |
| MongoDB connection lost | Return 500, log error |

---

## Test Scenarios

- [ ] **Happy path (email):** Valid email + password → 200 with token
- [ ] **Happy path (username):** Valid username + password → 200 with token
- [ ] **Wrong password:** Correct email, wrong password → 401
- [ ] **Non-existent user:** Email not in DB → 401
- [ ] **Missing password:** Only email provided → 400
- [ ] **Missing email/username:** Only password provided → 400
- [ ] **Empty credentials:** Empty strings → 401
- [ ] **Case-insensitive email:** "USER@EXAMPLE.COM" matches "user@example.com" → 200
- [ ] **Token structure:** Decode token, verify userId, username, iat, exp present
- [ ] **Token signature:** Verify token with JWT_SECRET → valid signature
- [ ] **Token expiration:** Verify exp claim is ~7 days from iat
- [ ] **Security:** Error message doesn't reveal if email or password was wrong → always "Invalid credentials"

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0001](US0001-user-registration-api.md) | Prerequisite | User model and schema | Draft |

### External Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| jsonwebtoken | npm package | Required |
| bcrypt | npm package | Required |
| JWT_SECRET | Environment variable | Required |

---

## Estimation

**Story Points:** 3
**Complexity:** Medium

---

## Open Questions

- [ ] Should we return user profile data in login response? - Owner: Richard (Decision: Yes, basic user info)
- [ ] Should we log login attempts? - Owner: Richard (Decision: Not for v0.1.0)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial story created from EP0001 |
