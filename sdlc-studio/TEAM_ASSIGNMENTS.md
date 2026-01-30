# Team Epic Assignments - inchagram v0.1.0

**Date:** 2026-01-30
**Team:** Richard, Mark, Ethel, Neildren

---

## Epic Ownership

| Epic | Owner | Focus | Est. Duration | Dependencies |
|------|-------|-------|---------------|--------------|
| **EP0001** - User Authentication | **Richard** | Backend | 2 weeks | None (foundation) |
| **EP0002** - User Profiles | **Mark** | Full-stack | 2 weeks | EP0001, EP0003 |
| **EP0003** - Photo Upload & Storage | **Ethel** | Backend | 2 weeks | EP0001 (minor) |
| **EP0004** - Social Interactions | **Neildren** | Full-stack | 2 weeks | EP0001, EP0003 |
| **EP0005** - Photo Feeds | **Richard** | Full-stack | 2 weeks | EP0001, EP0003, EP0004 |

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

#### Richard - EP0001 (User Authentication)
**Work:**
- User registration API endpoint
- User login API endpoint with JWT
- JWT authentication middleware
- User model and MongoDB schema
- Password hashing with bcrypt
- Input validation for auth endpoints

**Key Deliverables:**
- `/src/routes/auth.ts`
- `/src/models/User.ts`
- `/src/middleware/auth.ts`
- Working registration and login
- JWT token generation/validation

**Blockers:** None - this is the foundation

**Team Impact:** Provides User model and auth middleware for all other epics

---

#### Ethel - EP0003 (Photo Upload & Storage)
**Work:**
- Photo model and MongoDB schema
- AWS S3 integration and configuration
- Photo upload API endpoint with Multer
- File validation (type, size, format)
- Photo deletion (MongoDB + S3 cleanup)

**Key Deliverables:**
- `/src/routes/photos.ts`
- `/src/models/Photo.ts`
- `/src/services/s3Service.ts`
- Working photo upload to S3
- Photo metadata storage in MongoDB

**Blockers:** Minor dependency on EP0001 User model (can start schema work)

**Team Impact:** Provides Photo model for EP0002 (profile grid), EP0004 (likes), EP0005 (feeds)

---

#### Mark - EP0002 Planning
**Work:**
- Plan profile UI components
- Design profile API contracts
- Set up React project structure
- Create shared component library foundation

**Coordination:** Wait for Richard's User model schema

---

#### Neildren - EP0004 Planning
**Work:**
- Plan social interaction components
- Design Like/Follow button components
- Plan MongoDB relationship models
- Set up frontend state management patterns

**Coordination:** Wait for Richard's auth middleware and Ethel's Photo model

---

### Phase 2: Feature Development (Week 3-4)

#### Mark - EP0002 (User Profiles)
**Work:**
- Profile page component (view any user's profile)
- Profile photo grid component
- Edit profile modal/page (display name, bio)
- Upload/update profile picture functionality
- Profile API endpoints (GET, PUT users/:userId)
- Profile routing (/profile/:username)

**Key Deliverables:**
- `/src/routes/users.ts`
- `/src/components/Profile/ProfilePage.tsx`
- `/src/components/Profile/PhotoGrid.tsx`
- `/src/components/Profile/EditProfileModal.tsx`
- Working profile viewing and editing

**Dependencies:**
- **Richard:** User model, auth middleware
- **Ethel:** Photo model for grid, reusable upload component

**Coordination Points:**
- **With Ethel:** Coordinate on shared upload component for profile pictures
- Use Ethel's S3 upload logic for avatar uploads

---

#### Neildren - EP0004 (Social Interactions)
**Work:**
- Like/unlike photo API endpoints
- Follow/unfollow user API endpoints
- Like and Follow models with compound indexes
- Like button component with state management
- Follow button component with state management
- View photo likes list
- Optimistic UI updates for better UX

**Key Deliverables:**
- `/src/routes/likes.ts`
- `/src/routes/follows.ts`
- `/src/models/Like.ts`
- `/src/models/Follow.ts`
- `/src/components/LikeButton.tsx`
- `/src/components/FollowButton.tsx`
- Working like/unlike and follow/unfollow

**Dependencies:**
- **Richard:** User model, auth middleware
- **Ethel:** Photo model for likes

**Coordination Points:**
- Share Like button component with EP0005 (feeds will use it)
- Ensure atomic operations on like counts

---

#### Richard - EP0005 Planning & Support
**Work:**
- Plan feed API queries and optimization
- Design feed pagination strategy
- Support Mark and Neildren with code reviews
- Prepare feed infrastructure

**Coordination:** Stays available for auth/User model questions

---

#### Ethel - EP0003 Completion & Support
**Work:**
- Complete and polish photo upload
- Create reusable upload component for Mark
- Test S3 integration thoroughly
- Support team with upload questions

**Coordination:**
- **With Mark:** Create shared `UploadService` or `useUpload` hook for profile pictures

---

### Phase 3: Integration (Week 5-6)

#### Richard - EP0005 (Photo Feeds) - Lead
**Work:**
- Personalized feed API endpoint (photos from followed users)
- Discovery feed API endpoint (all public photos)
- Feed page component with infinite scroll
- Photo card component for feed
- Feed pagination and query optimization
- Empty state handling

**Key Deliverables:**
- `/src/routes/feed.ts`
- `/src/pages/FeedPage.tsx`
- `/src/components/Feed/PhotoCard.tsx`
- `/src/components/Feed/InfiniteScroll.tsx`
- Working personalized and discovery feeds

**Dependencies:**
- **Richard:** EP0001 (auth for personalized feed)
- **Ethel:** EP0003 (Photo model)
- **Neildren:** EP0004 (Follow model, Like button component)

**Team Support:** Everyone assists with integration testing

---

#### Full Team - Integration & Testing
**Work:**
- Integration testing across all epics
- Bug fixes and polish
- Performance optimization
- Documentation updates
- Code reviews
- Deployment preparation

---

## Critical Coordination Points

### 1. User Model Schema (Richard → All)
**When:** Week 1, early
**What:** Richard defines User model schema
**Who Needs It:** Mark (profiles), Neildren (social), Ethel (photo ownership)
**Action:** Richard shares schema definition in team chat once ready

### 2. Photo Model Schema (Ethel → Mark, Neildren, Richard)
**When:** Week 1-2
**What:** Ethel defines Photo model schema
**Who Needs It:** Mark (profile grid), Neildren (likes), Richard (feeds)
**Action:** Ethel shares schema definition once ready

### 3. Upload Component (Ethel → Mark)
**When:** Week 2-3
**What:** Reusable upload logic for files to S3
**Who Needs It:** Mark for profile picture uploads
**Action:** Ethel creates `UploadService` or `useUpload` hook, Mark imports it

### 4. Auth Middleware (Richard → All)
**When:** Week 1, mid-late
**What:** JWT authentication middleware for protected routes
**Who Needs It:** Everyone for protected API endpoints
**Action:** Richard shares middleware implementation, everyone uses it

### 5. Like Button Component (Neildren → Richard)
**When:** Week 4
**What:** Reusable Like button component
**Who Needs It:** Richard for EP0005 feed photo cards
**Action:** Neildren creates component, Richard imports it into feed

---

## File Ownership (Avoid Conflicts)

### Richard
- `/src/routes/auth.ts`
- `/src/middleware/auth.ts`
- `/src/models/User.ts`
- `/src/routes/feed.ts` (EP0005)
- `/src/pages/FeedPage.tsx` (EP0005)

### Mark
- `/src/routes/users.ts`
- `/src/components/Profile/**`
- `/src/pages/ProfilePage.tsx`

### Ethel
- `/src/routes/photos.ts`
- `/src/models/Photo.ts`
- `/src/services/s3Service.ts`
- `/src/services/uploadService.ts` (shared)

### Neildren
- `/src/routes/likes.ts`
- `/src/routes/follows.ts`
- `/src/models/Like.ts`
- `/src/models/Follow.ts`
- `/src/components/LikeButton.tsx`
- `/src/components/FollowButton.tsx`

### Shared (Coordinate)
- `/src/models/` (all models - discuss schema changes)
- `/src/components/shared/` (shared components)
- `/src/services/` (shared services like upload)

---

## Git Branch Strategy

### Branch Naming
- **Richard:** `feature/EP0001-user-auth`, `feature/EP0005-photo-feeds`
- **Mark:** `feature/EP0002-user-profiles`
- **Ethel:** `feature/EP0003-photo-upload`
- **Neildren:** `feature/EP0004-social-interactions`

### Merge Strategy
1. Daily pull from `main` to stay updated
2. Create PR when epic is feature-complete
3. Request code review from at least 1 other developer
4. Merge to `main` after approval
5. Delete feature branch after merge

### Conflict Prevention
- Each developer works in their own route/component files
- Coordinate before modifying shared files (models, services)
- Use team chat to announce schema changes
- Pull from `main` daily to catch integration issues early

---

## Daily Standup Template

**What I did yesterday:**
- [List completed work]

**What I'm doing today:**
- [List planned work]

**Blockers:**
- [List anything blocking progress]

**Need from team:**
- [List coordination needs, e.g., "Need User model schema from Richard"]

---

## Communication Channels

**Quick Questions:** Team chat
**Schema Changes:** Post in team chat before committing
**Blocked:** Tag relevant developer in chat immediately
**Code Reviews:** GitHub PR comments
**Integration Issues:** Call a quick team sync

---

## Success Criteria

### Week 2 Checkpoint
- ✅ Richard: EP0001 complete, auth working
- ✅ Ethel: EP0003 complete, photo upload working
- ✅ Mark: EP0002 started, profile UI in progress
- ✅ Neildren: EP0004 started, social models defined

### Week 4 Checkpoint
- ✅ Mark: EP0002 complete, profiles working
- ✅ Neildren: EP0004 complete, likes/follows working
- ✅ Richard: EP0005 started, feed API in progress
- ✅ Ethel: Supporting team, upload component shared

### Week 6 Target
- ✅ Richard: EP0005 complete, feeds working
- ✅ Team: All epics integrated and tested
- ✅ Team: v0.1.0 ready for deployment

---

## Next Action: Generate User Stories

Once everyone has reviewed their epic assignments, run:

```bash
/sdlc-studio story
```

This will generate detailed user stories for each epic with specific acceptance criteria, breaking the work down into implementable units.

Each developer will then have:
- Epic overview (already complete)
- 4-7 user stories per epic
- Clear acceptance criteria per story
- Story points for estimation

---

**Ready to start building inchagram!** 🚀
