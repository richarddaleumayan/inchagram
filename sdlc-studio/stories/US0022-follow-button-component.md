# US0022: Follow Button Component (Frontend)

> **Status:** Done
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Created:** 2026-01-30
> **Completed:** 2026-01-30

## User Story

**As a** user viewing another user's profile
**I want to** click a follow button to follow or unfollow that user
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
3. **Loading:** Disabled state during API call
4. **Unauthenticated:** Prompts user to log in
5. **Own Profile:** Button hidden (cannot follow yourself)

## Acceptance Criteria

- [x] Displays "Follow" or "Following" button based on state
- [x] Toggles follow state on click
- [x] Updates button text immediately (optimistic update)
- [x] Reverts on API error
- [x] Shows login prompt if not authenticated
- [x] Disabled during API call to prevent double-clicks
- [x] Hidden when viewing own profile
- [x] Accessible with keyboard navigation
- [x] Used on ProfilePage component

## Dependencies

- US0019: Follow/Unfollow User API (Done)
- US0020: Follow Model (Done)
- US0006: View User Profile API (Done)

## Technical Notes

- Use optimistic updates for better UX
- Store auth token in localStorage (matching LikeButton pattern)
- Component should be reusable
- Check if viewing own profile and hide button
- Similar implementation pattern to LikeButton component

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Claude | Story created and implementation started |
