/**
 * JWT Utilities
 * Simple JWT decoder for client-side use
 */

interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Decode a JWT token to extract the payload
 * Note: This does NOT verify the token signature - only use for reading claims
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get the current user ID from the stored auth token
 */
export function getCurrentUserId(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = decodeJWT(token);
  return payload?.userId || null;
}
