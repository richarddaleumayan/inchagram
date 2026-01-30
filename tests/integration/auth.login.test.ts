/**
 * Integration Tests: User Login API with JWT Token Generation
 * Test Spec: TS0002
 * Story: US0002 - User Login API with JWT Token Generation
 *
 * These tests verify all acceptance criteria for user login:
 * - AC1: Successful login with email
 * - AC2: Successful login with username
 * - AC3: Invalid credentials (wrong password)
 * - AC4: Invalid credentials (non-existent user)
 * - AC5: Token validation (structure, signature, expiration)
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';

// JWT configuration for tests
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing';

describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  // Helper function to create test user
  async function createTestUser(email: string, username: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return await User.create({
      email,
      username,
      passwordHash
    });
  }

  // TC001: Successful Login with Email (AC1)
  describe('TC001: Successful Login with Email', () => {
    it('should login successfully with valid email and password', async () => {
      // Create test user
      const user = await createTestUser('test@example.com', 'testuser', 'password123');

      // Login with email
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      // Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');

      // Verify user data
      expect(response.body.data.user.userId).toBe(user._id.toString());
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.email).toBe('test@example.com');

      // Verify token is a valid JWT
      const token = response.body.data.token;
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  // TC002: Successful Login with Username (AC2)
  describe('TC002: Successful Login with Username', () => {
    it('should login successfully with valid username and password', async () => {
      // Create test user
      const user = await createTestUser('test@example.com', 'testuser', 'password123');

      // Login with username
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200);

      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.userId).toBe(user._id.toString());
      expect(response.body.data.user.username).toBe('testuser');
    });
  });

  // TC003: Wrong Password (AC3)
  describe('TC003: Wrong Password', () => {
    it('should return 401 with generic error for wrong password', async () => {
      // Create test user
      await createTestUser('test@example.com', 'testuser', 'password123');

      // Attempt login with wrong password
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      // Verify generic error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid credentials');

      // Verify no token returned
      expect(response.body.data).toBeUndefined();

      // Security: Error message should NOT reveal password was wrong
      expect(response.body.error.message.toLowerCase()).not.toContain('password');
    });
  });

  // TC004: Non-existent User (AC4)
  describe('TC004: Non-existent User', () => {
    it('should return 401 with generic error for non-existent email', async () => {
      // Attempt login with non-existent email
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      // Verify same error as wrong password (security)
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid credentials');

      // Security: Error message should NOT reveal user doesn't exist
      expect(response.body.error.message.toLowerCase()).not.toContain('user');
      expect(response.body.error.message.toLowerCase()).not.toContain('not found');
    });

    it('should return 401 with generic error for non-existent username', async () => {
      // Attempt login with non-existent username
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });

  // TC005: Missing Password Field
  describe('TC005: Missing Password Field', () => {
    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
          // password missing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toMatch(/password.*required/i);
    });
  });

  // TC006: Missing Email/Username Field
  describe('TC006: Missing Email/Username Field', () => {
    it('should return 400 when both email and username are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123'
          // email/username missing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toMatch(/email.*username.*required/i);
    });
  });

  // TC007: Empty Credentials
  describe('TC007: Empty Credentials', () => {
    it('should return 401 for empty email and password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '',
          password: ''
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });

  // TC008: Case-Insensitive Email Match
  describe('TC008: Case-Insensitive Email Match', () => {
    it('should login with email regardless of case', async () => {
      // Create user with lowercase email
      await createTestUser('test@example.com', 'testuser', 'password123');

      // Login with uppercase email
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });

  // TC009: Token Payload Structure (AC5)
  describe('TC009: Token Payload Structure', () => {
    it('should include userId, username, iat, exp in token payload', async () => {
      // Create test user
      const user = await createTestUser('test@example.com', 'testuser', 'password123');

      // Login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      // Decode token (without verification)
      const token = response.body.data.token;
      const decoded = jwt.decode(token) as any;

      // Verify payload structure
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');

      // Verify payload values
      expect(decoded.userId).toBe(user._id.toString());
      expect(decoded.username).toBe('testuser');
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');

      // Security: No sensitive data in payload
      expect(decoded).not.toHaveProperty('passwordHash');
      expect(decoded).not.toHaveProperty('password');
    });
  });

  // TC010: Token Signature Validation (AC5)
  describe('TC010: Token Signature Validation', () => {
    it('should generate token with valid signature', async () => {
      // Create test user
      await createTestUser('test@example.com', 'testuser', 'password123');

      // Login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = response.body.data.token;

      // Verify token with JWT_SECRET
      const verified = jwt.verify(token, JWT_SECRET) as any;
      expect(verified.userId).toBeDefined();
      expect(verified.username).toBe('testuser');
    });

    it('should fail verification with wrong secret', async () => {
      // Create test user
      await createTestUser('test@example.com', 'testuser', 'password123');

      // Login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = response.body.data.token;

      // Attempt to verify with wrong secret
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should fail verification for tampered token', async () => {
      // Create test user
      await createTestUser('test@example.com', 'testuser', 'password123');

      // Login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = response.body.data.token;

      // Tamper with token (change last character)
      const tamperedToken = token.slice(0, -1) + 'X';

      // Verification should fail
      expect(() => {
        jwt.verify(tamperedToken, JWT_SECRET);
      }).toThrow();
    });
  });

  // TC011: Token Expiration Time (AC5)
  describe('TC011: Token Expiration Time', () => {
    it('should set token expiration to 7 days', async () => {
      // Create test user
      await createTestUser('test@example.com', 'testuser', 'password123');

      // Login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = response.body.data.token;
      const decoded = jwt.decode(token) as any;

      // Calculate expiration duration
      const issuedAt = decoded.iat;
      const expiresAt = decoded.exp;
      const duration = expiresAt - issuedAt;

      // 7 days = 604800 seconds
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;

      expect(duration).toBe(sevenDaysInSeconds);
    });
  });

  // TC012: Both Email and Username Provided
  describe('TC012: Both Email and Username Provided', () => {
    it('should prioritize email when both email and username provided', async () => {
      // Create two users
      const user1 = await createTestUser('email@example.com', 'user1', 'password123');
      await createTestUser('other@example.com', 'user2', 'password123');

      // Login with email from user1 and username from user2
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'email@example.com',  // user1's email
          username: 'user2',             // user2's username
          password: 'password123'
        })
        .expect(200);

      // Should login as user1 (email takes precedence)
      expect(response.body.data.user.userId).toBe(user1._id.toString());
      expect(response.body.data.user.username).toBe('user1');
      expect(response.body.data.user.email).toBe('email@example.com');
    });
  });
});
