# US0016: Like/Unlike Photo API Endpoints

> **Status:** Done
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As an** authenticated user
**I want to** like and unlike photos via API
**So that** I can show appreciation for photos I enjoy

## Context

### Persona Reference
- **Alex (Photography Enthusiast)** - Likes inspiring photos
- **Taylor (Visual Curator)** - Likes quality content as curation
- **Jamie (Casual Sharer)** - Likes friends' photos
- **Morgan (Mindful Consumer)** - Appreciates simple like interaction

[Full persona details](../personas.md)

### Background
The Like/Unlike API allows authenticated users to like and unlike photos. Each like creates a record in the Like collection and atomically increments the Photo's likeCount. Unlike removes the record and decrements the count. Duplicate likes are prevented by the compound unique index on (userId, photoId).

---

## Acceptance Criteria

### AC1: Like Photo
- **Given** I am authenticated and provide a valid photoId
- **When** I POST to `/api/v1/photos/:photoId/like`
- **Then** a Like record is created with my userId and the photoId
- **And** the Photo's likeCount is atomically incremented by 1
- **And** response returns 201 with success message

### AC2: Unlike Photo
- **Given** I am authenticated and have previously liked a photo
- **When** I DELETE `/api/v1/photos/:photoId/like`
- **Then** the Like record is deleted
- **And** the Photo's likeCount is atomically decremented by 1
- **And** response returns 200 with success message

### AC3: Duplicate Like Prevention
- **Given** I have already liked a photo
- **When** I attempt to like it again
- **Then** response returns 409 Conflict
- **And** error message indicates "Already liked this photo"

### AC4: Unlike Non-Existent Like
- **Given** I have not liked a photo
- **When** I attempt to unlike it
- **Then** response returns 404 Not Found
- **And** error message indicates "Like not found"

### AC5: Photo Not Found
- **Given** the photoId does not exist
- **When** I attempt to like or unlike
- **Then** response returns 404 Not Found
- **And** error message indicates "Photo not found"

### AC6: Authentication Required
- **Given** I am not authenticated
- **When** I attempt to like or unlike
- **Then** response returns 401 Unauthorized

---

## Technical Notes

**API Endpoints:**
```
POST   /api/v1/photos/:photoId/like   - Like a photo
DELETE /api/v1/photos/:photoId/like   - Unlike a photo
```

**Like Operation:**
```typescript
// Create like and increment count atomically
const like = await Like.create({ userId, photoId });
await Photo.findByIdAndUpdate(photoId, { $inc: { likeCount: 1 } });
```

**Unlike Operation:**
```typescript
// Delete like and decrement count atomically
const like = await Like.findOneAndDelete({ userId, photoId });
if (like) {
  await Photo.findByIdAndUpdate(photoId, { $inc: { likeCount: -1 } });
}
```

**Response Format:**
```json
// Success (201 for like, 200 for unlike)
{
  "success": true,
  "data": {
    "photoId": "...",
    "likeCount": 5
  },
  "message": "Photo liked successfully"
}

// Error (409 Conflict)
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Already liked this photo"
  }
}
```

---

## Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| US0003 | Auth Middleware | JWT authentication | Done |
| US0011 | Photo Model | Photo model with likeCount | Done |
| US0017 | Like Model | Like model with indexes | Done |

---

## Estimation

**Story Points:** 2
**Complexity:** Low

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Neildren | Initial story created |
