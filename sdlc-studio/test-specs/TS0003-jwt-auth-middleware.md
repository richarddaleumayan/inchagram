# TS0003: JWT Authentication Middleware

> **Status:** Automated
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Last Updated:** 2026-01-30

## Overview

Test specification for JWT authentication middleware that verifies tokens and populates request context with authenticated user information.

## Scope

### Stories Covered

| Story | Title | Priority |
|-------|-------|----------|
| [US0003](../stories/US0003-jwt-auth-middleware.md) | JWT Authentication Middleware | Critical |

### AC Coverage Matrix

| Story | AC | Description | Test Cases | Status |
|-------|-----|-------------|------------|--------|
| US0003 | AC1 | Valid Token Authentication | TC001 | Covered |
| US0003 | AC2 | Missing Token Rejection | TC002, TC003, TC008 | Covered |
| US0003 | AC3 | Invalid Token Rejection | TC004, TC006, TC007 | Covered |
| US0003 | AC4 | Expired Token Rejection | TC005 | Covered |

**Coverage:** 4/4 ACs covered

### Test Types Required

| Type | Required | Rationale |
|------|----------|-----------|
| Unit | No | Middleware behavior best tested in integration context |
| Integration | Yes | Test middleware with Express routes and JWT verification |
| E2E | No | Backend middleware only, no UI |

---

## Environment

| Requirement | Details |
|-------------|---------|
| Prerequisites | MongoDB running, JWT_SECRET set, User registered and logged in |
| External Services | MongoDB (test database: inchagram_test) |
| Test Data | Valid JWT tokens from login endpoint |

---

## Test Cases

### TC001: Valid Token Authentication

**Type:** Integration | **Priority:** Critical | **Story:** US0003 AC1

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User logged in with valid JWT token | Token available |
| When | Request to protected endpoint with `Authorization: Bearer <token>` | Middleware verifies token |
| Then | req.user populated with { userId, username } | User context available |
| And | next() called, request proceeds to route handler | Endpoint accessible |

**Assertions:**
- [ ] Response status code is 200 (endpoint reached)
- [ ] req.user.userId matches logged-in user's ID
- [ ] req.user.username matches logged-in user's username
- [ ] Route handler receives populated req.user
- [ ] Middleware calls next() (does not block request)

---

### TC002: Missing Authorization Header

**Type:** Integration | **Priority:** Critical | **Story:** US0003 AC2

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Protected route requiring authentication | Middleware active |
| When | Request sent with no Authorization header | Header check fails |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Authentication token required" | Clear error |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response body contains `success: false`
- [ ] Response error code is "UNAUTHORIZED"
- [ ] Response error message is "Authentication token required"
- [ ] Route handler never called (request blocked by middleware)

---

### TC003: Authorization Header Without Bearer Prefix

**Type:** Integration | **Priority:** High | **Story:** US0003 AC2 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Valid JWT token | Token available |
| When | Request sent with `Authorization: <token>` (no "Bearer " prefix) | Format validation fails |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Authentication token required" | Header malformed |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error message is "Authentication token required"
- [ ] Malformed header treated same as missing header

---

### TC004: Malformed JWT Token

**Type:** Integration | **Priority:** Critical | **Story:** US0003 AC3

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Invalid JWT (not 3 base64 parts) | Token malformed |
| When | Request sent with `Authorization: Bearer invalid.token` | Verification fails |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Invalid or expired token" | Generic error |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error code is "UNAUTHORIZED"
- [ ] Response error message is "Invalid or expired token"
- [ ] Malformed token rejected (signature verification fails)

---

### TC005: Expired JWT Token

**Type:** Integration | **Priority:** Critical | **Story:** US0003 AC4

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | JWT token issued >7 days ago | Token expired |
| When | Request sent with expired token | Expiration check fails |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Invalid or expired token" | Expiration detected |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error message is "Invalid or expired token"
- [ ] Expired token rejected (exp claim validation fails)

---

### TC006: Token with Wrong Signature

**Type:** Integration | **Priority:** High | **Story:** US0003 AC3 (Security)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | JWT token signed with different secret | Signature mismatch |
| When | Request sent with token signed by wrong key | Signature verification fails |
| Then | Response is 401 Unauthorized | Tampering detected |
| And | Error message is "Invalid or expired token" | Security validated |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error message is "Invalid or expired token"
- [ ] Token signed with wrong secret rejected
- [ ] Security: Cannot forge tokens without correct secret

---

### TC007: Token with Tampered Payload

**Type:** Integration | **Priority:** High | **Story:** US0003 AC3 (Security)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Valid JWT with modified payload (e.g., changed userId) | Payload tampered |
| When | Request sent with tampered token | Signature verification fails |
| Then | Response is 401 Unauthorized | Tampering detected |
| And | Error message is "Invalid or expired token" | Integrity validated |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error message is "Invalid or expired token"
- [ ] Modified token rejected (signature doesn't match payload)
- [ ] Security: Cannot modify token claims without detection

---

### TC008: Whitespace-Only Authorization Header

**Type:** Integration | **Priority:** Medium | **Story:** US0003 AC2 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Protected route | Middleware active |
| When | Request sent with `Authorization: "   "` (whitespace only) | Empty header |
| Then | Response is 401 Unauthorized | Access denied |
| And | Error message is "Authentication token required" | Invalid header |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error message is "Authentication token required"
- [ ] Whitespace-only header treated as missing

---

## Test Implementation Strategy

### Test Route Setup
Create a protected test route for middleware validation:

```typescript
// In test file
const protectedRoute = express();
protectedRoute.use(express.json());
protectedRoute.get('/test/protected', authenticateJWT, (req: AuthRequest, res) => {
  res.status(200).json({
    success: true,
    data: {
      userId: req.user!.userId,
      username: req.user!.username,
      message: 'Protected endpoint accessed'
    }
  });
});
```

### Token Generation for Tests
- Use login endpoint to generate valid tokens
- Manually create invalid tokens for error scenarios
- Generate expired tokens using jwt.sign with past exp claim

---

## Fixtures

```yaml
users:
  test_user:
    email: "middleware@example.com"
    username: "middlewareuser"
    password: "password123"

valid_tokens:
  fresh_token:
    userId: "<from_login>"
    username: "middlewareuser"
    generated_via: "POST /api/v1/auth/login"

invalid_tokens:
  malformed: "not.a.valid.jwt"
  wrong_signature: "<token_signed_with_different_secret>"
  tampered: "<valid_token_with_modified_payload>"
  expired: "<token_with_exp_7_days_ago>"
  no_bearer_prefix: "<token_without_bearer>"
  whitespace: "   "
```

---

## Automation Status

| TC | Title | Status | Implementation |
|----|-------|--------|----------------|
| TC001 | Valid Token Authentication | ✓ Pass | tests/integration/auth.middleware.test.ts:69 |
| TC002 | Missing Authorization Header | ✓ Pass | tests/integration/auth.middleware.test.ts:90 |
| TC003 | Authorization Without Bearer Prefix | ✓ Pass | tests/integration/auth.middleware.test.ts:104 |
| TC004 | Malformed JWT Token | ✓ Pass | tests/integration/auth.middleware.test.ts:123,134 |
| TC005 | Expired JWT Token | ✓ Pass | tests/integration/auth.middleware.test.ts:146 |
| TC006 | Token with Wrong Signature | ✓ Pass | tests/integration/auth.middleware.test.ts:171 |
| TC007 | Token with Tampered Payload | ✓ Pass | tests/integration/auth.middleware.test.ts:194 |
| TC008 | Whitespace-Only Authorization Header | ✓ Pass | tests/integration/auth.middleware.test.ts:217,229 |

---

## Traceability

| Artefact | Reference |
|----------|-----------|
| PRD | [sdlc-studio/prd.md](../prd.md) |
| Epic | [EP0001](../epics/EP0001-user-authentication.md) |
| Story | [US0003](../stories/US0003-jwt-auth-middleware.md) |
| Plan | [PL0003](../plans/PL0003-jwt-auth-middleware.md) |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial spec created for US0003 |
