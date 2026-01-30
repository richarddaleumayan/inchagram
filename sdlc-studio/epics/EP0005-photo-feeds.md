# EP0005: Photo Feeds (Personal & Discovery)

> **Status:** Draft
> **Owner:** Richard (after completing EP0001)
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Target Release:** v0.1.0

## Summary

Implement photo feed functionality including personalized feed (photos from followed users) and discovery feed (all public photos). This epic creates the core browsing experience that keeps users engaged on inchagram.

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
|--------|------|------------|--------|
| PRD | Algorithm | Chronological feed only (no algorithmic ranking) | Simple, predictable ordering |
| PRD | Performance | Feed load time <1s for initial 20 photos | Efficient queries, pagination required |
| TRD | Architecture | React frontend, infinite scroll pattern | Frontend state management for feed |
| TRD | Data | MongoDB indexes on createdAt for fast sorting | Query optimization needed |

---

## Business Context

### Problem Statement
Users need an engaging way to discover and consume photography content. The personalized feed shows photos from users they follow (curated experience), while the discovery feed helps users find new photographers and content.

**PRD Reference:** [Photo Feed](../prd.md#photo-feed), [Discovery Feed](../prd.md#discovery-feed)

### Value Proposition
- **Curation:** Personalized feed shows only photos from followed users
- **Control:** Users curate their feed through follow/unfollow decisions
- **Chronological:** Predictable, non-algorithmic ordering (newest first)
- **Discovery:** Discovery feed surfaces photos from all users
- **Simplicity:** No complex ranking algorithms or engagement optimization

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Feed Load Time (initial 20 photos) | N/A | <1s | Frontend + backend response time |
| Feed Query Performance (p95) | N/A | <300ms | MongoDB query execution time |
| Infinite Scroll Smoothness | N/A | No jank | Frontend rendering performance |
| Discovery Feed Diversity | N/A | >50 unique users in first 100 photos | Photo author distribution |

---

## Scope

### In Scope
- Personalized feed: photos from users you follow, chronological order
- Discovery feed: all public photos, chronological order
- Pagination/infinite scroll (load more photos)
- Photo cards displaying: image, uploader, caption, like count, timestamp
- Like button on feed photos (integrated with EP0004)
- Navigate to photo detail view (full-size)
- Navigate to uploader's profile
- Empty state when not following anyone (personalized feed)
- Frontend feed components (FeedPage, PhotoCard, InfiniteScroll)

### Out of Scope
- Algorithmic ranking / personalized recommendations - future version
- Trending photos / popular feed - future version
- Following feed (mix of personal + discovery) - future version
- Filter feed by user, date, or other criteria - future version
- Search photos by caption or user - future version
- Saved photos / bookmarks - future version
- Feed customization (hide certain users) - future version

### Affected Personas
- **Alex (Photography Enthusiast):** Uses personalized feed to see work from followed photographers
- **Taylor (Visual Curator):** Heavy feed user, curates through follows, uses discovery to find new artists
- **Morgan (Mindful Consumer):** Appreciates chronological feed, checks intentionally
- **Jamie (Casual Sharer):** Scrolls feed to see friends' photos

---

## Acceptance Criteria (Epic Level)

- [ ] Personalized feed shows photos from users the authenticated user follows
- [ ] Discovery feed shows all public photos regardless of follows
- [ ] Both feeds display photos in reverse chronological order (newest first)
- [ ] Feeds load 20 photos initially, then load more on scroll (pagination)
- [ ] Photo cards display: image, uploader username, caption, like count, timestamp
- [ ] Like button on photo cards works (integrated with EP0004)
- [ ] Clicking photo navigates to photo detail view
- [ ] Clicking username navigates to uploader's profile
- [ ] Personalized feed shows empty state when not following anyone
- [ ] Feed scrolling is smooth (no performance issues)

---

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| EP0001 (User Authentication) | Epic | Draft | Richard/Mark |
| EP0003 (Photo Upload) | Epic | Draft | Richard/Mark |
| EP0004 (Social Interactions) | Epic | Draft | Neildren/Ethel |

**Reason:** Feed requires Photo model, Follow relationships, and authentication. Like button requires EP0004 API.

### Blocking

| Item | Type | Impact |
|------|------|--------|
| None | N/A | This is a consumer epic (no downstream dependencies) |

---

## Risks & Assumptions

### Assumptions
- Chronological ordering is acceptable (users don't need algorithmic ranking)
- 20 photos per page is reasonable batch size
- Users with thousands of followed users will still get fast queries
- Discovery feed doesn't need content moderation in v0.1.0

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Feed queries slow for users following many accounts | Medium | High | Use indexed queries, cursor-based pagination |
| Discovery feed shows inappropriate content | Low | Medium | Defer moderation to v0.2.0, rely on community standards |
| Infinite scroll memory leaks | Low | Medium | Virtual scrolling (react-window) if needed |
| Feed photos load slowly | Medium | Medium | Lazy loading, progressive image rendering |

---

## Technical Considerations

### Architecture Impact
- Establishes feed as primary content consumption pattern
- Requires efficient MongoDB queries with joins (follows → photos)
- Frontend infinite scroll state management

### Integration Points
- Photo model: Source of feed content
- Follow model: Determines personalized feed content
- Like model: Shows like status on feed photos
- User model: Display uploader username
- React Query: Feed data caching and pagination
- React: Feed components, infinite scroll

### API Endpoints (from TRD)
- `GET /api/v1/photos/feed` - Personalized feed (authenticated)
  - Query params: `?page=1&limit=20`
- `GET /api/v1/photos/discover` - Discovery feed (public)
  - Query params: `?page=1&limit=20`

### Feed Query Logic

**Personalized Feed:**
```typescript
// 1. Get followingIds for authenticated user
const follows = await Follow.find({ followerId: userId });
const followingIds = follows.map(f => f.followingId);

// 2. Get photos from followed users, sorted by createdAt desc
const photos = await Photo.find({ userId: { $in: followingIds } })
  .sort({ createdAt: -1 })
  .skip(page * limit)
  .limit(limit)
  .populate('userId', 'username profilePictureUrl');
```

**Discovery Feed:**
```typescript
// Get all photos, sorted by createdAt desc
const photos = await Photo.find({})
  .sort({ createdAt: -1 })
  .skip(page * limit)
  .limit(limit)
  .populate('userId', 'username profilePictureUrl');
```

---

## Sizing

**Story Points:** 13
**Estimated Story Count:** 5-6 stories

**Complexity Factors:**
- Efficient feed queries (joins, pagination)
- Infinite scroll implementation
- Photo card component with like integration
- Feed state management (loading, error, empty states)
- Performance optimization for large feeds

---

## Story Breakdown

- [x] [US0023: Personalized Feed API Endpoint](../stories/US0023-personalized-feed-api.md) - 3 points - **Done**
- [x] [US0024: Discovery Feed API Endpoint](../stories/US0024-discovery-feed-api.md) - 2 points - **Done**
- [x] [US0025: Photo Card Component for Feeds](../stories/US0025-photo-card-component.md) - 2 points - **Done**
- [x] [US0026: Feed Page with Infinite Scroll](../stories/US0026-feed-page-infinite-scroll.md) - 3 points - **Done**
- [x] [US0027: Feed Empty State Handling](../stories/US0027-feed-empty-state.md) - 1 point - **Done**
- [x] [US0028: Feed Query Optimization](../stories/US0028-feed-query-optimization.md) - 2 points - **Done**

**Total Story Points:** 13
**Completed:** 13/13 points (100%)

**Note:** Depends on US0011 (Photo model), US0017 (Like model), US0020 (Follow model), US0021 (Like button)

---

## Test Plan

**Test Spec:** Will be created during story implementation

**Key Test Scenarios:**
- Personalized feed shows only photos from followed users
- Discovery feed shows all photos
- Feeds are ordered chronologically (newest first)
- Pagination loads next batch correctly
- Empty state shown when not following anyone
- Photo card displays all required data
- Like button on feed works correctly
- Navigation to photo detail works
- Navigation to profile works
- Feed query performance <300ms

---

## Team Assignment Notes

**Ideal Developer Profile:**
- Full-stack or frontend-focused
- Comfortable with React and state management
- Understands pagination and infinite scroll
- Can optimize database queries

**Conflict Avoidance:**
- Backend: `/src/routes/feed.ts`, `/src/controllers/feedController.ts`
- Frontend: `/src/pages/FeedPage.tsx`, `/src/components/Feed/PhotoCard.tsx`, `/src/hooks/useFeed.ts`
- Depends on EP0003, EP0004 completing first (uses Photo, Like, Follow models)
- Can work in parallel with EP0002 (User Profiles) - different UI components
- Coordinate with EP0004 developer on Like button API contracts

**Suggested Assignment:** Any developer (coordinate based on workload and dependencies)

---

## Open Questions

- [ ] Should we use cursor-based pagination or offset-based? - Owner: TBD (Decision: Offset-based for simplicity in v0.1.0)
- [ ] How to handle deleted photos in feed? - Owner: TBD (Decision: Photos hard deleted, removed from feed)
- [ ] Should discovery feed prioritize recent photos from diverse users? - Owner: TBD (Decision: Purely chronological for v0.1.0)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial epic created from PRD |
