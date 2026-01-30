# TS0002: User Login API with JWT Token Generation

> **Status:** Automated
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Last Updated:** 2026-01-30

## Overview

Test specification for user login API endpoint with JWT token generation. This validates credential verification, JWT token structure, security measures, and error handling for authentication.

## Scope

### Stories Covered

| Story | Title | Priority |
|-------|-------|----------|
| [US0002](../stories/US0002-user-login-jwt.md) | User Login API with JWT Token Generation | Critical |

### AC Coverage Matrix

| Story | AC | Description | Test Cases | Status |
|-------|-----|-------------|------------|--------|
| US0002 | AC1 | Successful Login with Email | TC001, TC008 | Covered |
| US0002 | AC2 | Successful Login with Username | TC002 | Covered |
| US0002 | AC3 | Invalid Credentials (Wrong Password) | TC003 | Covered |
| US0002 | AC4 | Invalid Credentials (Non-existent User) | TC004 | Covered |
| US0002 | AC5 | Token Validation | TC009, TC010, TC011 | Covered |

**Coverage:** 5/5 ACs covered

### Test Types Required

| Type | Required | Rationale |
|------|----------|-----------|
| Unit | No | JWT service could have unit tests, but integration tests sufficient |
| Integration | Yes | Test full login flow including DB, bcrypt, JWT generation |
| E2E | No | Backend API only, no UI |

---

## Environment

| Requirement | Details |
|-------------|---------|
| Prerequisites | MongoDB running, User registered (from US0001), JWT_SECRET set in environment |
| External Services | MongoDB (test database: inchagram_test) |
| Test Data | User fixtures for login testing |

---

## Test Cases

### TC001: Successful Login with Email

**Type:** Integration | **Priority:** Critical | **Story:** US0002 AC1

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User registered with email "test@example.com", password "password123" | User exists in database |
| When | POST /api/v1/auth/login with email + password | Request processed |
| Then | Response is 200 with JWT token | Login successful |

**Assertions:**
- [ ] Response status code is 200
- [ ] Response body contains `success: true`
- [ ] Response body contains `data.token` (string)
- [ ] Response body contains `data.user.userId`
- [ ] Response body contains `data.user.username`
- [ ] Response body contains `data.user.email` matching input
- [ ] Response message is "Login successful"
- [ ] Token is a valid JWT (can be decoded)

---

### TC002: Successful Login with Username

**Type:** Integration | **Priority:** Critical | **Story:** US0002 AC2

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User registered with username "testuser", password "password123" | User exists in database |
| When | POST /api/v1/auth/login with username + password | Request processed |
| Then | Response is 200 with JWT token | Login successful |

**Assertions:**
- [ ] Response status code is 200
- [ ] Response body contains valid JWT token
- [ ] Response user data matches registered user
- [ ] Token payload contains userId and username

---

### TC003: Wrong Password

**Type:** Integration | **Priority:** Critical | **Story:** US0002 AC3

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User exists with email "test@example.com" | User in database |
| When | POST /api/v1/auth/login with correct email but wrong password | Validation fails |
| Then | Response is 401 Unauthorized | Authentication denied |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response body contains `success: false`
- [ ] Response error code is "UNAUTHORIZED"
- [ ] Response error message is "Invalid credentials" (generic)
- [ ] No token returned
- [ ] Error message does NOT reveal password was wrong

---

### TC004: Non-existent User

**Type:** Integration | **Priority:** Critical | **Story:** US0002 AC4

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | Email "nonexistent@example.com" not in database | User does not exist |
| When | POST /api/v1/auth/login with non-existent email | Lookup fails |
| Then | Response is 401 Unauthorized | Authentication denied |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error message is "Invalid credentials" (same as wrong password)
- [ ] Error message does NOT reveal user doesn't exist
- [ ] Security: No user enumeration possible

---

### TC005: Missing Password Field

**Type:** Integration | **Priority:** High | **Story:** US0002 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database accessible |
| When | POST /api/v1/auth/login with only email (no password field) | Validation fails |
| Then | Response is 400 Bad Request | Missing required field |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error code is "VALIDATION_ERROR"
- [ ] Response error message contains "password" and "required"

---

### TC006: Missing Email/Username Field

**Type:** Integration | **Priority:** High | **Story:** US0002 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database accessible |
| When | POST /api/v1/auth/login with only password (no email/username) | Validation fails |
| Then | Response is 400 Bad Request | Missing required field |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message indicates email or username required

---

### TC007: Empty Credentials

**Type:** Integration | **Priority:** Medium | **Story:** US0002 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database accessible |
| When | POST /api/v1/auth/login with email="" and password="" | Validation fails |
| Then | Response is 401 Invalid credentials | Empty strings rejected |

**Assertions:**
- [ ] Response status code is 401
- [ ] Response error message is "Invalid credentials"

---

### TC008: Case-Insensitive Email Match

**Type:** Integration | **Priority:** Medium | **Story:** US0002 AC1 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User registered with email "test@example.com" (lowercase) | User in database |
| When | POST /api/v1/auth/login with email "TEST@EXAMPLE.COM" (uppercase) | Case-insensitive match |
| Then | Response is 200 with valid token | Login successful |

**Assertions:**
- [ ] Response status code is 200
- [ ] Email case-insensitivity working
- [ ] User correctly identified

---

### TC009: Token Payload Structure

**Type:** Integration | **Priority:** Critical | **Story:** US0002 AC5

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User logged in successfully | JWT token received |
| When | Decode JWT token (without verification) | Token payload readable |
| Then | Payload contains userId, username, iat, exp | Token structure correct |

**Assertions:**
- [ ] Token payload has `userId` field (MongoDB ObjectId string)
- [ ] Token payload has `username` field (string)
- [ ] Token payload has `iat` field (unix timestamp)
- [ ] Token payload has `exp` field (unix timestamp)
- [ ] No sensitive data in payload (no passwordHash, email)

---

### TC010: Token Signature Validation

**Type:** Integration | **Priority:** Critical | **Story:** US0002 AC5

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User logged in successfully | JWT token received |
| When | Verify token with JWT_SECRET | Signature verification |
| Then | Token signature is valid | Token not tampered |

**Assertions:**
- [ ] Token can be verified with JWT_SECRET
- [ ] Verification returns decoded payload
- [ ] Modified token fails verification
- [ ] Token signed with wrong secret fails verification

---

### TC011: Token Expiration Time

**Type:** Integration | **Priority:** Critical | **Story:** US0002 AC5

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User logged in successfully | JWT token received |
| When | Check token expiration claim | Expiration time extracted |
| Then | Expiration is 7 days from issuance | Token expires in 7 days |

**Assertions:**
- [ ] Token `exp` claim exists
- [ ] `exp` - `iat` equals 7 days (604800 seconds)
- [ ] Token expiration configured correctly

---

### TC012: Both Email and Username Provided

**Type:** Integration | **Priority:** Low | **Story:** US0002 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User registered with email and username | User in database |
| When | POST /api/v1/auth/login with both email AND username fields | Email prioritized |
| Then | Response is 200, login uses email | Email takes precedence |

**Assertions:**
- [ ] Response status code is 200
- [ ] User logged in successfully
- [ ] Email used for lookup (username ignored)

---

## Fixtures

```yaml
users:
  test_user:
    email: "test@example.com"
    username: "testuser"
    password: "password123"  # Plaintext for test input
    passwordHash: "$2b$10$..."  # bcrypt hash in database

  another_user:
    email: "another@example.com"
    username: "anotheruser"
    password: "anotherpass123"

invalid_credentials:
  wrong_password: "wrongpassword"
  wrong_email: "nonexistent@example.com"
  wrong_username: "nonexistentuser"

jwt_config:
  secret: "test-secret-key-for-jwt-testing"
  expires_in: "7d"
```

---

## Automation Status

| TC | Title | Status | Implementation |
|----|-------|--------|----------------|
| TC001 | Successful Login with Email | ✓ Pass | tests/integration/auth.login.test.ts:49 |
| TC002 | Successful Login with Username | ✓ Pass | tests/integration/auth.login.test.ts:82 |
| TC003 | Wrong Password | ✓ Pass | tests/integration/auth.login.test.ts:105 |
| TC004 | Non-existent User | ✓ Pass | tests/integration/auth.login.test.ts:133,153 |
| TC005 | Missing Password Field | ✓ Pass | tests/integration/auth.login.test.ts:170 |
| TC006 | Missing Email/Username Field | ✓ Pass | tests/integration/auth.login.test.ts:187 |
| TC007 | Empty Credentials | ✓ Pass | tests/integration/auth.login.test.ts:204 |
| TC008 | Case-Insensitive Email Match | ✓ Pass | tests/integration/auth.login.test.ts:220 |
| TC009 | Token Payload Structure | ✓ Pass | tests/integration/auth.login.test.ts:241 |
| TC010 | Token Signature Validation | ✓ Pass | tests/integration/auth.login.test.ts:278,299,320 |
| TC011 | Token Expiration Time | ✓ Pass | tests/integration/auth.login.test.ts:347 |
| TC012 | Both Email and Username Provided | ✓ Pass | tests/integration/auth.login.test.ts:377 |

---

## Traceability

| Artefact | Reference |
|----------|-----------|
| PRD | [sdlc-studio/prd.md](../prd.md) |
| Epic | [EP0001](../epics/EP0001-user-authentication.md) |
| Story | [US0002](../stories/US0002-user-login-jwt.md) |
| Plan | [PL0002](../plans/PL0002-user-login-jwt.md) |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial spec created for US0002 |
