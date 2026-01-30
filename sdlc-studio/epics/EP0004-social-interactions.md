# EP0004: Social Interactions (Likes & Follows)

> **Status:** Draft
> **Owner:** Neildren
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Target Release:** v0.1.0

## Summary

Implement core social interaction features including liking/unliking photos, following/unfollowing users, and viewing who liked a photo. This epic enables the social graph that connects users and creates engagement on inchagram.

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
|--------|------|------------|--------|
| PRD | Interactions | Likes only (no comments, reactions) | Simple interaction model |
| PRD | Privacy | All interactions are public | No privacy controls needed |
| TRD | Data Model | Like and Follow as separate collections with compound indexes | Prevent duplicate likes/follows |
| TRD | Performance | Denormalized like counts on Photo model | Fast display without aggregations |

---

## Business Context

### Problem Statement
Users need ways to show appreciation for photos (likes) and curate their feed by choosing who to follow. This creates the social network effect without the complexity of comments or reactions.

**PRD Reference:** [Like Photos](../prd.md#like-photos), [Follow Users](../prd.md#follow-users), [Unfollow Users](../prd.md#unfollow-users), [View Likes](../prd.md#view-likes)

### Value Proposition
- **Engagement:** Users can appreciate photos with simple "like" interaction
- **Curation:** Users control their feed by following photographers they enjoy
- **Discovery:** Following enables content discovery through followed users
- **Feedback:** Photographers receive positive feedback through likes
- **Simplicity:** No comments means less moderation, less toxicity

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Like/Unlike Response Time | N/A | <200ms | API response time |
| Follow/Unfollow Response Time | N/A | <200ms | API response time |
| Like Count Accuracy | N/A | 100% | Denormalized count matches actual likes |
| Duplicate Prevention | N/A | 100% | No duplicate likes/follows in DB |

---

## Scope

### In Scope
- Like a photo (authenticated users only)
- Unlike a photo (remove previous like)
- View list of users who liked a photo
- Follow a user (add to following list)
- Unfollow a user (remove from following list)
- Prevent duplicate likes (one like per user per photo)
- Prevent duplicate follows (one follow per user pair)
- Prevent self-follows
- Denormalized like count on Photo model (performance optimization)
- Like and Follow models with MongoDB schemas
- API endpoints for like/unlike, follow/unfollow, view likes

### Out of Scope
- Comments on photos - explicitly excluded from v0.1.0
- Photo reactions (beyond like) - future version
- Follow requests / private follows - future version
- Block users - future version
- Mute users - future version
- Notifications for likes/follows - future version
- Activity feed ("X liked your photo") - future version

### Affected Personas
- **Alex (Photography Enthusiast):** Uses likes to show appreciation, follows inspiring photographers
- **Taylor (Visual Curator):** Heavy follower, curates feed by following quality artists
- **Jamie (Casual Sharer):** Likes friends' photos, follows acquaintances
- **Morgan (Mindful Consumer):** Appreciates no comment pressure, mindful liking

---

## Acceptance Criteria (Epic Level)

- [ ] Authenticated users can like any photo
- [ ] Users can unlike a photo they previously liked
- [ ] Each user can like each photo only once (enforced by DB constraint)
- [ ] Like count on photo increments/decrements atomically
- [ ] Users can view list of users who liked a photo
- [ ] Authenticated users can follow any other user
- [ ] Users can unfollow a user they previously followed
- [ ] Users cannot follow themselves (validation error)
- [ ] Each user can follow each user only once (enforced by DB constraint)
- [ ] Like button shows filled state when user has liked the photo
- [ ] Follow button shows "Following" state when user follows the target user

---

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| EP0001 (User Authentication) | Epic | Draft | Richard/Mark |
| EP0003 (Photo Upload) | Epic | Draft | Richard/Mark |

**Reason:** Likes require Photo model, follows require User model, all require authentication.

### Blocking

| Item | Type | Impact |
|------|------|--------|
| EP0005 (Photo Feed) | Epic | Feed shows photos from followed users |
| EP0002 (User Profiles) | Epic | Profiles show follower/following counts |

---

## Risks & Assumptions

### Assumptions
- Denormalized like counts are acceptable (may drift, but reconcilable)
- Users won't abuse liking (no rate limiting needed in v0.1.0)
- Follow relationships are asymmetric (can follow without being followed back)
- Users accept public likes/follows (no privacy concerns)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Like count drift (denormalized) | Medium | Low | Background job to reconcile (future) |
| Race condition on like/unlike | Low | Low | Use atomic MongoDB operations |
| Performance on popular photos (many likes) | Low | Medium | Pagination for like list (20 per page) |
| Users follow/unfollow rapidly (spam) | Low | Low | Rate limiting (future) |

---

## Technical Considerations

### Architecture Impact
- Introduces Like and Follow collections (many-to-many relationships)
- Denormalization pattern for like counts (performance optimization)
- Atomic increment/decrement operations on Photo model

### Integration Points
- Photo model: likeCount field (denormalized)
- User model: Referenced by Like and Follow models
- MongoDB: Compound unique indexes to prevent duplicates
- Frontend: Like button state management, follow button state

### API Endpoints (from TRD)
- `POST /api/v1/photos/:photoId/like` - Like photo
- `DELETE /api/v1/photos/:photoId/like` - Unlike photo
- `GET /api/v1/photos/:photoId/likes` - Get users who liked photo
- `POST /api/v1/users/:userId/follow` - Follow user
- `DELETE /api/v1/users/:userId/follow` - Unfollow user
- `GET /api/v1/users/:userId/followers` - Get user's followers
- `GET /api/v1/users/:userId/following` - Get users followed by user

### Data Models (from TRD)

**Like Schema:**
```typescript
{
  userId: ObjectId (ref: User),
  photoId: ObjectId (ref: Photo),
  createdAt: Date,
  // Compound unique index on (userId, photoId)
}
```

**Follow Schema:**
```typescript
{
  followerId: ObjectId (ref: User),
  followingId: ObjectId (ref: User),
  createdAt: Date,
  // Compound unique index on (followerId, followingId)
  // Validation: followerId !== followingId
}
```

---

## Sizing

**Story Points:** 13
**Estimated Story Count:** 6-7 stories

**Complexity Factors:**
- Like/unlike logic with atomic count updates
- Follow/unfollow with duplicate prevention
- Compound unique indexes in MongoDB
- Frontend state management (like/follow button states)
- View likes list with pagination
- Frontend optimistic updates for better UX

---

## Story Breakdown

- [ ] US0016: Like/Unlike Photo API Endpoints - 2 points
- [ ] US0017: Like Model and Denormalized Count Logic - 2 points
- [ ] US0018: View Photo Likes List - 2 points
- [ ] US0019: Follow/Unfollow User API Endpoints - 2 points
- [ ] US0020: Follow Model with Self-Follow Validation - 2 points
- [ ] US0021: Like Button Component (Frontend) - 2 points
- [ ] US0022: Follow Button Component (Frontend) - 1 point

**Total Story Points:** 13
**Note:** US0021 (Like Button) is reused by US0025 (Photo Card in feeds)

---

## Test Plan

**Test Spec:** Will be created during story implementation

**Key Test Scenarios:**
- Like photo increments like count
- Unlike photo decrements like count
- User can like photo only once (duplicate rejected)
- View likes returns list of users
- Follow user creates follow relationship
- Unfollow user removes follow relationship
- User cannot follow themselves (validation error)
- User can follow user only once (duplicate rejected)
- Like button shows correct state (liked/not liked)
- Follow button shows correct state (following/not following)
- Atomic operations prevent race conditions

---

## Team Assignment Notes

**Ideal Developer Profile:**
- Full-stack or backend-focused
- Understands many-to-many relationships
- Familiar with MongoDB indexes and constraints
- Can implement optimistic UI updates (frontend)

**Conflict Avoidance:**
- Backend: `/src/routes/likes.ts`, `/src/routes/follows.ts`, `/src/models/Like.ts`, `/src/models/Follow.ts`
- Frontend: `/src/components/LikeButton.tsx`, `/src/components/FollowButton.tsx`
- Works independently from EP0003 (Photo Upload) - different domain
- Minor overlap with EP0002 (User Profiles) for follower counts - coordinate on API contracts

**Suggested Assignment:** Neildren or Ethel (full-stack, comfortable with relationships)

---

## Open Questions

- [ ] Should we denormalize follower/following counts on User model? - Owner: TBD (Decision: Not in v0.1.0, calculate on-demand)
- [ ] Pagination limit for like list? - Owner: TBD (Decision: 20 per page, matching photo feed)
- [ ] Should follow actions be reversible without confirmation? - Owner: TBD (Decision: Yes, no confirmation for simplicity)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial epic created from PRD |
