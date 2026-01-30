# US0010: Profile Page Routing and Navigation

> **Status:** Done
> **Epic:** [EP0002: User Profiles & Profile Management](../epics/EP0002-user-profiles.md)
> **Owner:** Mark
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** Taylor (Visual Curator)
**I want** to navigate to user profiles via a profile route
**So that** I can browse photographers from a consistent URL

## Context

This story establishes the profile route `/profile/:username` in the frontend and adds basic navigation between the main app view and profile pages. Profiles are public, so the route should be accessible even without authentication.

## Acceptance Criteria

### AC1: Profile Route
- **Given** I navigate to `/profile/:username`
- **When** the route loads
- **Then** the Profile page renders for that username without a full page reload

### AC2: In-App Navigation
- **Given** I am signed in
- **When** I click "My Profile"
- **Then** I am routed to `/profile/:username` for my account

### AC3: Profile Data Display
- **Given** a valid username
- **When** the profile page loads
- **Then** the UI fetches `GET /api/v1/users/username/:username` and displays username, display name (or fallback), bio, profile picture (or placeholder), and counts

### AC4: Return to Home
- **Given** I am on a profile page
- **When** I click "Home"
- **Then** I return to the main app view

### AC5: Not Found Handling
- **Given** a username that does not exist
- **When** the profile page loads
- **Then** a "Profile not found" error is shown

## Scope

### In Scope
- Client-side route handling for `/profile/:username`
- Profile navigation from the authenticated header
- Read-only display of profile data (basic fields + counts)

### Out of Scope
- Profile photo grid (US0007)
- Edit profile UI/API (US0008)
- Upload/update profile picture (US0009)
- Follow/like interactions (EP0004)

## Technical Notes

- Use History API for route changes to avoid a full page reload.
- Profile data comes from `GET /api/v1/users/username/:username`.
- Profile route should be accessible without login.

## Test Scenarios

- Navigate to `/profile/:username` and verify data renders.
- Click "My Profile" from header and verify URL updates.
- Return to home and verify the upload UI is visible for authenticated users.
- Visit `/profile/:unknown` and verify an error message is shown.

## Dependencies

- [US0006](US0006-view-user-profile-api.md) - Profile data endpoint (Done)
- [US0005](US0005-get-current-user-endpoint.md) - Current user data (Done)

## Implementation Summary

**Files Created:**
- `client/src/components/ProfilePage.tsx` - Profile page UI and data fetching
- `client/src/components/ProfilePage.css` - Profile page styling
- `client/src/components/ProfilePage.test.tsx` - Profile page tests
- `client/src/App.test.tsx` - Route navigation test
- `client/src/test/setup.ts` - Client test setup

**Files Updated:**
- `client/src/App.tsx` - Client-side routing and navigation
- `client/src/App.css` - Header navigation styles
- `client/vite.config.ts` - Vitest configuration
- `client/package.json` - Test scripts and dependencies

**Key Features:**
- History API routing for `/profile/:username`
- Profile fetch via `GET /api/v1/users/username/:username`
- In-app navigation with "My Profile" and "Home"
- Not-found and loading states

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Mark | Initial story created from EP0002 |
