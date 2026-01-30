# PL0005: Get Current User Endpoint (/auth/me) - Implementation Plan

> **Status:** Completed
> **Story:** [US0005: Get Current User Endpoint (/auth/me)](../stories/US0005-get-current-user-endpoint.md)
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Created:** 2026-01-30
> **Language:** TypeScript

## Overview

Implement a protected GET endpoint at `/api/v1/auth/me` that returns the authenticated user's profile information. This endpoint demonstrates the practical use of the JWT authentication middleware (US0003) and provides users with a way to retrieve their current account details.

## Implementation Approach: Test-Driven Development (TDD)

**Rationale for TDD:**
- Clear API contract with well-defined request/response structure
- Security-critical endpoint (must validate authentication correctly)
- Simple business logic makes it ideal for test-first approach
- Integration with existing middleware easy to test

## Dependencies

### Prerequisite Stories
- **US0001 (User Registration):** Provides User model and schema
  - Status: ✓ Completed
  - Provides: `src/models/User.ts` with user schema
- **US0002 (Login API):** Provides JWT token generation for test setup
  - Status: ✓ Completed
  - Provides: Login endpoint to generate valid tokens for tests
- **US0003 (JWT Middleware):** Provides authenticateJWT middleware
  - Status: ✓ Completed
  - Provides: `src/middleware/authMiddleware.ts` with AuthRequest interface

### External Dependencies
- Express (already installed)
- Mongoose (already installed)
- JWT authentication middleware (from US0003)

## Implementation Phases

### Phase 1: Route Definition
**File:** `src/routes/auth.ts`

**Steps:**
1. Import `authenticateJWT` middleware from `src/middleware/authMiddleware`
2. Import `getCurrentUser` controller function
3. Add `GET /me` route with middleware chain:
   ```typescript
   router.get('/me', authenticateJWT, getCurrentUser);
   ```

**Why This Matters:**
- Demonstrates middleware usage pattern for future protected endpoints
- Separates authentication concern (middleware) from business logic (controller)
- Establishes routing pattern for authenticated endpoints

---

### Phase 2: Controller Implementation
**File:** `src/controllers/authController.ts`

**Steps:**
1. Import `AuthRequest` type from middleware
2. Create `getCurrentUser` async function
3. Extract `userId` from `req.user` (populated by middleware)
4. Query database for user by ID
5. Use `.select('-passwordHash')` to exclude sensitive field
6. Handle user not found (404)
7. Return user profile in standard response format
8. Handle database errors (500)

**Response Format:**
```typescript
{
  success: true,
  data: {
    userId: string,
    username: string,
    email: string,
    displayName: string | null,
    bio: string | null,
    profilePictureUrl: string | null,
    createdAt: Date,
    updatedAt: Date
  }
}
```

**Error Handling:**
- User not found (deleted after token issued) → 404
- Database error → 500 with generic message
- Missing/invalid token → 401 (handled by middleware)

---

### Phase 3: Security Considerations

**Security Checklist:**
1. ✓ Never expose passwordHash in response (use `.select('-passwordHash')`)
2. ✓ Fetch fresh data from DB (don't trust stale token payload)
3. ✓ Authenticate via middleware (don't skip auth for "convenience")
4. ✓ Return user's OWN data only (req.user.userId from verified token)

**Why Security Matters:**
- This is a public API endpoint accessible to all authenticated users
- Must prevent password hash exposure even if select() is forgotten
- Must verify token on EVERY request (no session caching)
- Must handle race condition (user deleted after token issued)

---

### Phase 4: Testing Strategy

**Test Type:** Integration tests (endpoint + middleware + database)

**Test File:** `tests/integration/auth.me.test.ts`

**Test Scenarios:**
1. **Valid Token (AC1)**
   - Given: User logged in with valid token
   - Then: 200 with complete user profile
   - Coverage: Happy path

2. **Response Excludes passwordHash (AC1 Security)**
   - Given: Valid token
   - Then: Response does NOT include passwordHash field
   - Coverage: Security validation

3. **Missing Authorization Header (AC2)**
   - Given: No Authorization header
   - Then: 401 "Authentication token required" (from middleware)
   - Coverage: Missing auth

4. **Invalid Token (AC3)**
   - Given: Malformed or invalid JWT
   - Then: 401 "Invalid or expired token" (from middleware)
   - Coverage: Invalid auth

5. **Expired Token (AC3)**
   - Given: Token >7 days old
   - Then: 401 "Invalid or expired token" (from middleware)
   - Coverage: Expiration

6. **User Deleted After Token Issued (AC4, Edge Case)**
   - Given: Valid token but user deleted from database
   - Then: 404 "User not found"
   - Coverage: Race condition

7. **Fresh Data Returned (AC4)**
   - Given: User updates profile, then calls /me
   - Then: Response reflects latest changes
   - Coverage: Data freshness

8. **Optional Fields Null (Edge Case)**
   - Given: User has no displayName, bio, profilePictureUrl
   - Then: Response includes these fields as null
   - Coverage: Optional field handling

**Test Approach:**
- Use supertest to test endpoint
- Generate valid tokens via login endpoint
- Test invalid tokens by tampering with token string
- Test user deletion by removing user after token generation
- Verify response structure and field types

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior | Test Coverage |
|----------|------------------|---------------|
| No Authorization header | 401 "Authentication token required" | TC003 |
| Invalid JWT format | 401 "Invalid or expired token" | TC004 |
| Expired token (>7 days) | 401 "Invalid or expired token" | TC005 |
| Valid token but user deleted | 404 "User not found" | TC006 |
| Database connection failure | 500 "Internal error" | TC009 |
| passwordHash in response | NEVER (select excludes it) | TC002 |
| Optional fields null | Return null (don't omit fields) | TC008 |
| Token with invalid userId | 404 "User not found" | TC007 |

---

## File Structure

```
src/
  controllers/
    authController.ts        # UPDATE: Add getCurrentUser function
  routes/
    auth.ts                  # UPDATE: Add GET /me route
  middleware/
    authMiddleware.ts        # EXISTING: From US0003
tests/
  integration/
    auth.me.test.ts          # NEW: Integration tests for /me endpoint
```

---

## Implementation Checklist

### Phase 1: Route Definition
- [ ] Import authenticateJWT from middleware
- [ ] Import getCurrentUser controller
- [ ] Add GET /me route with middleware chain

### Phase 2: Controller Implementation
- [ ] Import AuthRequest type
- [ ] Create getCurrentUser async function
- [ ] Extract userId from req.user
- [ ] Query user by ID with .select('-passwordHash')
- [ ] Handle user not found (404)
- [ ] Return user profile in standard format
- [ ] Handle database errors (500)

### Phase 3: Security Validation
- [ ] Verify passwordHash excluded from response
- [ ] Verify fresh data fetched from DB
- [ ] Verify authentication middleware applied
- [ ] Verify no hardcoded user IDs

### Phase 4: Testing
- [ ] Write 8 test scenarios
- [ ] Test valid token returns profile
- [ ] Test passwordHash excluded
- [ ] Test authentication errors (401)
- [ ] Test user not found (404)
- [ ] Test fresh data retrieval
- [ ] Test optional fields as null
- [ ] Verify TypeScript types

---

## Success Criteria

- [ ] All 4 acceptance criteria met
- [ ] All 8 test scenarios passing
- [ ] TypeScript compilation successful
- [ ] Linting passes with no errors
- [ ] Response properly typed (AuthRequest)
- [ ] Integration tests verify behavior end-to-end
- [ ] No passwordHash exposure in any scenario
- [ ] Middleware integration working correctly

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| passwordHash accidentally exposed | Low | Critical | Use .select('-passwordHash'), add test to verify |
| User deleted race condition | Low | Medium | Return 404 with clear message, add test |
| Stale data from token | Very Low | Low | Fetch fresh from DB, add test to verify |
| Middleware not applied | Very Low | Critical | Integration tests will catch missing auth |

---

## Next Steps After Implementation

1. Update US0005 status to "In Progress"
2. Run tests to verify all ACs met
3. Create pull request with implementation
4. This endpoint will be used by frontend to:
   - Display logged-in user info in header
   - Verify authentication status on page load
   - Fetch user details for profile page

---

## Notes

**Code Reuse:**
- Uses `authenticateJWT` middleware from US0003
- Uses User model from US0001
- Uses login endpoint from US0002 for test token generation
- Follows same error response format as other endpoints

**First Protected Endpoint:**
- This is the first endpoint in the codebase to use the JWT middleware
- Establishes pattern for future protected endpoints
- Demonstrates middleware chain: `authenticateJWT` → `controller`

**Future Enhancement Opportunities:**
- Add caching for frequently accessed user profiles
- Add query parameters to include/exclude specific fields
- Add ETag support for conditional requests
- Add profile completion percentage
