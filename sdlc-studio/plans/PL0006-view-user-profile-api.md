# PL0006: View User Profile API - Implementation Plan

> **Status:** Done
> **Story:** [US0006: View User Profile API](../stories/US0006-view-user-profile-api.md)
> **Epic:** [EP0002: User Profiles & Profile Management](../epics/EP0002-user-profiles.md)
> **Created:** 2026-01-30
> **Language:** TypeScript

## Overview

Implement public API endpoints to retrieve user profile information by user ID or username. This includes creating a new profile controller, profile routes, and integration tests following the established patterns from EP0001 authentication implementation.

## Acceptance Criteria Summary

| AC | Name | Description |
|----|------|-------------|
| AC1 | Get Profile by User ID | GET /api/v1/users/:userId returns 200 with profile data |
| AC2 | Get Profile by Username | GET /api/v1/users/username/:username returns 200 with profile data |
| AC3 | User Not Found (by ID) | Returns 404 with NOT_FOUND error code |
| AC4 | User Not Found (by Username) | Returns 404 with NOT_FOUND error code |
| AC5 | Invalid User ID Format | Returns 400 with VALIDATION_ERROR code |
| AC6 | Username Case-Insensitive | Lookup matches regardless of case |

---

## Technical Context

### Language & Framework
- **Primary Language:** TypeScript
- **Framework:** Express.js 4.x
- **Test Framework:** Jest with Supertest

### Relevant Best Practices
- Follow existing controller pattern from `authController.ts`
- Use standardized response format: `{ success: boolean, data?: object, error?: object }`
- Async/await with try-catch for error handling
- Validate ObjectId format before database queries

### Existing Patterns
- **Controller Pattern:** See `src/controllers/authController.ts` - async functions with Request/Response params
- **Route Pattern:** See `src/routes/auth.ts` - Express Router with controller imports
- **Response Format:** Consistent `success/data/error` JSON structure
- **Error Codes:** VALIDATION_ERROR, NOT_FOUND, INTERNAL_ERROR

---

## Recommended Approach

**Strategy:** TDD (Test-Driven Development)
**Rationale:** This is an API story with clear Given/When/Then acceptance criteria, 14 documented edge cases, and straightforward request/response contracts - ideal for TDD.

### Test Priority
1. Happy path tests (get by ID, get by username)
2. Error cases (404 not found, 400 invalid ID)
3. Edge cases (case-insensitive username, optional fields null)

---

## Implementation Tasks

| # | Task | File | Depends On | Status |
|---|------|------|------------|--------|
| 1 | Create profile controller | `src/controllers/profileController.ts` | - | [ ] |
| 2 | Create profile routes | `src/routes/users.ts` | 1 | [ ] |
| 3 | Register routes in app | `src/app.ts` | 2 | [ ] |
| 4 | Write integration tests | `tests/integration/profile.test.ts` | 3 | [ ] |

---

## Implementation Phases

### Phase 1: Controller Implementation
**Goal:** Create profileController with getUserById and getUserByUsername functions

- [ ] Create `src/controllers/profileController.ts`
- [ ] Implement `getUserById` function with ObjectId validation
- [ ] Implement `getUserByUsername` function with case-insensitive lookup
- [ ] Add proper error handling and response format

**Files:**
- `src/controllers/profileController.ts` - New file with controller functions

### Phase 2: Routes & App Integration
**Goal:** Wire up routes and register in Express app

- [ ] Create `src/routes/users.ts` with GET routes
- [ ] Update `src/app.ts` to register `/api/v1/users` routes

**Files:**
- `src/routes/users.ts` - New route file
- `src/app.ts` - Add users routes import and registration

### Phase 3: Testing & Validation
**Goal:** Verify all acceptance criteria with integration tests

| AC | Verification Method | File Evidence | Status |
|----|---------------------|---------------|--------|
| AC1 | Integration test: valid ID returns 200 | `tests/integration/profile.test.ts` | Pending |
| AC2 | Integration test: valid username returns 200 | `tests/integration/profile.test.ts` | Pending |
| AC3 | Integration test: non-existent ID returns 404 | `tests/integration/profile.test.ts` | Pending |
| AC4 | Integration test: non-existent username returns 404 | `tests/integration/profile.test.ts` | Pending |
| AC5 | Integration test: invalid ID format returns 400 | `tests/integration/profile.test.ts` | Pending |
| AC6 | Integration test: case-insensitive username match | `tests/integration/profile.test.ts` | Pending |

---

## Edge Case Handling

| # | Edge Case (from Story) | Handling Strategy | Phase |
|---|------------------------|-------------------|-------|
| 1 | Valid user ID | Return 200 with profile data | Phase 1 |
| 2 | Valid username | Return 200 with profile data | Phase 1 |
| 3 | Non-existent user ID | Return 404 NOT_FOUND | Phase 1 |
| 4 | Non-existent username | Return 404 NOT_FOUND | Phase 1 |
| 5 | Invalid ObjectId format | Validate with mongoose.Types.ObjectId.isValid(), return 400 | Phase 1 |
| 6 | ObjectId with wrong length | Same validation catches this, return 400 | Phase 1 |
| 7 | Username with special chars in URL | URL decoding + 404 if no match | Phase 1 |
| 8 | Empty username | Route won't match, handled by 404 | Phase 2 |
| 9 | Username case mismatch | Case-insensitive regex lookup | Phase 1 |
| 10 | User with no displayName | Return displayName: null | Phase 1 |
| 11 | User with no bio | Return bio: null | Phase 1 |
| 12 | User with no profilePictureUrl | Return profilePictureUrl: null | Phase 1 |
| 13 | MongoDB connection failure | Catch in try-catch, return 500 | Phase 1 |
| 14 | Extremely long username in URL | No DB match, return 404 | Phase 1 |

**Coverage:** 14/14 edge cases handled

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Photo/Follow models not ready | Counts return 0 | Use placeholder values (documented in story) |
| Password hash leak | High security risk | Explicitly select fields to return, never include passwordHash |

---

## Definition of Done

- [x] All acceptance criteria implemented
- [x] Integration tests written and passing (20 tests)
- [x] Edge cases handled (14/14)
- [x] Code follows existing patterns (authController style)
- [x] No linting errors
- [x] Password hash never returned in response

---

## Notes

- Counts (followerCount, followingCount, photoCount) will return 0 until US0020 and US0011 are fully integrated
- Photo model exists (US0011 done) but count query will be added later
- No authentication required - profiles are public per PRD
