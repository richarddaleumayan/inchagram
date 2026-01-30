# TS0023: Personalized Feed API Test Specification

> **Story:** [US0023: Personalized Feed API Endpoint](../stories/US0023-personalized-feed-api.md)
> **Plan:** [PL0023: Personalized Feed API Implementation Plan](../plans/PL0023-personalized-feed-api.md)
> **Epic:** [EP0005: Photo Feeds (Personal & Discovery)](../epics/EP0005-photo-feeds.md)
> **Status:** Draft
> **Created:** 2026-01-30
> **Owner:** Richard

---

## Test Strategy

**Approach:** TDD (Test-Driven Development)
**Test Level:** Integration (API endpoint behavior with database)
**Framework:** Jest + Supertest
**Test File:** `tests/integration/feed.personalized.test.ts`

---

## Test Data Setup

### Test Users
- **userA:** Authenticated user requesting feed (follows userB, userC)
- **userB:** Followed by userA, has 5 photos
- **userC:** Followed by userA, has 3 photos
- **userD:** NOT followed by userA, has 2 photos (should not appear in feed)

### Test Photos
- **userB photos:** Created at T-8h, T-6h, T-4h, T-2h, T-1h
- **userC photos:** Created at T-7h, T-5h, T-3h
- **userD photos:** Created at T-9h, T-1h30m

**Expected Feed Order (newest first):**
1. userB photo (T-1h)
2. userC photo (T-3h)
3. userB photo (T-2h)
4. userB photo (T-4h)
5. userC photo (T-5h)
6. userB photo (T-6h)
7. userC photo (T-7h)
8. userB photo (T-8h)

---

## Test Suites

### TC001: Feed Shows Only Followed Users' Photos

**Purpose:** Verify feed returns photos only from followed users, not all users

**Test Cases:**

#### TC001.1: Authenticated user sees followed users' photos
```typescript
it('should return photos only from followed users', async () => {
  // Arrange: userA follows userB and userC
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act: GET /feed
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert: 8 photos from userB (5) + userC (3)
  expect(response.body.success).toBe(true);
  expect(response.body.data.photos).toHaveLength(8);

  // Verify all photos are from userB or userC
  const photoUserIds = response.body.data.photos.map((p: any) => p.userId);
  expect(photoUserIds).not.toContain(userD._id.toString());
});
```

#### TC001.2: Does not include photos from non-followed users
```typescript
it('should not include photos from users not followed', async () => {
  // Arrange: userD posted photos but userA doesn't follow userD
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert: No photos from userD
  const userDPhotos = response.body.data.photos.filter(
    (p: any) => p.userId === userD._id.toString()
  );
  expect(userDPhotos).toHaveLength(0);
});
```

**Expected Results:** 2/2 tests passing

---

### TC002: Photos Sorted Chronologically (Newest First)

**Purpose:** Verify photos are returned in reverse chronological order

**Test Cases:**

#### TC002.1: Photos ordered by createdAt descending
```typescript
it('should return photos sorted by createdAt descending', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert: Each photo older than or equal to previous
  const photos = response.body.data.photos;
  for (let i = 1; i < photos.length; i++) {
    const prevDate = new Date(photos[i - 1].createdAt).getTime();
    const currDate = new Date(photos[i].createdAt).getTime();
    expect(prevDate).toBeGreaterThanOrEqual(currDate);
  }
});
```

#### TC002.2: Newest photo appears first
```typescript
it('should have newest photo first in feed', async () => {
  // Arrange: userB's most recent photo is at T-1h
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert: First photo is the newest one
  const firstPhoto = response.body.data.photos[0];
  expect(firstPhoto.userId).toBe(userB._id.toString());
  // Verify it's the T-1h photo by caption or compare timestamps
});
```

**Expected Results:** 2/2 tests passing

---

### TC003: Pagination Works Correctly

**Purpose:** Verify page/limit query params work correctly

**Test Cases:**

#### TC003.1: First page returns correct number of photos
```typescript
it('should return first page with specified limit', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act: Request first 3 photos
  const response = await request(app)
    .get('/api/v1/photos/feed?page=0&limit=3')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert
  expect(response.body.data.photos).toHaveLength(3);
  expect(response.body.data.pagination.page).toBe(0);
  expect(response.body.data.pagination.limit).toBe(3);
  expect(response.body.data.pagination.total).toBe(8);
  expect(response.body.data.pagination.hasMore).toBe(true);
});
```

#### TC003.2: Second page returns next batch
```typescript
it('should return second page without overlap', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act: Get both pages
  const page0 = await request(app)
    .get('/api/v1/photos/feed?page=0&limit=3')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const page1 = await request(app)
    .get('/api/v1/photos/feed?page=1&limit=3')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert: No overlap
  const page0Ids = page0.body.data.photos.map((p: any) => p.photoId);
  const page1Ids = page1.body.data.photos.map((p: any) => p.photoId);
  const overlap = page0Ids.filter((id: string) => page1Ids.includes(id));
  expect(overlap).toHaveLength(0);

  // Assert: Second page has correct pagination
  expect(page1.body.data.pagination.page).toBe(1);
  expect(page1.body.data.pagination.hasMore).toBe(true);
});
```

#### TC003.3: Last page indicates no more results
```typescript
it('should indicate no more results on last page', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act: Request page that includes last photos (page=1, limit=5 → photos 6-8)
  const response = await request(app)
    .get('/api/v1/photos/feed?page=1&limit=5')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert
  expect(response.body.data.photos).toHaveLength(3); // Only 3 remaining
  expect(response.body.data.pagination.hasMore).toBe(false);
});
```

**Expected Results:** 3/3 tests passing

---

### TC004: Photo Metadata Complete

**Purpose:** Verify each photo includes all required metadata fields

**Test Cases:**

#### TC004.1: Photo includes all required fields
```typescript
it('should include all required photo metadata', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert: First photo has all fields
  const photo = response.body.data.photos[0];
  expect(photo).toHaveProperty('photoId');
  expect(photo).toHaveProperty('imageUrl');
  expect(photo).toHaveProperty('caption');
  expect(photo).toHaveProperty('userId');
  expect(photo).toHaveProperty('username');
  expect(photo).toHaveProperty('profilePictureUrl');
  expect(photo).toHaveProperty('likeCount');
  expect(photo).toHaveProperty('createdAt');
});
```

#### TC004.2: Username and profilePictureUrl populated from user
```typescript
it('should populate username and profilePictureUrl from user data', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert: Photo shows correct username
  const photo = response.body.data.photos[0];
  expect(photo.username).toBe(userB.username); // Or userC.username
  expect(typeof photo.profilePictureUrl).toBe('string');
});
```

**Expected Results:** 2/2 tests passing

---

### TC005: Empty Feed When Not Following Anyone

**Purpose:** Verify empty array returned when user follows nobody

**Test Cases:**

#### TC005.1: Returns empty array when no follows
```typescript
it('should return empty photos array when user follows nobody', async () => {
  // Arrange: Create userE who follows nobody
  const userE = await createTestUser('usere@example.com', 'userE', 'password123');
  const token = generateValidToken(userE._id.toString(), userE.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert
  expect(response.body.success).toBe(true);
  expect(response.body.data.photos).toEqual([]);
  expect(response.body.data.pagination.total).toBe(0);
  expect(response.body.data.pagination.hasMore).toBe(false);
});
```

**Expected Results:** 1/1 tests passing

---

### TC006: Authentication Required

**Purpose:** Verify endpoint requires valid JWT token

**Test Cases:**

#### TC006.1: 401 without Authorization header
```typescript
it('should return 401 when no auth token provided', async () => {
  // Arrange: No authorization header

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .expect(401);

  // Assert
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
});
```

#### TC006.2: 401 with invalid token
```typescript
it('should return 401 with invalid token', async () => {
  // Arrange: Invalid JWT
  const invalidToken = 'invalid.jwt.token';

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${invalidToken}`)
    .expect(401);

  // Assert
  expect(response.body.error.code).toBe('UNAUTHORIZED');
});
```

**Expected Results:** 2/2 tests passing

---

### TC007: Query Parameter Validation

**Purpose:** Verify query params are validated and have sensible defaults

**Test Cases:**

#### TC007.1: Defaults to page=0, limit=20 when not specified
```typescript
it('should use default page=0, limit=20 when not specified', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert
  expect(response.body.data.pagination.page).toBe(0);
  expect(response.body.data.pagination.limit).toBe(20);
});
```

#### TC007.2: Caps limit at 50
```typescript
it('should cap limit at maximum of 50', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act: Request limit=100 (should be capped at 50)
  const response = await request(app)
    .get('/api/v1/photos/feed?limit=100')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert
  expect(response.body.data.pagination.limit).toBe(50);
});
```

#### TC007.3: Handles negative page number
```typescript
it('should treat negative page as page 0', async () => {
  // Arrange
  const token = generateValidToken(userA._id.toString(), userA.username);

  // Act
  const response = await request(app)
    .get('/api/v1/photos/feed?page=-1')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Assert
  expect(response.body.data.pagination.page).toBe(0);
});
```

**Expected Results:** 3/3 tests passing

---

## Expected Test Summary

| Test Suite | Test Cases | Expected Pass/Fail |
|------------|------------|-------------------|
| TC001: Followed Users Only | 2 | 2 / 0 |
| TC002: Chronological Sorting | 2 | 2 / 0 |
| TC003: Pagination | 3 | 3 / 0 |
| TC004: Photo Metadata | 2 | 2 / 0 |
| TC005: Empty Feed | 1 | 1 / 0 |
| TC006: Authentication | 2 | 2 / 0 |
| TC007: Query Param Validation | 3 | 3 / 0 |
| **Total** | **15** | **15 / 0** |

---

## Acceptance Criteria Coverage

| AC | Test Suites | Coverage |
|----|-------------|----------|
| AC1: Only followed users' photos | TC001 (2 tests) | ✅ Complete |
| AC2: Chronological ordering | TC002 (2 tests) | ✅ Complete |
| AC3: Pagination support | TC003 (3 tests) | ✅ Complete |
| AC4: Photo metadata | TC004 (2 tests) | ✅ Complete |
| AC5: Empty when no follows | TC005 (1 test) | ✅ Complete |
| AC6: Authentication required | TC006 (2 tests) | ✅ Complete |

**All acceptance criteria have test coverage** ✅

---

## Test Execution Plan

1. **Setup:** Create test file with database connection and cleanup
2. **Implement:** Write all 15 test cases (TDD - these will fail initially)
3. **Run Tests:** Execute `npm test -- feed.personalized.test.ts` → expect 15 failures
4. **Implement Controller:** Create feedController.ts
5. **Run Tests Again:** Execute tests → expect 15 passes
6. **Verify:** Run full test suite to ensure no regressions

---

## Dependencies

### Required Models
- ✅ `User` model (US0001)
- ✅ `Photo` model (US0011)
- ✅ `Follow` model (US0020)

### Required Middleware
- ✅ `authenticateJWT` (US0003)

### Test Utilities
- ✅ `createTestUser()` helper
- ✅ `generateValidToken()` helper
- ✅ MongoDB test database setup/teardown

---

## Success Criteria

- [ ] All 15 tests passing
- [ ] 100% code coverage of feedController.ts
- [ ] All 6 acceptance criteria covered by tests
- [ ] Feed query performance <300ms
- [ ] No regressions in existing test suite

---

## References

- **Story:** [US0023](../stories/US0023-personalized-feed-api.md)
- **Plan:** [PL0023](../plans/PL0023-personalized-feed-api.md)
- **Epic:** [EP0005](../epics/EP0005-photo-feeds.md)
