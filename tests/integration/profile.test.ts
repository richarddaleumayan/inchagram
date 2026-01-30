/**
 * User Profile API Integration Tests
 * Tests for GET /api/v1/users/:userId and GET /api/v1/users/username/:username
 * Story: US0006 - View User Profile API Endpoint
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Photo.deleteMany({});
});

describe('US0006: View User Profile API', () => {
  // Test data
  const createTestUser = async (overrides = {}) => {
    const userData = {
      email: 'taylor@example.com',
      username: 'taylor_curator',
      passwordHash: '$2b$10$hashedpassword',
      displayName: 'Taylor Smith',
      bio: 'Art gallery assistant | Photography curator',
      profilePictureUrl: 'https://example.com/avatar.jpg',
      ...overrides
    };
    return await User.create(userData);
  };

  describe('GET /api/v1/users/:userId', () => {
    describe('AC1: Get Profile by User ID', () => {
      it('should return 200 with complete profile data for valid user ID', async () => {
        const user = await createTestUser();

        const response = await request(app)
          .get(`/api/v1/users/${user._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          userId: user._id.toString(),
          username: 'taylor_curator',
          email: 'taylor@example.com',
          displayName: 'Taylor Smith',
          bio: 'Art gallery assistant | Photography curator',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          followerCount: 0,
          followingCount: 0,
          photoCount: 0
        });
        expect(response.body.data.createdAt).toBeDefined();
        // Verify ISO 8601 format
        expect(new Date(response.body.data.createdAt).toISOString()).toBe(response.body.data.createdAt);
      });

      it('should never return passwordHash in response', async () => {
        const user = await createTestUser();

        const response = await request(app)
          .get(`/api/v1/users/${user._id}`)
          .expect(200);

        expect(response.body.data.passwordHash).toBeUndefined();
        expect(response.body.data.password).toBeUndefined();
      });

      it('should return correct photoCount when user has photos', async () => {
        const user = await createTestUser();

        // Create some photos for this user
        await Photo.create([
          { userId: user._id, imageUrl: 'https://example.com/photo1.jpg' },
          { userId: user._id, imageUrl: 'https://example.com/photo2.jpg' },
          { userId: user._id, imageUrl: 'https://example.com/photo3.jpg' }
        ]);

        const response = await request(app)
          .get(`/api/v1/users/${user._id}`)
          .expect(200);

        expect(response.body.data.photoCount).toBe(3);
      });
    });

    describe('AC3: User Not Found (by ID)', () => {
      it('should return 404 for non-existent user ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .get(`/api/v1/users/${nonExistentId}`)
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            details: { userId: nonExistentId.toString() }
          }
        });
      });
    });

    describe('AC5: Invalid User ID Format', () => {
      it('should return 400 for invalid ObjectId format', async () => {
        const response = await request(app)
          .get('/api/v1/users/invalid-id-format')
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user ID format',
            details: { userId: 'invalid-id-format' }
          }
        });
      });

      it('should return 400 for ObjectId with wrong length', async () => {
        const response = await request(app)
          .get('/api/v1/users/abc123')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Invalid user ID format');
      });
    });

    describe('Edge Cases: Optional Fields', () => {
      it('should return null for displayName when not set', async () => {
        const user = await createTestUser({ displayName: undefined });

        const response = await request(app)
          .get(`/api/v1/users/${user._id}`)
          .expect(200);

        expect(response.body.data.displayName).toBeNull();
      });

      it('should return null for bio when not set', async () => {
        const user = await createTestUser({ bio: undefined });

        const response = await request(app)
          .get(`/api/v1/users/${user._id}`)
          .expect(200);

        expect(response.body.data.bio).toBeNull();
      });

      it('should return null for profilePictureUrl when not set', async () => {
        const user = await createTestUser({ profilePictureUrl: undefined });

        const response = await request(app)
          .get(`/api/v1/users/${user._id}`)
          .expect(200);

        expect(response.body.data.profilePictureUrl).toBeNull();
      });

      it('should return all fields as null when optional fields are not set', async () => {
        const user = await createTestUser({
          displayName: undefined,
          bio: undefined,
          profilePictureUrl: undefined
        });

        const response = await request(app)
          .get(`/api/v1/users/${user._id}`)
          .expect(200);

        expect(response.body.data.displayName).toBeNull();
        expect(response.body.data.bio).toBeNull();
        expect(response.body.data.profilePictureUrl).toBeNull();
        // Required fields should still be present
        expect(response.body.data.username).toBe('taylor_curator');
        expect(response.body.data.email).toBe('taylor@example.com');
      });
    });
  });

  describe('GET /api/v1/users/username/:username', () => {
    describe('AC2: Get Profile by Username', () => {
      it('should return 200 with complete profile data for valid username', async () => {
        const user = await createTestUser();

        const response = await request(app)
          .get('/api/v1/users/username/taylor_curator')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          userId: user._id.toString(),
          username: 'taylor_curator',
          email: 'taylor@example.com',
          displayName: 'Taylor Smith',
          bio: 'Art gallery assistant | Photography curator'
        });
      });
    });

    describe('AC4: User Not Found (by Username)', () => {
      it('should return 404 for non-existent username', async () => {
        const response = await request(app)
          .get('/api/v1/users/username/nonexistent_user')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            details: { username: 'nonexistent_user' }
          }
        });
      });
    });

    describe('AC6: Username Case-Insensitive Lookup', () => {
      it('should find user with uppercase username query', async () => {
        await createTestUser({ username: 'Taylor_Curator' });

        const response = await request(app)
          .get('/api/v1/users/username/TAYLOR_CURATOR')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe('Taylor_Curator');
      });

      it('should find user with lowercase username query', async () => {
        await createTestUser({ username: 'Taylor_Curator' });

        const response = await request(app)
          .get('/api/v1/users/username/taylor_curator')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe('Taylor_Curator');
      });

      it('should find user with mixed case username query', async () => {
        await createTestUser({ username: 'taylor_curator' });

        const response = await request(app)
          .get('/api/v1/users/username/TaYlOr_CuRaToR')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe('taylor_curator');
      });
    });

    describe('Edge Cases: Username Lookup', () => {
      it('should return 404 for extremely long username', async () => {
        const longUsername = 'a'.repeat(100);

        const response = await request(app)
          .get(`/api/v1/users/username/${longUsername}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      it('should handle URL-encoded special characters in username', async () => {
        // Username with @ symbol (URL encoded as %40)
        const response = await request(app)
          .get('/api/v1/users/username/user%40test')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return createdAt in ISO 8601 format', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .get(`/api/v1/users/${user._id}`)
        .expect(200);

      const createdAt = response.body.data.createdAt;
      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return consistent response structure', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .get(`/api/v1/users/${user._id}`)
        .expect(200);

      // Verify all expected fields are present
      const expectedFields = [
        'userId',
        'username',
        'email',
        'displayName',
        'bio',
        'profilePictureUrl',
        'followerCount',
        'followingCount',
        'photoCount',
        'createdAt'
      ];

      expectedFields.forEach(field => {
        expect(response.body.data).toHaveProperty(field);
      });
    });

    it('should return counts as numbers', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .get(`/api/v1/users/${user._id}`)
        .expect(200);

      expect(typeof response.body.data.followerCount).toBe('number');
      expect(typeof response.body.data.followingCount).toBe('number');
      expect(typeof response.body.data.photoCount).toBe('number');
    });
  });
});
