/**
 * Integration Tests: JWT Authentication Middleware
 * Test Spec: TS0003
 * Story: US0003 - JWT Authentication Middleware
 *
 * These tests verify all acceptance criteria for JWT middleware:
 * - AC1: Valid token authentication
 * - AC2: Missing token rejection
 * - AC3: Invalid token rejection
 * - AC4: Expired token rejection
 */

import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import bcrypt from 'bcrypt';
import { authenticateJWT, AuthRequest } from '../../src/middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing';

// Create a test Express app with protected route
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Protected test route
  app.get('/test/protected', authenticateJWT, (req: AuthRequest, res) => {
    res.status(200).json({
      success: true,
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        message: 'Protected endpoint accessed'
      }
    });
  });

  return app;
}

describe('JWT Authentication Middleware', () => {
  let testApp: Express;

  beforeAll(async () => {
    await connectDatabase();
    testApp = createTestApp();
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

  // Helper function to generate valid JWT token
  function generateValidToken(userId: string, username: string): string {
    return jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // TC001: Valid Token Authentication (AC1)
  describe('TC001: Valid Token Authentication', () => {
    it('should populate req.user and call next() for valid token', async () => {
      // Create test user
      const user = await createTestUser('middleware@example.com', 'middlewareuser', 'password123');

      // Generate valid token
      const token = generateValidToken(user._id.toString(), user.username);

      // Request protected endpoint with valid token
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(user._id.toString());
      expect(response.body.data.username).toBe('middlewareuser');
      expect(response.body.data.message).toBe('Protected endpoint accessed');
    });
  });

  // TC002: Missing Authorization Header (AC2)
  describe('TC002: Missing Authorization Header', () => {
    it('should return 401 when Authorization header is missing', async () => {
      // Request without Authorization header
      const response = await request(testApp)
        .get('/test/protected')
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Authentication token required');
    });
  });

  // TC003: Authorization Header Without Bearer Prefix (AC2 Edge Case)
  describe('TC003: Authorization Without Bearer Prefix', () => {
    it('should return 401 when Authorization header lacks "Bearer " prefix', async () => {
      // Create valid token but send without Bearer prefix
      const user = await createTestUser('test@example.com', 'testuser', 'password123');
      const token = generateValidToken(user._id.toString(), user.username);

      // Request with token but no "Bearer " prefix
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', token)  // Missing "Bearer " prefix
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Authentication token required');
    });
  });

  // TC004: Malformed JWT Token (AC3)
  describe('TC004: Malformed JWT Token', () => {
    it('should return 401 for malformed JWT (not 3 parts)', async () => {
      // Request with malformed token
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    it('should return 401 for completely invalid token', async () => {
      // Request with non-JWT string
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', 'Bearer notajwtatall')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });

  // TC005: Expired JWT Token (AC4)
  describe('TC005: Expired JWT Token', () => {
    it('should return 401 for expired token', async () => {
      // Create user
      const user = await createTestUser('expired@example.com', 'expireduser', 'password123');

      // Generate token with past expiration (1 second ago)
      const expiredToken = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        JWT_SECRET,
        { expiresIn: '-1s' }  // Negative time = already expired
      );

      // Request with expired token
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });

  // TC006: Token with Wrong Signature (AC3 Security)
  describe('TC006: Token with Wrong Signature', () => {
    it('should return 401 for token signed with different secret', async () => {
      // Create user
      const user = await createTestUser('wrong@example.com', 'wronguser', 'password123');

      // Generate token with WRONG secret
      const wrongSecretToken = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        'wrong-secret-key',  // Different secret
        { expiresIn: '7d' }
      );

      // Request with wrong-secret token
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });

  // TC007: Token with Tampered Payload (AC3 Security)
  describe('TC007: Token with Tampered Payload', () => {
    it('should return 401 for token with modified payload', async () => {
      // Create user
      const user = await createTestUser('tamper@example.com', 'tamperuser', 'password123');

      // Generate valid token
      const validToken = generateValidToken(user._id.toString(), user.username);

      // Tamper with token (change last character of signature)
      const tamperedToken = validToken.slice(0, -1) + 'X';

      // Request with tampered token
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });

  // TC008: Whitespace-Only Authorization Header (AC2 Edge Case)
  describe('TC008: Whitespace-Only Authorization Header', () => {
    it('should return 401 for whitespace-only Authorization header', async () => {
      // Request with whitespace-only header
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', '   ')
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Authentication token required');
    });

    it('should return 401 for "Bearer " with no token', async () => {
      // Request with "Bearer " but no token after it
      // Note: HTTP libraries may normalize this to effectively no header
      const response = await request(testApp)
        .get('/test/protected')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.success).toBe(false);
      // Header normalization may result in "Authentication token required"
      expect(response.body.error.message).toBe('Authentication token required');
    });
  });
});
