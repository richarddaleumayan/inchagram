# US0004: Input Validation Middleware

> **Status:** Done
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Completed:** 2026-01-30

## User Story

**As a** developer (internal)
**I want** reusable input validation middleware
**So that** I can validate request data consistently across all endpoints

## Context

### Background
All API endpoints need consistent input validation (required fields, email format, length constraints). This middleware provides centralized validation logic used across authentication and other endpoints, reducing code duplication and ensuring consistent error messages.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| TRD | Architecture | Express middleware pattern | Must integrate with Express request pipeline |
| PRD | UX | Clear error messages | Validation errors must specify field and issue |
| TRD | Tech Stack | TypeScript | Must provide type-safe validation functions |

---

## Acceptance Criteria

### AC1: Required Field Validation
- **Given** middleware configured to require specific fields
- **When** request body is missing a required field
- **Then** response returns 400 Bad Request with field name in error message

### AC2: Email Format Validation
- **Given** middleware configured to validate email field
- **When** request body contains invalid email format
- **Then** response returns 400 Bad Request with "Invalid email format" message

### AC3: Length Constraints Validation
- **Given** middleware configured with min/max length for a field
- **When** request body contains field value outside length bounds
- **Then** response returns 400 Bad Request with length requirement in error

### AC4: Valid Input Passes Through
- **Given** middleware configured with validation rules
- **When** request body contains all required fields with valid formats
- **Then** middleware calls next() and request proceeds to route handler

---

## Scope

### In Scope
- Required field validation middleware
- Email format validation using regex
- String length validation (min/max)
- Username pattern validation (alphanumeric + underscore)
- Consistent error response format
- TypeScript validation function types
- Reusable validation utilities

### Out of Scope
- Password strength scoring (basic min length only)
- Custom validation rules per endpoint (use built-in validators)
- Async validation (database uniqueness checks)
- Request rate limiting (separate middleware)
- File upload validation (separate story)

---

## Technical Notes

**Validation Utilities:**
```typescript
// src/utils/validation.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

export function validateLength(
  value: string,
  min: number,
  max?: number
): boolean {
  if (value.length < min) return false;
  if (max && value.length > max) return false;
  return true;
}
```

**Middleware Usage:**
```typescript
import { validateRequired, validateEmail, validateLength } from '../middleware/validation';

router.post('/register',
  validateRequired(['email', 'username', 'password']),
  validateEmail('email'),
  validateLength('username', 3, 30),
  registerHandler
);
```

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be between 3 and 30 characters",
    "details": {
      "field": "username",
      "issue": "Length constraint violated"
    }
  }
}
```

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Multiple validation failures | Return first validation error encountered |
| Field with whitespace only | Treat as empty (fails required check) |
| Email with uppercase letters | Accept (validation is format only, not case) |
| Username with special chars (@, #) | Reject with pattern validation error |
| Password exactly 8 characters | Accept (meets minimum length) |
| Extra fields in request body | Ignore (don't validate fields not in schema) |
| Null vs undefined field | Both fail required validation |
| Empty string for required field | Fail required validation |

---

## Test Scenarios

- [ ] Required field missing → 400 error
- [ ] Email without @ symbol → 400 error
- [ ] Email without domain → 400 error
- [ ] Username too short (2 chars) → 400 error
- [ ] Username too long (31 chars) → 400 error
- [ ] Username with special chars → 400 error
- [ ] Password too short (7 chars) → 400 error
- [ ] Valid input passes all validations → next() called
- [ ] Whitespace-only username → 400 error
- [ ] Multiple validation errors → first error returned

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| None | - | - | - |

**Note:** This story has no blockers. It provides utilities used by US0001, US0002.

---

## Estimation

**Story Points:** 2
**Complexity:** Low

**Effort Breakdown:**
- Validation utility functions: 1 hour
- Middleware factory functions: 1 hour
- Unit tests: 2 hours
- Integration with existing routes: 1 hour

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial story created from EP0001 |
