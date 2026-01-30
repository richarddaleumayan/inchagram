/**
 * JWT Authentication Middleware
 * Story: US0003 - JWT Authentication Middleware
 *
 * Middleware to verify JWT tokens and populate req.user with authenticated user information.
 * Use this middleware to protect routes that require authentication.
 *
 * Usage:
 * ```typescript
 * import { authenticateJWT, AuthRequest } from './middleware/authMiddleware';
 *
 * router.get('/protected', authenticateJWT, (req: AuthRequest, res) => {
 *   const { userId, username } = req.user!;
 *   // ... handle authenticated request
 * });
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwtService';

/**
 * Extended Request interface with authenticated user information
 * Use this type in route handlers that are protected by authenticateJWT middleware
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

/**
 * JWT Authentication Middleware
 *
 * Verifies JWT token from Authorization header and populates req.user with user information.
 *
 * @param req - Express request (extended with user property)
 * @param res - Express response
 * @param next - Express next function
 *
 * Authorization header format: "Bearer <jwt_token>"
 *
 * Success: Populates req.user with { userId, username } and calls next()
 * Failure: Returns 401 Unauthorized with error message
 */
export function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required'
      }
    });
    return;
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.substring(7).trim(); // Remove "Bearer " prefix and trim whitespace

  // Check if token is empty after extraction
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
    return;
  }

  // Verify token using JWT service
  const decoded = verifyToken(token);

  if (!decoded) {
    // Token is invalid, expired, or malformed
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
    return;
  }

  // Token is valid - populate req.user with decoded payload
  req.user = {
    userId: decoded.userId,
    username: decoded.username
  };

  // Proceed to next middleware/route handler
  next();
}
