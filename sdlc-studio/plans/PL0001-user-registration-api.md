# PL0001: User Registration API Endpoint - Implementation Plan

> **Status:** Done
> **Story:** [US0001: User Registration API Endpoint](../stories/US0001-user-registration-api.md)
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Language:** TypeScript

## Overview

Implement the user registration API endpoint for inchagram. This is the foundational story that establishes the User model, authentication infrastructure, and Express API patterns. Since this is a greenfield project, we'll set up the complete TypeScript/Node.js backend structure including project initialization, MongoDB integration, and bcrypt password hashing.

**Key deliverables:**
- Complete backend project setup (TypeScript, Express, MongoDB)
- User model with Mongoose schema
- POST /api/v1/auth/register endpoint with comprehensive validation
- Password hashing with bcrypt
- Error handling and response formatting

## Acceptance Criteria Summary

| AC | Name | Description |
|----|------|-------------|
| AC1 | Successful Registration | Valid email, unique username, password ≥8 chars → 201 response with hashed password |
| AC2 | Email Validation | Invalid email format → 400 error |
| AC3 | Duplicate Email Prevention | Existing email → 409 error |
| AC4 | Duplicate Username Prevention | Existing username (case-insensitive) → 409 error |
| AC5 | Username Format Validation | Invalid characters or length → 400 error |
| AC6 | Password Strength Validation | Password <8 characters → 400 error |

---

## Technical Context

### Language & Framework
- **Primary Language:** TypeScript 5.x
- **Framework:** Express 4.x
- **Test Framework:** Jest + Supertest (API testing)
- **ODM:** Mongoose 7.x
- **Database:** MongoDB 7.x

### Relevant Best Practices
- Use async/await for all database operations
- Implement proper error handling middleware
- Validate input at API boundary
- Use environment variables for sensitive config
- Hash passwords with bcrypt (10+ rounds)
- Implement MongoDB unique indexes for email and username

### Existing Patterns
**None** - This is a greenfield project. We'll establish patterns for:
- Express router structure
- Mongoose model definitions
- Error response formatting
- Validation middleware
- Environment configuration

---

## Recommended Approach

**Strategy:** TDD (Test-Driven Development)

**Rationale:**
- API story with clear contracts and 18 edge cases
- Well-defined Given/When/Then acceptance criteria
- Backend-only implementation with no UI exploration
- Complex validation logic benefits from test-first approach
- Setting up foundational patterns that other stories will follow

### Test Priority
1. **Happy path** - Valid registration creates user with hashed password
2. **Validation errors** - Email format, username format, password length
3. **Duplicate prevention** - Email and username uniqueness (case-insensitive)
4. **Edge cases** - Empty strings, whitespace, special characters, MongoDB failures

---

## Implementation Phases

### Phase 1: Project Setup & Infrastructure
**Goal:** Initialize TypeScript Node.js project with MongoDB connection

- [ ] Initialize npm project and install dependencies
  - express, mongoose, bcrypt, dotenv, cors
  - @types/express, @types/bcrypt, @types/node
  - jest, ts-jest, supertest, @types/supertest (dev)
  - typescript, ts-node, nodemon (dev)
- [ ] Create tsconfig.json with strict mode
- [ ] Create .env.example with MongoDB connection string
- [ ] Create src/ directory structure
- [ ] Set up MongoDB connection utility (src/config/database.ts)
- [ ] Create Express app initialization (src/app.ts)
- [ ] Create server entry point (src/server.ts)
- [ ] Add scripts to package.json (dev, build, start, test)

**Files:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variable template
- `src/config/database.ts` - MongoDB connection
- `src/app.ts` - Express app setup
- `src/server.ts` - Server entry point

### Phase 2: User Model & Schema
**Goal:** Define User model with Mongoose schema and validation

- [ ] Create User interface (TypeScript types)
- [ ] Define Mongoose schema with validation rules
  - username: 3-30 chars, alphanumeric + underscore, unique, indexed
  - email: valid format, lowercase, unique, indexed
  - passwordHash: required
  - displayName, bio, profilePictureUrl: optional
  - timestamps: true
- [ ] Add unique indexes for email and username
- [ ] Create User model export

**Files:**
- `src/models/User.ts` - User model and schema

### Phase 3: Validation Utilities
**Goal:** Create reusable validation functions

- [ ] Email format validation helper
- [ ] Username format validation helper
- [ ] Password strength validation helper
- [ ] Input sanitization utilities

**Files:**
- `src/utils/validation.ts` - Validation helpers

### Phase 4: Registration Endpoint Implementation
**Goal:** Implement POST /api/v1/auth/register with all validation and error handling

- [ ] Create auth router (src/routes/auth.ts)
- [ ] Create registration controller (src/controllers/authController.ts)
  - Extract and validate request body
  - Check for duplicate email (case-insensitive)
  - Check for duplicate username (case-insensitive)
  - Hash password with bcrypt
  - Create user document
  - Handle MongoDB errors (unique constraint violations)
  - Return standardized success/error responses
- [ ] Mount auth router in app.ts
- [ ] Add error handling middleware

**Files:**
- `src/routes/auth.ts` - Auth routes
- `src/controllers/authController.ts` - Registration logic
- `src/middleware/errorHandler.ts` - Error handling middleware
- `src/app.ts` - Mount routes (update)

### Phase 5: Testing & Validation
**Goal:** Verify all acceptance criteria with comprehensive tests

- [ ] Write integration tests for happy path
- [ ] Write tests for email validation (AC2)
- [ ] Write tests for duplicate email prevention (AC3)
- [ ] Write tests for duplicate username prevention (AC4)
- [ ] Write tests for username format validation (AC5)
- [ ] Write tests for password strength validation (AC6)
- [ ] Write edge case tests (18 scenarios from story)
- [ ] Verify password hashing (check DB for bcrypt hash)
- [ ] Test MongoDB connection failures
- [ ] Test all error response formats

**Files:**
- `tests/integration/auth.register.test.ts` - Registration endpoint tests
- `tests/setup.ts` - Test environment setup

| AC | Verification Method | File Evidence | Status |
|----|---------------------|---------------|--------|
| AC1 | Integration test: POST with valid data → 201, user in DB | `tests/integration/auth.register.test.ts:15` | Pending |
| AC2 | Integration test: POST with invalid email → 400 | `tests/integration/auth.register.test.ts:45` | Pending |
| AC3 | Integration test: POST with duplicate email → 409 | `tests/integration/auth.register.test.ts:65` | Pending |
| AC4 | Integration test: POST with duplicate username → 409 | `tests/integration/auth.register.test.ts:85` | Pending |
| AC5 | Integration test: POST with invalid username → 400 | `tests/integration/auth.register.test.ts:105` | Pending |
| AC6 | Integration test: POST with short password → 400 | `tests/integration/auth.register.test.ts:125` | Pending |

---

## Edge Case Handling

| # | Edge Case (from Story) | Handling Strategy | Phase |
|---|------------------------|-------------------|-------|
| 1 | Email with uppercase letters | Convert to lowercase in schema (Mongoose `lowercase: true`) | Phase 2 |
| 2 | Username with mixed case | Store original case, check uniqueness via case-insensitive query | Phase 4 |
| 3 | Password exactly 8 characters | Accept (meets minimum requirement) | Phase 4 |
| 4 | Missing required field (email, username, password) | Validate presence, return 400 with field name | Phase 4 |
| 5 | Extra fields in request body | Mongoose schema filters, only save defined fields | Phase 2 |
| 6 | Very long password (>100 chars) | Accept (no max limit in v0.1.0) | Phase 4 |
| 7 | Special characters in username | Regex validation in schema rejects | Phase 2 |
| 8 | Empty string for required field | Mongoose required validator rejects | Phase 2 |
| 9 | Whitespace in username | Regex validation rejects (only alphanumeric + underscore) | Phase 2 |
| 10 | SQL injection attempt in fields | Mongoose parameterized queries prevent (ORM safety) | Phase 2 |
| 11 | MongoDB connection failure | Try-catch in controller, return 500 with generic error | Phase 4 |
| 12 | Bcrypt hashing failure | Try-catch in controller, return 500, log error | Phase 4 |

**Coverage:** 12/12 edge cases handled

---

## Implementation Tasks

| # | Task | File | Depends On | Status |
|---|------|------|------------|--------|
| 1 | Initialize npm project and install dependencies | `package.json` | - | [ ] |
| 2 | Create TypeScript config | `tsconfig.json` | #1 | [ ] |
| 3 | Set up MongoDB connection | `src/config/database.ts` | #1, #2 | [ ] |
| 4 | Create Express app setup | `src/app.ts` | #1, #2 | [ ] |
| 5 | Create server entry point | `src/server.ts` | #3, #4 | [ ] |
| 6 | Define User interface and schema | `src/models/User.ts` | #3 | [ ] |
| 7 | Create validation utilities | `src/utils/validation.ts` | - | [ ] |
| 8 | Create auth router | `src/routes/auth.ts` | #4 | [ ] |
| 9 | Implement registration controller | `src/controllers/authController.ts` | #6, #7, #8 | [ ] |
| 10 | Create error handling middleware | `src/middleware/errorHandler.ts` | #4 | [ ] |
| 11 | Mount routes in app | `src/app.ts` | #8, #9, #10 | [ ] |
| 12 | Write integration tests | `tests/integration/auth.register.test.ts` | #1-#11 | [ ] |

### Parallel Execution Groups

| Group | Tasks | Prerequisite |
|-------|-------|--------------|
| Setup | #1, #2 | None - can start immediately |
| Infrastructure | #3, #4 | Group "Setup" complete |
| Models & Utils | #6, #7 | Task #3 complete (MongoDB connection) |
| Routes & Controllers | #8, #9, #10 | Group "Models & Utils" complete |
| Integration | #11, #12 | All previous groups complete |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MongoDB not installed/running locally | Blocking | Document MongoDB setup in README, use Docker Compose for local dev |
| bcrypt installation issues on different platforms | Medium | Document platform-specific installation, use specific bcrypt version |
| Unique index race conditions | Low | MongoDB handles atomically, rely on database-level constraint |
| Case-insensitive username check performance | Low | Add case-insensitive index if needed in future, acceptable for v0.1.0 |
| Password hash timing attacks | Low | bcrypt inherently resistant, no additional mitigation needed in v0.1.0 |

---

## Definition of Done

- [ ] All 6 acceptance criteria implemented
- [ ] All 12 edge cases handled
- [ ] 18+ test scenarios passing (from story)
- [ ] Password hashing verified (bcrypt, 10+ rounds)
- [ ] MongoDB unique indexes created
- [ ] Error responses standardized
- [ ] Code follows TypeScript best practices
- [ ] No TypeScript compilation errors
- [ ] No linting errors (ESLint)
- [ ] .env.example documented
- [ ] README updated with setup instructions

---

## Notes

### TDD Implementation Order
1. Write test for happy path
2. Implement minimal code to pass
3. Write test for validation errors
4. Implement validation logic
5. Write test for duplicate prevention
6. Implement uniqueness checks
7. Continue until all AC and edge cases covered

### Environment Variables Required
```
MONGODB_URI=mongodb://localhost:27017/inchagram
BCRYPT_ROUNDS=10
PORT=3000
NODE_ENV=development
```

### MongoDB Collection Indexes
```javascript
// Created automatically by Mongoose schema
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
```

### API Response Format Established
This story establishes the standard response format for all future endpoints:

**Success:**
```json
{
  "success": true,
  "data": { ...actual data... },
  "message": "User registered successfully"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error",
    "details": { ...additional context... }
  }
}
```

This pattern will be reused by all other stories (US0002-US0028).

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial plan created for US0001 |
