# Implementation Plan: US0024 - Discovery Feed API

> **Story:** [US0024: Discovery Feed API Endpoint](../stories/US0024-discovery-feed-api.md)
> **Plan ID:** PL0024
> **Created:** 2026-01-30
> **Approach:** TDD (Test-Driven Development)

## Overview

Implement public discovery feed API endpoint that returns all photos from all users, ordered chronologically. This is simpler than US0023 (Personalized Feed) as it has no Follow filtering logic.

**Key Simplification:** Copy US0023 pattern and remove Follow.find() logic - just query Photo.find({}) directly.

---

## Implementation Phases

### Phase 1: Test Specification (30 min)
Create comprehensive test spec covering all acceptance criteria.

**Output:** `sdlc-studio/test-specs/TS0024-discovery-feed-api.md`

**Test Coverage:**
- TC001-TC002: Public access + all users' photos
- TC003-TC004: Chronological sorting + pagination
- TC005-TC006: Empty feed + photo metadata
- TC007-TC009: Pagination metadata + limits + defaults
- TC010: Authenticated user access (optional)

### Phase 2: Write Tests (1.5 hours)
Implement integration tests **before** writing controller code (TDD).

**Output:** `tests/integration/feed.discovery.test.ts`

**Test Structure:**
```typescript
describe('GET /api/v1/photos/discover', () => {
  beforeEach(async () => {
    // Create 3 users (userA, userB, userC)
    // Create photos from all users (no Follow relationships needed)
  });

  describe('TC001: Public Access', () => {
    it('should allow unauthenticated access', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('TC002: All Users Photos', () => {
    it('should return photos from all users', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const usernames = res.body.data.photos.map(p => p.username);
      expect(usernames).toContain('userA');
      expect(usernames).toContain('userB');
      expect(usernames).toContain('userC');
    });
  });

  // ... TC003-TC010
});
```

**Expected Result:** All tests fail initially (no implementation yet).

### Phase 3: Implement Controller (1 hour)
Add `getDiscoveryFeed()` function to existing `src/controllers/feedController.ts`.

**Changes:**
1. Add new export function `getDiscoveryFeed()`
2. Copy US0023 `getPersonalizedFeed()` logic
3. Remove Follow.find() logic
4. Change Photo.find({ userId: { $in: followingIds } }) to Photo.find({})
5. Keep all other logic (pagination, sorting, formatting) identical

**Code:**
```typescript
export async function getDiscoveryFeed(req: Request, res: Response): Promise<void> {
  try {
    // Parse and validate query parameters (same as US0023)
    let page = parseInt(req.query.page as string) || 0;
    let limit = parseInt(req.query.limit as string) || 20;
    page = Math.max(0, page);
    limit = Math.min(Math.max(1, limit), 50);

    // Get all photos (no Follow filtering)
    const photos = await Photo.find({})
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate('userId', 'username profilePictureUrl');

    const total = await Photo.countDocuments({});

    // Format response (identical to US0023)
    const formattedPhotos = photos.map(photo => {
      const user = photo.userId as unknown as PopulatedUser;
      return {
        photoId: photo._id.toString(),
        imageUrl: photo.imageUrl,
        caption: photo.caption || '',
        userId: user._id.toString(),
        username: user.username,
        profilePictureUrl: user.profilePictureUrl || null,
        likeCount: photo.likeCount,
        createdAt: photo.createdAt
      };
    });

    const hasMore = (page + 1) * limit < total;

    res.status(200).json({
      success: true,
      data: {
        photos: formattedPhotos,
        pagination: { page, limit, total, hasMore }
      }
    });
  } catch (error: unknown) {
    console.error('Get discovery feed error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred retrieving discovery feed'
      }
    });
  }
}
```

**Reuse from US0023:**
- PopulatedUser interface (already exists)
- Pagination validation logic
- Photo formatting logic
- Error handling pattern

### Phase 4: Update Routes (15 min)
Add discovery feed route to `src/routes/photos.ts`.

**Changes:**
```typescript
import { getPersonalizedFeed, getDiscoveryFeed } from '../controllers/feedController';

// Existing routes...
router.get('/feed', authenticateJWT, getPersonalizedFeed);

// New route - PUBLIC (no authenticateJWT middleware)
router.get('/discover', getDiscoveryFeed);
```

**Important:** Place `/discover` route **before** `/:photoId` to avoid route conflict.

### Phase 5: Run Tests (10 min)
Execute test suite and verify all tests pass.

**Command:**
```bash
npm test tests/integration/feed.discovery.test.ts
```

**Expected Result:** All 10 test cases pass.

### Phase 6: Code Quality Check (15 min)
Run linter and fix any issues.

**Command:**
```bash
npm run lint
npm run lint:fix  # if needed
```

### Phase 7: Update Documentation (15 min)
Update story status and epic progress.

**Files to Update:**
1. `sdlc-studio/stories/US0024-discovery-feed-api.md` - Status: Done
2. `sdlc-studio/stories/_index.md` - Mark US0024 as Done
3. `sdlc-studio/epics/EP0005-photo-feeds.md` - Update completion (5/13 points)

---

## AC Mapping to Tests

| Acceptance Criteria | Test Cases |
|---------------------|------------|
| AC1: All users' photos | TC001, TC002 |
| AC2: Chronological order | TC003 |
| AC3: Pagination | TC004, TC007, TC009 |
| AC4: Photo metadata | TC006 |
| AC5: No auth required | TC001, TC010 |
| AC6: Empty feed | TC005 |

---

## Test Strategy

**Approach:** Test-Driven Development (TDD)
1. Write test spec first (Phase 1)
2. Write failing tests (Phase 2)
3. Implement controller to make tests pass (Phase 3)
4. Refactor if needed (Phase 4)
5. Verify all tests pass (Phase 5)

**Why TDD for this story:**
- Clear acceptance criteria map to test cases
- Simple query logic (less complex than US0023)
- Reuses US0023 pattern (proven approach)
- Fast feedback loop (tests catch bugs early)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Route conflict with /:photoId | Low | Medium | Place /discover before /:photoId |
| Performance with large dataset | Medium | Medium | Reuse existing Photo.createdAt index |
| PopulatedUser type errors | Low | Low | Reuse existing interface from US0023 |
| Test data setup complexity | Low | Low | Simpler than US0023 (no Follow data) |

---

## Definition of Done

- [x] Test spec created (TS0024)
- [ ] 10 integration tests written and passing
- [ ] getDiscoveryFeed() controller implemented
- [ ] Route added to photos.ts
- [ ] All tests pass (npm test)
- [ ] Linter clean (npm run lint)
- [ ] Story marked Done
- [ ] Epic progress updated
- [ ] Code committed and pushed

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Test Specification | 30 min | 30 min |
| Write Tests | 1.5 hours | 2 hours |
| Implement Controller | 1 hour | 3 hours |
| Update Routes | 15 min | 3.25 hours |
| Run Tests | 10 min | 3.5 hours |
| Code Quality | 15 min | 3.75 hours |
| Documentation | 15 min | 4 hours |

**Total Estimate:** 4 hours

---

## Code Reuse from US0023

To maximize efficiency, reuse these elements:
- ✅ PopulatedUser interface
- ✅ Pagination parameter validation
- ✅ Photo formatting logic
- ✅ Response structure
- ✅ Error handling pattern

**New Code:** Only the query logic changes (remove Follow filtering).

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Richard | Initial plan created |
