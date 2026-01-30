# PL0003: JWT Authentication Middleware - Implementation Plan

> **Status:** Completed
> **Story:** [US0003: JWT Authentication Middleware](../stories/US0003-jwt-auth-middleware.md)
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Language:** TypeScript

## Overview

Implement Express middleware that verifies JWT tokens from Authorization headers and populates `req.user` with authenticated user information. This middleware will be used to protect all routes requiring authentication.

## Implementation Approach: Test-Driven Development (TDD)

**Rationale for TDD:**
- Clear acceptance criteria with well-defined inputs/outputs
- Middleware behavior is easily testable without complex setup
- Security-critical component benefits from test-first approach
- Simple interface makes it ideal for TDD

## Dependencies

### Prerequisite Stories
- **US0002 (Login API):** Provides JWT token generation and JWT service
  - Status: ✓ Completed
  - Provides: `src/services/jwtService.ts` with `verifyToken()` function

### External Dependencies
- `jsonwebtoken` library (already installed)
- `@types/jsonwebtoken` (already installed)
- Express types for Request, Response, NextFunction

## Implementation Phases

### Phase 1: TypeScript Interface Definition
**File:** `src/middleware/authMiddleware.ts`

**Steps:**
1. Create `AuthRequest` interface extending Express `Request`
2. Add optional `user` property with `{ userId: string; username: string }`
3. Export interface for use in protected route handlers

**Why This Matters:**
- Type safety for protected routes accessing `req.user`
- Prevents runtime errors from accessing undefined properties
- Clear contract for what authenticated requests provide

---

### Phase 2: Middleware Core Implementation
**File:** `src/middleware/authMiddleware.ts`

**Steps:**
1. Import JWT service `verifyToken()` from US0002
2. Create `authenticateJWT` middleware function with signature:
   ```typescript
   (req: AuthRequest, res: Response, next: NextFunction) => void
   ```
3. Extract Authorization header
4. Validate header format (exists, starts with "Bearer ")
5. Extract token from "Bearer <token>"
6. Call `verifyToken()` from JWT service
7. Populate `req.user` if valid
8. Call `next()` on success, return 401 on failure

**Error Handling:**
- Missing/malformed Authorization header → 401 with "Authentication token required"
- Invalid/expired token → 401 with "Invalid or expired token"

**Security Considerations:**
- Use `verifyToken()` from JWT service (reuses existing logic)
- Generic error messages (don't reveal why token failed)
- Return early on errors (don't proceed to route handler)

---

### Phase 3: Integration with Existing Services
**File:** `src/middleware/authMiddleware.ts`

**Steps:**
1. Import `verifyToken` from `src/services/jwtService.ts`
2. Use existing JWT_SECRET validation (already in JWT service)
3. Ensure consistent error response format with other endpoints

**Code Reuse:**
- Leverage `verifyToken()` from US0002 (don't duplicate JWT logic)
- Use same error response structure as login/register endpoints

---

### Phase 4: Export and Documentation
**File:** `src/middleware/authMiddleware.ts`

**Steps:**
1. Export `authenticateJWT` as named export
2. Export `AuthRequest` interface for route handlers
3. Add JSDoc comments explaining:
   - What the middleware does
   - How to use it in routes
   - What `req.user` contains after authentication

**Example Usage in Routes:**
```typescript
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';

router.get('/protected', authenticateJWT, (req: AuthRequest, res) => {
  const { userId, username } = req.user!; // TypeScript knows this exists
  // ... handle request
});
```

---

### Phase 5: Testing Strategy

**Test Type:** Integration tests (middleware + JWT service)

**Test File:** `tests/integration/auth.middleware.test.ts`

**Test Scenarios:**
1. **Valid Token (AC1)**
   - Given: Request with valid JWT in Authorization header
   - Then: req.user populated, next() called
   - Coverage: Happy path

2. **Missing Authorization Header (AC2)**
   - Given: Request with no Authorization header
   - Then: 401 "Authentication token required"
   - Coverage: Missing header scenario

3. **Authorization Without Bearer Prefix (Edge Case)**
   - Given: Authorization header without "Bearer " prefix
   - Then: 401 "Authentication token required"
   - Coverage: Malformed header

4. **Invalid Token Format (AC3)**
   - Given: Authorization header with malformed JWT (not 3 parts)
   - Then: 401 "Invalid or expired token"
   - Coverage: Invalid token structure

5. **Expired Token (AC4)**
   - Given: Token issued >7 days ago
   - Then: 401 "Invalid or expired token"
   - Coverage: Expiration handling

6. **Token with Wrong Signature (Edge Case)**
   - Given: Token signed with different secret
   - Then: 401 "Invalid or expired token"
   - Coverage: Signature tampering detection

7. **Token with Tampered Payload (Edge Case)**
   - Given: Valid token with modified payload
   - Then: 401 "Invalid or expired token"
   - Coverage: Payload tampering detection

8. **Whitespace-Only Authorization Header (Edge Case)**
   - Given: Authorization header with only whitespace
   - Then: 401 "Authentication token required"
   - Coverage: Empty header handling

**Test Approach:**
- Use supertest to test middleware in route context
- Create test route that uses `authenticateJWT` middleware
- Generate valid tokens using login endpoint from US0002
- Test invalid tokens by manually creating/modifying JWTs

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior | Test Coverage |
|----------|------------------|---------------|
| No Authorization header | 401 "Authentication token required" | TC002 |
| Authorization without "Bearer " | 401 "Authentication token required" | TC003 |
| Malformed JWT | 401 "Invalid or expired token" | TC004 |
| Expired token (>7 days) | 401 "Invalid or expired token" | TC005 |
| Wrong signature | 401 "Invalid or expired token" | TC006 |
| Tampered payload | 401 "Invalid or expired token" | TC007 |
| Whitespace-only header | 401 "Authentication token required" | TC008 |

---

## File Structure

```
src/
  middleware/
    authMiddleware.ts        # NEW: JWT authentication middleware
tests/
  integration/
    auth.middleware.test.ts  # NEW: Middleware integration tests
```

---

## Implementation Checklist

### Phase 1: Interface Definition
- [ ] Create AuthRequest interface extending Request
- [ ] Add optional user property with userId, username
- [ ] Export interface

### Phase 2: Middleware Implementation
- [ ] Import verifyToken from JWT service
- [ ] Create authenticateJWT function
- [ ] Extract and validate Authorization header
- [ ] Parse Bearer token
- [ ] Verify token using JWT service
- [ ] Populate req.user on success
- [ ] Return 401 errors for missing/invalid tokens

### Phase 3: Integration
- [ ] Ensure consistent error response format
- [ ] Reuse JWT service (no duplicate logic)
- [ ] Verify JWT_SECRET validation via service

### Phase 4: Documentation
- [ ] Add JSDoc comments
- [ ] Document usage examples
- [ ] Export AuthRequest and authenticateJWT

### Phase 5: Testing
- [ ] Write 8 test scenarios
- [ ] Test valid token authentication
- [ ] Test missing/malformed headers
- [ ] Test invalid/expired/tampered tokens
- [ ] Verify req.user population
- [ ] Verify next() called on success
- [ ] Verify 401 responses on failure

---

## Success Criteria

- [ ] All 4 acceptance criteria met
- [ ] All 8 test scenarios passing
- [ ] TypeScript compilation successful
- [ ] Linting passes with no errors
- [ ] Middleware properly typed (AuthRequest)
- [ ] Integration tests verify behavior end-to-end
- [ ] Code reuses JWT service (DRY principle)
- [ ] Documentation clear for other developers

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| JWT service changes break middleware | Low | High | Use stable verifyToken() API from US0002 |
| Type safety issues with req.user | Low | Medium | Use TypeScript interface, enforce types in tests |
| Inconsistent error responses | Low | Low | Follow existing error format from US0001/US0002 |

---

## Next Steps After Implementation

1. Update US0003 status to "In Progress"
2. Run tests to verify all ACs met
3. Create pull request with middleware implementation
4. Use middleware in US0004 (User Profile Retrieval API)

---

## Notes

**Code Reuse:**
- This middleware uses `verifyToken()` from `src/services/jwtService.ts`
- JWT_SECRET validation happens in the service (line 13)
- Error handling follows same pattern as login/register

**Future Enhancement Opportunities:**
- Add optional role-based access control (RBAC) middleware
- Add rate limiting for authenticated endpoints
- Add request logging with userId for audit trail
- Add refresh token support (deferred to later sprint)
