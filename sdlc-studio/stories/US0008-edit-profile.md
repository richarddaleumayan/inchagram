# US0008: Edit Profile API and UI

> **Status:** Done ✅
> **Epic:** [EP0002: User Profiles & Profile Management](../epics/EP0002-user-profiles.md)
> **Owner:** Claude
> **Created:** 2026-01-30
> **Completed:** 2026-01-30

## User Story

**As a** logged-in user
**I want** to edit my profile information (display name and bio)
**So that** I can customize how I appear to other users

## Context

### Persona Reference
**Primary:** Alex (Photography Enthusiast) - Wants professional-looking profile
**Secondary:** Jamie (Casual Sharer) - Simple profile editing

### Background
This story implements profile editing functionality, allowing users to update their display name and bio. Only the profile owner can edit their own profile. Profile picture upload is handled separately in US0009.

---

## Inherited Constraints

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Data | Bio max 150 chars, display name max 50 chars | Validation rules |
| PRD | Security | Only owner can edit | Authorization check |
| TRD | API | PUT /api/v1/users/:userId | Backend endpoint |
| TRD | Frontend | React modal/form | EditProfileModal component |

---

## Acceptance Criteria

### AC1: Backend API Endpoint
- **Given** authenticated user editing their own profile
- **When** PUT /api/v1/users/:userId is called with displayName and/or bio
- **Then** update the user's profile in database
- **And** return updated profile data

### AC2: Authorization
- **Given** user tries to edit another user's profile
- **When** PUT request is made
- **Then** return 403 Forbidden error

### AC3: Validation
- **Given** profile data with invalid inputs
- **When** updating profile
- **Then** return 400 Bad Request with specific validation errors
- **And** display name must be ≤50 characters
- **And** bio must be ≤150 characters

### AC4: Edit Profile UI
- **Given** user is on their own profile
- **When** clicking "Edit Profile" button
- **Then** display edit form/modal with current values pre-filled

### AC5: Save Changes
- **Given** valid profile edits in form
- **When** clicking "Save"
- **Then** submit changes to API
- **And** close modal
- **And** update profile display with new values

### AC6: Cancel Editing
- **Given** profile edit form is open
- **When** clicking "Cancel" or outside modal
- **Then** discard changes and close modal

---

## Scope

### In Scope
- Backend PUT /api/v1/users/:userId endpoint
- Authorization middleware (owner only)
- Validation (display name, bio)
- Frontend EditProfileModal component
- "Edit Profile" button on own profile
- Form with display name and bio fields
- Save and cancel functionality

### Out of Scope
- Profile picture upload (US0009)
- Username changes (username is immutable)
- Email changes (separate security feature)
- Other profile fields

---

## Technical Notes

### Backend Endpoint
```typescript
PUT /api/v1/users/:userId
Authorization: Bearer <token>

Request Body:
{
  displayName?: string,  // Optional, max 50 chars
  bio?: string           // Optional, max 150 chars
}

Response:
{
  success: true,
  data: {
    userId: string,
    username: string,
    displayName: string | null,
    bio: string | null,
    ...
  }
}
```

### Frontend Component
- EditProfileModal component
- Controlled form inputs
- Character count display
- Loading state during save
- Error handling

---

## Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0006](US0006-view-user-profile-api.md) | Prerequisite | User model | Done ✅ |
| [US0005](US0005-get-current-user-endpoint.md) | Prerequisite | Auth check | Done ✅ |

**All dependencies satisfied** ✅

---

## Test Scenarios

### Backend Tests
- [ ] TC001: Owner can update their own profile
- [ ] TC002: Non-owner cannot update profile (403)
- [ ] TC003: Unauthenticated user cannot update (401)
- [ ] TC004: Display name validation (max 50 chars)
- [ ] TC005: Bio validation (max 150 chars)
- [ ] TC006: Partial updates work (only displayName or only bio)
- [ ] TC007: Empty strings clear fields

### Frontend Tests
- [ ] TC008: Edit button appears on own profile
- [ ] TC009: Edit button does not appear on other profiles
- [ ] TC010: Modal opens with pre-filled values
- [ ] TC011: Character count updates correctly
- [ ] TC012: Save button updates profile
- [ ] TC013: Cancel discards changes

---

## Estimation

**Story Points:** 3
**Complexity:** Medium

**Effort Breakdown:**
- Backend API endpoint: 1.5 hours
- Authorization logic: 30 minutes
- Validation: 30 minutes
- Frontend modal component: 2 hours
- Integration: 30 minutes
- Tests: 1.5 hours

**Total:** ~6.5 hours

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Claude | Initial story created |
