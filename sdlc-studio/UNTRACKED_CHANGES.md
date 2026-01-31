# Untracked Changes Log

> **Purpose:** Document features/fixes implemented outside SDLC-STUDIO workflow
> **Created:** 2026-01-31
> **Last Tracked Story:** US0022 (Follow Button Component)

---

## Summary

After completing the initial user stories (US0001-US0022), the following work was completed outside of SDLC tracking. This is **normal for fast iteration** - this file serves as a reference for what exists beyond the formal stories.

**Total Untracked Work:** ~30 story points across 7+ features/fixes

---

## Untracked Features & Fixes

### 🔐 Password Reset Flow & Email Branding
- **Date:** 2026-01-31
- **Type:** Feature
- **Epic:** EP0001 (User Authentication)
- **Estimated Complexity:** 5 points
- **Status:** ✅ Completed
- **Description:**
  - Forgot password flow (request reset via email)
  - Password reset with token validation
  - Email branding (logo in all emails)
- **Files Changed:**
  - Backend: `User.ts`, `authController.ts`, `auth.ts`, `emailService.ts`, `app.ts`
  - Frontend: `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `App.tsx`, `design-system.css`
  - Assets: `public/assets/inchagram_logo_light.png`
- **Routes Added:**
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `GET /assets/*` (static file serving)
- **Git Commits:** Current HEAD + previous commits

---

### ✉️ Email Verification System
- **Date:** ~2026-01-30
- **Type:** Feature
- **Epic:** EP0001 (User Authentication)
- **Estimated Complexity:** 3 points
- **Status:** ✅ Completed
- **Description:** Email verification for user registration
- **Git Commit:** `58f2299`

---

### 🎨 UI Theme System Redesign
- **Date:** ~2026-01-30
- **Type:** Enhancement
- **Epic:** Cross-cutting (affects all features)
- **Estimated Complexity:** 8 points
- **Status:** ✅ Completed
- **Description:** Comprehensive UI redesign with dark/light theme system
- **Git Commit:** `e1bbb0b`

---

### 💬 Photo Commenting Feature
- **Date:** ~2026-01-30
- **Type:** Feature
- **Epic:** EP0004 (Social Interactions)
- **Estimated Complexity:** 5 points
- **Status:** ✅ Completed
- **Description:** Users can comment on photos
- **Git Commit:** `c367dd4`

---

### ☁️ AWS Deployment Setup
- **Date:** ~2026-01-30
- **Type:** Infrastructure
- **Epic:** DevOps
- **Estimated Complexity:** 3 points
- **Status:** ✅ Completed
- **Description:** AWS deployment configuration and setup

---

### 🔧 API URL Configuration Fixes
- **Date:** 2026-01-31
- **Type:** Bug Fixes
- **Epic:** Technical Debt
- **Estimated Complexity:** 2 points
- **Status:** ✅ Completed
- **Description:** Standardized API URL handling with apiUrl helper
- **Git Commits:**
  - `95751d0` - Fix all API calls to use correct apiUrl helper
  - `33dc4d1` - Fix FeedPage feed fetch to use apiUrl helper
  - `298218e` - Fix email verification API URL
  - `fc28f73` - Remove duplicate apiUrl imports
  - `f127047` - Fix API URLs to use absolute URLs for production

---

### 🏗️ Build Configuration Improvements
- **Date:** ~2026-01-30
- **Type:** Infrastructure
- **Epic:** DevOps
- **Estimated Complexity:** 2 points
- **Status:** ✅ Completed
- **Description:** TypeScript build configuration fixes, request size limits
- **Git Commits:**
  - `31b8f1f` - Increase request body size limit to 50MB for file uploads
  - `c94fdc2` - Fix build errors by excluding tests and relaxing strict mode
  - `daf3caf` - Fix TypeScript build configuration for deployment

---

## Going Forward

### Prevent Future Drift - Choose Your Workflow:

**Option 1: Minimal Tracking** (fastest, for solo dev)
```bash
# Just use git commits as documentation
git commit -m "feat: describe what you built"

# Update this file monthly
# Update UNTRACKED_CHANGES.md when you remember
```

**Option 2: Story-First** (balanced, recommended)
```bash
# Before implementing a feature:
/sdlc-studio story  # Create story first
# Then implement however you want (manual or via SDLC)
# Mark story as Done when finished
```

**Option 3: Full SDLC** (most rigorous)
```bash
# Use automated workflows:
/sdlc-studio story implement --story US00XX
```

### Quick Reference Commands

```bash
# Check project status anytime
/sdlc-studio status

# See what to do next
/sdlc-studio hint

# Create a story when needed
/sdlc-studio story

# Review current state
/sdlc-studio review
```

---

## Notes

- This file is **informational only** - not part of formal SDLC tracking
- Use this as a reference when you need to remember "what else did we build?"
- Feel free to add entries here for any future untracked work
- No need to create retroactive stories unless you need formal documentation

**Bottom line:** Keep building, keep shipping. Document when it helps, skip when it slows you down.
