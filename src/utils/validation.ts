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

// ============================================
// File Validation (US0013)
// ============================================

/**
 * Allowed photo MIME types
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const;

/**
 * Allowed file extensions (lowercase)
 */
export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
] as const;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  code?: 'INVALID_TYPE' | 'INVALID_SIZE' | 'MISSING_FILE';
}

/**
 * Validate file MIME type
 * @param mimeType MIME type string to validate
 * @returns Validation result with isValid boolean and error message if invalid
 */
export function validateFileType(mimeType: string | undefined): FileValidationResult {
  if (!mimeType) {
    return {
      isValid: false,
      error: 'File type is required',
      code: 'MISSING_FILE'
    };
  }

  const normalizedType = mimeType.toLowerCase().trim();

  if (!ALLOWED_MIME_TYPES.includes(normalizedType as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
      code: 'INVALID_TYPE'
    };
  }

  return { isValid: true };
}

/**
 * Validate file extension from filename
 * @param filename Filename to extract and validate extension
 * @returns Validation result with isValid boolean and error message if invalid
 */
export function validateFileExtension(filename: string | undefined): FileValidationResult {
  if (!filename) {
    return {
      isValid: false,
      error: 'Filename is required',
      code: 'MISSING_FILE'
    };
  }

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  if (!extension || extension === filename.toLowerCase()) {
    return {
      isValid: false,
      error: 'File must have a valid extension',
      code: 'INVALID_TYPE'
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(extension as typeof ALLOWED_EXTENSIONS[number])) {
    return {
      isValid: false,
      error: 'Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed',
      code: 'INVALID_TYPE'
    };
  }

  return { isValid: true };
}

/**
 * Validate file size
 * @param size File size in bytes
 * @param maxSize Maximum allowed size in bytes (default: 10MB)
 * @returns Validation result with isValid boolean and error message if invalid
 */
export function validateFileSize(size: number | undefined, maxSize: number = MAX_FILE_SIZE): FileValidationResult {
  if (size === undefined || size === null) {
    return {
      isValid: false,
      error: 'File size is required',
      code: 'MISSING_FILE'
    };
  }

  if (typeof size !== 'number' || isNaN(size)) {
    return {
      isValid: false,
      error: 'File size must be a valid number',
      code: 'INVALID_SIZE'
    };
  }

  if (size <= 0) {
    return {
      isValid: false,
      error: 'File cannot be empty',
      code: 'INVALID_SIZE'
    };
  }

  if (size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxMB}MB limit`,
      code: 'INVALID_SIZE'
    };
  }

  return { isValid: true };
}

/**
 * File info for validation
 */
export interface FileInfo {
  mimeType?: string;
  filename?: string;
  size?: number;
}

/**
 * Validate photo file (combined validation)
 * Validates MIME type, extension, and size
 * @param file File info object containing mimeType, filename, and size
 * @returns Validation result with isValid boolean and error message if invalid
 */
export function validatePhotoFile(file: FileInfo): FileValidationResult {
  // Check if file info is provided
  if (!file) {
    return {
      isValid: false,
      error: 'File is required',
      code: 'MISSING_FILE'
    };
  }

  // Validate MIME type
  const typeResult = validateFileType(file.mimeType);
  if (!typeResult.isValid) {
    return typeResult;
  }

  // Validate extension
  const extensionResult = validateFileExtension(file.filename);
  if (!extensionResult.isValid) {
    return extensionResult;
  }

  // Validate size
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  return { isValid: true };
}

/**
 * Get file extension from MIME type
 * @param mimeType MIME type string
 * @returns File extension string (e.g., '.jpg')
 */
export function getExtensionFromMimeType(mimeType: string): string | null {
  const mimeToExtension: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
  };

  return mimeToExtension[mimeType.toLowerCase()] || null;
}
