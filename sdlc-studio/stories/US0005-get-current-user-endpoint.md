# US0005: Get Current User Endpoint (/auth/me)

> **Status:** Done
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** registered user (any persona)
**I want** to retrieve my own profile information using my authentication token
**So that** I can see my current account details and verify I'm logged in

## Context

### Persona Reference
**All Personas** - All users need to view their own profile information.

[Full persona details](../personas.md)

### Background
After logging in, users receive a JWT token. The `/auth/me` endpoint allows users to retrieve their own profile information by presenting this token. This is commonly used by frontends to display user info and verify authentication status.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| TRD | Auth | JWT authentication required | Must use authenticateJWT middleware |
| PRD | Security | Don't expose passwordHash | Response must exclude sensitive fields |
| PRD | Performance | Response time <500ms (p95) | Simple database query by ID |

---

## Acceptance Criteria

### AC1: Successful Profile Retrieval with Valid Token
- **Given** I have a valid JWT token from login
- **When** I GET `/api/v1/auth/me` with Authorization header
- **Then** response returns 200 with my user profile (userId, username, email)
- **And** response does NOT include passwordHash

### AC2: Missing Authentication Token
- **Given** I don't include an Authorization header
- **When** I GET `/api/v1/auth/me`
- **Then** response returns 401 Unauthorized
- **And** error message is "Authentication token required"

### AC3: Invalid or Expired Token
- **Given** I have an invalid or expired JWT token
- **When** I GET `/api/v1/auth/me` with that token
- **Then** response returns 401 Unauthorized
- **And** error message is "Invalid or expired token"

### AC4: User Data Freshness
- **Given** I'm authenticated with a valid token
- **When** I GET `/api/v1/auth/me`
- **Then** response returns current user data from database (not cached token payload)
- **And** reflects any profile updates made since login

---

## Scope

### In Scope
- `GET /api/v1/auth/me` endpoint
- JWT token validation via authenticateJWT middleware
- Fetch user from database by userId in token
- Return user profile excluding passwordHash
- Handle missing or invalid tokens (via middleware)
- Handle user not found (deleted after token issued)

### Out of Scope
- Profile editing (separate story)
- Profile picture upload (separate epic)
- Account deletion (future version)
- Password change (future version)
- Email/username change (future version)

---

## Technical Notes

**Endpoint Implementation:**
```typescript
// src/routes/auth.ts
router.get('/me', authenticateJWT, getCurrentUser);

// src/controllers/authController.ts
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.user!; // Populated by authenticateJWT

    // Fetch fresh user data from database
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      // User deleted after token was issued
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName || null,
        bio: user.bio || null,
        profilePictureUrl: user.profilePictureUrl || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred retrieving user profile'
      }
    });
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "janedoe",
    "email": "jane@example.com",
    "displayName": null,
    "bio": null,
    "profilePictureUrl": null,
    "createdAt": "2026-01-30T12:00:00.000Z",
    "updatedAt": "2026-01-30T12:00:00.000Z"
  }
}
```

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| No Authorization header | 401 "Authentication token required" (middleware) |
| Invalid JWT format | 401 "Invalid or expired token" (middleware) |
| Expired token (>7 days) | 401 "Invalid or expired token" (middleware) |
| Valid token but user deleted | 404 "User not found" |
| Database connection failure | 500 "Internal error" |
| Token has invalid userId | 404 "User not found" (no such ID in DB) |
| User exists but passwordHash exposed | NEVER (use .select('-passwordHash')) |
| Optional fields (displayName, bio) null | Return null (don't omit) |

---

## Test Scenarios

- [ ] Valid token → 200 with user profile
- [ ] Response excludes passwordHash
- [ ] Response includes all expected fields (userId, username, email, etc.)
- [ ] No Authorization header → 401 (middleware)
- [ ] Invalid token → 401 (middleware)
- [ ] Expired token → 401 (middleware)
- [ ] User deleted after token issued → 404
- [ ] Database error → 500
- [ ] Fresh data returned (not stale token payload)
- [ ] Optional fields (displayName, bio) return null if not set

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0001](US0001-user-registration-api.md) | Prerequisite | User model and registration | Done |
| [US0002](US0002-user-login-jwt.md) | Prerequisite | JWT token generation | Done |
| [US0003](US0003-jwt-auth-middleware.md) | Prerequisite | authenticateJWT middleware | Done |

---

## Estimation

**Story Points:** 3
**Complexity:** Low-Medium

**Effort Breakdown:**
- Route and controller implementation: 1 hour
- Integration with authenticateJWT middleware: 30 minutes
- Error handling (user not found): 30 minutes
- Integration tests: 2 hours
- Documentation: 30 minutes

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial story created from EP0001 |
