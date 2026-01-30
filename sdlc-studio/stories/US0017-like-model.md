# US0017: Like Model and Denormalized Count Logic

> **Status:** Done
> **Epic:** [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
> **Owner:** Neildren
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** developer implementing the like feature
**I want** a Like model with proper schema and denormalized count support
**So that** users can like photos with fast count retrieval

## Context

### Persona Reference
**Internal** - Technical foundation for like/unlike functionality. Enables:
- **Alex (Photography Enthusiast)** - Receives likes on photos, shows appreciation
- **Taylor (Visual Curator)** - Likes quality content
- **Jamie (Casual Sharer)** - Likes friends' photos
- **Morgan (Mindful Consumer)** - Appreciates without comment pressure

[Full persona details](../personas.md)

### Background
The Like model stores individual like records between users and photos. It uses a compound unique index to prevent duplicate likes. The Photo model has a denormalized `likeCount` field that will be atomically incremented/decremented by the Like/Unlike API endpoints (US0016) for fast count retrieval without aggregation queries.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| TRD | Data Model | Like as separate collection with compound index | Prevent duplicate likes |
| TRD | Performance | Denormalized like counts on Photo model | Fast display without aggregations |
| PRD | Interactions | Likes only (no comments, reactions) | Simple interaction model |

---

## Acceptance Criteria

### AC1: Like Model Schema
- **Given** the Like model is implemented
- **When** a like is created with valid userId and photoId
- **Then** the document is saved with userId, photoId, createdAt, and updatedAt fields
- **And** both userId and photoId reference valid documents

### AC2: Compound Unique Index (Duplicate Prevention)
- **Given** a like already exists from User A on Photo X
- **When** attempting to create another like from User A on Photo X
- **Then** the operation fails with a duplicate key error
- **And** the error is identifiable as a duplicate like attempt

### AC3: Timestamps
- **Given** a like is created
- **When** the document is saved
- **Then** createdAt timestamp is automatically set
- **And** updatedAt timestamp is automatically set

### AC4: Photo Model Has likeCount Field
- **Given** the Photo model exists
- **When** checking its schema
- **Then** it has a likeCount field with default value 0
- **And** likeCount has minimum value constraint of 0

---

## Scope

### In Scope
- Like Mongoose model and schema
- ILike TypeScript interface
- Compound unique index on (userId, photoId)
- Individual indexes for efficient queries
- Proper TypeScript types for all fields
- Integration tests for model validation
- Verification that Photo.likeCount exists for denormalization

### Out of Scope
- Like/Unlike API endpoints (US0016)
- Atomic increment/decrement of Photo.likeCount (US0016)
- View likes list endpoint (US0018)
- Like button frontend component (US0021)

---

## Technical Notes

**Like Model Schema (Mongoose):**
```typescript
interface ILike extends Document {
  userId: mongoose.Types.ObjectId;
  photoId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  photoId: {
    type: Schema.Types.ObjectId,
    ref: 'Photo',
    required: true,
    index: true
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate likes
likeSchema.index({ userId: 1, photoId: 1 }, { unique: true });
```

**Denormalized Count Strategy:**
- Photo model has `likeCount: Number` field (default: 0)
- Like API (US0016) will use atomic operations:
  - On like: `Photo.findByIdAndUpdate(photoId, { $inc: { likeCount: 1 } })`
  - On unlike: `Photo.findByIdAndUpdate(photoId, { $inc: { likeCount: -1 } })`

### Data Requirements
- MongoDB connection established
- User model exists (US0001 - Done)
- Photo model exists with likeCount field (US0011 - Done)

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Valid like | Create document, return success |
| Duplicate like (same user, same photo) | Reject with duplicate key error (E11000) |
| Invalid userId (not ObjectId) | Mongoose cast error |
| Invalid photoId (not ObjectId) | Mongoose cast error |
| Non-existent userId | Allow (referential integrity not enforced at model level) |
| Non-existent photoId | Allow (referential integrity not enforced at model level) |

---

## Test Scenarios

- [x] **Happy path:** Valid userId and photoId -> document created
- [x] **Duplicate prevention:** Same like pair twice -> E11000 duplicate key error
- [x] **Timestamps:** createdAt and updatedAt are set automatically
- [x] **Index verification:** Compound unique index exists on collection
- [x] **Photo likeCount field:** Photo model has likeCount with default 0

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| US0001 | User Model | User model for ObjectId references | Done |
| US0011 | Photo Model | Photo model with likeCount field | Done |

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
- Photo model already has likeCount field
- Well-understood Mongoose patterns
- Similar to US0020 (Follow model)

---

## Open Questions

- [x] Should we enforce referential integrity at model level? - Decision: No, handle at API level for performance
- [x] Is Photo.likeCount already in place? - Decision: Yes, US0011 added it

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Neildren | Initial story created |
