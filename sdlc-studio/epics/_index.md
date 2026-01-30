# Epic Registry

**Last Updated:** 2026-01-30
**PRD Reference:** [Product Requirements Document](../prd.md)
**TRD Reference:** [Technical Requirements Document](../trd.md)

## Summary

| Status | Count |
|--------|-------|
| Draft | 5 |
| Ready | 0 |
| Approved | 0 |
| In Progress | 0 |
| Done | 0 |
| **Total** | **5** |

## Epics

| ID | Title | Status | Owner | Stories | Points | Target |
|----|-------|--------|-------|---------|--------|--------|
| [EP0001](EP0001-user-authentication.md) | User Authentication & Account Management | Draft | **Richard** | 4-5 | 13 | v0.1.0 |
| [EP0002](EP0002-user-profiles.md) | User Profiles & Profile Management | Draft | **Mark** | 5-6 | 13 | v0.1.0 |
| [EP0003](EP0003-photo-management.md) | Photo Upload & Storage | Draft | **Ethel** | 4-5 | 13 | v0.1.0 |
| [EP0004](EP0004-social-interactions.md) | Social Interactions (Likes & Follows) | Draft | **Neildren** | 6-7 | 13 | v0.1.0 |
| [EP0005](EP0005-photo-feeds.md) | Photo Feeds (Personal & Discovery) | Draft | **Richard** (after EP0001) | 5-6 | 13 | v0.1.0 |

## Team Assignment Strategy

### Developers
- **Richard** - Backend specialist
- **Mark** - Backend specialist
- **Ethel** - Full-stack or frontend-focused
- **Neildren** - Full-stack or frontend-focused

### Final Epic Assignments (Confirmed 2026-01-30)

#### Phase 1: Foundation (Parallel Work)
- **Richard:** EP0001 (User Authentication) - Pure backend, foundational auth work
- **Ethel:** EP0003 (Photo Upload & Storage) - Backend-focused, S3 integration, file uploads
- **Mark:** Can start on EP0002 planning (waits for EP0001 User model)
- **Neildren:** Can start on EP0004 planning (waits for EP0001 auth + EP0003 Photo model)

**Rationale:** Richard (backend specialist) handles critical auth foundation. Ethel (full-stack) takes photo upload. Minimal conflict.

#### Phase 2: User-Facing Features (Parallel Work)
- **Mark:** EP0002 (User Profiles) - Full-stack, requires EP0001 auth + EP0003 photos for grid
- **Neildren:** EP0004 (Social Interactions) - Full-stack, requires EP0001 auth + EP0003 Photo model
- **Richard:** Supports team, starts planning EP0005 after EP0001 completion
- **Ethel:** Supports team, coordinates on shared upload component with Mark

**Rationale:** Mark and Neildren work on different domains (profiles vs social). Clear separation, minimal conflicts.

#### Phase 3: Content Consumption
- **Richard:** EP0005 (Photo Feeds) - Takes lead after completing EP0001
- **Team:** Support Richard with integration work (depends on EP0001, EP0003, EP0004)

**Rationale:** Richard takes EP0005 as he'll be first to finish (EP0001 is foundational and blocking). EP0005 integrates all previous work.

### Conflict Avoidance Guidelines

**File-Level Separation:**
- EP0001: `/src/routes/auth.ts`, `/src/models/User.ts`, `/src/middleware/auth.ts`
- EP0002: `/src/routes/users.ts`, `/src/components/Profile/**`, `/src/pages/ProfilePage.tsx`
- EP0003: `/src/routes/photos.ts`, `/src/services/s3Service.ts`, `/src/models/Photo.ts`
- EP0004: `/src/routes/likes.ts`, `/src/routes/follows.ts`, `/src/components/LikeButton.tsx`, `/src/components/FollowButton.tsx`
- EP0005: `/src/routes/feed.ts`, `/src/components/Feed/**`, `/src/pages/FeedPage.tsx`

**Shared Components (Coordinate):**
- Upload logic: EP0003 (photos) and EP0002 (profile pictures) - Mark and Ethel coordinate
- Like button: EP0004 (creation) and EP0005 (usage in feed) - Neildren and feed developer coordinate

**API Contract Communication:**
- Use TRD as source of truth for API endpoints
- Document API changes in epic files
- Coordinate in team chat before changing shared models (User, Photo)

### Dependency Graph

```
EP0001 (Auth)
  ├─> EP0002 (Profiles)
  ├─> EP0003 (Photos)
  │     ├─> EP0002 (Profiles need photos for grid)
  │     └─> EP0004 (Likes need photos)
  │           └─> EP0005 (Feed needs likes)
  └─> EP0004 (Social)
        ├─> EP0002 (Profiles show follower counts)
        └─> EP0005 (Feed needs follows)
```

**Critical Path:** EP0001 → EP0003 → EP0004 → EP0005

### Work Parallelization Opportunities (Based on Assignments)

**Week 1-2: Foundation Phase**
- **Richard:** EP0001 (User Authentication) - Critical path, no blockers
- **Ethel:** EP0003 (Photo Upload & Storage) - Can start S3 setup and schema planning
- **Mark:** EP0002 planning, frontend architecture setup
- **Neildren:** EP0004 planning, React component library setup

**Coordination Point:** Richard shares User model schema with team once defined.

**Week 3-4: Feature Development Phase**
- **Mark:** EP0002 (User Profiles) - Depends on Richard's User model, Ethel's Photo model
- **Neildren:** EP0004 (Social Interactions) - Depends on Richard's auth, Ethel's Photo model
- **Richard:** Code reviews, support team, start EP0005 planning
- **Ethel:** Complete EP0003, coordinate upload component with Mark

**Coordination Points:**
- **Ethel & Mark:** Share reusable upload component for profile pictures
- **Richard:** Provide auth middleware for protected routes

**Week 5-6: Integration Phase**
- **Richard:** EP0005 (Photo Feeds) - Lead developer
- **Team:** Support EP0005 integration, testing, bug fixes
- Final integration testing across all epics
- Polish and bug fixes

**Coordination Point:** All developers support Richard on EP0005 feed integration.

## Notes

- Epics are numbered globally (EP0001, EP0002, etc.)
- All epics target v0.1.0 release
- Total story points: 65 (13 per epic x 5 epics)
- Estimated total stories: 24-29 stories across all epics
- Stories will be generated in next phase (`/sdlc-studio story`)
- Each epic includes team assignment notes and conflict avoidance guidance
- Dependencies are clearly documented to enable parallel work

## Next Steps

1. **Assign Epics to Developers:**
   - Update "Owner" field in each epic file
   - Confirm assignments in team meeting

2. **Generate User Stories:**
   ```bash
   /sdlc-studio story
   ```
   This will create detailed user stories for each epic.

3. **Coordinate on Shared Components:**
   - Upload component (EP0003 & EP0002)
   - Like button (EP0004 & EP0005)
   - API contracts (review TRD together)

4. **Set Up Development Branches:**
   - Each developer creates feature branch: `feature/EP000X-epic-name`
   - Merge to main after epic completion and review

5. **Daily Standups:**
   - Each developer updates epic status
   - Flag blockers or conflicts early
   - Coordinate on shared components

---

**Ready to proceed?** Once epic assignments are confirmed, run `/sdlc-studio story` to generate user stories for implementation.
