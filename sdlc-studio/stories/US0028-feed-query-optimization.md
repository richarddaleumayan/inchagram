# US0028: Feed Query Optimization

> **Status:** Done
> **Completed:** 2026-01-30
> **Epic:** [EP0005: Photo Feeds](../epics/EP0005-photo-feeds.md)
> **Owner:** Richard
> **Created:** 2026-01-30

## User Story

**As a** system
**I want** optimized database queries for feed endpoints
**So that** feeds load quickly even with many photos and follows

## Acceptance Criteria

### AC1: Database Indexes
- Compound index on Photo: (userId, createdAt DESC)
- Index on Photo: (createdAt DESC) for discovery feed
- Index on Follow: (followerId, followingId)
- Verified via MongoDB explain()

### AC2: Query Performance
- Personalized feed query < 100ms (p95)
- Discovery feed query < 100ms (p95)
- Tested with 1000+ photos, 100+ follows

### AC3: Pagination Efficiency
- Use skip/limit efficiently
- Consider cursor-based pagination for future
- Document trade-offs

### AC4: Populate Optimization
- Only populate required fields (username, profilePictureUrl)
- No over-fetching
- Lean queries where possible

## Implementation

**Files:**
- `src/models/Photo.ts` - Add indexes
- `src/models/Follow.ts` - Add indexes
- `src/controllers/feedController.ts` - Optimize queries

**Index Strategy:**
```typescript
// Photo model
photoSchema.index({ userId: 1, createdAt: -1 }); // Personalized feed
photoSchema.index({ createdAt: -1 }); // Discovery feed (already exists)

// Follow model
followSchema.index({ followerId: 1, followingId: 1 }); // Already exists (unique)
followSchema.index({ followerId: 1 }); // Follow lookups
```

**Query Optimization:**
- Use `.lean()` where possible (no Mongoose docs overhead)
- Project only needed fields
- Batch queries efficiently

## Dependencies

- US0023 (Personalized Feed API) ✅
- US0024 (Discovery Feed API) ✅

## Test Coverage

- [ ] Indexes created successfully
- [ ] Query performance meets targets
- [ ] Explain plans show index usage
- [ ] No regression in functionality

**Estimated:** 2 points
