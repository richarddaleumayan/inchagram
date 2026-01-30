# US0027: Feed Empty State Handling

> **Status:** Done
> **Completed:** 2026-01-30
> **Epic:** [EP0005: Photo Feeds](../epics/EP0005-photo-feeds.md)
> **Owner:** Richard
> **Created:** 2026-01-30

## User Story

**As a** user viewing an empty feed
**I want** to see helpful guidance
**So that** I understand why the feed is empty and what to do next

## Acceptance Criteria

### AC1: Personalized Feed Empty State
- Shown when following 0 users
- Message: "Your feed is empty. Follow users to see their photos here."
- "Discover" button navigates to discovery tab
- Friendly illustration/icon

### AC2: Discovery Feed Empty State
- Shown when no photos exist globally
- Message: "No photos yet. Be the first to upload!"
- "Upload Photo" button navigates to upload page
- Only shown if truly empty (rare case)

### AC3: No More Photos State
- Shown at bottom when all photos loaded
- Message: "You're all caught up!"
- Subtle, not prominent

## Implementation

**Component:** `client/src/components/EmptyState.tsx`

**Props:**
```typescript
interface EmptyStateProps {
  type: 'no-following' | 'no-photos' | 'all-caught-up';
  onAction?: () => void;
}
```

**Integrated into:** FeedPage component (US0026)

## Dependencies

- US0026 (Feed Page) required

## Test Coverage

- [ ] Shows correct message for each type
- [ ] Action buttons work
- [ ] Responsive design

**Estimated:** 1 point
