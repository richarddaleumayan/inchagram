# US0001: User Registration API Endpoint

> **Status:** Done
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** new user (any persona)
**I want** to create an account with my email, username, and password via API
**So that** I can access inchagram and start sharing photos

## Context

### Persona Reference
**All Personas** - Foundation for accessing the platform. Particularly relevant to:
- **Jamie (Casual Sharer)** - Needs simple, fast account creation
- **Sam (Privacy-Conscious)** - Values minimal data collection

[Full persona details](../personas.md)

### Background
User registration is the entry point to inchagram. This API endpoint accepts email, username, and password, validates the input, hashes the password securely, creates a user account in MongoDB, and returns a success response. This is pure backend work with no UI components.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Security | Passwords hashed with bcrypt (10+ rounds) | AC must verify password is never stored plaintext |
| PRD | Validation | Username 3-30 chars, alphanumeric + underscore | AC must validate username format |
| PRD | Validation | Email must be valid format and unique | AC must validate email format and check duplicates |
| TRD | Tech Stack | TypeScript, Express, MongoDB, Mongoose | Use Express router, Mongoose schema |

---

## Acceptance Criteria

### AC1: Successful Registration
- **Given** I provide valid email, unique username, and password ≥8 chars
- **When** I POST to `/api/v1/auth/register` with JSON body
- **Then** user account is created in MongoDB with hashed password
- **And** response returns 201 with success message and user ID
- **And** password is hashed with bcrypt (never stored plaintext)

### AC2: Email Validation
- **Given** I provide an invalid email format (e.g., "notanemail")
- **When** I POST to `/api/v1/auth/register`
- **Then** response returns 400 Bad Request
- **And** error message indicates "Email format is invalid"

### AC3: Duplicate Email Prevention
- **Given** an email already exists in the database
- **When** I attempt to register with that email
- **Then** response returns 409 Conflict
- **And** error message indicates "Email already registered"

### AC4: Duplicate Username Prevention
- **Given** a username already exists in the database (case-insensitive)
- **When** I attempt to register with that username
- **Then** response returns 409 Conflict
- **And** error message indicates "Username already taken"

### AC5: Username Format Validation
- **Given** I provide username with invalid characters or length
- **When** I POST to `/api/v1/auth/register`
- **Then** response returns 400 Bad Request
- **And** error message indicates username requirements (3-30 chars, alphanumeric + underscore)

### AC6: Password Strength Validation
- **Given** I provide password <8 characters
- **When** I POST to `/api/v1/auth/register`
- **Then** response returns 400 Bad Request
- **And** error message indicates "Password must be at least 8 characters"

---

## Scope

### In Scope
- POST `/api/v1/auth/register` endpoint
- User model creation with Mongoose schema
- Email validation (format and uniqueness)
- Username validation (format, length, uniqueness, case-insensitive)
- Password strength validation (min 8 chars)
- Bcrypt password hashing (10 rounds)
- MongoDB unique indexes on email and username
- Error responses with clear messages
- Input sanitization

### Out of Scope
- Email verification flow (deferred to v0.2.0)
- reCAPTCHA or bot prevention (deferred)
- Password strength meter (frontend concern)
- OAuth/social registration (deferred)
- Username availability check endpoint (separate story if needed)

---

## Technical Notes

**User Model Schema (Mongoose):**
```typescript
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    required: true
  },
  displayName: { type: String },
  bio: { type: String, maxlength: 150 },
  profilePictureUrl: { type: String },
}, { timestamps: true });
```

**Password Hashing:**
```typescript
import bcrypt from 'bcrypt';
const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
const passwordHash = await bcrypt.hash(password, saltRounds);
```

**Username Case-Insensitivity:**
Convert username to lowercase for uniqueness check, but store original case.

### API Contracts

**Request:**
```json
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "user@example.com"
  },
  "message": "User registered successfully"
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email format is invalid",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Data Requirements
- MongoDB connection established
- Users collection with unique indexes on `email` and `username`
- Environment variable `BCRYPT_ROUNDS` (default: 10)

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Email with uppercase letters | Convert to lowercase, store lowercase |
| Username with mixed case | Store original case, check uniqueness case-insensitively |
| Password exactly 8 characters | Accept (meets minimum) |
| Missing required field (email, username, password) | Return 400 with clear message indicating missing field |
| Extra fields in request body | Ignore extra fields, process valid fields only |
| Very long password (>100 chars) | Accept but consider max length limit (future) |
| Special characters in username | Reject with validation error (only alphanumeric + underscore allowed) |
| Empty string for required field | Return 400 validation error |
| Whitespace in username | Reject with validation error |
| SQL injection attempt in fields | Mongoose parameterized queries prevent injection |
| MongoDB connection failure | Return 500 Internal Server Error, log error |
| Bcrypt hashing failure | Return 500 Internal Server Error, log error |

---

## Test Scenarios

- [ ] **Happy path:** Valid email, username, password → 201 success
- [ ] **Invalid email format:** "notanemail" → 400 error
- [ ] **Duplicate email:** Existing email → 409 error
- [ ] **Duplicate username (exact match):** Existing "johndoe" → 409 error
- [ ] **Duplicate username (case-insensitive):** Existing "johndoe", register "JohnDoe" → 409 error
- [ ] **Username too short:** "ab" (2 chars) → 400 error
- [ ] **Username too long:** 31+ characters → 400 error
- [ ] **Username with special chars:** "john@doe" → 400 error
- [ ] **Password too short:** "pass123" (7 chars) → 400 error
- [ ] **Password exactly 8 chars:** "pass1234" → 201 success
- [ ] **Missing email field:** No email in request → 400 error
- [ ] **Missing username field:** No username in request → 400 error
- [ ] **Missing password field:** No password in request → 400 error
- [ ] **Empty email string:** email: "" → 400 error
- [ ] **Whitespace-only username:** "   " → 400 error
- [ ] **Email with uppercase:** "User@EXAMPLE.COM" → 201, stored as "user@example.com"
- [ ] **Password hash verification:** Query DB, verify password field contains bcrypt hash, not plaintext
- [ ] **MongoDB unique index enforcement:** Attempt duplicate email at DB level → error

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| None | - | No story dependencies | - |

**Note:** This is the first story in the epic and has no dependencies.

### External Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| MongoDB | Database | Required - must be running |
| bcrypt | npm package | Required - install via package.json |
| Express | Web framework | Required - project setup |
| Mongoose | ODM | Required - install via package.json |

---

## Estimation

**Story Points:** 3
**Complexity:** Medium

**Rationale:**
- Straightforward CRUD operation
- Standard validation patterns
- Well-understood bcrypt library
- MongoDB schema design is clear from TRD

---

## Open Questions

- [ ] Should we enforce max password length? - Owner: Richard (Decision: Not for v0.1.0, accept any length)
- [ ] Should we prevent common/weak passwords? - Owner: Richard (Decision: Not for v0.1.0, just min length)
- [ ] Should username be converted to lowercase for storage? - Owner: Richard (Decision: No, store original case, check uniqueness case-insensitively)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial story created from EP0001 |
