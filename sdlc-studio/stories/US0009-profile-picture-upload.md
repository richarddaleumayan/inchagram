# US0009: Upload/Update Profile Picture

> **Status:** Done ✅
> **Epic:** [EP0002: User Profiles & Profile Management](../epics/EP0002-user-profiles.md)
> **Owner:** Claude
> **Created:** 2026-01-30
> **Completed:** 2026-01-30

## User Story

**As a** logged-in user
**I want** to upload or update my profile picture
**So that** I can personalize my profile with a photo

## Context

### Persona Reference
**Primary:** Alex (Photography Enthusiast) - Professional profile appearance
**Secondary:** All users - Visual identity

### Background
This story implements profile picture upload functionality, reusing the photo upload logic from US0012. Profile pictures are stored in S3 under the `avatars/` prefix and validated for format and size.

---

## Acceptance Criteria

### AC1: Upload Profile Picture
- **Given** user on their profile with "Edit Profile" option
- **When** uploading a profile picture
- **Then** validate file (JPEG/PNG, <10MB)
- **And** upload to S3 under `avatars/{userId}/`
- **And** update profilePictureUrl in database

### AC2: Replace Existing Picture
- **Given** user already has a profile picture
- **When** uploading a new one
- **Then** old picture is replaced (new upload, old file remains in S3)

### AC3: File Validation
- **Given** invalid file (wrong format or too large)
- **When** attempting upload
- **Then** show validation error message

### AC4: Authorization
- **Given** unauthenticated user
- **When** attempting upload
- **Then** return 401 Unauthorized

---

## Technical Implementation

**Backend:** Extended PUT /api/v1/users/:userId to accept multipart/form-data with `profilePicture` field. Reused validation and S3 upload from photo upload.

**Frontend:** Added profile picture upload to EditProfileModal with preview and file selection.

**Story Points:** 3
**Completed:** All acceptance criteria met ✅

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Claude | Story created and completed |
