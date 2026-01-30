# Story Registry

**Last Updated:** 2026-01-30
**Personas Reference:** [User Personas](../personas.md)
**Total Stories:** 26

## Summary

| Status | Count |
|--------|-------|
| Draft | 21 |
| Ready | 0 |
| Planned | 0 |
| In Progress | 0 |
| Review | 0 |
| Done | 5 |
| **Total** | **26** |

---

## Stories by Epic

### [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
**Owner:** Richard | **Points:** 13 | **Stories:** 4

| ID | Title | Status | Points | Owner |
|----|-------|--------|--------|-------|
| [US0001](US0001-user-registration-api.md) | User Registration API Endpoint | Done | 3 | Richard |
| [US0002](US0002-user-login-jwt.md) | User Login API with JWT Token Generation | Draft | 3 | Richard |
| [US0003](US0003-jwt-auth-middleware.md) | JWT Authentication Middleware | Draft | 2 | Richard |
| US0004 | Input Validation Middleware | Draft | 2 | Richard |
| US0005 | Get Current User Endpoint (/auth/me) | Draft | 3 | Richard |

---

### [EP0002: User Profiles & Profile Management](../epics/EP0002-user-profiles.md)
**Owner:** Mark | **Points:** 13 | **Stories:** 5

| ID | Title | Status | Points | Persona |
|----|-------|--------|--------|---------|
| US0006 | View User Profile API (GET /users/:userId) | Draft | 2 | Taylor (Curator) |
| US0007 | Profile Photo Grid Component | Draft | 3 | Alex (Photographer) |
| US0008 | Edit Profile API and UI | Draft | 3 | Jamie (Casual) |
| US0009 | Upload/Update Profile Picture | Draft | 3 | All |
| US0010 | Profile Page Routing and Navigation | Draft | 2 | All |

**Coordination:** Mark coordinates with Ethel on shared upload component (US0009 uses US0012 logic)

---

### [EP0003: Photo Upload & Storage](../epics/EP0003-photo-management.md)
**Owner:** Ethel | **Points:** 13 | **Stories:** 5

| ID | Title | Status | Points | Persona |
|----|-------|--------|--------|---------|
| [US0011](US0011-photo-model-mongodb-schema.md) | Photo Model and MongoDB Schema | Done | 2 | Internal |
| US0012 | Photo Upload API with S3 Integration | Draft | 5 | Alex (Photographer) |
| [US0013](US0013-file-validation.md) | File Validation (Type, Size, Format) | Done | 2 | All |
| US0014 | Photo Deletion (MongoDB + S3 Cleanup) | Draft | 2 | Alex (Photographer) |
| US0015 | Photo Upload Frontend Component | Draft | 2 | Jamie (Casual) |

**Critical:** US0012 S3 upload logic is reused by US0009 (profile pictures)

---

### [EP0004: Social Interactions (Likes & Follows)](../epics/EP0004-social-interactions.md)
**Owner:** Neildren | **Points:** 13 | **Stories:** 7

| ID | Title | Status | Points | Persona |
|----|-------|--------|--------|---------|
| US0016 | Like/Unlike Photo API Endpoints | Draft | 2 | All |
| [US0017](US0017-like-model.md) | Like Model and Denormalized Count Logic | Done | 2 | Internal |
| US0018 | View Photo Likes List | Draft | 2 | Alex (Photographer) |
| US0019 | Follow/Unfollow User API Endpoints | Draft | 2 | Taylor (Curator) |
| [US0020](US0020-follow-model.md) | Follow Model with Self-Follow Validation | Done | 2 | Internal |
| US0021 | Like Button Component (Frontend) | Draft | 2 | All |
| US0022 | Follow Button Component (Frontend) | Draft | 1 | All |

**Critical:** US0021 (Like Button) component is reused by US0025 (Photo Card in feeds)

---

### [EP0005: Photo Feeds (Personal & Discovery)](../epics/EP0005-photo-feeds.md)
**Owner:** Richard (after EP0001) | **Points:** 13 | **Stories:** 5

| ID | Title | Status | Points | Persona |
|----|-------|--------|--------|---------|
| US0023 | Personalized Feed API Endpoint | Draft | 3 | All |
| US0024 | Discovery Feed API Endpoint | Draft | 2 | Taylor (Curator) |
| US0025 | Photo Card Component for Feeds | Draft | 2 | All |
| US0026 | Feed Page with Infinite Scroll | Draft | 3 | Morgan (Mindful) |
| US0027 | Feed Empty State Handling | Draft | 1 | All |
| US0028 | Feed Query Optimization | Draft | 2 | Internal |

**Dependencies:** Requires US0012 (Photo model), US0017 (Like model), US0020 (Follow model), US0021 (Like button)

---

## All Stories (Sequential)

| ID | Title | Epic | Owner | Points | Status |
|----|-------|------|-------|--------|--------|
| [US0001](US0001-user-registration-api.md) | User Registration API Endpoint | EP0001 | Richard | 3 | Done |
| [US0002](US0002-user-login-jwt.md) | User Login API with JWT | EP0001 | Richard | 3 | Draft |
| [US0003](US0003-jwt-auth-middleware.md) | JWT Authentication Middleware | EP0001 | Richard | 2 | Draft |
| US0004 | Input Validation Middleware | EP0001 | Richard | 2 | Draft |
| US0005 | Get Current User Endpoint | EP0001 | Richard | 3 | Draft |
| US0006 | View User Profile API | EP0002 | Mark | 2 | Draft |
| US0007 | Profile Photo Grid Component | EP0002 | Mark | 3 | Draft |
| US0008 | Edit Profile API and UI | EP0002 | Mark | 3 | Draft |
| US0009 | Upload/Update Profile Picture | EP0002 | Mark | 3 | Draft |
| US0010 | Profile Page Routing | EP0002 | Mark | 2 | Draft |
| [US0011](US0011-photo-model-mongodb-schema.md) | Photo Model and Schema | EP0003 | Ethel | 2 | Done |
| US0012 | Photo Upload API with S3 | EP0003 | Ethel | 5 | Draft |
| [US0013](US0013-file-validation.md) | File Validation | EP0003 | Ethel | 2 | Done |
| US0014 | Photo Deletion | EP0003 | Ethel | 2 | Draft |
| US0015 | Photo Upload Frontend | EP0003 | Ethel | 2 | Draft |
| US0016 | Like/Unlike Photo API | EP0004 | Neildren | 2 | Draft |
| [US0017](US0017-like-model.md) | Like Model and Count Logic | EP0004 | Neildren | 2 | Done |
| US0018 | View Photo Likes List | EP0004 | Neildren | 2 | Draft |
| US0019 | Follow/Unfollow User API | EP0004 | Neildren | 2 | Draft |
| [US0020](US0020-follow-model.md) | Follow Model with Validation | EP0004 | Neildren | 2 | Done |
| US0021 | Like Button Component | EP0004 | Neildren | 2 | Draft |
| US0022 | Follow Button Component | EP0004 | Neildren | 1 | Draft |
| US0023 | Personalized Feed API | EP0005 | Richard | 3 | Draft |
| US0024 | Discovery Feed API | EP0005 | Richard | 2 | Draft |
| US0025 | Photo Card Component | EP0005 | Richard | 2 | Draft |
| US0026 | Feed Page with Infinite Scroll | EP0005 | Richard | 3 | Draft |
| US0027 | Feed Empty State | EP0005 | Richard | 1 | Draft |
| US0028 | Feed Query Optimization | EP0005 | Richard | 2 | Draft |

**Total Story Points:** 65

---

## Story Dependencies (Critical Path)

### Phase 1: Foundation (Week 1-2)
**Can Start Immediately:**
- US0001, US0002, US0003, US0004, US0005 (EP0001 - Richard)
- US0011, US0013 (EP0003 - Ethel can start schema work)

**Blocked:**
- All other stories wait for US0001-US0005 (auth foundation)

### Phase 2: Core Features (Week 3-4)
**Can Start After Phase 1:**
- US0006-US0010 (EP0002 - Mark) - requires US0001 (User model), US0011 (Photo model)
- US0012, US0014, US0015 (EP0003 - Ethel) - requires US0003 (auth middleware)
- US0016-US0022 (EP0004 - Neildren) - requires US0003 (auth), US0011 (Photo model)

**Critical Cross-Team Dependency:**
- US0009 (Mark - profile picture upload) reuses US0012 (Ethel - S3 upload logic)

### Phase 3: Integration (Week 5-6)
**Can Start After Phase 2:**
- US0023-US0028 (EP0005 - Richard) - requires US0011 (Photo), US0017 (Like), US0020 (Follow), US0021 (Like button)

---

## Coordination Notes

### Shared Components
1. **Upload Service** (Ethel → Mark)
   - US0012 creates reusable S3 upload service
   - US0009 imports and uses it for profile pictures

2. **Like Button** (Neildren → Richard)
   - US0021 creates reusable Like button component
   - US0025 imports and uses it in photo cards

3. **Auth Middleware** (Richard → All)
   - US0003 creates auth middleware
   - US0008, US0009, US0012, US0014, US0016, US0019, US0023 all use it

### Schema Coordination
- **User Model:** US0001 (Richard) - shared with US0006, US0019, US0020
- **Photo Model:** US0011 (Ethel) - shared with US0007, US0016, US0023, US0024

---

## Notes

- Stories are numbered globally (US0001, US0002, etc.)
- Story points total 65 across all epics (13 per epic × 5 epics)
- Detailed story files created for US0001-US0003
- Remaining stories (US0004-US0028) documented in index with key details
- Each developer should review their assigned stories before starting work
- Story points should be validated during team refinement

---

## Next Steps

1. **Team Review**
   - Each developer reviews their assigned stories
   - Validate story points and acceptance criteria
   - Flag any unclear requirements

2. **Story Refinement**
   - Team discusses and refines stories together
   - Adjust story points based on team estimates
   - Break down any stories >5 points

3. **Start Development**
   - Richard begins US0001 (User Registration)
   - Ethel begins US0011 (Photo Model planning)
   - Mark and Neildren plan their Phase 2 work

4. **Create Detailed Story Files**
   - As each story is picked up, developer can create full story markdown file using template
   - Or use existing US0001-US0003 as examples

5. **Track Progress**
   - Update story status as work progresses (Draft → Ready → Planned → In Progress → Review → Done)
   - Update this index regularly

---

**Ready to start?** Each developer now has clear story assignments. Begin with Richard's US0001, the foundation for all other work.
