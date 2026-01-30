# EP0002: User Profiles & Profile Management

> **Status:** Draft
> **Owner:** Mark
> **Reviewer:** TBD
> **Created:** 2026-01-30
> **Target Release:** v0.1.0

## Summary

Implement user profile viewing and editing functionality, including profile pages, photo grids, follower/following counts, and profile customization (bio, display name, profile picture). This epic creates the user-facing profile experience.

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
|--------|------|------------|--------|
| PRD | Functional | All profiles are public (no privacy settings) | No access control needed, simplified design |
| PRD | Data | Bio max 150 chars, display name max 50 chars | Validation rules for profile editing |
| TRD | Architecture | React frontend + Express backend | Profile UI components + API endpoints |
| TRD | Storage | Profile pictures stored in AWS S3 | Reuse photo upload logic for avatars |

---

## Business Context

### Problem Statement
Users need to showcase their identity and photography work. Profiles serve as a user's home on inchagram, displaying their photos in a grid, bio, and social stats (followers/following counts).

**PRD Reference:** [User Profiles](../prd.md#user-profiles), [Profile Editing](../prd.md#profile-editing)

### Value Proposition
- **Identity:** Users can express themselves through bio, display name, profile picture
- **Portfolio:** Photo grid showcases user's work in reverse chronological order
- **Social Context:** Follower/following counts show user's network
- **Discovery:** Other users can find and learn about photographers

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Profile Load Time (p95) | N/A | <1s | Frontend load + backend API response |
| Profile Picture Upload Success | N/A | >95% | Successful uploads / attempts |
| Profile Editing Completion Rate | N/A | >90% | Edits saved / edits attempted |
| Photo Grid Rendering | N/A | <500ms | Time to render 20 photos |

---

## Scope

### In Scope
- View user profile page (own and others')
- Display username, display name, bio, profile picture
- Show follower count, following count, photo count
- Photo grid displaying user's uploaded photos (newest first)
- Edit own profile (display name, bio, profile picture)
- Upload/update profile picture to S3
- Profile picture validation (format, size)
- Navigate to profile via /profile/:username route

### Out of Scope
- Private profiles / profile visibility settings - future version
- Profile badges, verified accounts - future version
- Profile analytics (profile views) - future version
- Multiple photos in profile (cover photo) - future version
- Custom profile themes - future version
- Profile URL customization - future version

### Affected Personas
- **Alex (Photography Enthusiast):** Needs professional-looking profile to showcase work
- **Taylor (Visual Curator):** Views many profiles to discover photographers
- **Jamie (Casual Sharer):** Wants simple profile editing without complexity
- **Sam (Privacy-Conscious):** Comfortable with public profiles given platform philosophy

---

## Acceptance Criteria (Epic Level)

- [ ] Users can view any profile by navigating to /profile/:username
- [ ] Profile displays username, display name, bio, profile picture, follower/following/photo counts
- [ ] Photo grid shows all photos uploaded by user in reverse chronological order
- [ ] Users can edit their own profile (display name, bio, profile picture)
- [ ] Profile picture uploads are validated (format: JPEG/PNG, size: <10MB)
- [ ] Profile pictures are stored in S3 (avatars/{userId}/ prefix)
- [ ] Bio cannot exceed 150 characters
- [ ] Display name cannot exceed 50 characters
- [ ] Profile edits save successfully and update immediately
- [ ] Clicking on a photo in grid navigates to photo detail view

---

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| EP0001 (User Authentication) | Epic | Draft | Richard/Mark |

**Reason:** Requires user authentication to edit own profile, and User model to display profile data.

### Blocking

| Item | Type | Impact |
|------|------|--------|
| EP0004 (Social Interactions) | Epic | Follow/unfollow buttons appear on profiles |

---

## Risks & Assumptions

### Assumptions
- S3 bucket for avatars is configured (can reuse photos bucket with different prefix)
- Frontend framework (React) is set up and working
- Photo upload logic (EP0003) can be reused for profile pictures
- Users accept public profiles (no privacy concerns for v0.1.0)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large photo grids slow to load | Medium | Medium | Implement pagination (20 photos per page) |
| Profile picture upload fails | Low | Medium | Reuse tested upload logic from EP0003 |
| Profile data out of sync | Low | Medium | Ensure counts (followers, photos) are updated atomically |

---

## Technical Considerations

### Architecture Impact
- Introduces profile page as major UI component
- Establishes pattern for user-specific data views
- Profile picture upload reuses photo storage infrastructure

### Integration Points
- EP0001: User model for profile data
- EP0003: Photo model to fetch user's photos for grid
- EP0004: Follow model to calculate follower/following counts
- AWS S3: Profile picture storage
- React Router: /profile/:username routing
- React: Profile components (ProfileHeader, PhotoGrid, ProfileEditForm)

### API Endpoints (from TRD)
- `GET /api/v1/users/:userId` - Get user profile by ID
- `GET /api/v1/users/username/:username` - Get user profile by username
- `PUT /api/v1/users/:userId` - Update user profile (authenticated, owner only)
- `GET /api/v1/users/:userId/photos` - Get user's photos for grid

---

## Sizing

**Story Points:** 13
**Estimated Story Count:** 5-6 stories

**Complexity Factors:**
- Frontend profile UI components (ProfilePage, PhotoGrid, EditProfileModal)
- Backend API for fetching/updating profile data
- Profile picture upload to S3 (similar to photo upload)
- Aggregating follower/following counts efficiently
- Pagination for photo grid

---

## Story Breakdown

- [x] US0006: View User Profile API (GET /users/:userId) - 2 points ✅
- [ ] US0007: Profile Photo Grid Component - 3 points
- [ ] US0008: Edit Profile API and UI - 3 points
- [ ] US0009: Upload/Update Profile Picture - 3 points
- [x] US0010: Profile Page Routing and Navigation - 2 points ✅

**Total Story Points:** 13
**Completed:** 4/13 points (31%)
**Note:** US0009 reuses upload logic from US0012 (Ethel's photo upload)

---

## Test Plan

**Test Spec:** Will be created during story implementation

**Key Test Scenarios:**
- View own profile shows correct data
- View another user's profile shows their data
- Edit profile updates display name and bio
- Upload profile picture saves to S3 and updates profile
- Photo grid displays user's photos in correct order
- Follower/following counts are accurate
- Navigation to /profile/:username loads correct profile

---

## Team Assignment Notes

**Ideal Developer Profile:**
- Full-stack: Comfortable with React and Express
- Can create responsive UI components
- Understands file uploads and S3 integration
- Familiar with React state management and routing

**Conflict Avoidance:**
- Frontend focus: `/src/components/Profile/`, `/src/pages/ProfilePage.tsx`
- Backend: `/src/routes/users.ts`, `/src/controllers/profileController.ts`
- Can work in parallel with EP0003 (Photo Upload) - different UI components
- Depends on EP0001 completing User model first

**Suggested Assignment:** Ethel or Neildren (full-stack or frontend-focused)

---

## Open Questions

- [ ] Should we show private/public toggle even if disabled for v0.1.0? - Owner: TBD (Decision: No, keep it simple)
- [ ] How many photos to show in grid before pagination? - Owner: TBD (Decision: 20 photos per page)
- [ ] Should display name default to username if not set? - Owner: TBD (Decision: Yes, good default)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial epic created from PRD |
