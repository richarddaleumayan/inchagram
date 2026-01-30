# PL0023: Personalized Feed API Implementation Plan

> **Story:** [US0023: Personalized Feed API Endpoint](../stories/US0023-personalized-feed-api.md)
> **Epic:** [EP0005: Photo Feeds (Personal & Discovery)](../epics/EP0005-photo-feeds.md)
> **Status:** Approved
> **Created:** 2026-01-30
> **Owner:** Richard

---

## Overview

Implement GET `/api/v1/photos/feed` endpoint that returns photos from users the authenticated user follows, sorted chronologically with pagination support.

**Approach:** TDD (Test-Driven Development)
**Rationale:** Feed logic has clear input/output contracts, making it ideal for test-first development. We can define expected behaviors upfront and implement to pass tests.

---

## Current State Analysis

### Existing Code

**Models Available:**
- `User` model (US0001) ✅
- `Photo` model (US0011) ✅
- `Follow` model (US0020) ✅
- `Like` model (US0017) ✅

**Authentication:**
- `authenticateJWT` middleware (US0003) ✅

**Routes:**
- `/api/v1/photos` routes exist (upload, delete) ✅
- Need to add `/api/v1/photos/feed` ✅

**No Existing Feed Logic:**
- This is the first feed endpoint
- No feed controller exists yet

---

## Implementation Approach

### Architecture Decision

**Feed Controller Pattern** - Create dedicated `feedController.ts` for feed-related endpoints:

Benefits:
- Separation of concerns (feed logic separate from photo CRUD)
- Easy to extend with discovery feed (US0024)
- Clear ownership of feed-specific business logic

**Query Strategy:**
1. Get followingIds from Follow collection
2. Query Photos where userId in followingIds
3. Sort by createdAt descending
4. Apply pagination (skip/limit)
5. Populate user data for each photo

---

## Files to Create/Modify

### 1. Create `src/controllers/feedController.ts` (NEW)

**Exports:**
- `getPersonalizedFeed(req: AuthRequest, res: Response): Promise<void>`

**Logic:**
- Extract userId from req.user (authenticated)
- Parse page/limit from query params with defaults and validation
- Query Follow model for followingIds
- Query Photo model filtered by followingIds, sorted, paginated
- Populate userId with username and profilePictureUrl
- Format response with photos array and pagination metadata

### 2. Update `src/routes/photos.ts`

**Changes:**
- Import `getPersonalizedFeed` from feedController
- Add route: `router.get('/feed', authenticateJWT, getPersonalizedFeed)`

### 3. Create `tests/integration/feed.personalized.test.ts` (NEW)

**Test Suites:**
- TC001: Feed shows photos from followed users
- TC002: Photos sorted chronologically
- TC003: Pagination works correctly
- TC004: Does not show non-followed users' photos
- TC005: Empty array when not following anyone
- TC006: 401 when not authenticated
- TC007: Photo metadata complete
- TC008: Pagination metadata correct
- TC009: Limit capping works
- TC010: Default params work

**Expected Test Count:** ~10 tests

---

## Test Strategy

### Integration Tests

**Test File:** `tests/integration/feed.personalized.test.ts`

**Setup:**
- Create 3 test users (userA, userB, userC)
- userA follows userB and userC
- userB posts 5 photos
- userC posts 3 photos
- Create another userD (not followed by userA) who posts 2 photos

**Test Scenarios:**

#### TC001: Feed Shows Photos from Followed Users
```typescript
it('should return photos only from followed users', async () => {
  const token = generateValidToken(userA._id, userA.username);

  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(response.body.success).toBe(true);
  expect(response.body.data.photos).toHaveLength(8); // 5 from userB + 3 from userC

  // Verify no photos from userD (not followed)
  const userDPhotos = response.body.data.photos.filter(
    (p: any) => p.userId === userD._id.toString()
  );
  expect(userDPhotos).toHaveLength(0);
});
```

#### TC002: Photos Sorted Chronologically
```typescript
it('should return photos sorted by createdAt descending', async () => {
  // Photos created with specific timestamps
  const token = generateValidToken(userA._id, userA.username);

  const response = await request(app)
    .get('/api/v1/photos/feed')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const photos = response.body.data.photos;

  // Verify each photo is older than or equal to the previous
  for (let i = 1; i < photos.length; i++) {
    const prev = new Date(photos[i - 1].createdAt);
    const curr = new Date(photos[i].createdAt);
    expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
  }
});
```

#### TC003: Pagination Works Correctly
```typescript
it('should paginate results correctly', async () => {
  const token = generateValidToken(userA._id, userA.username);

  // Get first page (limit=3)
  const page0 = await request(app)
    .get('/api/v1/photos/feed?page=0&limit=3')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(page0.body.data.photos).toHaveLength(3);
  expect(page0.body.data.pagination.hasMore).toBe(true);

  // Get second page
  const page1 = await request(app)
    .get('/api/v1/photos/feed?page=1&limit=3')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(page1.body.data.photos).toHaveLength(3);

  // Verify no overlap
  const page0Ids = page0.body.data.photos.map((p: any) => p.photoId);
  const page1Ids = page1.body.data.photos.map((p: any) => p.photoId);
  const overlap = page0Ids.filter((id: string) => page1Ids.includes(id));
  expect(overlap).toHaveLength(0);
});
```

---

## Implementation Phases

### Phase 1: Setup and Structure (30 min)

**Tasks:**
1. Create `src/controllers/feedController.ts` with function signature
2. Update `src/routes/photos.ts` with new route
3. Set up test file structure

**Files:**
- NEW: `src/controllers/feedController.ts`
- MODIFY: `src/routes/photos.ts`
- NEW: `tests/integration/feed.personalized.test.ts`

### Phase 2: Write Tests (TDD) (3 hours)

**Tasks:**
1. Create test utilities (helper functions for creating users, photos, follows)
2. Write TC001-TC010 tests (all 10 test cases)
3. Run tests → expect all to fail initially

**Files:**
- MODIFY: `tests/integration/feed.personalized.test.ts`

### Phase 3: Implement Feed Controller (2 hours)

**Tasks:**
1. Implement `getPersonalizedFeed` function
2. Add query param parsing with validation
3. Implement Follow lookup logic
4. Implement Photo query with filtering, sorting, pagination
5. Add user population
6. Format response with photos + pagination metadata

**Files:**
- MODIFY: `src/controllers/feedController.ts`

### Phase 4: Test and Refine (1 hour)

**Tasks:**
1. Run tests → verify all pass
2. Test edge cases manually (no follows, large limits, etc.)
3. Verify response format matches spec
4. Check performance with larger datasets

### Phase 5: Performance Verification (1 hour)

**Tasks:**
1. Verify MongoDB indexes exist on Photo.createdAt, Photo.userId
2. Test query performance with >100 photos
3. Ensure feed loads in <300ms (p95)

---

## Acceptance Criteria Mapping

| AC | Implementation | Tests |
|----|----------------|-------|
| AC1: Only followed users' photos | Follow query → Photo filter | TC001, TC004 |
| AC2: Chronological ordering | .sort({ createdAt: -1 }) | TC002 |
| AC3: Pagination support | .skip().limit() | TC003, TC009, TC010 |
| AC4: Photo metadata | Response formatting + populate | TC007 |
| AC5: Empty when no follows | Handle empty followingIds | TC005 |
| AC6: Authentication required | authenticateJWT middleware | TC006 |

---

## Dependencies

### Prerequisites
- ✅ User model (US0001)
- ✅ Photo model (US0011)
- ✅ Follow model (US0020)
- ✅ authenticateJWT middleware (US0003)

### Blocked By
- None

### Blocking
- US0024: Discovery Feed API (uses similar pattern)
- US0026: Feed Page with Infinite Scroll (consumes this API)

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Slow queries with many follows | High | Medium | Ensure indexes, test with 100+ follows |
| Memory issues with large limits | Medium | Low | Cap limit at 50, use cursor pagination if needed later |
| N+1 query problem | High | Low | Use populate() to avoid separate user queries |
| Empty feed confusion | Low | Medium | Clear empty state message in frontend (US0027) |

---

## Success Criteria

- [ ] All 10 integration tests passing
- [ ] Feed returns correct photos for authenticated user
- [ ] Photos sorted newest first
- [ ] Pagination works correctly
- [ ] Response format matches specification
- [ ] Query performance <300ms for 20 photos
- [ ] No existing tests broken

---

## Code Review Checklist

- [ ] Feed query uses proper MongoDB operators
- [ ] Pagination math correct (skip = page * limit)
- [ ] Limit capped at reasonable max (50)
- [ ] User data populated correctly
- [ ] Response format consistent with other endpoints
- [ ] Error handling for edge cases
- [ ] TypeScript types correct (AuthRequest)
- [ ] No sensitive data exposed (passwords, etc.)

---

## Estimated Effort

**Total Story Points:** 3
**Estimated Time:** 7 hours

**Breakdown:**
- Phase 1 (Setup): 30 min
- Phase 2 (Tests): 3 hours
- Phase 3 (Implementation): 2 hours
- Phase 4 (Testing): 1 hour
- Phase 5 (Performance): 30 min

---

## Next Steps After Implementation

1. Update story status: In Progress → Review → Done
2. Update epic progress: EP0005 3/13 points complete
3. Prepare for US0024: Discovery Feed API (similar pattern)
4. Frontend team can start US0026: Feed Page component

---

## References

- **Story:** [US0023](../stories/US0023-personalized-feed-api.md)
- **Epic:** [EP0005](../epics/EP0005-photo-feeds.md)
- **Related Files:**
  - `src/models/Photo.ts` - Photo model
  - `src/models/Follow.ts` - Follow model
  - `src/middleware/authMiddleware.ts` - Authentication
  - `src/routes/photos.ts` - Photo routes
