# US0019: Follow/Unfollow User API Endpoints

> **Status:** Done
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As an** authenticated user
**I want to** follow and unfollow other users via API
**So that** I can curate my feed with content from users I'm interested in

## Acceptance Criteria

- [x] AC1: Follow user successfully (POST /users/:userId/follow)
- [x] AC2: Unfollow user successfully (DELETE /users/:userId/follow)
- [x] AC3: Duplicate follow prevention (409 Conflict)
- [x] AC4: Unfollow non-existent relationship (404 Not Found)
- [x] AC5: User not found (404 Not Found)
- [x] AC6: Self-follow prevention (400 Bad Request)
- [x] AC7: Authentication required (401 Unauthorized)

## API Endpoints

```
POST   /api/v1/users/:userId/follow   - Follow a user
DELETE /api/v1/users/:userId/follow   - Unfollow a user
```

## Test Results

- 14/14 tests passing
- 90% coverage on followController

## Dependencies

| Story | Status |
|-------|--------|
| US0003 (Auth Middleware) | Done |
| US0020 (Follow Model) | Done |

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Neildren | Initial implementation |
