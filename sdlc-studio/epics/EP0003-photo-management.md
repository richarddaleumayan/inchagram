# EP0003: Photo Upload & Storage

> **Status:** Draft
> **Owner:** Ethel
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Target Release:** v0.1.0

## Summary

Implement core photo upload functionality, including file validation, S3 storage integration, photo metadata management, and photo deletion. This epic enables users to share their photography on inchagram.

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
|--------|------|------------|--------|
| PRD | File Limits | Max 10MB, JPEG/PNG/WebP only, no videos | Strict validation required |
| PRD | Storage | AWS S3 for photo files | Must integrate S3 SDK |
| PRD | Metadata | Photos are public, optional captions (max 2200 chars) | No access control, simple metadata |
| TRD | Upload Flow | Multer for file parsing, S3Client for upload | Specific libraries and flow |

---

## Business Context

### Problem Statement
Users need a simple, reliable way to upload and share their photos. Unlike complex platforms, inchagram focuses on photo uploads without videos, Stories, or editing tools in v0.1.0.

**PRD Reference:** [Photo Upload](../prd.md#photo-upload)

### Value Proposition
- **Simplicity:** Upload photo with optional caption, no complex options
- **Reliability:** S3 provides durable, scalable storage
- **Speed:** <10s upload time for 5MB photos
- **Quality:** Support for high-quality image formats (JPEG, PNG, WebP)

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Upload Success Rate | N/A | >98% | Successful uploads / attempts |
| Upload Time (5MB photo) | N/A | <10s | Time from request to response |
| S3 Storage Reliability | N/A | 99.999999999% | AWS SLA |
| File Validation Accuracy | N/A | 100% | Invalid files rejected correctly |

---

## Scope

### In Scope
- Upload photo file (JPEG, PNG, WebP) with optional caption
- Client-side and server-side file validation (type, size)
- Photo upload to AWS S3 with unique key structure
- Save photo metadata to MongoDB (imageUrl, userId, caption, timestamps)
- Generate S3 URL for photo access
- Delete own photo (soft delete or hard delete with S3 cleanup)
- Photo model and MongoDB schema with indexes
- API endpoint for photo upload (`POST /api/v1/photos`)
- API endpoint for photo deletion (`DELETE /api/v1/photos/:photoId`)

### Out of Scope
- Multiple photo upload (batch) - future version
- Photo editing (filters, cropping, rotation) - future version
- Photo tagging / hashtags - future version
- Photo albums / collections - future version
- Image compression / optimization on server - future version
- Thumbnail generation - future version
- Geolocation tagging - future version
- Photo privacy settings - all photos public in v0.1.0

### Affected Personas
- **Alex (Photography Enthusiast):** Core use case - uploading high-quality photos
- **Jamie (Casual Sharer):** Needs simple upload without complexity
- **Morgan (Mindful Consumer):** Appreciates simplicity, no feature bloat
- **Sam (Privacy-Conscious):** Accepts public photos given platform philosophy

---

## Acceptance Criteria (Epic Level)

- [ ] Authenticated users can upload photos (JPEG, PNG, WebP)
- [ ] Files larger than 10MB are rejected with clear error
- [ ] Invalid file types (videos, GIFs, etc.) are rejected
- [ ] Photos are uploaded to S3 with structure: `photos/{userId}/{timestamp}-{uuid}.{ext}`
- [ ] Photo metadata (imageUrl, userId, caption, likeCount=0) saved to MongoDB
- [ ] Captions cannot exceed 2200 characters
- [ ] S3 upload failures are handled gracefully (retry, error response)
- [ ] Users can delete their own photos (owner check enforced)
- [ ] Deleting photo removes from MongoDB and S3
- [ ] Photo URLs are publicly accessible (no auth required to view)

---

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| EP0001 (User Authentication) | Epic | Draft | Richard/Mark |

**Reason:** Photo upload requires authenticated user, Photo model references User model.

### Blocking

| Item | Type | Impact |
|------|------|--------|
| EP0002 (User Profiles) | Epic | Profile photo grid displays uploaded photos |
| EP0005 (Photo Feed) | Epic | Feed displays photos from followed users |
| EP0004 (Social Interactions) | Epic | Photos can be liked |

---

## Risks & Assumptions

### Assumptions
- AWS S3 bucket is created and configured with proper IAM permissions
- AWS SDK credentials are available in environment variables
- Network bandwidth supports 10MB uploads reasonably fast
- Users understand all photos are public (no privacy concerns)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| S3 upload failures | Low | High | Retry logic (3 attempts), clear error messages |
| Large file uploads timeout | Medium | Medium | Increase timeout for upload endpoint, show progress indicator |
| Invalid file type bypasses validation | Low | Medium | Server-side validation always (never trust client) |
| S3 costs exceed budget | Low | Low | Monitor usage, set up billing alerts |
| Orphaned S3 files after deletion failure | Low | Medium | Background job to reconcile (future) |

---

## Technical Considerations

### Architecture Impact
- Introduces AWS S3 integration as core infrastructure dependency
- Establishes Photo model as central content entity
- File upload handling patterns apply to profile pictures (EP0002)

### Integration Points
- AWS S3: Photo file storage (S3Client from @aws-sdk/client-s3)
- MongoDB: Photo metadata storage
- Multer: Multipart/form-data parsing for file uploads
- Express: File upload endpoint with size limits
- Frontend: File input, upload progress, preview

### API Endpoints (from TRD)
- `POST /api/v1/photos` - Upload new photo (multipart/form-data)
- `GET /api/v1/photos/:photoId` - Get photo metadata
- `DELETE /api/v1/photos/:photoId` - Delete photo (owner only)

### S3 Configuration
```typescript
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

**Bucket structure:**
- Bucket: `inchagram-photos-{env}` (e.g., `inchagram-photos-prod`)
- Keys: `photos/{userId}/{timestamp}-{uuid}.{ext}`
- Example: `photos/507f1f77bcf86cd799439011/1706612345678-a1b2c3d4.jpg`

---

## Sizing

**Story Points:** 13
**Estimated Story Count:** 4-5 stories

**Complexity Factors:**
- AWS S3 SDK integration and configuration
- File upload handling with Multer
- File validation (client and server-side)
- Error handling for upload failures
- S3 key generation and URL management
- Photo deletion with S3 cleanup

---

## Story Breakdown

- [ ] US0011: Photo Model and MongoDB Schema - 2 points
- [ ] US0012: Photo Upload API with S3 Integration - 5 points
- [ ] US0013: File Validation (Type, Size, Format) - 2 points
- [ ] US0014: Photo Deletion (MongoDB + S3 Cleanup) - 2 points
- [ ] US0015: Photo Upload Frontend Component - 2 points

**Total Story Points:** 13
**Note:** US0012 creates reusable upload service used by US0009 (profile pictures)

---

## Test Plan

**Test Spec:** Will be created during story implementation

**Key Test Scenarios:**
- Upload valid JPEG photo successfully
- Upload valid PNG photo successfully
- Upload valid WebP photo successfully
- Reject file >10MB with error
- Reject video file with error
- Reject unsupported format (GIF, BMP) with error
- Photo saved to S3 with correct key structure
- Photo metadata saved to MongoDB correctly
- S3 URL is publicly accessible
- Delete photo removes from MongoDB and S3
- Non-owner cannot delete photo (403 error)
- Upload with caption saves caption correctly
- Upload without caption saves with empty string

---

## Team Assignment Notes

**Ideal Developer Profile:**
- Strong Node.js/Express backend skills
- Experience with AWS S3 or similar object storage
- Understands file uploads and multipart/form-data
- Can handle error cases and retries

**Conflict Avoidance:**
- Backend-focused: `/src/routes/photos.ts`, `/src/services/s3Service.ts`, `/src/models/Photo.ts`
- Works independently from EP0002 (different domain)
- Can work in parallel with EP0004 (Social Interactions) - different features
- Minor frontend overlap with EP0002 (both need file upload UI) - coordinate on shared upload component

**Suggested Assignment:** Richard or Mark (backend specialists with AWS experience)

---

## Open Questions

- [ ] Should we generate multiple sizes (thumbnail, medium, full) on upload? - Owner: TBD (Decision: Not in v0.1.0, defer to future)
- [ ] How do we handle S3 upload failures? - Owner: TBD (Decision: 3 retries with exponential backoff, then return error)
- [ ] Should we compress photos server-side before S3 upload? - Owner: TBD (Decision: Not in v0.1.0, accept original files)
- [ ] Delete photo: hard delete or soft delete? - Owner: TBD (Decision: Hard delete for simplicity)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial epic created from PRD |
