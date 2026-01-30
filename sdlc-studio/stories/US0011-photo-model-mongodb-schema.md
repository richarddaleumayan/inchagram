# US0011: Photo Model and MongoDB Schema

> **Status:** Done
> **Epic:** [EP0003: Photo Upload & Storage](../epics/EP0003-photo-management.md)
> **Owner:** Ethel
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** developer building photo features
**I want** a Photo model with MongoDB schema
**So that** photos can be stored with proper structure, validation, and indexes for efficient queries

## Context

### Persona Reference
**All Personas** - Foundation for all photo-related features. Enables:
- **Alex (Photography Enthusiast)** - Uploading high-quality photos
- **Jamie (Casual Sharer)** - Simple photo sharing
- **Morgan (Mindful Consumer)** - Viewing photos in feeds

[Full persona details](../personas.md)

### Background
The Photo model is the foundational data structure for photo storage in inchagram. It defines the schema for storing photo metadata (URL, caption, like count) and establishes indexes for efficient querying (user photos, feed sorting). This is schema-only work with no API endpoints.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Metadata | Photos are public, optional captions (max 2200 chars) | Caption field optional with max validation |
| TRD | Tech Stack | TypeScript, MongoDB, Mongoose | Use Mongoose schema with TypeScript interface |
| TRD | Storage | S3 URLs stored in imageUrl field | imageUrl is required string field |

---

## Acceptance Criteria

### AC1: Photo Schema Fields
- **Given** the Photo model is defined
- **When** a photo document is created
- **Then** it must include: userId (ObjectId ref to User), imageUrl (required string), caption (optional string), likeCount (number, default 0)
- **And** timestamps (createdAt, updatedAt) are auto-generated

### AC2: Caption Validation
- **Given** a photo is created with a caption
- **When** the caption exceeds 2200 characters
- **Then** validation fails with appropriate error message
- **And** captions up to 2200 characters are accepted

### AC3: likeCount Constraints
- **Given** a photo is created
- **When** no likeCount is provided
- **Then** it defaults to 0
- **And** negative values are rejected with validation error

### AC4: User Reference
- **Given** a photo is created with a userId
- **When** the userId is a valid ObjectId
- **Then** the photo can be populated with user data
- **And** queries can efficiently filter by userId

### AC5: Database Indexes
- **Given** the Photo collection exists
- **When** indexes are checked
- **Then** compound index on (userId, createdAt) exists for user photo queries
- **And** index on createdAt exists for feed sorting

### AC6: TypeScript Interface
- **Given** the Photo model is imported
- **When** used in TypeScript code
- **Then** IPhoto interface provides type safety
- **And** all fields are properly typed

---

## Scope

### In Scope
- Photo Mongoose schema definition
- IPhoto TypeScript interface
- Field validations (required, maxlength, min)
- Default values (likeCount: 0, caption: '')
- Database indexes for efficient queries
- User reference (ObjectId with ref)
- Automatic timestamps
- Unit/integration tests for model

### Out of Scope
- API endpoints (US0012)
- S3 upload logic (US0012)
- File validation (US0013)
- Photo deletion (US0014)
- Frontend components (US0015)

---

## Technical Notes

**Photo Model Schema (Mongoose):**
```typescript
export interface IPhoto extends Document {
  userId: Types.ObjectId;
  imageUrl: string;
  caption?: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    caption: {
      type: String,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      trim: true,
      default: ''
    },
    likeCount: {
      type: Number,
      default: 0,
      min: [0, 'Like count cannot be negative']
    }
  },
  {
    timestamps: true,
    collection: 'photos'
  }
);

// Indexes
photoSchema.index({ userId: 1, createdAt: -1 }); // User's photos sorted by date
photoSchema.index({ createdAt: -1 }); // Discovery feed sorted by date
```

### Data Requirements
- MongoDB connection established
- User model exists (for reference)

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Missing userId | Validation error: "User ID is required" |
| Missing imageUrl | Validation error: "Image URL is required" |
| Empty imageUrl string | Validation error: "Image URL is required" |
| Caption exactly 2200 chars | Accept |
| Caption 2201+ chars | Validation error: "Caption cannot exceed 2200 characters" |
| Negative likeCount | Validation error: "Like count cannot be negative" |
| Whitespace in caption | Trimmed automatically |
| Whitespace in imageUrl | Trimmed automatically |

---

## Test Scenarios

- [x] **TC001:** Create photo with valid userId and imageUrl
- [x] **TC002:** Reject photo without userId
- [x] **TC003:** Reject photo without imageUrl
- [x] **TC004:** Caption is optional (default empty string)
- [x] **TC005:** Accept caption at 2200 chars, reject at 2201
- [x] **TC006:** likeCount defaults to 0
- [x] **TC007:** Reject negative likeCount
- [x] **TC008:** Timestamps auto-generated
- [x] **TC009:** User reference can be populated
- [x] **TC010:** Multiple photos per user allowed
- [x] **TC011:** Query by userId works
- [x] **TC012:** Query sorted by createdAt works
- [x] **TC013:** Caption trimming
- [x] **TC014:** ImageUrl trimming
- [x] **TC015:** Photo deletion
- [x] **TC016:** Index verification
- [x] **TC017:** Collection name is "photos"

**Test Results:** 24/24 tests passing, 100% coverage

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| US0001 | Blocked-by | User model exists | Done |

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
- Straightforward schema definition
- Standard Mongoose patterns
- Clear requirements from epic
- No external integrations

---

## Implementation Summary

**Files Created:**
- `src/models/Photo.ts` - Photo Mongoose model and schema
- `tests/integration/photo.model.test.ts` - Integration tests (24 tests)

**Key Features:**
- TypeScript interface (IPhoto) for type safety
- Comprehensive field validation
- Automatic timestamps
- Compound indexes for efficient queries
- User reference with populate support
- 100% test coverage

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Ethel | Initial story created |
| 2026-01-30 | Ethel | Implementation complete - 24/24 tests passing |
