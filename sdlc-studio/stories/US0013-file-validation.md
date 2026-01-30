# US0013: File Validation (Type, Size, Format)

> **Status:** Done
> **Epic:** [EP0003: Photo Upload & Storage](../epics/EP0003-photo-management.md)
> **Owner:** Ethel
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** user uploading photos
**I want** my files to be validated before upload
**So that** only valid image files (JPEG, PNG, WebP) under 10MB are accepted

## Context

### Persona Reference
**All Personas** - Ensures users receive clear feedback when uploading invalid files:
- **Alex (Photography Enthusiast)** - May upload high-res photos, needs clear size limit feedback
- **Jamie (Casual Sharer)** - Needs simple error messages for invalid files

[Full persona details](../personas.md)

### Background
File validation is critical for photo uploads to ensure only supported image formats are accepted and files don't exceed size limits. This prevents server errors, storage waste, and security issues. The validation logic is reusable across photo uploads and profile picture uploads.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | File Limits | Max 10MB file size | Validate size before upload |
| PRD | File Types | JPEG, PNG, WebP only | Validate MIME type and extension |
| PRD | Exclusions | No videos, GIFs, etc. | Reject non-image formats |

---

## Acceptance Criteria

### AC1: MIME Type Validation
- **Given** a file is submitted for upload
- **When** the MIME type is checked
- **Then** only `image/jpeg`, `image/png`, and `image/webp` are accepted
- **And** all other types are rejected with clear error message

### AC2: File Extension Validation
- **Given** a file is submitted for upload
- **When** the file extension is checked
- **Then** only `.jpg`, `.jpeg`, `.png`, and `.webp` are accepted
- **And** invalid extensions are rejected with clear error message

### AC3: File Size Validation
- **Given** a file is submitted for upload
- **When** the file size is checked
- **Then** files up to 10MB are accepted
- **And** files exceeding 10MB are rejected with "File size exceeds 10MB limit" error

### AC4: Combined Validation
- **Given** a file info object with mimeType, filename, and size
- **When** validatePhotoFile is called
- **Then** all validations (type, extension, size) are performed
- **And** first validation failure returns appropriate error

### AC5: Video Rejection
- **Given** a video file is submitted
- **When** validation runs
- **Then** the file is rejected with "Invalid file type" error
- **And** MP4, MOV, WebM, AVI are all rejected

### AC6: Error Codes
- **Given** validation fails
- **When** an error is returned
- **Then** it includes error code: `INVALID_TYPE`, `INVALID_SIZE`, or `MISSING_FILE`
- **And** it includes human-readable error message

---

## Scope

### In Scope
- `validateFileType(mimeType)` - MIME type validation
- `validateFileExtension(filename)` - File extension validation
- `validateFileSize(size, maxSize?)` - File size validation
- `validatePhotoFile(file)` - Combined validation
- `getExtensionFromMimeType(mimeType)` - Helper function
- Constants: `ALLOWED_MIME_TYPES`, `ALLOWED_EXTENSIONS`, `MAX_FILE_SIZE`
- TypeScript interfaces: `FileValidationResult`, `FileInfo`
- Unit tests for all validation functions

### Out of Scope
- Multer integration (US0012)
- S3 upload logic (US0012)
- Client-side validation (US0015)
- Magic byte validation (not required for v0.1.0)

---

## Technical Notes

**Validation Functions:**
```typescript
// MIME type validation
validateFileType('image/jpeg') // { isValid: true }
validateFileType('video/mp4')  // { isValid: false, error: '...', code: 'INVALID_TYPE' }

// Extension validation
validateFileExtension('photo.jpg') // { isValid: true }
validateFileExtension('video.mp4') // { isValid: false, error: '...', code: 'INVALID_TYPE' }

// Size validation
validateFileSize(5 * 1024 * 1024)  // { isValid: true } - 5MB
validateFileSize(15 * 1024 * 1024) // { isValid: false, error: '...', code: 'INVALID_SIZE' }

// Combined validation
validatePhotoFile({
  mimeType: 'image/jpeg',
  filename: 'photo.jpg',
  size: 5 * 1024 * 1024
}) // { isValid: true }
```

**Constants:**
```typescript
ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
```

### Integration with US0012
The validation functions will be used by the photo upload API endpoint:
```typescript
// In photoController.ts (US0012)
const validation = validatePhotoFile({
  mimeType: req.file.mimetype,
  filename: req.file.originalname,
  size: req.file.size
});

if (!validation.isValid) {
  return res.status(400).json({
    success: false,
    error: { code: validation.code, message: validation.error }
  });
}
```

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Uppercase MIME type (IMAGE/JPEG) | Accept (case-insensitive) |
| Uppercase extension (.JPG) | Accept (case-insensitive) |
| Missing MIME type | Return MISSING_FILE error |
| Missing filename | Return MISSING_FILE error |
| Missing size | Return MISSING_FILE error |
| Zero-byte file | Return INVALID_SIZE error |
| Negative size | Return INVALID_SIZE error |
| File exactly 10MB | Accept |
| File 10MB + 1 byte | Reject with INVALID_SIZE |
| GIF image | Reject with INVALID_TYPE |
| BMP image | Reject with INVALID_TYPE |
| TIFF image | Reject with INVALID_TYPE |
| SVG file | Reject with INVALID_TYPE |
| PDF file | Reject with INVALID_TYPE |
| Mismatched MIME/extension | Reject (validates both) |

---

## Test Scenarios

- [x] **TC001-TC004:** Valid MIME types (JPEG, PNG, WebP, case-insensitive)
- [x] **TC005-TC011:** Reject invalid MIME types (GIF, video, BMP, TIFF, SVG, PDF)
- [x] **TC012-TC016:** Valid and invalid file extensions
- [x] **TC017-TC020:** File size validation (valid sizes, exceeding limit, custom max)
- [x] **TC021-TC026:** Combined validation (valid files, missing fields, invalid combinations)
- [x] **TC027:** getExtensionFromMimeType helper
- [x] **TC028:** Constants verification

**Test Results:** 64/64 tests passing

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| None | - | Pure validation logic, no dependencies | - |

**Note:** This story has no dependencies and can be implemented in parallel with other stories.

### Blocking

| Story | What It Needs |
|-------|---------------|
| US0012 | Uses validation functions for upload API |

---

## Estimation

**Story Points:** 2
**Complexity:** Low

**Rationale:**
- Pure validation logic with no external dependencies
- Clear requirements from PRD
- Standard TypeScript patterns
- Comprehensive but straightforward testing

---

## Implementation Summary

**Files Modified:**
- `src/utils/validation.ts` - Added file validation functions and constants

**Files Created:**
- `tests/unit/fileValidation.test.ts` - Unit tests (64 test cases)

**Key Features:**
- MIME type validation (JPEG, PNG, WebP)
- File extension validation
- File size validation (max 10MB, configurable)
- Combined validation function
- TypeScript interfaces for type safety
- Comprehensive error codes and messages
- 64/64 tests passing

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Ethel | Initial story created |
| 2026-01-30 | Ethel | Implementation complete - 64/64 tests passing |
