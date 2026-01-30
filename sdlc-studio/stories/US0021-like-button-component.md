# US0021: Like Button Component (Frontend)

> **Status:** Done
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Created:** 2026-01-30

## User Story

**As a** user viewing a photo
**I want to** click a like button to like or unlike a photo
**So that** I can express my appreciation for content I enjoy

## Component Specifications

### Props

```typescript
interface LikeButtonProps {
  photoId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  onLikeChange?: (isLiked: boolean, likeCount: number) => void;
}
```

### API Integration

- **Like:** POST /api/v1/photos/:photoId/like
- **Unlike:** DELETE /api/v1/photos/:photoId/like

### Visual States

1. **Not Liked:** Outlined heart icon
2. **Liked:** Filled heart icon (red)
3. **Loading:** Disabled state during API call
4. **Unauthenticated:** Prompts user to log in

## Acceptance Criteria

- [x] Displays heart icon with like count
- [x] Filled heart when user has liked the photo
- [x] Outline heart when not liked
- [x] Toggles like state on click
- [x] Updates like count immediately (optimistic update)
- [x] Reverts on API error
- [x] Shows login prompt if not authenticated
- [x] Disabled during API call to prevent double-clicks
- [x] Accessible with keyboard navigation
- [x] Reusable by US0025 (Photo Card Component)

## Test Results

- 14/14 tests passing

## Dependencies

- US0016: Like/Unlike Photo API (Done)
- US0017: Like Model (Done)

## Technical Notes

- Use optimistic updates for better UX
- Store auth token in localStorage (matching PhotoUpload pattern)
- Component should be self-contained and reusable
