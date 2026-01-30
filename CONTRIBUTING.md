# Contributing to Inchagram

Welcome to the Inchagram development team! This guide will help you understand our development workflow, coding standards, and collaboration practices.

## 👥 Team

- **Richard** - EP0001: User Authentication & Account Management
- **Mark** - EP0002: User Profiles & Profile Management
- **Ethel** - EP0003: Photo Upload & Storage
- **Neildren** - EP0004: Social Interactions (Likes & Follows)

## 🚀 Getting Started

### Initial Setup

```bash
# 1. Clone the repository
git clone git@github.com:richarddaleumayan/inchagram.git
cd inchagram

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your MongoDB connection

# 4. Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# 5. Run tests to verify setup
npm test

# 6. Start development server
npm run dev
```

### Daily Workflow

```bash
# Start of day - get latest changes
git checkout main
git pull origin main

# Check your assigned stories
cat sdlc-studio/stories/_index.md
# Or view your epic
cat sdlc-studio/epics/EP000X-*.md
```

## 📋 Development Workflow

### 1. Story Selection

**Check your assignments in `sdlc-studio/stories/_index.md`:**
- Ensure dependencies are met (blocked-by stories are Done)
- Verify you have all required context (PRD, TRD, Epic)
- Confirm story status is "Ready" or "Planned"

### 2. Create Feature Branch

**Branch Naming Convention:**
```bash
# For user stories
git checkout -b US0006/view-user-profile

# For bug fixes
git checkout -b bugfix/US0006/fix-profile-photo-loading

# For shared services
git checkout -b shared/s3-upload-service

# For documentation
git checkout -b docs/update-api-documentation
```

**Branch name format:** `<type>/<story-id>/<brief-description>`

### 3. Implement Using SDLC Studio

```bash
# Execute full story workflow (8 phases)
/sdlc-studio story implement --story US0006

# Or run phases individually if needed
/sdlc-studio code plan --story US0006
/sdlc-studio test-spec --story US0006
/sdlc-studio test-automation --spec TS0006
/sdlc-studio code implement --plan PL0006
/sdlc-studio code test --story US0006
/sdlc-studio code verify --story US0006
/sdlc-studio code check
```

### 4. Commit Guidelines

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `test:` Add or update tests
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `style:` Formatting, missing semicolons, etc.
- `chore:` Maintenance tasks

**Examples:**
```bash
# Good commits
git commit -m "feat(auth): Add user registration endpoint (US0001)

- Implement POST /api/v1/auth/register
- Add email/username validation
- Hash passwords with bcrypt
- 20/20 tests passing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git commit -m "test(profile): Add profile view integration tests (US0006)

- 15 test cases covering all AC
- Test photo grid pagination
- Verify follower/following counts"

git commit -m "fix(auth): Handle empty email validation (US0001)

Fixes edge case where empty string bypassed validation"
```

**Bad commits (avoid these):**
```bash
git commit -m "fixed stuff"           # ❌ Too vague
git commit -m "WIP"                   # ❌ Not descriptive
git commit -m "asdf"                  # ❌ Meaningless
git commit -m "Final final version"   # ❌ No context
```

### 5. Push and Create Pull Request

```bash
# Push your branch
git push -u origin US0006/view-user-profile

# Create PR using GitHub CLI (recommended)
gh pr create --title "feat: User Profile View API (US0006)" --body "$(cat <<'EOF'
## Story
US0006: View User Profile API Endpoint

## Summary
- Implemented GET /api/v1/users/:userId endpoint
- Added profile photo grid with pagination (20 photos per page)
- Display follower/following/photo counts
- Error handling for non-existent users

## Testing
- ✅ 15/15 integration tests passing
- ✅ 85% code coverage
- ✅ All 5 acceptance criteria verified
- ✅ Linting passed (0 errors)

## Acceptance Criteria
- [x] AC1: View any profile by username
- [x] AC2: Display username, display name, bio, profile picture
- [x] AC3: Show follower/following/photo counts
- [x] AC4: Photo grid shows user's photos in chronological order
- [x] AC5: Clicking photo navigates to detail view

## Dependencies
- Depends on: US0001 (User Model) - ✅ Merged
- Blocks: US0020 (Follow button on profile)

## Files Changed
- `src/routes/profile.ts` - Profile routes
- `src/controllers/profileController.ts` - Profile logic
- `tests/integration/profile.test.ts` - Integration tests
- `sdlc-studio/plans/PL0006-*.md` - Implementation plan
- `sdlc-studio/test-specs/TS0006-*.md` - Test specification

## Checklist
- [x] All acceptance criteria met
- [x] Tests written and passing
- [x] Code linted (0 errors)
- [x] Documentation updated
- [x] SDLC artifacts updated
- [x] No merge conflicts with main

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# Or create via GitHub UI if you prefer
```

## 🔍 Code Review Process

### For Authors

**Before requesting review:**
- ✅ All tests pass locally (`npm test`)
- ✅ Linting passes (`npm run lint`)
- ✅ Story status updated to "Review" or "Done"
- ✅ PR description is complete
- ✅ Commits are clean and well-messaged

**During review:**
- Respond to comments within 24 hours
- Make requested changes in new commits (don't force push)
- Re-request review after addressing feedback

### For Reviewers

**Review checklist:**

```bash
# 1. Check out the PR
gh pr checkout 123

# 2. Review SDLC artifacts
cat sdlc-studio/stories/US0006-*.md        # Story status = "Done"?
cat sdlc-studio/plans/PL0006-*.md          # Plan complete?
cat sdlc-studio/test-specs/TS0006-*.md     # Test coverage adequate?

# 3. Run tests
npm test                                    # All passing?
npm run test:integration                    # Integration tests?

# 4. Check code quality
npm run lint                                # No errors?

# 5. Manual testing
npm run dev
# Test the endpoints manually

# 6. Review code
# - Does it match the acceptance criteria?
# - Are edge cases handled?
# - Is error handling comprehensive?
# - Does it follow existing patterns?
# - Is it readable and maintainable?
```

**Approval criteria:**
- ✅ All acceptance criteria verified
- ✅ Tests comprehensive and passing
- ✅ Code follows project conventions
- ✅ No security vulnerabilities
- ✅ Documentation complete
- ✅ No unnecessary complexity

**Provide constructive feedback:**
```markdown
# Good feedback
"Consider adding validation for the userId parameter to handle malformed ObjectIds.
This will prevent MongoDB cast errors. Example:
```typescript
if (!mongoose.Types.ObjectId.isValid(userId)) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
```

# Bad feedback
"This is wrong"  # Not helpful
"Rewrite this"   # Too vague
```

## 🎨 Coding Standards

### TypeScript Style

```typescript
// ✅ Good
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
}

export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<IUser> {
  // Implementation
}

// ❌ Bad
export interface user {  // Use PascalCase for interfaces, prefix with "I"
  Username: string;      // Use camelCase for properties
  EMAIL: string;         // Avoid all caps
}

export async function Register_User(Email, Username, Password) {  // Missing types
  // Implementation
}
```

### API Response Format

**Always use standardized response format:**

```typescript
// Success response
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": { /* additional context */ }
  }
}
```

### Error Handling

```typescript
// ✅ Good - Specific error handling
try {
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
        details: { userId }
      }
    });
  }
  // Continue...
} catch (error) {
  console.error('Error fetching user:', error);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch user',
      details: {}
    }
  });
}

// ❌ Bad - Generic error handling
try {
  const user = await User.findById(userId);
  // No null check
  res.json(user);
} catch (error) {
  res.status(500).json({ error: 'Error' });  // Too vague
}
```

### Testing Standards

```typescript
// ✅ Good - Descriptive test with clear assertions
describe('TC001: Successful Registration', () => {
  it('should create user with valid email, username, and password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.userId).toBeDefined();
    expect(response.body.data.username).toBe('testuser');

    // Verify in database
    const user = await User.findById(response.body.data.userId);
    expect(user).toBeTruthy();
    expect(user?.passwordHash).toMatch(/^\$2[ab]\$/);  // bcrypt format
  });
});

// ❌ Bad - Vague test
it('should work', async () => {
  const response = await request(app).post('/api/v1/auth/register');
  expect(response.status).toBe(201);  // No data verification
});
```

## 🔒 File Ownership & Conflict Avoidance

### File Ownership Map

| Developer | Primary Files | Don't Modify Without Asking |
|-----------|---------------|----------------------------|
| **Richard** | `src/middleware/auth.ts`<br>`src/controllers/authController.ts`<br>`src/routes/auth.ts` | Coordinate for changes |
| **Mark** | `src/controllers/profileController.ts`<br>`src/routes/profile.ts`<br>`src/components/Profile/*` | Ask Mark first |
| **Ethel** | `src/models/Photo.ts`<br>`src/services/s3Service.ts`<br>`src/controllers/photoController.ts` | Ask Ethel first |
| **Neildren** | `src/models/Like.ts`<br>`src/models/Follow.ts`<br>`src/controllers/socialController.ts` | Ask Neildren first |

### Shared Files (Coordinate Changes)

- `src/models/User.ts` - Owned by Richard, but others may need to reference
- `src/app.ts` - All developers add routes here (coordinate)
- `src/utils/*` - Shared utilities (create PR for new utilities)

### When You Need to Modify Someone Else's File

1. **Check with the owner first:**
   ```
   "@Ethel - I need to add a `userId` field to the Photo model for US0020.
   Can you add it, or should I create a PR with the change?"
   ```

2. **Create a small, focused PR:**
   ```bash
   git checkout -b chore/add-userid-to-photo-model
   # Make minimal change
   git commit -m "chore(photo): Add userId field to Photo model

   Requested by Neildren for US0020 (Follow Model).
   Just adding the field, no logic changes.

   cc: @Ethel"
   gh pr create
   ```

3. **Get quick approval:**
   - Tag the file owner in PR
   - Keep changes minimal
   - Merge quickly to unblock work

## 🧪 Testing Requirements

### Minimum Coverage

- **Overall:** 80% statements, branches, functions, lines
- **New code:** 90% coverage for new files
- **Critical paths:** 100% coverage (auth, payments, data loss scenarios)

### Test Types by Story Type

| Story Type | Unit Tests | Integration Tests | E2E Tests |
|------------|-----------|-------------------|-----------|
| API Endpoint | Optional | **Required** | Optional |
| Business Logic | **Required** | Recommended | No |
| UI Component | **Required** | No | Recommended |
| Database Model | No | **Required** | No |

### Running Tests

```bash
# All tests
npm test

# Watch mode (during development)
npm run test:watch

# Only integration tests
npm run test:integration

# Specific test file
npm test -- tests/integration/auth.test.ts

# With coverage report
npm test -- --coverage

# Debug failing test
npm test -- --verbose tests/integration/auth.test.ts
```

## 📦 Dependencies

### Adding New Dependencies

**Before adding a dependency:**
1. Check if existing dependency can solve the problem
2. Evaluate: bundle size, maintenance, security
3. Discuss with team if it's a major dependency

**How to add:**
```bash
# Production dependency
npm install <package>

# Dev dependency
npm install -D <package>

# Commit with explanation
git commit -m "chore(deps): Add <package> for <reason>

Used in US0006 for <specific use case>.
Alternatives considered: <list>
Chose this because: <reason>"
```

**Avoid:**
- Unused dependencies
- Deprecated packages
- Packages with known security vulnerabilities
- Heavy packages for simple tasks (e.g., don't import lodash for one function)

## 🚨 Common Issues & Solutions

### Merge Conflicts

```bash
# If conflict in your branch
git checkout main
git pull origin main
git checkout US0006/feature
git merge main
# Resolve conflicts
git add .
git commit -m "chore: Merge main into US0006/feature"
git push

# If conflict in SDLC files (index files)
git checkout --theirs sdlc-studio/stories/_index.md
git add sdlc-studio/stories/_index.md
git commit -m "chore: Accept remote story index"
```

### Tests Failing in CI But Pass Locally

```bash
# Use same Node version as CI
nvm use 20

# Clear Jest cache
npm test -- --clearCache

# Check for race conditions
npm test -- --runInBand

# Run multiple times
for i in {1..10}; do npm test || break; done
```

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Restart MongoDB
docker restart mongodb

# Check logs
docker logs mongodb

# Reset database (CAREFUL - deletes data)
docker exec -it mongodb mongosh
> use inchagram
> db.dropDatabase()
```

## 📞 Communication

### When to Ask for Help

**Ask immediately if:**
- Blocked by dependency for > 2 hours
- Security concern or vulnerability found
- Major architectural decision needed
- Breaking change required

**How to ask:**
```
"@team - Blocked on US0020 (Follow Model)

**Issue:** Need to modify User model to add followerCount field
**Impact:** Affects Richard's EP0001 work
**Options:**
1. Add field now (may cause merge conflicts)
2. Wait for EP0001 to complete
3. Use aggregation instead of denormalized count

**Recommendation:** Option 3 for now, add denormalized field in v0.2.0

Thoughts?"
```

### Daily Async Standup

Post in team chat:
```
📅 2026-01-31

✅ Yesterday:
- Completed US0006 (Profile View API)
- Created PR #123

🔄 Today:
- Starting US0007 (Profile Photo Grid)
- ETA: EOD

🚫 Blockers:
- None

📊 EP0002 Progress: 40% (2/5 stories)
```

## 🎓 Resources

### Project Documentation
- [README.md](README.md) - Project overview and setup
- [sdlc-studio/prd.md](sdlc-studio/prd.md) - Product requirements
- [sdlc-studio/trd.md](sdlc-studio/trd.md) - Technical requirements
- [SHARED_SERVICES.md](SHARED_SERVICES.md) - Reusable services
- [sdlc-studio/DEPENDENCIES.md](sdlc-studio/DEPENDENCIES.md) - Story dependencies

### External Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## 📝 License

MIT - See [LICENSE](LICENSE) file for details.

---

**Questions?** Ask in the team chat or create a discussion in GitHub Discussions.

**Found a bug?** Create an issue using `/sdlc-studio bug`

**Ready to contribute?** Check `sdlc-studio/stories/_index.md` for your assigned stories! 🚀
