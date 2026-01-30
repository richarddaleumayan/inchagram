# US0023: Personalized Feed API Endpoint

> **Status:** Done
> **Epic:** [EP0005: Photo Feeds (Personal & Discovery)](../epics/EP0005-photo-feeds.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Completed:** 2026-01-30

## User Story

**As a** registered user (any persona)
**I want** to see a feed of photos from users I follow
**So that** I can discover and enjoy content from photographers I'm interested in

## Context

### Persona Reference
**All Personas** benefit from personalized feed:
- **Alex (Photography Enthusiast):** Follows favorite photographers to see their latest work
- **Taylor (Visual Curator):** Curates feed through strategic follows
- **Morgan (Mindful Consumer):** Checks feed intentionally to see updates
- **Jamie (Casual Sharer):** Scrolls to see friends' photos

[Full persona details](../personas.md)

### Background
The personalized feed is the core browsing experience for inchagram. It shows photos from users the authenticated user follows, ordered chronologically (newest first). This differs from the discovery feed which shows all photos globally.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Algorithm | Chronological only (no ranking) | Sort by createdAt desc |
| PRD | Performance | Feed load <1s for 20 photos | Efficient queries + indexes |
| TRD | Auth | JWT authentication required | Use authenticateJWT middleware |
| TRD | Pagination | Offset-based (page/limit) | Support ?page=1&limit=20 query params |

---

## Acceptance Criteria

### AC1: Return Photos from Followed Users Only
- **Given** I am authenticated and follow 3 users
- **When** I GET `/api/v1/photos/feed`
- **Then** response returns only photos from those 3 users
- **And** does not include photos from users I don't follow

### AC2: Chronological Ordering (Newest First)
- **Given** followed users have posted photos at different times
- **When** I GET `/api/v1/photos/feed`
- **Then** response returns photos sorted by createdAt descending
- **And** newest photo appears first in the array

### AC3: Pagination Support
- **Given** followed users have posted 50 photos total
- **When** I GET `/api/v1/photos/feed?page=0&limit=20`
- **Then** response returns first 20 photos
- **When** I GET `/api/v1/photos/feed?page=1&limit=20`
- **Then** response returns next 20 photos (21-40)

### AC4: Include Photo Metadata
- **Given** I request the personalized feed
- **When** I GET `/api/v1/photos/feed`
- **Then** each photo includes: photoId, imageUrl, caption, userId, username, profilePictureUrl, likeCount, createdAt

### AC5: Empty Feed When Not Following Anyone
- **Given** I am authenticated but follow 0 users
- **When** I GET `/api/v1/photos/feed`
- **Then** response returns empty array []
- **And** response is 200 OK (not an error)

### AC6: Authentication Required
- **Given** I am not authenticated
- **When** I GET `/api/v1/photos/feed`
- **Then** response returns 401 Unauthorized

---

## Scope

### In Scope
- GET `/api/v1/photos/feed` endpoint
- Query photos from followed users only
- Sort by createdAt descending
- Pagination with page/limit query params
- Populate user data (username, profilePictureUrl)
- Include like count on each photo
- Require JWT authentication

### Out of Scope
- Discovery feed (separate story: US0024)
- Filtering by user or date (future version)
- Cursor-based pagination (offset-based is sufficient)
- Feed caching or optimization (separate story: US0028)
- Photo detail view (separate epic)
- Like/unlike on feed (frontend only, API exists in US0016)

---

## Technical Notes

### API Endpoint

**Route:** `GET /api/v1/photos/feed`

**Query Parameters:**
- `page` (number, optional): Page number (0-indexed), default 0
- `limit` (number, optional): Photos per page, default 20, max 50

**Headers:**
- `Authorization: Bearer <jwt_token>` (required)

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "photoId": "507f1f77bcf86cd799439011",
        "imageUrl": "https://s3.amazonaws.com/bucket/photos/uuid.jpg",
        "caption": "Sunset at the beach",
        "userId": "507f191e810c19729de860ea",
        "username": "photographer123",
        "profilePictureUrl": "https://s3.amazonaws.com/bucket/avatars/uuid.jpg",
        "likeCount": 42,
        "createdAt": "2026-01-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 0,
      "limit": 20,
      "total": 150,
      "hasMore": true
    }
  }
}
```

**Response (Empty Feed - 200 OK):**
```json
{
  "success": true,
  "data": {
    "photos": [],
    "pagination": {
      "page": 0,
      "limit": 20,
      "total": 0,
      "hasMore": false
    }
  }
}
```

### Implementation Approach

**1. Feed Controller (`src/controllers/feedController.ts`):**
```typescript
export async function getPersonalizedFeed(req: AuthRequest, res: Response) {
  const { userId } = req.user!;
  const page = parseInt(req.query.page as string) || 0;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  // Get users the authenticated user follows
  const follows = await Follow.find({ followerId: userId }).select('followingId');
  const followingIds = follows.map(f => f.followingId);

  // Get photos from followed users
  const photos = await Photo.find({ userId: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .populate('userId', 'username profilePictureUrl');

  // Get total count for pagination
  const total = await Photo.countDocuments({ userId: { $in: followingIds } });

  // Format response
  const formattedPhotos = photos.map(photo => ({
    photoId: photo._id.toString(),
    imageUrl: photo.imageUrl,
    caption: photo.caption,
    userId: photo.userId._id.toString(),
    username: photo.userId.username,
    profilePictureUrl: photo.userId.profilePictureUrl || null,
    likeCount: photo.likeCount,
    createdAt: photo.createdAt
  }));

  res.status(200).json({
    success: true,
    data: {
      photos: formattedPhotos,
      pagination: {
        page,
        limit,
        total,
        hasMore: (page + 1) * limit < total
      }
    }
  });
}
```

**2. Route (`src/routes/photos.ts`):**
```typescript
import { authenticateJWT } from '../middleware/authMiddleware';
import { getPersonalizedFeed } from '../controllers/feedController';

router.get('/feed', authenticateJWT, getPersonalizedFeed);
```

**3. Performance Optimization:**
- Ensure index on `Photo.createdAt` for fast sorting
- Ensure index on `Photo.userId` for fast filtering
- Ensure index on `Follow.followerId` for follow lookups

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| No Authorization header | 401 (handled by authenticateJWT middleware) |
| Invalid/expired token | 401 (handled by authenticateJWT middleware) |
| User follows 0 people | 200 with empty photos array |
| Page beyond available data | 200 with empty photos array |
| Negative page number | Treat as page 0 |
| Limit > 50 | Cap at 50 |
| Limit < 1 | Use default 20 |
| Non-numeric page/limit | Use defaults (page=0, limit=20) |
| Followed user deleted photo | Photo not in results (expected) |
| Followed user deleted account | Photos remain (userId still in DB) |

---

## Test Scenarios

### Integration Tests (tests/integration/feed.personalized.test.ts)

- [ ] **TC001:** Authenticated user with follows sees their photos
- [ ] **TC002:** Photos are sorted by createdAt descending
- [ ] **TC003:** Pagination returns correct page of results
- [ ] **TC004:** Does not return photos from non-followed users
- [ ] **TC005:** Empty array when not following anyone
- [ ] **TC006:** 401 when not authenticated
- [ ] **TC007:** Photo includes all required metadata
- [ ] **TC008:** Pagination metadata correct (hasMore, total)
- [ ] **TC009:** Limit caps at 50
- [ ] **TC010:** Default page=0, limit=20 when not specified

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0001](US0001-user-registration-api.md) | Prerequisite | User model | Done |
| [US0003](US0003-jwt-auth-middleware.md) | Prerequisite | authenticateJWT middleware | Done |
| [US0011](US0011-photo-model-mongodb-schema.md) | Prerequisite | Photo model | Done |
| [US0020](US0020-follow-model.md) | Prerequisite | Follow model | Done |

**All dependencies satisfied** ✅

---

## Estimation

**Story Points:** 3
**Complexity:** Medium

**Effort Breakdown:**
- Feed controller implementation: 2 hours
- Route setup: 30 minutes
- Integration tests (10 test cases): 3 hours
- Performance testing: 1 hour
- Documentation: 30 minutes

**Total:** ~7 hours

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Richard | Initial story created from EP0005 |
