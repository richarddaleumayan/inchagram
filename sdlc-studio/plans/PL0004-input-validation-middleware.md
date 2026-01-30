# PL0004: Input Validation Middleware Implementation Plan

> **Story:** [US0004: Input Validation Middleware](../stories/US0004-input-validation-middleware.md)
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Status:** Approved
> **Created:** 2026-01-30
> **Owner:** Richard

---

## Overview

This plan implements reusable Express middleware for input validation, reducing code duplication across authentication and other endpoints. The middleware will wrap existing validation utilities from `src/utils/validation.ts` and provide consistent error responses.

**Approach:** TDD (Test-Driven Development)
**Rationale:** Middleware has clear input/output contracts, making it ideal for test-first development. We can define expected behaviors upfront and implement to pass tests.

---

## Current State Analysis

### Existing Code

**Validation Utilities** (`src/utils/validation.ts`):
- `isValidEmail(email: string): boolean` - Email format validation
- `isValidUsername(username: string): { isValid: boolean; error?: string }` - Username pattern validation
- `isValidPassword(password: string): { isValid: boolean; error?: string }` - Password strength validation

**Current Validation Pattern** (`src/controllers/authController.ts:18-49`):
```typescript
// Manual required field validation (repeated across endpoints)
if (!email) {
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Email is required',
      details: { field: 'email', issue: 'Missing required field' }
    }
  });
  return;
}
// ... repeated for username, password
```

**Problems with Current Approach:**
1. Duplicate validation logic across controllers
2. Inconsistent error messages
3. Mix of controller concerns (business logic + validation)
4. Hard to test validation in isolation

---

## Implementation Approach

### Architecture Decision

**Middleware Factory Pattern** - Create factory functions that return Express middleware:

```typescript
// Factory function signature
export function validateRequired(fields: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validation logic
  };
}

// Usage in routes
router.post('/register',
  validateRequired(['email', 'username', 'password']),
  validateEmail('email'),
  validateLength('username', 3, 30),
  register
);
```

**Benefits:**
- Composable middleware chains
- Reusable across routes
- Type-safe with TypeScript
- Clear separation of concerns

---

## Files to Modify

### 1. Create `src/middleware/validationMiddleware.ts` (NEW)

**Exports:**
- `validateRequired(fields: string[]): RequestHandler` - Check required fields
- `validateEmail(field: string): RequestHandler` - Validate email format
- `validateLength(field: string, min: number, max?: number): RequestHandler` - Validate string length
- `validateUsername(field: string): RequestHandler` - Validate username pattern
- `validatePassword(field: string): RequestHandler` - Validate password strength

**Error Response Format:**
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: string, // Human-readable error
    details: {
      field: string,
      issue: string
    }
  }
}
```

### 2. Update `src/routes/auth.ts`

**Changes:**
- Import validation middleware
- Add middleware to register route: `validateRequired`, `validateEmail`, `validateLength`
- Add middleware to login route: `validateRequired`

### 3. Refactor `src/controllers/authController.ts`

**Changes:**
- Remove inline required field validation (lines 23-49)
- Remove inline email/username validation calls (rely on middleware)
- Simplify to business logic only (uniqueness checks, password hashing)

---

## Test Strategy

### Test File: `tests/integration/validation.middleware.test.ts` (NEW)

**Test Suites:**

1. **TC001: Required Field Validation**
   - Missing single required field → 400 error
   - Missing multiple fields → 400 for first missing
   - All required fields present → next() called
   - Empty string treated as missing → 400 error

2. **TC002: Email Format Validation**
   - Invalid email (no @) → 400 error
   - Invalid email (no domain) → 400 error
   - Valid email → next() called
   - Email field missing → handled by required validation

3. **TC003: Length Constraints Validation**
   - Value below min length → 400 error
   - Value above max length → 400 error
   - Value within bounds → next() called
   - Whitespace-only value → 400 error

4. **TC004: Username Pattern Validation**
   - Username with special chars → 400 error
   - Username too short (2 chars) → 400 error
   - Username too long (31 chars) → 400 error
   - Valid username → next() called

5. **TC005: Password Validation**
   - Password too short (7 chars) → 400 error
   - Valid password (8+ chars) → next() called

6. **TC006: Middleware Chaining**
   - Multiple validations pass in sequence
   - First validation failure stops chain
   - Successful chain calls route handler

**Test Utilities:**
- Mock Express req/res/next functions
- Helper to create test requests with body
- Assertion helpers for error response format

---

## Implementation Phases

### Phase 1: Setup and Core Utilities (30 min)

**Tasks:**
1. Create `src/middleware/validationMiddleware.ts`
2. Import existing validation utilities from `src/utils/validation.ts`
3. Define error response helper function
4. Set up TypeScript types and interfaces

**Files:**
- NEW: `src/middleware/validationMiddleware.ts`

### Phase 2: Implement Validation Middleware (1 hour)

**Tasks:**
1. Implement `validateRequired()` factory
2. Implement `validateEmail()` factory
3. Implement `validateLength()` factory
4. Implement `validateUsername()` factory
5. Implement `validatePassword()` factory

**Files:**
- MODIFY: `src/middleware/validationMiddleware.ts`

### Phase 3: Write Tests (2 hours)

**Tasks:**
1. Create test file with mock utilities
2. Write TC001 (Required Field Validation) - 5 tests
3. Write TC002 (Email Format Validation) - 4 tests
4. Write TC003 (Length Constraints) - 4 tests
5. Write TC004 (Username Pattern) - 4 tests
6. Write TC005 (Password Validation) - 2 tests
7. Write TC006 (Middleware Chaining) - 3 tests

**Files:**
- NEW: `tests/integration/validation.middleware.test.ts`

**Expected Test Count:** ~22 tests

### Phase 4: Integration with Routes (1 hour)

**Tasks:**
1. Update `src/routes/auth.ts` with validation middleware
2. Refactor `src/controllers/authController.ts` to remove inline validation
3. Test register endpoint with middleware
4. Test login endpoint with middleware
5. Verify existing tests still pass

**Files:**
- MODIFY: `src/routes/auth.ts`
- MODIFY: `src/controllers/authController.ts`

### Phase 5: Verification and Cleanup (30 min)

**Tasks:**
1. Run full test suite - verify all tests pass
2. Run linter and fix any issues
3. Update story status to Review
4. Prepare for PR

---

## Acceptance Criteria Mapping

| AC | Implementation | Tests |
|----|----------------|-------|
| AC1: Required Field Validation | `validateRequired()` factory | TC001 (5 tests) |
| AC2: Email Format Validation | `validateEmail()` factory | TC002 (4 tests) |
| AC3: Length Constraints | `validateLength()` factory | TC003 (4 tests) |
| AC4: Valid Input Passes | All middleware call next() | TC006 (3 tests) |

---

## Dependencies

### Prerequisites
- ✅ User model exists (US0001)
- ✅ Auth routes exist (US0001, US0002)
- ✅ Validation utilities exist (`src/utils/validation.ts`)
- ✅ Error response format established (US0001, US0003)

### Blocked By
- None

### Blocking
- Future endpoints requiring validation (US0008, US0012, etc.)

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing auth tests | High | Medium | Run tests after each phase, refactor incrementally |
| Inconsistent error messages | Medium | Low | Use centralized error response helper |
| Middleware ordering issues | Medium | Low | Document correct order in route files |
| Type safety issues with Request | Low | Low | Use Express.RequestHandler type consistently |

---

## Success Criteria

- [ ] All 4 acceptance criteria met
- [ ] ~22 validation middleware tests passing
- [ ] Existing auth tests (143 total) still passing
- [ ] Linter clean (no new errors)
- [ ] Inline validation removed from authController.ts
- [ ] Validation middleware applied to auth routes
- [ ] Error response format consistent across endpoints

---

## Code Review Checklist

- [ ] Middleware uses RequestHandler type from Express
- [ ] Error responses follow consistent format
- [ ] All edge cases tested (null, undefined, empty string)
- [ ] Middleware calls next() on success
- [ ] Middleware returns early on failure (no next() call)
- [ ] TypeScript strict mode satisfied
- [ ] No code duplication
- [ ] JSDoc comments added to public functions

---

## Estimated Effort

**Total Story Points:** 2
**Estimated Time:** 5 hours

**Breakdown:**
- Phase 1 (Setup): 30 min
- Phase 2 (Implementation): 1 hour
- Phase 3 (Tests): 2 hours
- Phase 4 (Integration): 1 hour
- Phase 5 (Verification): 30 min

---

## Next Steps After Implementation

1. Update story status: Draft → In Progress → Review → Done
2. Update epic progress: EP0001 will be 13/13 points (100% complete)
3. Prepare PR with validation middleware changes
4. Consider applying middleware to other endpoints (photos, profiles)

---

## References

- **Story:** [US0004](../stories/US0004-input-validation-middleware.md)
- **Epic:** [EP0001](../epics/EP0001-user-authentication.md)
- **Related Files:**
  - `src/utils/validation.ts` - Existing validation utilities
  - `src/middleware/authMiddleware.ts` - Middleware pattern reference
  - `src/controllers/authController.ts` - Current inline validation
  - `src/routes/auth.ts` - Routes to be updated
