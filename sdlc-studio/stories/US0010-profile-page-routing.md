# US0010: Profile Page Routing and Navigation

> **Status:** Done ✅
> **Epic:** [EP0002: User Profiles & Profile Management](../epics/EP0002-user-profiles.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Completed:** 2026-01-30

## User Story

**As a** user
**I want** to navigate to user profiles via a profile route
**So that** I can view photographer profiles and their content

## Context

### Persona Reference
**Primary:** Taylor (Visual Curator) - Navigates between photographers
**Secondary:** All personas - View other users' profiles

[Full persona details](../personas.md)

### Background
This story establishes client-side routing for profile pages at `/profile/:username`. Users should be able to:
- Navigate to any user's profile via URL
- Click usernames in the feed to view profiles
- Access "My Profile" from the header
- Navigate back to the main feed

Profiles are public and viewable without authentication.

---

## Inherited Constraints

| Source | Type | Constraint | AC Implication |
|--------|------|------------|----------------|
| PRD | Public | Profiles are public | No auth required to view |
| TRD | Client-side | SPA architecture | History API routing |
| TRD | API | Use existing profile endpoint | GET /api/v1/users/username/:username |

---

## Acceptance Criteria

### AC1: Profile URL Route
- **Given** I navigate to `/profile/:username`
- **When** the page loads
- **Then** the profile page renders without full page reload
- **And** the URL updates in the browser

### AC2: Profile Data Display
- **Given** a valid username
- **When** the profile page loads
- **Then** I see: username, display name, bio, profile picture, follower count, following count, photo count

### AC3: My Profile Button
- **Given** I am authenticated
- **When** I click "My Profile" in the header
- **Then** I navigate to my own profile at `/profile/:myUsername`

### AC4: Navigate from Feed
- **Given** I am viewing the feed
- **When** I click a username on a photo
- **Then** I navigate to that user's profile

### AC5: Navigate Back to Home
- **Given** I am on a profile page
- **When** I click "Home" or the app logo
- **Then** I return to the main feed

### AC6: Profile Not Found
- **Given** an invalid username
- **When** the profile page attempts to load
- **Then** I see "Profile not found" error message

### AC7: Loading State
- **Given** profile data is being fetched
- **When** the request is in flight
- **Then** I see a loading indicator

---

## Scope

### In Scope
- Client-side routing for `/profile/:username`
- ProfilePage component with data fetching
- Navigation integration (header buttons, feed usernames)
- Loading and error states
- Browser back/forward button support

### Out of Scope
- Profile photo grid (US0007)
- Edit profile (US0008)
- Upload profile picture (US0009)
- Follow/unfollow buttons (US0022)

---

## Technical Notes

### Routing Implementation
Use History API (no external router library):
```typescript
// Navigate function
const navigate = (to: string) => {
  window.history.pushState({}, '', to);
  setPath(to);
};

// Listen for back/forward
useEffect(() => {
  const handlePopState = () => setPath(window.location.pathname);
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);

// Match profile routes
const profileUsername = useMemo(() => {
  const match = path.match(/^\/profile\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}, [path]);
```

### API Integration
```typescript
// Fetch profile data
const response = await fetch(`/api/v1/users/username/${encodeURIComponent(username)}`);
```

### PhotoCard Integration
Update PhotoCard to support profile navigation:
```typescript
// In PhotoCard component
<button onClick={() => onNavigate?.(`/profile/${username}`)}>
  {username}
</button>
```

---

## Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0006](US0006-view-user-profile-api.md) | Prerequisite | Profile API endpoint | Done ✅ |
| [US0005](US0005-get-current-user-endpoint.md) | Prerequisite | Current user endpoint | Done ✅ |
| [US0025](US0025-photo-card-component.md) | Integration | PhotoCard navigation | Done ✅ |

**All dependencies satisfied** ✅

---

## Test Scenarios

### Integration Tests
- [x] TC001: Navigate to `/profile/:username` renders profile
- [x] TC002: Profile displays all user data correctly
- [x] TC003: "My Profile" button navigates to own profile
- [x] TC004: Clicking username in feed navigates to profile
- [x] TC005: "Home" button returns to feed
- [x] TC006: Invalid username shows error message
- [x] TC007: Loading state displays during fetch
- [x] TC008: Browser back button returns to previous page
- [x] TC009: Direct URL navigation works (page refresh)

---

## Estimation

**Story Points:** 2
**Complexity:** Medium

**Effort Breakdown:**
- ProfilePage component: 2 hours
- Routing logic in App.tsx: 1.5 hours
- PhotoCard navigation integration: 30 minutes
- Tests: 2 hours
- Documentation: 30 minutes

**Total:** ~6.5 hours

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | Richard | Initial story created from EP0002 |
