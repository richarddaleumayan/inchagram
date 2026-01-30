# US0018: View Photo Likes List

> **Status:** Done
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Created:** 2026-01-30

## User Story

**As a** user viewing a photo
**I want to** see a list of users who liked it
**So that** I can discover other users with similar interests

## API Endpoint

```
GET /api/v1/photos/:photoId/likes
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "photoId": "...",
    "likeCount": 25,
    "users": [
      {
        "userId": "...",
        "username": "john",
        "displayName": "John Doe",
        "profilePictureUrl": "...",
        "likedAt": "2026-01-30T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalLikes": 25,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Acceptance Criteria

- [x] Returns list of users who liked a photo
- [x] Includes user details (username, displayName, profilePictureUrl)
- [x] Paginated response (default 20 per page)
- [x] Sorted by most recent first
- [x] Public endpoint (no auth required)
- [x] Returns 404 for non-existent photo
- [x] Returns 400 for invalid photo ID format

## Test Results

- 10/10 tests passing
