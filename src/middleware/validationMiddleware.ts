/**
 * Input Validation Middleware
 * Story: US0004 - Input Validation Middleware
 *
 * Provides reusable middleware factories for request validation.
 * Wraps existing validation utilities from src/utils/validation.ts.
 *
 * Usage:
 * ```typescript
 * import { validateRequired, validateEmail, validateLength } from './middleware/validationMiddleware';
 *
 * router.post('/register',
 *   validateRequired(['email', 'username', 'password']),
 *   validateEmail('email'),
 *   validateLength('username', 3, 30),
 *   registerHandler
 * );
 * ```
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { isValidEmail, isValidUsername as validateUsernameUtil, isValidPassword as validatePasswordUtil } from '../utils/validation';

/**
 * Error response helper
 * Creates consistent error response format
 */
function sendValidationError(
  res: Response,
  field: string,
  message: string,
  issue: string
): void {
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details: {
        field,
        issue
      }
    }
  });
}

/**
 * Validate Required Fields Middleware Factory
 *
 * Checks that specified fields exist in request body and are not empty.
 * Treats empty strings and whitespace-only strings as missing.
 *
 * @param fields - Array of field names that are required
 * @returns Express middleware function
 *
 * @example
 * router.post('/register', validateRequired(['email', 'username', 'password']), handler);
 */
export function validateRequired(fields: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of fields) {
      const value = req.body[field];

      // Check if field is missing, null, undefined, or empty/whitespace string
      if (!value || typeof value !== 'string' || value.trim() === '') {
        sendValidationError(
          res,
          field,
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          'Missing required field'
        );
        return;
      }
    }

    // All required fields present
    next();
  };
}

/**
 * Validate Email Format Middleware Factory
 *
 * Validates that specified field contains a valid email format.
 * Uses isValidEmail utility from src/utils/validation.ts.
 *
 * @param field - Name of the field to validate as email
 * @returns Express middleware function
 *
 * @example
 * router.post('/register', validateEmail('email'), handler);
 */
export function validateEmail(field: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // If field is missing, let validateRequired handle it
    if (!value) {
      next();
      return;
    }

    if (!isValidEmail(value)) {
      sendValidationError(
        res,
        field,
        'Invalid email format',
        'Email format validation failed'
      );
      return;
    }

    // Email is valid
    next();
  };
}

/**
 * Validate String Length Middleware Factory
 *
 * Validates that specified field meets minimum and maximum length requirements.
 *
 * @param field - Name of the field to validate
 * @param min - Minimum length (inclusive)
 * @param max - Maximum length (inclusive, optional)
 * @returns Express middleware function
 *
 * @example
 * router.post('/register', validateLength('username', 3, 30), handler);
 */
export function validateLength(field: string, min: number, max?: number): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // If field is missing, let validateRequired handle it
    if (!value || typeof value !== 'string') {
      next();
      return;
    }

    const length = value.length;

    if (length < min) {
      const maxPart = max ? ` and ${max}` : '';
      sendValidationError(
        res,
        field,
        `${field.charAt(0).toUpperCase() + field.slice(1)} must be between ${min}${maxPart} characters`,
        'Length constraint violated'
      );
      return;
    }

    if (max && length > max) {
      sendValidationError(
        res,
        field,
        `${field.charAt(0).toUpperCase() + field.slice(1)} must be between ${min} and ${max} characters`,
        'Length constraint violated'
      );
      return;
    }

    // Length is valid
    next();
  };
}

/**
 * Validate Username Pattern Middleware Factory
 *
 * Validates that username meets pattern requirements:
 * - 3-30 characters
 * - Alphanumeric characters and underscores only
 *
 * Uses isValidUsername utility from src/utils/validation.ts.
 *
 * @param field - Name of the field to validate as username
 * @returns Express middleware function
 *
 * @example
 * router.post('/register', validateUsername('username'), handler);
 */
export function validateUsername(field: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // If field is missing, let validateRequired handle it
    if (!value) {
      next();
      return;
    }

    const result = validateUsernameUtil(value);

    if (!result.isValid) {
      sendValidationError(
        res,
        field,
        result.error || 'Invalid username format',
        'Username pattern validation failed'
      );
      return;
    }

    // Username is valid
    next();
  };
}

/**
 * Validate Password Strength Middleware Factory
 *
 * Validates that password meets strength requirements:
 * - Minimum 8 characters
 *
 * Uses isValidPassword utility from src/utils/validation.ts.
 *
 * @param field - Name of the field to validate as password
 * @returns Express middleware function
 *
 * @example
 * router.post('/register', validatePassword('password'), handler);
 */
export function validatePassword(field: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];

    // If field is missing, let validateRequired handle it
    if (!value) {
      next();
      return;
    }

    const result = validatePasswordUtil(value);

    if (!result.isValid) {
      sendValidationError(
        res,
        field,
        result.error || 'Password does not meet strength requirements',
        'Password validation failed'
      );
      return;
    }

    // Password is valid
    next();
  };
}
