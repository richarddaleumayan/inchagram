# US0006: View User Profile API Endpoint

> **Status:** Done
> **Epic:** [EP0002: User Profiles & Profile Management](../epics/EP0002-user-profiles.md)
> **Owner:** Mark
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** Taylor (Visual Curator)
**I want** to view any user's profile by their user ID or username via API
**So that** I can discover photographers and see their profile information before deciding to follow them

## Context

### Persona Reference
**Taylor (Visual Curator)** - Art gallery assistant who browses profiles to discover new photographers. Values seeing profile information (bio, photo counts, follower stats) to evaluate if a photographer's style matches their interests.
[Full persona details](../personas.md#taylor---the-visual-curator)

### Background
The View User Profile API is the foundation for displaying user profiles in the inchagram frontend. This endpoint returns all public profile data for any user, including their username, display name, bio, profile picture URL, and counts for followers, following, and photos. This API does not require authentication since all profiles are public (per PRD constraints). This story focuses on the API only - the frontend profile page is handled in US0010.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Functional | All profiles are public (no privacy settings) | No access control needed, endpoint is public |
| PRD | Data | Bio max 150 chars, display name max 50 chars | Response fields match User model constraints |
| TRD | Architecture | RESTful API with /api/v1/ prefix | Endpoint follows URL pattern conventions |
| TRD | Response Format | Standardized JSON response with success/error structure | All responses use consistent format |

---

## Acceptance Criteria

### AC1: Get Profile by User ID
- **Given** a user exists with ID "507f1f77bcf86cd799439011"
- **When** I GET `/api/v1/users/507f1f77bcf86cd799439011`
- **Then** response returns 200 with JSON containing:
  - `success: true`
  - `data.userId`: "507f1f77bcf86cd799439011"
  - `data.username`: string (3-30 chars)
  - `data.email`: string (user's email)
  - `data.displayName`: string or null
  - `data.bio`: string or null (max 150 chars)
  - `data.profilePictureUrl`: string or null
  - `data.followerCount`: number (0 or positive integer)
  - `data.followingCount`: number (0 or positive integer)
  - `data.photoCount`: number (0 or positive integer)
  - `data.createdAt`: ISO 8601 date string

### AC2: Get Profile by Username
- **Given** a user exists with username "taylor_curator"
- **When** I GET `/api/v1/users/username/taylor_curator`
- **Then** response returns 200 with same profile data structure as AC1

### AC3: User Not Found (by ID)
- **Given** no user exists with ID "507f1f77bcf86cd799439012"
- **When** I GET `/api/v1/users/507f1f77bcf86cd799439012`
- **Then** response returns 404 with JSON:
  - `success: false`
  - `error.code: "NOT_FOUND"`
  - `error.message: "User not found"`
  - `error.details.userId`: the requested ID

### AC4: User Not Found (by Username)
- **Given** no user exists with username "nonexistent_user"
- **When** I GET `/api/v1/users/username/nonexistent_user`
- **Then** response returns 404 with JSON:
  - `success: false`
  - `error.code: "NOT_FOUND"`
  - `error.message: "User not found"`
  - `error.details.username`: the requested username

### AC5: Invalid User ID Format
- **Given** an invalid MongoDB ObjectId "invalid-id-format"
- **When** I GET `/api/v1/users/invalid-id-format`
- **Then** response returns 400 with JSON:
  - `success: false`
  - `error.code: "VALIDATION_ERROR"`
  - `error.message: "Invalid user ID format"`

### AC6: Username Case-Insensitive Lookup
- **Given** a user exists with username "Taylor_Curator"
- **When** I GET `/api/v1/users/username/taylor_curator`
- **Then** response returns 200 with the user profile (case-insensitive match)

---

## Scope

### In Scope
- GET `/api/v1/users/:userId` endpoint (lookup by MongoDB ObjectId)
- GET `/api/v1/users/username/:username` endpoint (lookup by username)
- Return user profile data (userId, username, email, displayName, bio, profilePictureUrl)
- Return social counts (followerCount, followingCount, photoCount)
- 404 handling for non-existent users
- 400 handling for invalid user ID format
- Case-insensitive username lookup
- Password hash is NEVER returned in response

### Out of Scope
- Authentication requirement (profiles are public)
- Pagination of user's photos (separate endpoint in US0007)
- Follow/unfollow actions (EP0004)
- Edit profile functionality (US0008)
- Blocking/reporting users (future version)
- Private profile visibility settings (future version)

---

## Technical Notes

**Controller Implementation:**
```typescript
// src/controllers/profileController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
// Future: import Follow from '../models/Follow';
// Future: import Photo from '../models/Photo';

export async function getUserById(req: Request, res: Response) {
  const { userId } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID format',
        details: { userId }
      }
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
        details: { userId }
      }
    });
  }

  // TODO: Get counts from Follow and Photo models when available
  const followerCount = 0;  // Placeholder until US0020
  const followingCount = 0; // Placeholder until US0020
  const photoCount = 0;     // Placeholder until US0011

  return res.status(200).json({
    success: true,
    data: {
      userId: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName || null,
      bio: user.bio || null,
      profilePictureUrl: user.profilePictureUrl || null,
      followerCount,
      followingCount,
      photoCount,
      createdAt: user.createdAt.toISOString()
    }
  });
}
```

### API Contracts

**Request (by ID):**
```
GET /api/v1/users/:userId
Content-Type: application/json

No body required (GET request)
```

**Request (by Username):**
```
GET /api/v1/users/username/:username
Content-Type: application/json

No body required (GET request)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "taylor_curator",
    "email": "taylor@example.com",
    "displayName": "Taylor Smith",
    "bio": "Art gallery assistant | Photography curator",
    "profilePictureUrl": "https://inchagram-bucket.s3.amazonaws.com/avatars/507f1f77bcf86cd799439011/profile.jpg",
    "followerCount": 127,
    "followingCount": 58,
    "photoCount": 43,
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404 - Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": {
      "userId": "507f1f77bcf86cd799439012"
    }
  }
}
```

**Error Response (400 - Invalid ID):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid user ID format",
    "details": {
      "userId": "invalid-id-format"
    }
  }
}
```

### Data Requirements
- User model must exist with fields: username, email, displayName, bio, profilePictureUrl, createdAt
- Password hash must NEVER be returned in API response
- Counts will return 0 until Follow model (US0020) and Photo model (US0011) are implemented
- MongoDB connection established

---

## Edge Cases & Error Handling

| Scenario | Input | Expected Behaviour |
|----------|-------|-------------------|
| Valid user ID | GET /api/v1/users/507f1f77bcf86cd799439011 | 200 with profile data |
| Valid username | GET /api/v1/users/username/taylor_curator | 200 with profile data |
| Non-existent user ID | GET /api/v1/users/507f1f77bcf86cd799439012 | 404, "User not found" |
| Non-existent username | GET /api/v1/users/username/ghost_user | 404, "User not found" |
| Invalid ObjectId format | GET /api/v1/users/not-a-valid-id | 400, "Invalid user ID format" |
| ObjectId with wrong length | GET /api/v1/users/abc123 | 400, "Invalid user ID format" |
| Username with special chars in URL | GET /api/v1/users/username/user%40test | 404 (no user with @ in username) |
| Empty username | GET /api/v1/users/username/ | 404 (route not matched or empty) |
| Username case mismatch | GET /api/v1/users/username/TAYLOR_CURATOR | 200 (case-insensitive) |
| User with no displayName | Valid user without displayName | 200, displayName: null |
| User with no bio | Valid user without bio | 200, bio: null |
| User with no profilePictureUrl | Valid user without avatar | 200, profilePictureUrl: null |
| MongoDB connection failure | Any request | 500, "Internal Server Error" |
| Extremely long username in URL | GET /api/v1/users/username/a{1000} | 404 (exceeds 30 char limit, won't match) |

---

## Test Scenarios

- [ ] **Happy path (by ID):** Valid user ID → 200 with complete profile data
- [ ] **Happy path (by username):** Valid username → 200 with complete profile data
- [ ] **User not found (by ID):** Non-existent ObjectId → 404 with error details
- [ ] **User not found (by username):** Non-existent username → 404 with error details
- [ ] **Invalid ObjectId format:** "invalid-id" → 400 validation error
- [ ] **Short invalid ObjectId:** "abc123" → 400 validation error
- [ ] **Username case-insensitive:** "TAYLOR_CURATOR" matches "taylor_curator" → 200
- [ ] **Profile with all fields:** User with displayName, bio, profilePicture → all fields present
- [ ] **Profile with optional fields null:** User without displayName/bio → fields are null, not missing
- [ ] **Password never returned:** Response does not contain passwordHash field
- [ ] **Counts default to 0:** Before Follow/Photo models exist, counts are 0
- [ ] **Response format matches spec:** success, data structure matches API contract
- [ ] **createdAt is ISO format:** createdAt field is valid ISO 8601 string
- [ ] **Empty username param:** /api/v1/users/username/ → 404 or route not found

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0001](US0001-user-registration-api.md) | Schema | User model with profile fields | Done |

**Note:** This story can proceed with counts returning 0. Full counts require:
- US0020 (Follow Model) for followerCount/followingCount
- US0011 (Photo Model) for photoCount

These are soft dependencies - the API works without them, just with placeholder counts.

### External Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| MongoDB | Database | Required - must be running |
| Express | Web framework | Required - project setup |
| Mongoose | ODM | Required - for User model queries |

---

## Estimation

**Story Points:** 2
**Complexity:** Low-Medium

**Rationale:**
- Straightforward read-only API endpoints
- User model already exists from US0001
- No authentication required (public profiles)
- Standard CRUD pattern with validation
- Counts will be placeholders until dependent stories complete

---

## Open Questions

- [x] Should email be included in public profile response? - Owner: Mark (Decision: Yes, for now. Can be made optional in future privacy settings)
- [x] What happens to counts before Follow/Photo models exist? - Owner: Mark (Decision: Return 0 as placeholder)
- [ ] Should we add rate limiting for this public endpoint? - Owner: Mark (Decision: Deferred to future security hardening)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Mark | Initial story created from EP0002 |
