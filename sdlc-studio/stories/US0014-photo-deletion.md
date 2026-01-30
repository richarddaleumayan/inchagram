# US0014: Photo Deletion (MongoDB + S3 Cleanup)

> **Status:** Done
> **Epic:** [EP0003: Photo Upload & Storage](../epics/EP0003-photo-management.md)
> **Owner:** Ethel
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** photo owner
**I want** to delete my photos
**So that** I can remove unwanted content from my profile

## Context

### Persona Reference
**Alex (Photography Enthusiast)** - Wants control over portfolio, may delete photos that don't meet standards
**Jamie (Casual Sharer)** - May want to remove old or regretted posts

[Full persona details](../personas.md)

### Background
Photo deletion is essential for user control over their content. This story implements secure deletion with ownership verification, ensuring only photo owners can delete their photos, and properly cleaning up both MongoDB metadata and S3 storage.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Security | Owner-only deletion | Verify userId matches photo owner |
| PRD | Storage | Delete from both MongoDB and S3 | Clean up S3 object after MongoDB |
| TRD | API | DELETE /api/v1/photos/:photoId | Implement DELETE endpoint |
| TRD | Auth | Requires authentication | Use JWT middleware |

---

## Acceptance Criteria

### AC1: Owner Can Delete Photo
- **Given** an authenticated user owns a photo
- **When** DELETE request to `/api/v1/photos/:photoId`
- **Then** photo is deleted from MongoDB
- **And** photo is deleted from S3
- **And** returns 200 with success message

### AC2: Non-Owner Cannot Delete
- **Given** an authenticated user does not own a photo
- **When** DELETE request to `/api/v1/photos/:photoId`
- **Then** returns 403 Forbidden
- **And** photo is NOT deleted from MongoDB or S3
- **And** error message: "You do not have permission to delete this photo"

### AC3: MongoDB Cleanup
- **Given** a photo exists in MongoDB
- **When** owner deletes the photo
- **Then** photo document is removed from photos collection
- **And** subsequent queries return 404

### AC4: S3 Cleanup
- **Given** a photo exists in S3
- **When** owner deletes the photo
- **Then** S3 object is deleted using extracted key from imageUrl
- **And** S3 delete failure does not prevent MongoDB deletion (best effort)

### AC5: Authentication Required
- **Given** a request without valid JWT token
- **When** DELETE to `/api/v1/photos/:photoId`
- **Then** returns 401 Unauthorized
- **And** no deletion occurs

### AC6: Non-Existent Photo Handling
- **Given** a photoId does not exist
- **When** DELETE request is made
- **Then** returns 404 Not Found
- **And** error message: "Photo not found"

---

## Scope

### In Scope
- DELETE `/api/v1/photos/:photoId` endpoint
- Owner verification (userId comparison)
- MongoDB photo deletion
- S3 object deletion with extractS3Key
- Authentication with JWT middleware
- Error handling (not found, forbidden, unauthorized)
- Best-effort S3 deletion (continue on S3 failure)
- Integration tests for all scenarios

### Out of Scope
- Cascade deletion of likes/comments (future)
- Soft delete / trash feature (future)
- Bulk photo deletion (future)
- Photo deletion from feed cache (future)

---

## Technical Notes

**DELETE Endpoint:**
```
DELETE /api/v1/photos/:photoId
Headers:
  Authorization: Bearer <jwt_token>

Response 200:
{
  "success": true,
  "message": "Photo deleted successfully"
}

Response 403:
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to delete this photo"
  }
}

Response 404:
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Photo not found"
  }
}
```

**Deletion Flow:**
1. Authenticate user (JWT middleware)
2. Find photo by photoId
3. Verify ownership (photo.userId === req.user.userId)
4. Delete from MongoDB (findByIdAndDelete)
5. Extract S3 key from imageUrl
6. Delete from S3 (best effort, log warning on failure)
7. Return success response

**S3 Cleanup:**
- Uses `extractS3Key(imageUrl)` to get S3 object key
- Calls `deleteFromS3(key)`
- S3 failure is logged but doesn't fail the request (MongoDB already deleted)

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Non-owner tries to delete | 403 Forbidden, photo not deleted |
| Missing auth token | 401 Unauthorized |
| Invalid JWT | 401 Unauthorized |
| Photo not found | 404 Not Found |
| Invalid photoId format | 500 Internal Server Error (Cast error) |
| S3 delete fails | Warning logged, MongoDB deleted, return 200 |
| S3 key extraction fails | Skip S3 delete, MongoDB deleted, return 200 |
| Photo already deleted | 404 Not Found (idempotent) |
| Photo with likes | Deletion succeeds (no cascade yet) |

---

## Test Scenarios

- [x] **TC001:** Owner successfully deletes photo (MongoDB + S3)
- [x] **TC002:** Non-owner cannot delete photo (403)
- [x] **TC003:** No authentication token (401)
- [x] **TC004:** Invalid authentication token (401)
- [x] **TC005:** Photo not found (404)
- [x] **TC006:** Invalid photo ID format (500)
- [x] **TC007:** S3 deletion fails but MongoDB succeeds (200)
- [x] **TC008:** S3 key extraction fails, MongoDB succeeds (200)
- [x] **TC009:** Delete multiple photos by same owner
- [x] **TC010:** Attempt to delete already deleted photo (404)
- [x] **TC011:** Photo with likes can be deleted

**Test Results:** 11/11 tests passing

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| US0011 | Blocked-by | Photo model | Done |
| US0012 | Blocked-by | S3 service (deleteFromS3, extractS3Key) | Done |

### Blocking

| Story | What It Needs |
|-------|---------------|
| None | Photo deletion is standalone feature |

---

## Estimation

**Story Points:** 2
**Complexity:** Low-Medium

**Rationale:**
- Straightforward CRUD operation
- Reuses existing S3 service functions
- Owner verification is simple userId comparison
- Error handling patterns established in US0012

---

## Implementation Summary

**Files Modified:**
- `src/controllers/photoController.ts` - Added deletePhoto function
- `src/routes/photos.ts` - Added DELETE route with auth

**Files Created:**
- `tests/integration/photo.delete.test.ts` - Integration tests (11 tests)

**Key Features:**
- DELETE `/api/v1/photos/:photoId` - Delete photo with ownership check
- Owner verification via userId comparison
- MongoDB deletion with findByIdAndDelete
- S3 cleanup using extractS3Key and deleteFromS3
- Best-effort S3 deletion (warning on failure)
- Authentication required via JWT middleware
- Comprehensive error handling (404, 403, 401, 500)
- 11/11 integration tests passing

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Ethel | Initial story created |
| 2026-01-30 | Ethel | Implementation complete - 11/11 tests passing |
