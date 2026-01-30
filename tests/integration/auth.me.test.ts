/**
 * Integration Tests: Get Current User Endpoint
 * Test Spec: TS0005
 * Story: US0005 - Get Current User Endpoint (/auth/me)
 *
 * These tests verify all acceptance criteria for the /auth/me endpoint:
 * - AC1: Successful profile retrieval with valid token
 * - AC2: Missing authentication token rejection
 * - AC3: Invalid or expired token rejection
 * - AC4: User data freshness
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing';

describe('GET /api/v1/auth/me', () => {
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

  // Helper function to generate valid JWT token
  function generateValidToken(userId: string, username: string): string {
    return jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // TC001: Successful Profile Retrieval with Valid Token (AC1)
  describe('TC001: Successful Profile Retrieval', () => {
    it('should return complete user profile with valid token', async () => {
      // Create test user
      const user = await createTestUser('getme@example.com', 'getmeuser', 'password123');

      // Generate valid token
      const token = generateValidToken(user._id.toString(), user.username);

      // Request /me endpoint
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Verify user data
      expect(response.body.data.userId).toBe(user._id.toString());
      expect(response.body.data.username).toBe('getmeuser');
      expect(response.body.data.email).toBe('getme@example.com');

      // Verify optional fields included (as null)
      expect(response.body.data).toHaveProperty('displayName');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).toHaveProperty('profilePictureUrl');

      // Verify timestamps
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });
  });

  // TC002: Response Excludes passwordHash (AC1 Security)
  describe('TC002: Response Excludes passwordHash', () => {
    it('should NOT include passwordHash in response', async () => {
      // Create test user
      const user = await createTestUser('security@example.com', 'secureuser', 'password123');

      // Generate valid token
      const token = generateValidToken(user._id.toString(), user.username);

      // Request /me endpoint
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify passwordHash NOT in response
      expect(response.body.data).not.toHaveProperty('passwordHash');

      // Verify user ID matches (correct user fetched)
      expect(response.body.data.userId).toBe(user._id.toString());
    });
  });

  // TC003: Missing Authorization Header (AC2)
  describe('TC003: Missing Authorization Header', () => {
    it('should return 401 when Authorization header is missing', async () => {
      // Request without Authorization header
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      // Verify error response (from middleware)
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Authentication token required');
    });
  });

  // TC004: Invalid JWT Token (AC3)
  describe('TC004: Invalid JWT Token', () => {
    it('should return 401 for malformed JWT', async () => {
      // Request with malformed token
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    it('should return 401 for token with wrong signature', async () => {
      // Create user
      const user = await createTestUser('wrong@example.com', 'wronguser', 'password123');

      // Generate token with WRONG secret
      const wrongSecretToken = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        'wrong-secret-key',
        { expiresIn: '7d' }
      );

      // Request with wrong-secret token
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });

  // TC005: Expired JWT Token (AC3)
  describe('TC005: Expired JWT Token', () => {
    it('should return 401 for expired token', async () => {
      // Create user
      const user = await createTestUser('expired@example.com', 'expireduser', 'password123');

      // Generate expired token (1 second ago)
      const expiredToken = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      // Request with expired token
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });

  // TC006: User Deleted After Token Issued (AC4 Race Condition)
  describe('TC006: User Deleted After Token Issued', () => {
    it('should return 404 when user deleted after token generation', async () => {
      // Create user
      const user = await createTestUser('deleted@example.com', 'deleteduser', 'password123');

      // Generate valid token
      const token = generateValidToken(user._id.toString(), user.username);

      // Delete user from database (simulate account deletion)
      await User.findByIdAndDelete(user._id);

      // Request with valid token but user no longer exists
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('User not found');
    });
  });

  // TC007: Fresh Data Returned from Database (AC4)
  describe('TC007: Fresh Data Returned', () => {
    it('should return updated data, not stale token payload', async () => {
      // Create user
      const user = await createTestUser('fresh@example.com', 'freshuser', 'password123');

      // Generate token
      const token = generateValidToken(user._id.toString(), user.username);

      // Update user profile (add displayName and bio)
      await User.findByIdAndUpdate(user._id, {
        displayName: 'Fresh Display Name',
        bio: 'Updated bio after token issued'
      });

      // Request /me endpoint
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify response includes updated data
      expect(response.body.data.displayName).toBe('Fresh Display Name');
      expect(response.body.data.bio).toBe('Updated bio after token issued');

      // This proves data is fetched fresh from DB, not from token
    });
  });

  // TC008: Optional Fields Null When Not Set (Edge Case)
  describe('TC008: Optional Fields Null', () => {
    it('should include optional fields as null when not set', async () => {
      // Create user with no optional fields
      const user = await createTestUser('minimal@example.com', 'minimaluser', 'password123');

      // Generate token
      const token = generateValidToken(user._id.toString(), user.username);

      // Request /me endpoint
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify optional fields present but null
      expect(response.body.data.displayName).toBeNull();
      expect(response.body.data.bio).toBeNull();
      expect(response.body.data.profilePictureUrl).toBeNull();

      // Fields should be present in response (not undefined)
      expect(response.body.data).toHaveProperty('displayName');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).toHaveProperty('profilePictureUrl');
    });

    it('should include optional fields when set', async () => {
      // Create user
      const user = await createTestUser('complete@example.com', 'completeuser', 'password123');

      // Update with optional fields
      await User.findByIdAndUpdate(user._id, {
        displayName: 'Complete User',
        bio: 'This is my bio',
        profilePictureUrl: 'https://example.com/profile.jpg'
      });

      // Generate token
      const token = generateValidToken(user._id.toString(), user.username);

      // Request /me endpoint
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify optional fields populated
      expect(response.body.data.displayName).toBe('Complete User');
      expect(response.body.data.bio).toBe('This is my bio');
      expect(response.body.data.profilePictureUrl).toBe('https://example.com/profile.jpg');
    });
  });
});
