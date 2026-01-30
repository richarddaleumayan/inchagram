# TS0001: User Registration API Endpoint

> **Status:** Automated
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Last Updated:** 2026-01-30

## Overview

Test specification for the user registration API endpoint. This validates all acceptance criteria including input validation, duplicate prevention, password hashing, and error handling. Tests will be implemented as Jest integration tests using Supertest to make HTTP requests to the Express API.

## Scope

### Stories Covered

| Story | Title | Priority |
|-------|-------|----------|
| [US0001](../stories/US0001-user-registration-api.md) | User Registration API Endpoint | High |

### AC Coverage Matrix

| Story | AC | Description | Test Cases | Status |
|-------|-----|-------------|------------|--------|
| US0001 | AC1 | Successful Registration | TC001, TC010 | Covered |
| US0001 | AC2 | Email Validation | TC002, TC014 | Covered |
| US0001 | AC3 | Duplicate Email Prevention | TC003, TC016 | Covered |
| US0001 | AC4 | Duplicate Username Prevention | TC004, TC005 | Covered |
| US0001 | AC5 | Username Format Validation | TC006, TC007, TC009 | Covered |
| US0001 | AC6 | Password Strength Validation | TC008, TC010 | Covered |

**Coverage:** 6/6 ACs covered

### Test Types Required

| Type | Required | Rationale |
|------|----------|-----------|
| Unit | No | Pure API endpoint testing, integration tests sufficient |
| Integration | Yes | Test full request/response cycle including MongoDB |
| E2E | No | Backend API only, no UI in this story |

---

## Environment

| Requirement | Details |
|-------------|---------|
| Prerequisites | MongoDB running on localhost:27017, Node.js 20 LTS, npm packages installed |
| External Services | MongoDB (test database: inchagram_test) |
| Test Data | User fixtures for duplicate testing, clean database before each test |

---

## Test Cases

### TC001: Successful Registration - Happy Path

**Type:** Integration | **Priority:** Critical | **Story:** US0001 AC1

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running and empty | Database is accessible |
| When | POST /api/v1/auth/register with valid email, username, password | Request is processed |
| Then | Response is 201 with user data | User created successfully |

**Assertions:**
- [ ] Response status code is 201
- [ ] Response body contains `success: true`
- [ ] Response body contains `data.userId` (MongoDB ObjectId)
- [ ] Response body contains `data.username` matching input
- [ ] Response body contains `data.email` matching input (lowercase)
- [ ] Response message is "User registered successfully"
- [ ] User document exists in MongoDB
- [ ] Password is hashed with bcrypt (starts with $2b$ or $2a$)
- [ ] Password field in DB is NOT the plaintext password

---

### TC002: Invalid Email Format

**Type:** Integration | **Priority:** High | **Story:** US0001 AC2

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register with email "notanemail" | Request is validated |
| Then | Response is 400 with validation error | Email format rejected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response body contains `success: false`
- [ ] Response error code is "VALIDATION_ERROR"
- [ ] Response error message contains "Email format is invalid"
- [ ] No user created in database

---

### TC003: Duplicate Email Prevention

**Type:** Integration | **Priority:** Critical | **Story:** US0001 AC3

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User exists with email "existing@example.com" | Database contains existing user |
| When | POST /api/v1/auth/register with email "existing@example.com" | Duplicate check fails |
| Then | Response is 409 Conflict | Duplicate email rejected |

**Assertions:**
- [ ] Response status code is 409
- [ ] Response body contains `success: false`
- [ ] Response error code is "CONFLICT"
- [ ] Response error message is "Email already registered"
- [ ] Only one user with that email in database

---

### TC004: Duplicate Username Prevention (Exact Match)

**Type:** Integration | **Priority:** Critical | **Story:** US0001 AC4

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User exists with username "johndoe" | Database contains existing user |
| When | POST /api/v1/auth/register with username "johndoe" | Duplicate check fails |
| Then | Response is 409 Conflict | Duplicate username rejected |

**Assertions:**
- [ ] Response status code is 409
- [ ] Response body contains `success: false`
- [ ] Response error code is "CONFLICT"
- [ ] Response error message is "Username already taken"
- [ ] Only one user with that username in database

---

### TC005: Duplicate Username Prevention (Case-Insensitive)

**Type:** Integration | **Priority:** Critical | **Story:** US0001 AC4

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User exists with username "johndoe" | Database contains existing user |
| When | POST /api/v1/auth/register with username "JohnDoe" (different case) | Case-insensitive duplicate check fails |
| Then | Response is 409 Conflict | Duplicate username rejected regardless of case |

**Assertions:**
- [ ] Response status code is 409
- [ ] Response error message is "Username already taken"
- [ ] Username check is case-insensitive
- [ ] Only one user with that username in database

---

### TC006: Username Too Short

**Type:** Integration | **Priority:** High | **Story:** US0001 AC5

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register with username "ab" (2 chars) | Validation fails |
| Then | Response is 400 with validation error | Username length rejected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message contains "3-30 chars" or "too short"
- [ ] No user created in database

---

### TC007: Username Too Long

**Type:** Integration | **Priority:** High | **Story:** US0001 AC5

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register with username of 31+ characters | Validation fails |
| Then | Response is 400 with validation error | Username length rejected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message contains "3-30 chars" or "too long"
- [ ] No user created in database

---

### TC008: Password Too Short

**Type:** Integration | **Priority:** Critical | **Story:** US0001 AC6

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register with password "pass123" (7 chars) | Validation fails |
| Then | Response is 400 with validation error | Password strength rejected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message is "Password must be at least 8 characters"
- [ ] No user created in database

---

### TC009: Username With Special Characters

**Type:** Integration | **Priority:** High | **Story:** US0001 AC5

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register with username "john@doe" (contains @) | Validation fails |
| Then | Response is 400 with validation error | Special characters rejected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message contains "alphanumeric" or "underscore"
- [ ] No user created in database

---

### TC010: Password Exactly 8 Characters

**Type:** Integration | **Priority:** Medium | **Story:** US0001 AC1, AC6

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running and empty | Database is accessible |
| When | POST /api/v1/auth/register with password "pass1234" (8 chars) | Password meets minimum |
| Then | Response is 201 success | User created with 8-char password |

**Assertions:**
- [ ] Response status code is 201
- [ ] User created successfully
- [ ] Password hashed with bcrypt

---

### TC011: Missing Required Field - Email

**Type:** Integration | **Priority:** High | **Story:** US0001 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register without email field | Validation fails |
| Then | Response is 400 with validation error | Missing field detected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message contains "email" and "required"
- [ ] No user created in database

---

### TC012: Missing Required Field - Username

**Type:** Integration | **Priority:** High | **Story:** US0001 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register without username field | Validation fails |
| Then | Response is 400 with validation error | Missing field detected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message contains "username" and "required"
- [ ] No user created in database

---

### TC013: Missing Required Field - Password

**Type:** Integration | **Priority:** High | **Story:** US0001 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register without password field | Validation fails |
| Then | Response is 400 with validation error | Missing field detected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message contains "password" and "required"
- [ ] No user created in database

---

### TC014: Empty Email String

**Type:** Integration | **Priority:** Medium | **Story:** US0001 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register with email "" (empty string) | Validation fails |
| Then | Response is 400 with validation error | Empty string rejected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message indicates email is invalid or required
- [ ] No user created in database

---

### TC015: Whitespace-Only Username

**Type:** Integration | **Priority:** Medium | **Story:** US0001 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running | Database is accessible |
| When | POST /api/v1/auth/register with username "   " (whitespace only) | Validation fails |
| Then | Response is 400 with validation error | Whitespace rejected |

**Assertions:**
- [ ] Response status code is 400
- [ ] Response error message indicates username is invalid
- [ ] No user created in database

---

### TC016: Email With Uppercase Letters

**Type:** Integration | **Priority:** Medium | **Story:** US0001 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running and empty | Database is accessible |
| When | POST /api/v1/auth/register with email "User@EXAMPLE.COM" | Email normalized to lowercase |
| Then | Response is 201, email stored as "user@example.com" | Email case normalized |

**Assertions:**
- [ ] Response status code is 201
- [ ] Database contains email as "user@example.com" (all lowercase)
- [ ] Response data returns normalized email

---

### TC017: Username With Mixed Case Storage

**Type:** Integration | **Priority:** Medium | **Story:** US0001 (Edge Case)

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | MongoDB is running and empty | Database is accessible |
| When | POST /api/v1/auth/register with username "JohnDoe" | Username stored with original case |
| Then | Response is 201, username stored as "JohnDoe" | Original case preserved |

**Assertions:**
- [ ] Response status code is 201
- [ ] Database contains username exactly as "JohnDoe" (case preserved)
- [ ] Response data returns "JohnDoe"

---

### TC018: Password Hash Verification

**Type:** Integration | **Priority:** Critical | **Story:** US0001 AC1

| Step | Action | Expected Result |
|------|--------|-----------------|
| Given | User registered with password "securepass123" | User created |
| When | Query database for user's passwordHash field | Password retrieved |
| Then | Password is bcrypt hash, not plaintext | Password properly hashed |

**Assertions:**
- [ ] Password field starts with "$2b$" or "$2a$" (bcrypt format)
- [ ] Password length is 60 characters (bcrypt hash length)
- [ ] Password does NOT match input plaintext
- [ ] bcrypt.compare(plaintext, hash) returns true

---

## Fixtures

```yaml
users:
  valid_user:
    email: "test@example.com"
    username: "testuser"
    password: "password123"

  existing_user:
    email: "existing@example.com"
    username: "johndoe"
    password: "existingpass123"

  invalid_emails:
    - "notanemail"
    - "missing@domain"
    - "@nodomain.com"
    - "spaces in@email.com"

  invalid_usernames:
    - "ab"  # too short
    - "a"   # too short
    - "this_is_a_very_long_username_that_exceeds_thirty_characters"  # too long
    - "john@doe"  # special char
    - "john doe"  # space
    - "john.doe"  # period

  weak_passwords:
    - "pass"     # too short
    - "1234567"  # 7 chars
    - ""         # empty

  valid_passwords:
    - "password123"   # valid
    - "pass1234"      # exactly 8 chars
    - "verylongpasswordthatexceeds100charactersbutshouldbevaccceptedanywaybecausewehavenomaxlimitinv01andthisisfinefornow"  # very long
```

---

## Automation Status

| TC | Title | Status | Implementation |
|----|-------|--------|----------------|
| TC001 | Successful Registration - Happy Path | Pending | - |
| TC002 | Invalid Email Format | Pending | - |
| TC003 | Duplicate Email Prevention | Pending | - |
| TC004 | Duplicate Username Prevention (Exact Match) | Pending | - |
| TC005 | Duplicate Username Prevention (Case-Insensitive) | Pending | - |
| TC006 | Username Too Short | Pending | - |
| TC007 | Username Too Long | Pending | - |
| TC008 | Password Too Short | Pending | - |
| TC009 | Username With Special Characters | Pending | - |
| TC010 | Password Exactly 8 Characters | Pending | - |
| TC011 | Missing Required Field - Email | Pending | - |
| TC012 | Missing Required Field - Username | Pending | - |
| TC013 | Missing Required Field - Password | Pending | - |
| TC014 | Empty Email String | Pending | - |
| TC015 | Whitespace-Only Username | Pending | - |
| TC016 | Email With Uppercase Letters | Pending | - |
| TC017 | Username With Mixed Case Storage | Pending | - |
| TC018 | Password Hash Verification | Pending | - |

---

## Traceability

| Artefact | Reference |
|----------|-----------|
| PRD | [sdlc-studio/prd.md](../prd.md) |
| Epic | [EP0001](../epics/EP0001-user-authentication.md) |
| Story | [US0001](../stories/US0001-user-registration-api.md) |
| Plan | [PL0001](../plans/PL0001-user-registration-api.md) |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial spec created for US0001 |
