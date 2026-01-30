# US0020: Follow Model with Self-Follow Validation

> **Status:** Done
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** developer implementing the follow feature
**I want** a Follow model with proper schema and validation
**So that** users can follow each other without duplicates or self-follows

## Context

### Persona Reference
**Internal** - Technical foundation for follow/unfollow functionality. Enables:
- **Taylor (Visual Curator)** - Heavy follower, curates feed by following quality artists
- **Alex (Photography Enthusiast)** - Follows inspiring photographers
- **Jamie (Casual Sharer)** - Follows friends and acquaintances

[Full persona details](../personas.md)

### Background
The Follow model is a core schema that enables social graph relationships between users. It stores who follows whom with proper constraints to prevent duplicate follows and self-follows. This model is used by follow/unfollow API endpoints (US0019) and the personalized feed (US0023).

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| TRD | Data Model | Follow as separate collection with compound index | Prevent duplicate follows |
| TRD | Validation | followerId !== followingId | User cannot follow themselves |
| PRD | Privacy | All follows are public | No privacy controls needed |

---

## Acceptance Criteria

### AC1: Follow Model Schema
- **Given** the Follow model is implemented
- **When** a follow relationship is created with valid followerId and followingId
- **Then** the document is saved with followerId, followingId, createdAt, and updatedAt fields
- **And** both followerId and followingId reference valid User documents

### AC2: Compound Unique Index (Duplicate Prevention)
- **Given** a follow relationship already exists between User A and User B
- **When** attempting to create another follow from User A to User B
- **Then** the operation fails with a duplicate key error
- **And** the error is identifiable as a duplicate follow attempt

### AC3: Self-Follow Validation
- **Given** a user attempts to follow themselves
- **When** creating a follow document where followerId === followingId
- **Then** the operation fails with a validation error
- **And** the error message indicates self-follow is not allowed

### AC4: Timestamps
- **Given** a follow relationship is created
- **When** the document is saved
- **Then** createdAt timestamp is automatically set
- **And** updatedAt timestamp is automatically set

---

## Scope

### In Scope
- Follow Mongoose model and schema
- IFollow TypeScript interface
- Compound unique index on (followerId, followingId)
- Pre-save validation hook for self-follow prevention
- Proper TypeScript types for all fields
- Integration tests for model validation

### Out of Scope
- Follow/Unfollow API endpoints (US0019)
- Follower/Following counts on User model (calculated on-demand)
- Follow button frontend component (US0022)
- Follow requests/approval flow (future version)
- Block/Mute functionality (future version)

---

## Technical Notes

**Follow Model Schema (Mongoose):**
```typescript
interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const followSchema = new Schema({
  followerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  followingId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Pre-save validation to prevent self-follows
followSchema.pre('save', function(next) {
  if (this.followerId.equals(this.followingId)) {
    return next(new Error('Users cannot follow themselves'));
  }
  next();
});
```

### Data Requirements
- MongoDB connection established
- User model exists (US0001 - Done)
- Follows collection with compound unique index on (followerId, followingId)

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Valid follow relationship | Create document, return success |
| Duplicate follow (exact same pair) | Reject with duplicate key error (E11000) |
| Self-follow attempt | Reject with validation error before save |
| Invalid followerId (not ObjectId) | Mongoose cast error |
| Invalid followingId (not ObjectId) | Mongoose cast error |
| Non-existent followerId | Allow (referential integrity not enforced at model level) |
| Non-existent followingId | Allow (referential integrity not enforced at model level) |

---

## Test Scenarios

- [x] **Happy path:** Valid followerId and followingId → document created
- [x] **Duplicate prevention:** Same follow pair twice → E11000 duplicate key error
- [x] **Self-follow prevention:** followerId === followingId → validation error
- [x] **Timestamps:** createdAt and updatedAt are set automatically
- [x] **Index verification:** Compound unique index exists on collection

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| US0001 | User Model | User model for ObjectId references | Done |

### External Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| MongoDB | Database | Required - must be running |
| Mongoose | ODM | Required - installed |

---

## Estimation

**Story Points:** 2
**Complexity:** Low

**Rationale:**
- Simple schema with two ObjectId references
- Standard compound unique index
- Pre-save hook for validation
- Well-understood Mongoose patterns

---

## Open Questions

- [x] Should we enforce referential integrity at model level? - Decision: No, handle at API level for performance
- [x] Should we denormalize follower/following counts on User? - Decision: No for v0.1.0, calculate on-demand

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Neildren | Initial story created |
