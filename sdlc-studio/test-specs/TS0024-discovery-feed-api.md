# Test Specification: US0024 - Discovery Feed API

> **Story:** [US0024: Discovery Feed API Endpoint](../stories/US0024-discovery-feed-api.md)
> **Test Spec ID:** TS0024
> **Created:** 2026-01-30
> **Test Type:** Integration
> **Status:** Automated

## Test Plan Summary

| Metric | Value |
|--------|-------|
| Total Test Cases | 10 |
| Test File | tests/integration/feed.discovery.test.ts |
| Estimated Duration | 2-3 seconds |
| Dependencies | Photo model, User model |

---

## Test Data Setup

### Users
```typescript
userA: { username: 'userA', email: 'usera@example.com' }
userB: { username: 'userB', email: 'userb@example.com' }
userC: { username: 'userC', email: 'userc@example.com' }
```

### Photos
```typescript
// UserA's photos (3 photos)
userA_photo1: { userId: userA._id, caption: 'Photo A1', createdAt: T-1h }
userA_photo2: { userId: userA._id, caption: 'Photo A2', createdAt: T-3h }
userA_photo3: { userId: userA._id, caption: 'Photo A3', createdAt: T-5h }

// UserB's photos (2 photos)
userB_photo1: { userId: userB._id, caption: 'Photo B1', createdAt: T-2h }
userB_photo2: { userId: userB._id, caption: 'Photo B2', createdAt: T-4h }

// UserC's photos (2 photos)
userC_photo1: { userId: userC._id, caption: 'Photo C1', createdAt: T-6h }
userC_photo2: { userId: userC._id, caption: 'Photo C2', createdAt: T-7h }
```

**Total:** 3 users, 7 photos, NO Follow relationships needed

---

## Test Cases

### TC001: Unauthenticated Access (AC5)
**Priority:** High
**Type:** Security

**Description:** Verify discovery feed is publicly accessible without authentication.

**Steps:**
1. Do NOT set Authorization header
2. GET /api/v1/photos/discover

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "photos": [...],
    "pagination": {...}
  }
}
```

**Assertions:**
- Response status: 200
- Response body.success: true
- No authentication error

---

### TC002: Returns Photos from All Users (AC1)
**Priority:** High
**Type:** Functional

**Description:** Verify discovery feed includes photos from all users, not filtered by follows.

**Steps:**
1. GET /api/v1/photos/discover

**Expected Result:**
- Photos from userA, userB, and userC are all present
- Total count includes all 7 photos

**Assertions:**
- Response includes photos where username = 'userA'
- Response includes photos where username = 'userB'
- Response includes photos where username = 'userC'
- Pagination.total = 7

---

### TC003: Chronological Ordering (AC2)
**Priority:** High
**Type:** Functional

**Description:** Verify photos are sorted by createdAt descending (newest first).

**Steps:**
1. GET /api/v1/photos/discover

**Expected Result:**
- First photo: userA_photo1 (T-1h, newest)
- Second photo: userB_photo1 (T-2h)
- Last photo: userC_photo2 (T-7h, oldest)

**Assertions:**
- Response.data.photos[0].caption = 'Photo A1'
- Response.data.photos[1].caption = 'Photo B1'
- Response.data.photos[6].caption = 'Photo C2'
- Photos are in descending createdAt order

---

### TC004: Pagination - Page 0 (AC3)
**Priority:** High
**Type:** Functional

**Description:** Verify first page returns correct subset of photos.

**Steps:**
1. GET /api/v1/photos/discover?page=0&limit=3

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "photos": [
      { "caption": "Photo A1" },  // T-1h
      { "caption": "Photo B1" },  // T-2h
      { "caption": "Photo A2" }   // T-3h
    ],
    "pagination": {
      "page": 0,
      "limit": 3,
      "total": 7,
      "hasMore": true
    }
  }
}
```

**Assertions:**
- Response.data.photos.length = 3
- Pagination.page = 0
- Pagination.limit = 3
- Pagination.total = 7
- Pagination.hasMore = true

---

### TC005: Empty Feed (AC6)
**Priority:** Medium
**Type:** Edge Case

**Description:** Verify empty feed returns empty array when no photos exist.

**Steps:**
1. Delete all photos from database
2. GET /api/v1/photos/discover

**Expected Result:**
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

**Assertions:**
- Response status: 200 (not 404)
- Response.data.photos = []
- Pagination.total = 0
- Pagination.hasMore = false

---

### TC006: Photo Metadata Completeness (AC4)
**Priority:** High
**Type:** Functional

**Description:** Verify each photo includes all required metadata fields.

**Steps:**
1. GET /api/v1/photos/discover

**Expected Result:**
Each photo object contains:
```json
{
  "photoId": "string (ObjectId)",
  "imageUrl": "string (S3 URL)",
  "caption": "string",
  "userId": "string (ObjectId)",
  "username": "string",
  "profilePictureUrl": "string | null",
  "likeCount": "number",
  "createdAt": "ISO 8601 date string"
}
```

**Assertions:**
- All 8 fields present in each photo
- photoId is valid ObjectId string
- userId is valid ObjectId string
- createdAt is ISO 8601 format
- likeCount is number >= 0

---

### TC007: Pagination Metadata (AC3)
**Priority:** Medium
**Type:** Functional

**Description:** Verify pagination metadata is accurate across pages.

**Steps:**
1. GET /api/v1/photos/discover?page=0&limit=3
2. GET /api/v1/photos/discover?page=1&limit=3
3. GET /api/v1/photos/discover?page=2&limit=3

**Expected Results:**
- Page 0: hasMore = true (3 of 7)
- Page 1: hasMore = true (6 of 7)
- Page 2: hasMore = false (7 of 7)

**Assertions:**
- Page 0: pagination.hasMore = true
- Page 1: pagination.hasMore = true
- Page 2: pagination.hasMore = false
- All pages: pagination.total = 7

---

### TC008: Limit Caps at 50 (AC3)
**Priority:** Low
**Type:** Validation

**Description:** Verify limit parameter is capped at maximum 50.

**Steps:**
1. GET /api/v1/photos/discover?limit=100

**Expected Result:**
- Actual limit applied: 50 (not 100)

**Assertions:**
- Response.data.pagination.limit = 50
- Response.data.photos.length <= 50

---

### TC009: Default Parameters (AC3)
**Priority:** Medium
**Type:** Validation

**Description:** Verify default values when page/limit not specified.

**Steps:**
1. GET /api/v1/photos/discover (no query params)

**Expected Result:**
```json
{
  "pagination": {
    "page": 0,
    "limit": 20,
    "total": 7,
    "hasMore": false
  }
}
```

**Assertions:**
- Pagination.page = 0
- Pagination.limit = 20
- Photos returned (up to 20)

---

### TC010: Authenticated User Access (AC5 Optional)
**Priority:** Low
**Type:** Security

**Description:** Verify authenticated users can also access discovery feed.

**Steps:**
1. Login as userA, get JWT token
2. GET /api/v1/photos/discover with Authorization header

**Expected Result:**
- Same response as unauthenticated request
- No errors

**Assertions:**
- Response status: 200
- Response.data.photos includes all 7 photos
- No authentication errors

---

## Test Coverage Matrix

| Acceptance Criteria | Test Cases | Coverage |
|---------------------|------------|----------|
| AC1: All users' photos | TC001, TC002 | 100% |
| AC2: Chronological order | TC003 | 100% |
| AC3: Pagination | TC004, TC007, TC008, TC009 | 100% |
| AC4: Photo metadata | TC006 | 100% |
| AC5: No auth required | TC001, TC010 | 100% |
| AC6: Empty feed | TC005 | 100% |

**Overall Coverage:** 100%

---

## Test Execution Order

1. TC005 (Empty Feed) - Sets baseline
2. TC001 (Unauthenticated Access) - Verify public access
3. TC002 (All Users Photos) - Verify basic functionality
4. TC003 (Chronological Ordering) - Verify sorting
5. TC004 (Pagination Page 0) - Verify pagination
6. TC006 (Photo Metadata) - Verify data structure
7. TC007 (Pagination Metadata) - Verify pagination logic
8. TC008 (Limit Caps) - Verify validation
9. TC009 (Default Parameters) - Verify defaults
10. TC010 (Authenticated Access) - Verify optional auth

---

## Test Environment

**Database:** MongoDB in-memory (for tests)
**Framework:** Jest + Supertest
**Setup:** beforeEach() creates fresh test data
**Cleanup:** afterEach() clears database

---

## Automation Status

- [x] Test spec created
- [ ] Tests automated (tests/integration/feed.discovery.test.ts)
- [ ] Tests passing
- [ ] CI integration complete

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Richard | Initial test spec created |
