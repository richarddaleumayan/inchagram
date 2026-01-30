# TS0005: Get Current User Endpoint (/auth/me)

> **Status:** Automated
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Last Updated:** 2026-01-30

## Overview

Test specification for GET /auth/me endpoint that returns the authenticated user's profile information. Validates authentication integration, data security, and error handling.

## Scope

### Stories Covered

| Story | Title | Priority |
|-------|-------|----------|
| [US0005](../stories/US0005-get-current-user-endpoint.md) | Get Current User Endpoint (/auth/me) | Critical |

### AC Coverage Matrix

| Story | AC | Description | Test Cases | Status |
|-------|-----|-------------|------------|--------|
| US0005 | AC1 | Successful Profile Retrieval with Valid Token | TC001, TC002 | Covered |
| US0005 | AC2 | Missing Authentication Token | TC003 | Covered |
| US0005 | AC3 | Invalid or Expired Token | TC004, TC005 | Covered |
| US0005 | AC4 | User Data Freshness | TC006, TC007 | Covered |

**Coverage:** 4/4 ACs covered

### Test Types Required

| Type | Required | Rationale |
|------|----------|-----------|
| Unit | No | Business logic is minimal, integration test sufficient |
| Integration | Yes | Test endpoint with auth middleware and database |
| E2E | No | Backend API only, no UI |

---

## Environment

| Requirement | Details |
|-------------|---------|
| Prerequisites | MongoDB running, User registered and logged in, JWT middleware functional |
| External Services | MongoDB (test database: inchagram_test) |
| Test Data | User fixtures, valid JWT tokens from login |

---

## Test Cases

### TC001: Successful Profile Retrieval with Valid Token

**Type:** Integration | **Priority:** Critical | **Story:** US0005 AC1

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User registered and logged in with valid JWT token | Token available |
| When | GET /api/v1/auth/me with Authorization: Bearer <token> | Request processed |
| Then | Response is 200 with complete user profile | Profile retrieved |
| And | Response includes userId, username, email, optional fields | All fields present |

**Assertions:**
- [ ] Response status code is 200
- [ ] Response body contains `success: true`
- [ ] Response data.userId matches logged-in user
- [ ] Response data.username matches logged-in user
- [ ] Response data.email matches logged-in user
- [ ] Response includes displayName (null if not set)
- [ ] Response includes bio (null if not set)
- [ ] Response includes profilePictureUrl (null if not set)
- [ ] Response includes createdAt timestamp
- [ ] Response includes updatedAt timestamp

---

### TC002: Response Excludes passwordHash

**Type:** Integration | **Priority:** Critical | **Story:** US0005 AC1 (Security)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User logged in with valid token | Token available |
| When | GET /api/v1/auth/me | Request processed |
| Then | Response is 200 with user profile | Success |
| And | Response does NOT include passwordHash field | Security validated |

**Assertions:**
- [ ] Response status code is 200
- [ ] Response data does NOT have passwordHash property
- [ ] Security: No sensitive data exposed

---

### TC003: Missing Authorization Header

**Type:** Integration | **Priority:** Critical | **Story:** US0005 AC2

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | No authentication credentials | No token |
| When | GET /api/v1/auth/me without Authorization header | Middleware blocks |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Authentication token required" | Clear error |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response body contains `success: false`
- [ ] Response error.code is "UNAUTHORIZED"
- [ ] Response error.message is "Authentication token required"
- [ ] Route handler never called (middleware blocks)

---

### TC004: Invalid JWT Token

**Type:** Integration | **Priority:** Critical | **Story:** US0005 AC3

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Invalid JWT (malformed, wrong secret) | Token invalid |
| When | GET /api/v1/auth/me with invalid token | Middleware rejects |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Invalid or expired token" | Clear error |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error.code is "UNAUTHORIZED"
- [ ] Response error.message is "Invalid or expired token"
- [ ] Malformed token rejected
- [ ] Token with wrong signature rejected

---

### TC005: Expired JWT Token

**Type:** Integration | **Priority:** Critical | **Story:** US0005 AC3

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | JWT token issued >7 days ago | Token expired |
| When | GET /api/v1/auth/me with expired token | Middleware rejects |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Invalid or expired token" | Expiration detected |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error.message is "Invalid or expired token"
- [ ] Expired token rejected by middleware

---

### TC006: User Deleted After Token Issued

**Type:** Integration | **Priority:** High | **Story:** US0005 AC4 (Race Condition)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User logged in, then account deleted | Valid token, no user |
| When | GET /api/v1/auth/me with valid token | Query returns null |
| Then | Response is 404 Not Found | User not found |
| And | Error message is "User not found" | Clear error |

**Assertions:**
- [ ] Response status code is 404
- [ ] Response error.code is "NOT_FOUND"
- [ ] Response error.message is "User not found"
- [ ] Race condition handled gracefully

---

### TC007: Fresh Data Returned from Database

**Type:** Integration | **Priority:** High | **Story:** US0005 AC4

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User logged in | Token issued |
| When | User profile updated (e.g., displayName changed) | Database modified |
| And | GET /api/v1/auth/me called | Fresh data queried |
| Then | Response includes updated displayName | Current data returned |

**Assertions:**
- [ ] Response reflects latest database state
- [ ] Does NOT return stale data from token payload
- [ ] Fresh query performed on each request

---

### TC008: Optional Fields Null When Not Set

**Type:** Integration | **Priority:** Medium | **Story:** US0005 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User has no displayName, bio, profilePictureUrl | Optional fields empty |
| When | GET /api/v1/auth/me | Profile retrieved |
| Then | Response includes optional fields as null | Fields present but null |

**Assertions:**
- [ ] Response data.displayName is null (not omitted)
- [ ] Response data.bio is null (not omitted)
- [ ] Response data.profilePictureUrl is null (not omitted)
- [ ] Optional fields included with null value

---

### TC009: Database Error Handling

**Type:** Integration | **Priority:** Medium | **Story:** US0005 (Error Handling)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Database connection issue (simulated) | DB unavailable |
| When | GET /api/v1/auth/me | Query fails |
| Then | Response is 500 Internal Server Error | Error handled |
| And | Generic error message returned | No DB details leaked |

**Assertions:**
- [ ] Response status code is 500
- [ ] Response error.code is "INTERNAL_ERROR"
- [ ] Response error.message is generic (no DB details)
- [ ] Error logged to console

---

## Test Implementation Strategy

### Test Route Setup
Use existing Express app with JWT middleware:

```typescript
// In test file
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/v1/auth/me', () => {
  // Test setup and helpers
});
```

### Token Generation for Tests
- Use login endpoint to generate valid tokens
- Manually create expired tokens with jwt.sign({ exp: past })
- Tamper with tokens for invalid token tests

---

## Fixtures

```yaml
users:
  test_user:
    email: "getme@example.com"
    username: "getmeuser"
    password: "password123"
    displayName: null  # Optional field
    bio: null
    profilePictureUrl: null

  user_with_profile:
    email: "complete@example.com"
    username: "completeuser"
    password: "password123"
    displayName: "Complete User"
    bio: "This is my bio"
    profilePictureUrl: "https://example.com/profile.jpg"

valid_tokens:
  fresh_token:
    generated_via: "POST /api/v1/auth/login"
    userId: "<from_login_response>"
    username: "getmeuser"

invalid_tokens:
  expired: "<token_with_exp_7_days_ago>"
  malformed: "not.a.valid.jwt"
  wrong_secret: "<token_signed_with_different_key>"
```

---

## Automation Status

| TC | Title | Status | Implementation |
|----|-------|--------|----------------|
| TC001 | Successful Profile Retrieval | ✓ Pass | tests/integration/auth.me.test.ts:49 |
| TC002 | Response Excludes passwordHash | ✓ Pass | tests/integration/auth.me.test.ts:77 |
| TC003 | Missing Authorization Header | ✓ Pass | tests/integration/auth.me.test.ts:98 |
| TC004 | Invalid JWT Token | ✓ Pass | tests/integration/auth.me.test.ts:113,128 |
| TC005 | Expired JWT Token | ✓ Pass | tests/integration/auth.me.test.ts:144 |
| TC006 | User Deleted After Token Issued | ✓ Pass | tests/integration/auth.me.test.ts:166 |
| TC007 | Fresh Data Returned | ✓ Pass | tests/integration/auth.me.test.ts:191 |
| TC008 | Optional Fields Null | ✓ Pass | tests/integration/auth.me.test.ts:221,248 |
| TC009 | Database Error Handling | Not Implemented | - |

---

## Traceability

| Artefact | Reference |
|----------|-----------|
| PRD | [sdlc-studio/prd.md](../prd.md) |
| Epic | [EP0001](../epics/EP0001-user-authentication.md) |
| Story | [US0005](../stories/US0005-get-current-user-endpoint.md) |
| Plan | [PL0005](../plans/PL0005-get-current-user-endpoint.md) |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial spec created for US0005 |
