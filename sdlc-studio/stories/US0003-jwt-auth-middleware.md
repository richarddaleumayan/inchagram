# US0003: JWT Authentication Middleware

> **Status:** Draft
> **Epic:** [EP0001: User Authentication & Account Management](../epics/EP0001-user-authentication.md)
> **Owner:** Richard
> **Reviewer:** TBD
> **Created:** 2026-01-30

## User Story

**As a** developer (internal)
**I want** reusable authentication middleware
**So that** I can protect API routes and identify authenticated users

## Context

### Background
Protected routes (photo upload, profile edit, etc.) need to verify JWT tokens and extract user information. This middleware provides centralized auth logic used across all protected endpoints.

---

## Acceptance Criteria

### AC1: Valid Token Authentication
- **Given** request includes valid JWT in Authorization header
- **When** middleware executes
- **Then** `req.user` is populated with { userId, username }
- **And** request proceeds to next middleware/route handler

### AC2: Missing Token Rejection
- **Given** request has no Authorization header
- **When** middleware executes
- **Then** response returns 401 Unauthorized
- **And** error message is "Authentication token required"

### AC3: Invalid Token Rejection
- **Given** request has malformed or invalid JWT
- **When** middleware executes
- **Then** response returns 401 Unauthorized
- **And** error message is "Invalid or expired token"

### AC4: Expired Token Rejection
- **Given** request has expired JWT (>7 days old)
- **When** middleware executes
- **Then** response returns 401 Unauthorized
- **And** error message is "Invalid or expired token"

---

## Technical Notes

**Middleware Implementation:**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication token required' }
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    });
  }
};
```

**Usage in Routes:**
```typescript
router.post('/photos', authenticateJWT, uploadPhoto);
router.put('/users/:userId', authenticateJWT, updateProfile);
```

---

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
|----------|-------------------|
| Token without "Bearer " prefix | Reject with 401 |
| Whitespace-only Authorization header | Reject with 401 |
| Token signed with different secret | Reject with 401 (signature verification fails) |
| Token with tampered payload | Reject with 401 (signature verification fails) |
| JWT_SECRET not set | Server fails to start |

---

## Test Scenarios

- [ ] Valid token in `Authorization: Bearer <token>` → req.user populated, next() called
- [ ] No Authorization header → 401 error
- [ ] Authorization header without "Bearer " → 401
- [ ] Malformed JWT (not 3 parts) → 401
- [ ] Expired token → 401
- [ ] Token with wrong signature → 401

---

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
|-------|------|---------------|--------|
| [US0002](US0002-user-login-jwt.md) | Prerequisite | JWT token format | Draft |

---

## Estimation

**Story Points:** 2
**Complexity:** Low-Medium

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-30 | System | Initial story created from EP0001 |
