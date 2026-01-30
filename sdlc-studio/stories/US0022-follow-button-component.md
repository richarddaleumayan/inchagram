# US0022: Follow Button Component (Frontend)

> **Status:** Review
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Created:** 2026-01-30

## User Story

**As a** user viewing another user's profile
**I want to** click a follow button to follow or unfollow them
**So that** I can curate my feed with content from users I'm interested in

## Component Specifications

### Props

```typescript
interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}
```

### API Integration

- **Follow:** POST /api/v1/users/:userId/follow
- **Unfollow:** DELETE /api/v1/users/:userId/follow

### Visual States

1. **Not Following:** "Follow" button (primary style)
2. **Following:** "Following" button (secondary style)
3. **Hover on Following:** "Unfollow" button (danger style)
4. **Loading:** Disabled state during API call
5. **Unauthenticated:** Prompts user to log in

## Acceptance Criteria

- [x] Displays "Follow" when not following
- [x] Displays "Following" when following
- [x] Shows "Unfollow" on hover when following
- [x] Toggles follow state on click
- [x] Optimistic update with rollback on error
- [x] Shows login prompt if not authenticated
- [x] Disabled during API call to prevent double-clicks
- [x] Accessible with keyboard navigation
- [x] Cannot follow yourself (handled by API)

## Dependencies

- US0019: Follow/Unfollow User API (Done)
- US0020: Follow Model (Done)

## Technical Notes

- Use optimistic updates for better UX
- Store auth token in localStorage
- Component should be self-contained and reusable
