/**
 * Optional JWT Authentication Middleware
 * Populates req.user if a valid token is present, but doesn't reject if missing
 */

import { Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwtService';
import { AuthRequest } from './authMiddleware';

/**
 * Optional JWT Authentication Middleware
 *
 * If Authorization header with valid token exists, populates req.user
 * If no token or invalid token, continues without req.user
 */
export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // No auth header - continue without user
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7).trim();

  // Empty token - continue without user
  if (!token) {
    next();
    return;
  }

  // Verify token
  const decoded = verifyToken(token);

  if (decoded) {
    // Valid token - populate req.user
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
  }

  // Continue regardless of token validity
  next();
}
