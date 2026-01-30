# US0025: Photo Card Component for Feeds

> **Status:** Done
> **Completed:** 2026-01-30
> **Epic:** [EP0005: Photo Feeds](../epics/EP0005-photo-feeds.md)
> **Owner:** Richard
> **Created:** 2026-01-30

## User Story

**As a** user viewing the feed
**I want** to see photo cards with image, username, caption, and like button
**So that** I can browse content and interact with photos

## Acceptance Criteria

### AC1: Display Photo Image
- Photo displays at consistent width (600px max)
- Aspect ratio preserved
- Lazy loading for performance

### AC2: Display User Information
- Username displayed above image
- Profile picture (if available)
- Clickable to navigate to user profile

### AC3: Display Caption
- Caption shown below image
- Truncated if > 200 characters with "... more"
- Full caption on click

### AC4: Display Metadata
- Like count displayed
- Timestamp (e.g., "2 hours ago")

### AC5: Integrate Like Button
- Uses existing LikeButton component (US0021)
- Updates like count on success
- Optimistic UI updates

### AC6: Responsive Design
- Works on mobile (320px+) and desktop
- Touch-friendly tap targets

## Implementation

**Component:** `client/src/components/PhotoCard.tsx`

**Props:**
```typescript
interface PhotoCardProps {
  photoId: string;
  imageUrl: string;
  caption: string;
  username: string;
  userId: string;
  profilePictureUrl?: string | null;
  likeCount: number;
  createdAt: string;
  isLiked?: boolean;
  onLike?: (photoId: string) => void;
  onUnlike?: (photoId: string) => void;
}
```

**Key Dependencies:**
- LikeButton component (US0021) ✅
- React Router for navigation
- date-fns for timestamp formatting

## Test Coverage

- [ ] Renders all photo data correctly
- [ ] Truncates long captions
- [ ] Like button integration works
- [ ] Navigation to profile works
- [ ] Responsive on mobile/desktop

**Estimated:** 2 points
