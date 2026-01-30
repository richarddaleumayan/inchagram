/**
 * JWT Service
 * Handles JWT token generation and verification
 * Shared service used by login (US0002) and auth middleware (US0003)
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET exists on module load
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.');
}

/**
 * JWT token payload interface
 */
export interface TokenPayload {
  userId: string;
  username: string;
}

/**
 * Generate JWT token for authenticated user
 * @param userId User's MongoDB ObjectId as string
 * @param username User's username
 * @returns JWT token string
 */
export function generateToken(userId: string, username: string): string {
  try {
    const payload: TokenPayload = {
      userId,
      username
    };

    // Type assertion needed: @types/jsonwebtoken has strict SignOptions type that doesn't accept expiresIn as string
    // even though the library documentation and runtime accept string values like '7d', '24h', etc.
    const token = jwt.sign(
      payload,
      JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    return token;
  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as TokenPayload;
    return decoded;
  } catch (error) {
    // Token invalid, expired, or malformed
    return null;
  }
}

/**
 * Decode JWT token without verification (for debugging/inspection)
 * WARNING: Do not use for authentication - use verifyToken() instead
 * @param token JWT token string
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
