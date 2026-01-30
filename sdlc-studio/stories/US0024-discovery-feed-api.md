# US0024: Discovery Feed API Endpoint

> **Status:** Done
> **Epic:** [EP0005: Photo Feeds (Personal & Discovery)](../epics/EP0005-photo-feeds.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Completed:** 2026-01-30

## User Story

**As a** registered user (any persona)
**I want** to see a feed of all public photos from all users
**So that** I can discover new photographers and interesting content beyond my followed users

## Context

### Persona Reference
**All Personas** benefit from discovery feed:
- **Taylor (Visual Curator):** Primary user - discovers new artists to follow
- **Alex (Photography Enthusiast):** Finds inspiration from broader community
- **Morgan (Mindful Consumer):** Explores intentionally when ready to follow new people
- **Jamie (Casual Sharer):** Browses popular content

[Full persona details](../personas.md)

### Background
The discovery feed is the global browsing experience for inchagram. Unlike the personalized feed (US0023) which shows only photos from followed users, the discovery feed shows ALL photos from ALL users, ordered chronologically (newest first). This helps users discover new photographers and content.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Algorithm | Chronological only (no ranking) | Sort by createdAt desc |
| PRD | Performance | Feed load <1s for 20 photos | Efficient queries + indexes |
| TRD | Auth | Optional authentication | Endpoint can be public or authenticated |
| TRD | Pagination | Offset-based (page/limit) | Support ?page=1&limit=20 query params |

---

## Acceptance Criteria

### AC1: Return All Photos from All Users
- **Given** there are photos from 10 different users in the database
- **When** I GET `/api/v1/photos/discover`
- **Then** response returns photos from all users
- **And** does not filter by follows

### AC2: Chronological Ordering (Newest First)
- **Given** users have posted photos at different times
- **When** I GET `/api/v1/photos/discover`
- **Then** response returns photos sorted by createdAt descending
- **And** newest photo appears first in the array

### AC3: Pagination Support
- **Given** there are 50 photos total in the database
- **When** I GET `/api/v1/photos/discover?page=0&limit=20`
- **Then** response returns first 20 photos
- **When** I GET `/api/v1/photos/discover?page=1&limit=20`
- **Then** response returns next 20 photos (21-40)

### AC4: Include Photo Metadata
- **Given** I request the discovery feed
- **When** I GET `/api/v1/photos/discover`
- **Then** each photo includes: photoId, imageUrl, caption, userId, username, profilePictureUrl, likeCount, createdAt

### AC5: No Authentication Required (Public Endpoint)
- **Given** I am not authenticated
- **When** I GET `/api/v1/photos/discover`
- **Then** response returns 200 OK with photos
- **And** no authentication error occurs

### AC6: Empty Feed Handling
- **Given** there are no photos in the database
- **When** I GET `/api/v1/photos/discover`
- **Then** response returns empty array []
- **And** response is 200 OK (not an error)

---

## Scope

### In Scope
- GET `/api/v1/photos/discover` endpoint
- Query all photos from all users
- Sort by createdAt descending
- Pagination with page/limit query params
- Populate user data (username, profilePictureUrl)
- Include like count on each photo
- Public endpoint (no authentication required)

### Out of Scope
- Personalized feed (already done: US0023)
- Filtering by user or date (future version)
- Algorithmic ranking or recommendations (future version)
- Cursor-based pagination (offset-based is sufficient)
- Feed caching or optimization (separate story: US0028)
- Photo detail view (separate epic)
- Like/unlike on feed (frontend only, API exists in US0016)

---

## Technical Notes

### API Endpoint

**Route:** `GET /api/v1/photos/discover`

**Query Parameters:**
- `page` (number, optional): Page number (0-indexed), default 0
- `limit` (number, optional): Photos per page, default 20, max 50

**Headers:**
- No authentication required (public endpoint)

**Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "photoId": "507f1f77bcf86cd799439011",
        "imageUrl": "https://s3.amazonaws.com/bucket/photos/uuid.jpg",
        "caption": "Beautiful sunset",
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
Add new function to existing file:
```typescript
export async function getDiscoveryFeed(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 0;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  // Get all photos (no filtering by follows)
  const photos = await Photo.find({})
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .populate('userId', 'username profilePictureUrl');

  // Get total count for pagination
  const total = await Photo.countDocuments({});

  // Format response (same as personalized feed)
  const formattedPhotos = photos.map(photo => ({
    photoId: photo._id.toString(),
    imageUrl: photo.imageUrl,
    caption: photo.caption || '',
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
import { getDiscoveryFeed } from '../controllers/feedController';

router.get('/discover', getDiscoveryFeed); // Public endpoint, no auth middleware
```

**3. Performance Optimization:**
- Reuse existing index on `Photo.createdAt` for fast sorting
- Reuse existing index on `Photo.userId` for populate

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| No photos in database | 200 with empty photos array |
| Page beyond available data | 200 with empty photos array |
| Negative page number | Treat as page 0 |
| Limit > 50 | Cap at 50 |
| Limit < 1 | Use default 20 |
| Non-numeric page/limit | Use defaults (page=0, limit=20) |
| User deleted photo | Photo not in results (expected) |
| User deleted account | Photos remain (userId still in DB) |

---

## Test Scenarios

### Integration Tests (tests/integration/feed.discovery.test.ts)

- [x] **TC001:** Unauthenticated user can access discovery feed
- [x] **TC002:** Returns photos from all users (not filtered by follows)
- [x] **TC003:** Photos are sorted by createdAt descending
- [x] **TC004:** Pagination returns correct page of results
- [x] **TC005:** Empty array when no photos exist
- [x] **TC006:** Photo includes all required metadata
- [x] **TC007:** Pagination metadata correct (hasMore, total)
- [x] **TC008:** Limit caps at 50
- [x] **TC009:** Default page=0, limit=20 when not specified
- [x] **TC010:** Authenticated user can also access (optional)

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0011](US0011-photo-model-mongodb-schema.md) | Prerequisite | Photo model | Done ✅ |

**All dependencies satisfied** ✅

---

## Estimation

**Story Points:** 2
**Complexity:** Low (simpler than US0023)

**Effort Breakdown:**
- Feed controller implementation: 1 hour (copy US0023 pattern, remove Follow logic)
- Route setup: 15 minutes
- Integration tests (10 test cases): 2 hours
- Performance testing: 30 minutes
- Documentation: 30 minutes

**Total:** ~4.5 hours

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Richard | Initial story created from EP0005 |
