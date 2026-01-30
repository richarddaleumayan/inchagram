/**
 * Integration Tests: Input Validation Middleware
 * Story: US0004 - Input Validation Middleware
 * Test Spec: TS0004
 *
 * Tests middleware factories for request validation:
 * - validateRequired: Required field validation
 * - validateEmail: Email format validation
 * - validateLength: String length constraints
 * - validateUsername: Username pattern validation
 * - validatePassword: Password strength validation
 */

import express, { Express } from 'express';
import request from 'supertest';
import {
  validateRequired,
  validateEmail,
  validateLength,
  validateUsername,
  validatePassword
} from '../../src/middleware/validationMiddleware';

// Test Express app with validation routes
let testApp: Express;

beforeAll(() => {
  testApp = express();
  testApp.use(express.json());

  // Route for testing validateRequired
  testApp.post('/test/validate-required',
    validateRequired(['email', 'username', 'password']),
    (_req, res) => res.status(200).json({ success: true })
  );

  // Route for testing validateEmail
  testApp.post('/test/validate-email',
    validateEmail('email'),
    (_req, res) => res.status(200).json({ success: true })
  );

  // Route for testing validateLength
  testApp.post('/test/validate-length',
    validateLength('username', 3, 30),
    (_req, res) => res.status(200).json({ success: true })
  );

  // Route for testing validateUsername
  testApp.post('/test/validate-username',
    validateUsername('username'),
    (_req, res) => res.status(200).json({ success: true })
  );

  // Route for testing validatePassword
  testApp.post('/test/validate-password',
    validatePassword('password'),
    (_req, res) => res.status(200).json({ success: true })
  );

  // Route for testing middleware chaining
  testApp.post('/test/validate-chain',
    validateRequired(['email', 'username', 'password']),
    validateEmail('email'),
    validateUsername('username'),
    validatePassword('password'),
    (_req, res) => res.status(200).json({ success: true })
  );
});

/**
 * TC001: Required Field Validation
 * Tests validateRequired() middleware
 */
describe('TC001: Required Field Validation', () => {
  /**
   * TC001.1: Missing single required field returns 400
   */
  it('should return 400 when required field is missing', async () => {
    // Arrange: Request body missing 'email' field
    const body = { username: 'testuser', password: 'password123' };

    // Act: POST with validateRequired(['email', 'username', 'password'])
    const response = await request(testApp)
      .post('/test/validate-required')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('Email is required');
    expect(response.body.error.details.field).toBe('email');
    expect(response.body.error.details.issue).toBe('Missing required field');
  });

  /**
   * TC001.2: Multiple missing fields returns error for first missing
   */
  it('should return 400 for first missing field when multiple are missing', async () => {
    // Arrange: Request body missing both 'email' and 'password'
    const body = { username: 'testuser' };

    // Act: POST with validateRequired(['email', 'username', 'password'])
    const response = await request(testApp)
      .post('/test/validate-required')
      .send(body)
      .expect(400);

    // Assert: Should fail on first missing field ('email' comes before 'password' in list)
    expect(response.body.error.details.field).toBe('email');
  });

  /**
   * TC001.3: All required fields present passes validation
   */
  it('should call next() when all required fields are present', async () => {
    // Arrange: Request body with all required fields
    const body = { email: 'test@example.com', username: 'testuser', password: 'password123' };

    // Act: POST with validateRequired(['email', 'username', 'password'])
    const response = await request(testApp)
      .post('/test/validate-required')
      .send(body)
      .expect(200);

    // Assert: Should reach route handler
    expect(response.body.success).toBe(true);
  });

  /**
   * TC001.4: Empty string treated as missing field
   */
  it('should return 400 when required field is empty string', async () => {
    // Arrange: Request body with empty string for 'email'
    const body = { email: '', username: 'testuser', password: 'password123' };

    // Act: POST with validateRequired(['email', 'username', 'password'])
    const response = await request(testApp)
      .post('/test/validate-required')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.details.field).toBe('email');
    expect(response.body.error.details.issue).toBe('Missing required field');
  });

  /**
   * TC001.5: Whitespace-only string treated as missing field
   */
  it('should return 400 when required field is whitespace only', async () => {
    // Arrange: Request body with whitespace for 'username'
    const body = { email: 'test@example.com', username: '   ', password: 'password123' };

    // Act: POST with validateRequired(['email', 'username', 'password'])
    const response = await request(testApp)
      .post('/test/validate-required')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.details.field).toBe('username');
    expect(response.body.error.details.issue).toBe('Missing required field');
  });
});

/**
 * TC002: Email Format Validation
 * Tests validateEmail() middleware
 */
describe('TC002: Email Format Validation', () => {
  /**
   * TC002.1: Invalid email without @ symbol returns 400
   */
  it('should return 400 when email missing @ symbol', async () => {
    // Arrange: Request body with invalid email
    const body = { email: 'notanemail.com' };

    // Act: POST with validateEmail('email')
    const response = await request(testApp)
      .post('/test/validate-email')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('email');
    expect(response.body.error.details.field).toBe('email');
  });

  /**
   * TC002.2: Invalid email without domain returns 400
   */
  it('should return 400 when email missing domain', async () => {
    // Arrange: Request body with email missing domain
    const body = { email: 'test@' };

    // Act: POST with validateEmail('email')
    const response = await request(testApp)
      .post('/test/validate-email')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.message).toContain('Invalid email format');
  });

  /**
   * TC002.3: Valid email passes validation
   */
  it('should call next() when email is valid', async () => {
    // Arrange: Request body with valid email
    const body = { email: 'test@example.com' };

    // Act: POST with validateEmail('email')
    const response = await request(testApp)
      .post('/test/validate-email')
      .send(body)
      .expect(200);

    // Assert: Should reach route handler
    expect(response.body.success).toBe(true);
  });

  /**
   * TC002.4: Email with uppercase letters is accepted
   */
  it('should accept email with uppercase letters', async () => {
    // Arrange: Request body with uppercase email
    const body = { email: 'Test@Example.COM' };

    // Act: POST with validateEmail('email')
    const response = await request(testApp)
      .post('/test/validate-email')
      .send(body)
      .expect(200);

    // Assert: Format validation only, case doesn't matter
    expect(response.body.success).toBe(true);
  });
});

/**
 * TC003: Length Constraints Validation
 * Tests validateLength() middleware
 */
describe('TC003: Length Constraints Validation', () => {
  /**
   * TC003.1: Value below minimum length returns 400
   */
  it('should return 400 when value is below minimum length', async () => {
    // Arrange: Request body with username too short (2 chars, min 3)
    const body = { username: 'ab' };

    // Act: POST with validateLength('username', 3, 30)
    const response = await request(testApp)
      .post('/test/validate-length')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('3');
    expect(response.body.error.details.field).toBe('username');
  });

  /**
   * TC003.2: Value above maximum length returns 400
   */
  it('should return 400 when value is above maximum length', async () => {
    // Arrange: Request body with username too long (31 chars, max 30)
    const body = { username: 'a'.repeat(31) };

    // Act: POST with validateLength('username', 3, 30)
    const response = await request(testApp)
      .post('/test/validate-length')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.message).toContain('30');
  });

  /**
   * TC003.3: Value within bounds passes validation
   */
  it('should call next() when value is within min/max bounds', async () => {
    // Arrange: Request body with valid username length
    const body = { username: 'validuser' }; // 9 chars, within 3-30

    // Act: POST with validateLength('username', 3, 30)
    const response = await request(testApp)
      .post('/test/validate-length')
      .send(body)
      .expect(200);

    // Assert
    expect(response.body.success).toBe(true);
  });

  /**
   * TC003.4: Boundary values (min and max) are accepted
   */
  it('should accept values exactly at min and max boundaries', async () => {
    // Arrange: Test min boundary (3 chars)
    const minBody = { username: 'abc' };
    const maxBody = { username: 'a'.repeat(30) };

    // Act & Assert: Min boundary
    const minResponse = await request(testApp)
      .post('/test/validate-length')
      .send(minBody)
      .expect(200);
    expect(minResponse.body.success).toBe(true);

    // Act & Assert: Max boundary
    const maxResponse = await request(testApp)
      .post('/test/validate-length')
      .send(maxBody)
      .expect(200);
    expect(maxResponse.body.success).toBe(true);
  });
});

/**
 * TC004: Username Pattern Validation
 * Tests validateUsername() middleware
 */
describe('TC004: Username Pattern Validation', () => {
  /**
   * TC004.1: Username with special characters returns 400
   */
  it('should return 400 when username contains special characters', async () => {
    // Arrange: Request body with username containing @, #
    const body = { username: 'user@name#' };

    // Act: POST with validateUsername('username')
    const response = await request(testApp)
      .post('/test/validate-username')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('alphanumeric');
    expect(response.body.error.details.field).toBe('username');
  });

  /**
   * TC004.2: Username too short returns 400
   */
  it('should return 400 when username is too short', async () => {
    // Arrange: Request body with 2-char username (min 3)
    const body = { username: 'ab' };

    // Act: POST with validateUsername('username')
    const response = await request(testApp)
      .post('/test/validate-username')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.message).toContain('3');
  });

  /**
   * TC004.3: Username too long returns 400
   */
  it('should return 400 when username is too long', async () => {
    // Arrange: Request body with 31-char username (max 30)
    const body = { username: 'a'.repeat(31) };

    // Act: POST with validateUsername('username')
    const response = await request(testApp)
      .post('/test/validate-username')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.message).toContain('30');
  });

  /**
   * TC004.4: Valid username (alphanumeric + underscore) passes
   */
  it('should accept valid username with letters, numbers, underscores', async () => {
    // Arrange: Request body with valid username
    const body = { username: 'user_name_123' };

    // Act: POST with validateUsername('username')
    const response = await request(testApp)
      .post('/test/validate-username')
      .send(body)
      .expect(200);

    // Assert
    expect(response.body.success).toBe(true);
  });
});

/**
 * TC005: Password Validation
 * Tests validatePassword() middleware
 */
describe('TC005: Password Validation', () => {
  /**
   * TC005.1: Password too short returns 400
   */
  it('should return 400 when password is less than 8 characters', async () => {
    // Arrange: Request body with 7-char password
    const body = { password: 'pass123' }; // 7 chars

    // Act: POST with validatePassword('password')
    const response = await request(testApp)
      .post('/test/validate-password')
      .send(body)
      .expect(400);

    // Assert
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('8');
    expect(response.body.error.details.field).toBe('password');
  });

  /**
   * TC005.2: Valid password (8+ characters) passes
   */
  it('should accept password with 8 or more characters', async () => {
    // Arrange: Request body with valid password
    const body = { password: 'password123' }; // 11 chars

    // Act: POST with validatePassword('password')
    const response = await request(testApp)
      .post('/test/validate-password')
      .send(body)
      .expect(200);

    // Assert
    expect(response.body.success).toBe(true);
  });
});

/**
 * TC006: Middleware Chaining
 * Tests that validation middleware execute in sequence correctly
 */
describe('TC006: Middleware Chaining', () => {
  /**
   * TC006.1: All validations pass in chain
   */
  it('should pass through all validation middleware when input is valid', async () => {
    // Arrange: Request body with all valid fields
    const body = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    };

    // Act: POST with full validation chain (required, email, username, password)
    const response = await request(testApp)
      .post('/test/validate-chain')
      .send(body)
      .expect(200);

    // Assert: All middleware should call next(), reaching handler
    expect(response.body.success).toBe(true);
  });

  /**
   * TC006.2: First validation failure stops chain
   */
  it('should stop at first validation failure and not execute subsequent middleware', async () => {
    // Arrange: Request body missing required field (fails first middleware)
    const body = {
      username: 'testuser',
      password: 'password123'
      // missing 'email'
    };

    // Act: POST with full validation chain (required → email → username → password)
    const response = await request(testApp)
      .post('/test/validate-chain')
      .send(body)
      .expect(400);

    // Assert: Should fail at validateRequired, not reach validateEmail
    expect(response.body.error.details.field).toBe('email');
    expect(response.body.error.details.issue).toContain('Missing required field');
  });

  /**
   * TC006.3: Second validation failure after first passes
   */
  it('should fail at second middleware when first passes', async () => {
    // Arrange: Request body with all fields (passes required) but invalid email
    const body = {
      email: 'notanemail',  // Invalid format
      username: 'testuser',
      password: 'password123'
    };

    // Act: POST with full validation chain (required → email → username → password)
    const response = await request(testApp)
      .post('/test/validate-chain')
      .send(body)
      .expect(400);

    // Assert: Should pass validateRequired but fail at validateEmail
    expect(response.body.error.details.field).toBe('email');
    expect(response.body.error.message).toContain('Invalid email format');
  });
});
