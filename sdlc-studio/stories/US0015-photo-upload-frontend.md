# US0015: Photo Upload Frontend Component

> **Status:** Done
> **Epic:** [EP0003: Photo Upload & Storage](../epics/EP0003-photo-management.md)
> **Owner:** Ethel
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** Jamie (Casual Sharer)
**I want** a simple interface to upload photos
**So that** I can share my moments without complexity

## Context

### Persona Reference
**Jamie (Casual Sharer)** - Busy professional who wants to share photos quickly without learning complex features. Values simplicity and speed.

[Full persona details](../personas.md)

### Background
This story implements the frontend React application and photo upload component, providing the user interface for the photo upload functionality built in US0012. It includes authentication flow, file selection with preview, caption input, and integration with the backend API.

---

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| TRD | Framework | React + Vite for frontend | Use React 18 with TypeScript |
| PRD | File Limits | Max 10MB, JPEG/PNG/WebP only | Client-side validation before upload |
| PRD | Simplicity | No complex editing or filters | Simple upload interface with caption |
| TRD | Auth | JWT token in localStorage | Include Bearer token in upload requests |

---

## Acceptance Criteria

### AC1: Frontend Infrastructure Setup
- **Given** no frontend exists
- **When** setting up the project
- **Then** React + Vite + TypeScript is initialized in `client/` directory
- **And** Vite is configured to proxy API requests to backend
- **And** frontend runs on port 3000

### AC2: Login Interface
- **Given** an unauthenticated user
- **When** visiting the app
- **Then** login form is displayed
- **And** user can enter email and password
- **And** successful login stores JWT token in localStorage
- **And** user is redirected to upload interface

### AC3: Photo Selection and Preview
- **Given** an authenticated user
- **When** clicking "Select Photo"
- **Then** file input accepts JPEG, PNG, WebP only
- **And** selected photo is validated (type, size)
- **And** photo preview is displayed
- **And** validation errors are shown clearly

### AC4: Caption Input
- **Given** a photo is selected
- **When** entering a caption
- **Then** caption textarea is available
- **And** character count shows X / 2200
- **And** captions exceeding 2200 characters are prevented
- **And** caption is optional

### AC5: Photo Upload
- **Given** a valid photo is selected
- **When** clicking "Upload Photo"
- **Then** photo uploads to backend API (POST /api/v1/photos)
- **And** JWT token is sent in Authorization header
- **And** FormData includes photo file and caption
- **And** progress indicator shows during upload
- **And** success message displays on completion

### AC6: Error Handling
- **Given** various error scenarios
- **When** errors occur
- **Then** appropriate error messages are displayed:
  - Invalid file type: "Invalid file type. Please upload a JPEG, PNG, or WebP image."
  - File too large: "File size exceeds 10MB limit."
  - No auth token: "You must be logged in to upload photos."
  - Network error: "Network error. Please check your connection."
  - Upload failed: Backend error message

### AC7: Form Reset After Upload
- **Given** a successful upload
- **When** upload completes
- **Then** file input is cleared
- **And** caption is cleared
- **And** preview is removed
- **And** form is ready for next upload

---

## Scope

### In Scope
- React + Vite + TypeScript frontend setup
- Photo upload component with file input and preview
- Caption input with character counter
- Client-side file validation (type, size)
- Login interface with JWT authentication
- Integration with backend photo upload API (US0012)
- Upload progress indicator
- Error and success messaging
- Logout functionality
- Responsive layout
- Basic styling (Instagram-inspired)

### Out of Scope
- Multiple photo upload (batch) - future
- Photo editing (crop, filters) - future
- Photo feed/gallery view - different story (EP0005)
- User profile page - different epic (EP0002)
- Photo deletion UI - future
- Testing (unit/integration) - future enhancement
- Build optimization - future

---

## Technical Notes

**Frontend Setup:**
```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
```

**Vite Configuration:**
```typescript
// vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

**Component Structure:**
- `PhotoUpload.tsx` - Main upload component
- `PhotoUpload.css` - Component styles
- `App.tsx` - App shell with authentication
- `App.css` - App-level styles

**Upload API Integration:**
```typescript
const formData = new FormData();
formData.append('photo', selectedFile);
formData.append('caption', caption);

const response = await fetch('/api/v1/photos', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

**File Validation:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| No file selected | Upload button disabled |
| Invalid file type | Error message, file rejected |
| File exceeds 10MB | Error message before upload |
| No auth token | Error message, cannot upload |
| Caption > 2200 chars | Input capped at 2200, warning shown |
| Network timeout | Error message, can retry |
| Backend returns 401 | Token invalid, redirect to login |
| Backend returns 400 | Show validation error from API |
| Backend returns 500 | Generic error message |
| Upload in progress | Disable inputs, show progress |

---

## Test Scenarios

**Manual Testing (No automated tests for this story):**

- [x] **TC001:** Frontend starts on port 3000
- [x] **TC002:** Login page displays when not authenticated
- [x] **TC003:** Login with valid credentials stores token
- [x] **TC004:** Photo upload page displays after login
- [x] **TC005:** Select valid JPEG file shows preview
- [x] **TC006:** Select valid PNG file shows preview
- [x] **TC007:** Select valid WebP file shows preview
- [x] **TC008:** Select invalid file type shows error
- [x] **TC009:** Select file > 10MB shows error
- [x] **TC010:** Enter caption updates character count
- [x] **TC011:** Caption exceeding 2200 chars shows warning
- [x] **TC012:** Upload valid photo succeeds
- [x] **TC013:** Upload with caption includes caption in request
- [x] **TC014:** Upload without caption sends empty string
- [x] **TC015:** Success message shows after upload
- [x] **TC016:** Form resets after successful upload
- [x] **TC017:** Cancel button clears form
- [x] **TC018:** Logout removes token and redirects to login

**Test Results:** 18/18 manual tests passing

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| US0012 | Blocked-by | Photo upload API endpoint | Done |
| US0001 | Blocked-by | User model for authentication | Done |
| US0002 | Blocked-by | Login API endpoint | Done |
| US0003 | Blocked-by | JWT authentication | Done |

### Blocking

| Story | What It Needs |
|-------|---------------|
| US0007 | Photo grid component will display uploaded photos |
| Future UI stories | Frontend infrastructure now exists |

---

## Estimation

**Story Points:** 2
**Complexity:** Low-Medium

**Rationale:**
- Basic React + Vite setup is straightforward
- Photo upload component is relatively simple
- No complex state management needed
- Backend API already exists (US0012)
- Minimal styling required

**Note:** Initial estimate didn't account for full frontend setup. Actual complexity slightly higher but kept at 2 points for consistency.

---

## Implementation Summary

**Files Created:**
- `client/` - React + Vite frontend directory
- `client/src/components/PhotoUpload.tsx` - Photo upload component
- `client/src/components/PhotoUpload.css` - Component styles
- `client/src/App.tsx` - Main app with authentication
- `client/src/App.css` - App styles
- `client/vite.config.ts` - Vite configuration with API proxy
- `client/README.md` - Frontend documentation

**Key Features:**
- React 18 + TypeScript + Vite setup
- PhotoUpload component with file selection, preview, caption
- Login interface with JWT authentication
- Client-side file validation (type, size, caption length)
- Integration with POST /api/v1/photos endpoint
- Error handling and success messaging
- Form reset after upload
- Instagram-inspired UI design
- Responsive layout

**Configuration:**
- Vite dev server on port 3000
- API proxy to http://localhost:5000
- JWT token stored in localStorage
- FormData upload with Bearer token

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Ethel | Initial story created |
| 2026-01-30 | Ethel | Implementation complete - 18/18 manual tests passing |
