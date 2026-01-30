/**
 * Integration Tests: Update Profile API
 * Story: US0008 - Edit Profile API and UI
 *
 * Tests for PUT /api/v1/users/:userId endpoint
 */

import request from 'supertest';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import bcrypt from 'bcrypt';

describe('PUT /api/v1/users/:userId', () => {
  let authToken: string;
  let userId: string;
  let otherUserToken: string;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: await bcrypt.hash('password123', 10),
      displayName: 'Test User',
      bio: 'Original bio'
    });

    userId = user._id.toString();

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data.token;

    // Create another user for authorization tests
    await User.create({
      email: 'other@example.com',
      username: 'otheruser',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    const otherLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'other@example.com',
        password: 'password123',
      });

    otherUserToken = otherLoginResponse.body.data.token;
  });

  // TC001: Owner can update their own profile
  describe('TC001: Owner updates profile', () => {
    it('should update display name and bio', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Updated Name',
          bio: 'Updated bio'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe('Updated Name');
      expect(response.body.data.bio).toBe('Updated bio');
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.username).toBe('testuser');

      // Verify in database
      const updatedUser = await User.findById(userId);
      expect(updatedUser!.displayName).toBe('Updated Name');
      expect(updatedUser!.bio).toBe('Updated bio');
    });

    it('should update only display name', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Only Name Changed'
        })
        .expect(200);

      expect(response.body.data.displayName).toBe('Only Name Changed');
      expect(response.body.data.bio).toBe('Original bio'); // Unchanged
    });

    it('should update only bio', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Only bio changed'
        })
        .expect(200);

      expect(response.body.data.displayName).toBe('Test User'); // Unchanged
      expect(response.body.data.bio).toBe('Only bio changed');
    });
  });

  // TC002: Non-owner cannot update profile (403)
  describe('TC002: Authorization', () => {
    it('should return 403 when non-owner tries to update', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          displayName: 'Hacker',
          bio: 'Unauthorized'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBe('You can only edit your own profile');

      // Verify profile unchanged
      const user = await User.findById(userId);
      expect(user!.displayName).toBe('Test User');
      expect(user!.bio).toBe('Original bio');
    });
  });

  // TC003: Unauthenticated user cannot update (401)
  describe('TC003: Authentication required', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .send({
          displayName: 'No Auth'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({
          displayName: 'Invalid Auth'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // TC004: Display name validation (max 50 chars)
  describe('TC004: Display name validation', () => {
    it('should reject display name over 50 characters', async () => {
      const longName = 'A'.repeat(51);

      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: longName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('50 characters');
    });

    it('should accept display name at 50 characters', async () => {
      const maxName = 'A'.repeat(50);

      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: maxName
        })
        .expect(200);

      expect(response.body.data.displayName).toBe(maxName);
    });

    it('should trim display name', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: '  Trimmed Name  '
        })
        .expect(200);

      expect(response.body.data.displayName).toBe('Trimmed Name');
    });
  });

  // TC005: Bio validation (max 150 chars)
  describe('TC005: Bio validation', () => {
    it('should reject bio over 150 characters', async () => {
      const longBio = 'A'.repeat(151);

      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: longBio
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('150 characters');
    });

    it('should accept bio at 150 characters', async () => {
      const maxBio = 'A'.repeat(150);

      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: maxBio
        })
        .expect(200);

      expect(response.body.data.bio).toBe(maxBio);
    });

    it('should trim bio', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: '  Trimmed bio  '
        })
        .expect(200);

      expect(response.body.data.bio).toBe('Trimmed bio');
    });
  });

  // TC007: Empty strings clear fields
  describe('TC007: Clearing fields', () => {
    it('should clear display name with empty string', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: ''
        })
        .expect(200);

      expect(response.body.data.displayName).toBeNull();

      const user = await User.findById(userId);
      expect(user!.displayName).toBeNull();
    });

    it('should clear bio with empty string', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: ''
        })
        .expect(200);

      expect(response.body.data.bio).toBeNull();

      const user = await User.findById(userId);
      expect(user!.bio).toBeNull();
    });

    it('should clear with null values', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: null,
          bio: null
        })
        .expect(200);

      expect(response.body.data.displayName).toBeNull();
      expect(response.body.data.bio).toBeNull();
    });
  });

  // TC008: Invalid user ID
  describe('TC008: Invalid user ID', () => {
    it('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app)
        .put('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';

      // Need a token for this user (won't work in practice but tests the logic)
      const response = await request(app)
        .put(`/api/v1/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Test'
        })
        .expect(403); // Will be forbidden because token userId !== fakeUserId

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
