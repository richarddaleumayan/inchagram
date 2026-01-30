# Shared Services & Components

This document tracks reusable services, utilities, and components created by team members. These are meant to be **used** by others, not modified directly.

> **Rule:** If you need to modify a shared service, create a PR and tag the owner for review.

---

## 🔐 Authentication Services

### JWT Token Service
**Owner:** Richard
**Story:** US0002 (User Login & JWT Token)
**File:** `src/services/jwtService.ts`
**Status:** 🚧 Planned

#### Usage:
```typescript
import { generateToken, verifyToken } from '../services/jwtService';

// Generate JWT token
const token = generateToken(userId, expiresIn);

// Verify JWT token
const payload = verifyToken(token);
```

#### API:
- `generateToken(userId: string, expiresIn?: string): string`
- `verifyToken(token: string): { userId: string } | null`
- `refreshToken(oldToken: string): string`

#### Configuration:
- Uses `JWT_SECRET` from environment
- Default expiration: 7 days
- Algorithm: HS256

**Dependencies:** None
**Used by:** US0003 (Auth Middleware), US0004 (Get Profile)

---

### Authentication Middleware
**Owner:** Richard
**Story:** US0003 (JWT Auth Middleware)
**File:** `src/middleware/auth.ts`
**Status:** 🚧 Planned

#### Usage:
```typescript
import { authenticate, optionalAuth } from '../middleware/auth';

// Protected route - requires authentication
router.get('/profile', authenticate, getProfile);

// Optional auth - adds user to req if authenticated
router.get('/photos', optionalAuth, getPhotos);
```

#### API:
- `authenticate` - Middleware that requires valid JWT token
- `optionalAuth` - Middleware that adds user to req if token present
- Adds `req.user` with `{ userId: string, username: string }`

#### Error Responses:
- 401: Missing or invalid token
- 403: Token expired

**Dependencies:** JWT Token Service
**Used by:** All protected routes (US0004+)

---

## 📸 Photo Services

### S3 Upload Service
**Owner:** Ethel
**Story:** US0012 (Photo Upload API with S3 Integration)
**File:** `src/services/s3Service.ts`
**Status:** 🚧 Planned

#### Usage:
```typescript
import { uploadToS3, deleteFromS3, generateS3Key } from '../services/s3Service';

// Upload photo to S3
const photoUrl = await uploadToS3(
  fileBuffer,
  'photos/userId/1234567890-abc123.jpg',
  'image/jpeg'
);

// Delete photo from S3
await deleteFromS3('photos/userId/1234567890-abc123.jpg');

// Generate unique S3 key
const key = generateS3Key(userId, originalFilename);
// Returns: photos/{userId}/{timestamp}-{uuid}.{ext}
```

#### API:
- `uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string>`
  - Returns: Public URL of uploaded file

- `deleteFromS3(key: string): Promise<void>`
  - Deletes file from S3

- `generateS3Key(userId: string, filename: string, prefix?: string): string`
  - Generates unique key: `{prefix}/{userId}/{timestamp}-{uuid}.{ext}`
  - Default prefix: "photos"

#### Configuration:
- Uses environment variables:
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_S3_BUCKET`
- Bucket structure: `{bucket}/photos/{userId}/{timestamp}-{uuid}.{ext}`

#### Error Handling:
- Throws on S3 upload failure (caller should catch)
- Retries 3 times with exponential backoff
- Logs errors to console

**Dependencies:** AWS SDK (@aws-sdk/client-s3)
**Used by:** US0012 (Photo Upload), US0009 (Profile Picture Upload)

---

### Photo Validation Service
**Owner:** Ethel
**Story:** US0013 (File Validation - Type, Size, Format)
**File:** `src/services/photoValidation.ts`
**Status:** 🚧 Planned

#### Usage:
```typescript
import { validatePhoto } from '../services/photoValidation';

// Validate uploaded photo
const validation = validatePhoto(file);
if (!validation.valid) {
  return res.status(400).json({
    error: validation.error
  });
}
```

#### API:
- `validatePhoto(file: { mimetype: string, size: number }): { valid: boolean, error?: string }`

#### Validation Rules:
- **Allowed types:** image/jpeg, image/png, image/webp
- **Max size:** 10MB
- **Min dimensions:** 100x100 pixels (future)
- **Max dimensions:** 4096x4096 pixels (future)

**Dependencies:** None
**Used by:** US0012 (Photo Upload), US0009 (Profile Picture)

---

## 🛠️ Utility Services

### Validation Utilities
**Owner:** Richard
**Story:** US0001 (User Registration API)
**File:** `src/utils/validation.ts`
**Status:** ✅ Ready to use

#### Usage:
```typescript
import { isValidEmail, isValidUsername, isValidPassword } from '../utils/validation';

// Validate email
if (!isValidEmail(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}

// Validate username
const usernameCheck = isValidUsername(username);
if (!usernameCheck.isValid) {
  return res.status(400).json({ error: usernameCheck.error });
}

// Validate password
const passwordCheck = isValidPassword(password);
if (!passwordCheck.isValid) {
  return res.status(400).json({ error: passwordCheck.error });
}
```

#### API:
- `isValidEmail(email: string): boolean`
  - Returns: true if email format is valid

- `isValidUsername(username: string): { isValid: boolean, error?: string }`
  - Validates: 3-30 chars, alphanumeric + underscore, no whitespace

- `isValidPassword(password: string): { isValid: boolean, error?: string }`
  - Validates: Minimum 8 characters

- `sanitizeString(input: string): string`
  - Returns: Trimmed string

**Dependencies:** None
**Used by:** US0001 (Registration), US0002 (Login), US0008 (Edit Profile)

---

### Error Handler Middleware
**Owner:** Richard
**Story:** US0001 (User Registration API)
**File:** `src/middleware/errorHandler.ts`
**Status:** ✅ Ready to use

#### Usage:
```typescript
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';

// In app.ts - always add last
app.use(notFoundHandler);  // 404 handler
app.use(errorHandler);     // Global error handler
```

#### API:
- `errorHandler` - Catches all errors, formats response
- `notFoundHandler` - Handles 404 routes

#### Response Format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

**Dependencies:** None
**Used by:** All routes (automatic via app.ts)

---

### Response Formatter
**Owner:** Richard
**Story:** US0001 (User Registration API)
**Status:** 🚧 Could be extracted to utility

#### Pattern (currently inline, could be centralized):
```typescript
// Success response
res.status(200).json({
  success: true,
  data: { /* actual data */ },
  message: "Operation successful"
});

// Error response
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Human-readable error',
    details: { field: 'email', issue: 'Invalid format' }
  }
});
```

**Future:** Could be centralized in `src/utils/response.ts`

---

## 📊 Database Utilities

### MongoDB Connection
**Owner:** Richard
**Story:** US0001 (User Registration API)
**File:** `src/config/database.ts`
**Status:** ✅ Ready to use

#### Usage:
```typescript
import { connectDatabase, disconnectDatabase } from '../config/database';

// In server.ts (already implemented)
await connectDatabase();

// For graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});
```

#### API:
- `connectDatabase(): Promise<void>` - Connects to MongoDB
- `disconnectDatabase(): Promise<void>` - Closes connection

**Dependencies:** Mongoose
**Used by:** All database operations

---

### Test Database Setup
**Owner:** Richard
**Story:** US0001 (User Registration API)
**File:** `tests/setup.ts`
**Status:** ✅ Ready to use

#### Usage:
```typescript
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';

describe('My Test Suite', () => {
  beforeAll(async () => {
    await connectDatabase();  // Connects to in-memory MongoDB
  });

  afterAll(async () => {
    await closeDatabase();    // Closes and stops MongoDB
  });

  beforeEach(async () => {
    await clearDatabase();    // Clears all collections
  });

  it('should test something', async () => {
    // Test code
  });
});
```

#### API:
- `connectDatabase(): Promise<void>` - Creates in-memory MongoDB
- `closeDatabase(): Promise<void>` - Stops in-memory MongoDB
- `clearDatabase(): Promise<void>` - Clears all collections

**Dependencies:** mongodb-memory-server
**Used by:** All integration tests

---

## 🎨 Frontend Components (Future)

### Photo Card Component
**Owner:** Richard (Frontend)
**Story:** US0025 (Photo Card Component for Feeds)
**File:** `src/components/Feed/PhotoCard.tsx`
**Status:** 🚧 Planned

#### Usage:
```tsx
import PhotoCard from '../components/Feed/PhotoCard';

<PhotoCard
  photo={photo}
  onLike={handleLike}
  onNavigate={handleNavigate}
/>
```

**Dependencies:** US0021 (Like Button), US0023 (Feed API)

---

### Like Button Component
**Owner:** Neildren (Frontend)
**Story:** US0021 (Like Button Component)
**File:** `src/components/LikeButton.tsx`
**Status:** 🚧 Planned

#### Usage:
```tsx
import LikeButton from '../components/LikeButton';

<LikeButton
  photoId={photo.id}
  isLiked={photo.isLikedByUser}
  likeCount={photo.likeCount}
  onToggle={handleLikeToggle}
/>
```

**Dependencies:** US0016 (Like/Unlike API)

---

### Follow Button Component
**Owner:** Neildren (Frontend)
**Story:** US0022 (Follow Button Component)
**File:** `src/components/FollowButton.tsx`
**Status:** 🚧 Planned

#### Usage:
```tsx
import FollowButton from '../components/FollowButton';

<FollowButton
  userId={user.id}
  isFollowing={user.isFollowedByCurrentUser}
  onToggle={handleFollowToggle}
/>
```

**Dependencies:** US0019 (Follow/Unfollow API)

---

## 📝 Conventions

### Creating a New Shared Service

**1. Document it here first:**
```markdown
### Service Name
**Owner:** Your Name
**Story:** US0XXX
**File:** `src/services/serviceName.ts`
**Status:** 🚧 In Development

#### Usage:
[Code example]

#### API:
[Function signatures]

**Dependencies:** [List dependencies]
**Used by:** [List stories that will use it]
```

**2. Implement with tests:**
```bash
# Create service
src/services/serviceName.ts

# Create tests
tests/unit/services/serviceName.test.ts

# Ensure > 90% coverage
npm test -- tests/unit/services/serviceName.test.ts
```

**3. Update this document:**
```bash
git add SHARED_SERVICES.md
git commit -m "docs: Document new shared service - serviceName (US0XXX)"
```

**4. Announce to team:**
```
"🎉 New shared service available: serviceName

📁 File: src/services/serviceName.ts
📖 Docs: SHARED_SERVICES.md#service-name
✅ Tests: 95% coverage
🔗 Story: US0XXX

Usage:
```typescript
import { doSomething } from '../services/serviceName';
const result = doSomething(input);
```

Let me know if you have questions!"
```

### Modifying an Existing Shared Service

**1. Check with the owner first:**
```
"@Owner - I need to add a new parameter to serviceName.doSomething() for US0XXX.

**Proposed change:**
```typescript
// Before
doSomething(input: string): string

// After
doSomething(input: string, options?: { validate?: boolean }): string
```

**Backward compatible:** Yes (optional parameter)
**Impact:** None (existing code continues to work)

Can I create a PR or would you prefer to make this change?"
```

**2. Create focused PR:**
```bash
git checkout -b chore/extend-service-name
# Make minimal change
# Update tests
# Update this document
git commit -m "feat(shared): Add options parameter to serviceName (US0XXX)

Backward compatible change. Existing usages continue to work."
gh pr create
```

**3. Get owner approval before merging**

---

## 🔍 Service Status Legend

- ✅ **Ready to use** - Implemented, tested, documented
- 🚧 **Planned** - Documented but not implemented yet
- 🔄 **In Development** - Implementation in progress
- ⚠️ **Deprecated** - Avoid using, will be removed
- 🔒 **Locked** - Do not modify without owner approval

---

## 📋 Quick Reference

| Service | Owner | File | Status | Used By |
|---------|-------|------|--------|---------|
| JWT Token Service | Richard | `src/services/jwtService.ts` | 🚧 Planned | US0003+ |
| Auth Middleware | Richard | `src/middleware/auth.ts` | 🚧 Planned | All protected routes |
| S3 Upload Service | Ethel | `src/services/s3Service.ts` | 🚧 Planned | US0012, US0009 |
| Photo Validation | Ethel | `src/services/photoValidation.ts` | 🚧 Planned | US0012, US0009 |
| Validation Utils | Richard | `src/utils/validation.ts` | ✅ Ready | US0001, US0002, US0008 |
| Error Handler | Richard | `src/middleware/errorHandler.ts` | ✅ Ready | All routes |
| DB Connection | Richard | `src/config/database.ts` | ✅ Ready | All DB operations |
| Test Setup | Richard | `tests/setup.ts` | ✅ Ready | All integration tests |

---

**Questions?** Ask the service owner or create a discussion in GitHub.

**Need a new shared service?** Document it here first, then implement! 🚀
