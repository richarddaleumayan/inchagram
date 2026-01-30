# US0012: Photo Upload API with S3 Integration

> **Status:** Done
> **Epic:** [EP0003: Photo Upload & Storage](../epics/EP0003-photo-management.md)
> **Owner:** Ethel
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** authenticated user
**I want** to upload photos via API with S3 storage
**So that** I can share my photos on inchagram

## Context

### Persona Reference
**Alex (Photography Enthusiast)** - Primary user uploading high-quality photos
**Jamie (Casual Sharer)** - Needs simple photo upload flow

[Full persona details](../personas.md)

### Background
Photo upload is the core feature of inchagram. This API endpoint handles photo uploads with AWS S3 storage, file validation, and metadata persistence to MongoDB. The S3 upload service is reusable and will be used by profile picture uploads (US0009).

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | File Limits | Max 10MB, JPEG/PNG/WebP only | Use US0013 validation |
| PRD | Storage | AWS S3 for photo files | Integrate S3 SDK |
| PRD | Auth | Upload requires authentication | Use US0003 auth middleware |
| TRD | Upload | Multer for multipart/form-data | Configure Multer middleware |

---

## Acceptance Criteria

### AC1: Upload Valid Photo Files
- **Given** an authenticated user uploads a JPEG, PNG, or WebP file under 10MB
- **When** POST request to `/api/v1/photos` with multipart/form-data
- **Then** file is uploaded to S3 with key: `photos/{userId}/{timestamp}-{uuid}.{ext}`
- **And** photo metadata saved to MongoDB with imageUrl, userId, caption, likeCount=0
- **And** returns 201 with photo ID, imageUrl, caption, likeCount, createdAt

### AC2: File Validation Integration
- **Given** a user uploads an invalid file (wrong type/size)
- **When** POST request to `/api/v1/photos`
- **Then** returns 400 with validation error from US0013 validators
- **And** no file uploaded to S3 or MongoDB

### AC3: S3 Upload and URL Generation
- **Given** a valid photo is uploaded
- **When** S3 upload succeeds
- **Then** S3 URL is publicly accessible
- **And** URL format: `https://{bucket}.s3.{region}.amazonaws.com/{key}`

### AC4: Caption Handling
- **Given** a user uploads a photo with caption
- **When** caption is ≤2200 characters
- **Then** caption is trimmed and saved with photo
- **And** empty/missing caption defaults to empty string
- **And** caption >2200 chars returns 400 error

### AC5: Authentication Required
- **Given** a request without valid JWT token
- **When** POST to `/api/v1/photos`
- **Then** returns 401 Unauthorized
- **And** no file processing occurs

### AC6: S3 Upload Failure Handling
- **Given** S3 upload fails (network/credentials/quota)
- **When** upload attempt is made
- **Then** returns 500 with error message
- **And** no metadata saved to MongoDB

---

## Scope

### In Scope
- POST `/api/v1/photos` endpoint
- Multer configuration for file uploads (memory storage, 10MB limit)
- File validation using US0013 functions
- S3 upload service (uploadToS3, generateS3Key, extractS3Key)
- Photo metadata persistence to MongoDB
- Authentication with JWT middleware (US0003)
- Caption validation and trimming
- GET `/api/v1/photos/:photoId` endpoint (read photo metadata)
- Error handling for all failure scenarios
- Integration tests with mocked S3

### Out of Scope
- Photo deletion (US0014)
- Frontend upload component (US0015)
- Image compression/optimization
- Thumbnail generation
- Multiple photo upload (batch)
- Direct S3 upload from client

---

## Technical Notes

**S3 Service Functions:**
```typescript
// Generate S3 key
generateS3Key(userId, mimeType)
// Returns: 'photos/{userId}/{timestamp}-{uuid}.{ext}'

// Upload to S3
uploadToS3(buffer, key, mimeType)
// Returns: { success, imageUrl, key, error? }

// Delete from S3
deleteFromS3(key)
// Returns: boolean

// Extract key from URL
extractS3Key(imageUrl)
// Returns: S3 key string
```

**API Endpoint:**
```
POST /api/v1/photos
Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: multipart/form-data
Body:
  photo: <file> (required)
  caption: <string> (optional, max 2200 chars)

Response 201:
{
  "success": true,
  "data": {
    "photoId": "...",
    "imageUrl": "https://...",
    "caption": "...",
    "likeCount": 0,
    "createdAt": "..."
  },
  "message": "Photo uploaded successfully"
}
```

**Environment Variables:**
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=inchagram-photos-dev
```

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| No file attached | 400 "No file uploaded" |
| Invalid file type | 400 with INVALID_TYPE code |
| File >10MB | 400/500 Multer error |
| Missing auth token | 401 Unauthorized |
| Invalid JWT | 401 Unauthorized |
| Caption >2200 chars | 400 "Caption cannot exceed 2200 characters" |
| S3 upload timeout | 500 "Failed to upload photo to storage" |
| S3 credentials invalid | 500 with S3 error message |
| MongoDB save failure | 500 "Failed to upload photo" |

---

## Test Scenarios

- [x] **TC001-003:** Upload valid JPEG, PNG, WebP photos
- [x] **TC004-007:** Caption handling (empty, missing, max length, exceed limit)
- [x] **TC008:** No file uploaded
- [x] **TC009-010:** Invalid file types (GIF, video)
- [x] **TC011:** File size exceeds 10MB
- [x] **TC012-013:** Authentication (missing/invalid token)
- [x] **TC014:** S3 upload failure
- [x] **TC015:** Multiple photos from same user
- [x] **TC016:** Caption whitespace trimming

**Test Results:** 16/16 tests passing

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| US0001 | Blocked-by | User model | Done |
| US0003 | Blocked-by | JWT auth middleware | Done |
| US0011 | Blocked-by | Photo model | Done |
| US0013 | Blocked-by | File validation | Done |

### Blocking

| Story | What It Needs |
|-------|---------------|
| US0009 | Uses S3 upload service for profile pictures |
| US0014 | Uses S3 delete service |
| US0015 | Frontend uses this API |

---

## Estimation

**Story Points:** 5
**Complexity:** High

**Rationale:**
- AWS S3 SDK integration
- Multer configuration and file handling
- Multiple integration points (auth, validation, S3, MongoDB)
- Error handling for multiple failure scenarios
- Reusable service design for US0009

---

## Implementation Summary

**Files Created:**
- `src/services/s3Service.ts` - S3 upload/delete service
- `src/controllers/photoController.ts` - Photo upload and retrieval logic
- `src/routes/photos.ts` - Photo API routes with Multer
- `tests/integration/photo.upload.test.ts` - Integration tests (16 tests)

**Files Modified:**
- `src/app.ts` - Added photo routes
- `.env.example` - Added AWS configuration
- `package.json` - Added AWS SDK, Multer, UUID dependencies
- `tests/jest.setup.ts` - Added AWS env vars and UUID mock

**Key Features:**
- POST /api/v1/photos - Upload photo with S3 integration
- GET /api/v1/photos/:photoId - Get photo metadata
- S3 key structure: `photos/{userId}/{timestamp}-{uuid}.{ext}`
- File validation integration (type, size, extension)
- Caption validation and trimming
- Authentication required via JWT middleware
- Comprehensive error handling
- 16/16 integration tests passing with mocked S3

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Ethel | Initial story created |
| 2026-01-30 | Ethel | Implementation complete - 16/16 tests passing |
