# US0026: Feed Page with Infinite Scroll

> **Status:** Done
> **Completed:** 2026-01-30
> **Epic:** [EP0005: Photo Feeds](../epics/EP0005-photo-feeds.md)
> **Owner:** Richard
> **Created:** 2026-01-30

## User Story

**As a** user
**I want** to view my personalized feed with infinite scroll
**So that** I can browse photos from users I follow seamlessly

## Acceptance Criteria

### AC1: Display Feed
- Fetches from `/api/v1/photos/feed` (personalized)
- Displays PhotoCard components in vertical list
- Initial load shows 20 photos

### AC2: Infinite Scroll
- Automatically loads more photos when scrolling near bottom
- Shows loading indicator while fetching
- No duplicate photos

### AC3: Tab Navigation
- "Following" tab (personalized feed)
- "Discover" tab (discovery feed)
- Tab state persists during session

### AC4: Loading States
- Initial loading spinner
- "Loading more..." at bottom
- Pull-to-refresh on mobile

### AC5: Error Handling
- Network error display
- Retry button
- Graceful degradation

## Implementation

**Page:** `client/src/pages/FeedPage.tsx`

**Features:**
- React Query for data fetching + caching
- Intersection Observer for infinite scroll
- Tab component for Following/Discover
- PhotoCard integration (US0025)

**API Integration:**
- GET /api/v1/photos/feed (personalized)
- GET /api/v1/photos/discover (discovery)
- Pagination: ?page=0&limit=20

## Dependencies

- US0025 (PhotoCard component) ✅
- US0023 (Personalized Feed API) ✅
- US0024 (Discovery Feed API) ✅

## Test Coverage

- [ ] Fetches and displays feed
- [ ] Infinite scroll loads more
- [ ] Tab switching works
- [ ] Empty state displayed (US0027)
- [ ] Error states handled

**Estimated:** 3 points
