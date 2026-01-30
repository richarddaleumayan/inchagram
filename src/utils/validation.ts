/**
 * Validation Utilities
 * Reusable validation functions for user input
 */

/**
 * Validate email format
 * @param email Email string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate username format
 * @param username Username string to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function isValidUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  // Check for empty or whitespace-only
  if (trimmed.length === 0 || /^\s+$/.test(username)) {
    return { isValid: false, error: 'Username is invalid' };
  }

  // Check length
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { isValid: false, error: 'Username must be between 3-30 chars' };
  }

  // Check format (alphanumeric + underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username must contain only alphanumeric characters and underscores' };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 * @param password Password string to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function isValidPassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  // Check minimum length
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  return { isValid: true };
}

/**
 * Sanitize string input
 * @param input Input string to sanitize
 * @returns Trimmed string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim();
}
