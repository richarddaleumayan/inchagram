/**
 * Integration Tests: User Photos API
 * Story: US0007 - Profile Photo Grid Component
 *
 * Tests for GET /api/v1/users/:userId/photos endpoint
 */

import request from 'supertest';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';
import bcrypt from 'bcrypt';

describe('GET /api/v1/users/:userId/photos', () => {
  let userId: string;

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
      email: 'photographer@example.com',
      username: 'photographer',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    userId = user._id.toString();

    // Create test photos (newest first by creation time)
    const photos = [];
    for (let i = 0; i < 25; i++) {
      const photo = await Photo.create({
        userId,
        imageUrl: `https://test-bucket.s3.us-east-1.amazonaws.com/photos/test/photo${i}.jpg`,
        caption: `Test photo ${i}`,
        likeCount: i,
        createdAt: new Date(Date.now() - (24 - i) * 1000) // Spread over time
      });
      photos.push(photo);
    }
  });

  // TC001: Returns user's photos in reverse chronological order
  describe('TC001: Returns photos in reverse chronological order', () => {
    it('should return newest photos first', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photos).toHaveLength(20); // Default limit

      // Check order - newest first (photo24 should be first)
      expect(response.body.data.photos[0].caption).toBe('Test photo 24');
      expect(response.body.data.photos[19].caption).toBe('Test photo 5');

      // Verify dates are in descending order
      for (let i = 0; i < response.body.data.photos.length - 1; i++) {
        const current = new Date(response.body.data.photos[i].createdAt).getTime();
        const next = new Date(response.body.data.photos[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  // TC002: Pagination works correctly
  describe('TC002: Pagination', () => {
    it('should return first page with default limit', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos`)
        .expect(200);

      expect(response.body.data.photos).toHaveLength(20);
      expect(response.body.data.pagination).toEqual({
        page: 0,
        limit: 20,
        total: 25,
        hasMore: true
      });
    });

    it('should return second page', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos?page=1&limit=20`)
        .expect(200);

      expect(response.body.data.photos).toHaveLength(5); // Remaining photos
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        hasMore: false
      });

      // Check it's the oldest photos
      expect(response.body.data.photos[0].caption).toBe('Test photo 4');
      expect(response.body.data.photos[4].caption).toBe('Test photo 0');
    });

    it('should respect custom limit', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos?page=0&limit=10`)
        .expect(200);

      expect(response.body.data.photos).toHaveLength(10);
      expect(response.body.data.pagination).toEqual({
        page: 0,
        limit: 10,
        total: 25,
        hasMore: true
      });
    });
  });

  // TC003: Returns empty array for user with no photos
  describe('TC003: Empty photo list', () => {
    it('should return empty array for user with no photos', async () => {
      // Create user with no photos
      const emptyUser = await User.create({
        email: 'empty@example.com',
        username: 'emptyuser',
        passwordHash: await bcrypt.hash('password123', 10),
      });

      const response = await request(app)
        .get(`/api/v1/users/${emptyUser._id.toString()}/photos`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photos).toEqual([]);
      expect(response.body.data.pagination).toEqual({
        page: 0,
        limit: 20,
        total: 0,
        hasMore: false
      });
    });
  });

  // TC004: Returns 404 for non-existent user
  describe('TC004: Non-existent user', () => {
    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId

      const response = await request(app)
        .get(`/api/v1/users/${fakeUserId}/photos`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('User not found');
    });
  });

  // TC005: Invalid user ID format
  describe('TC005: Invalid user ID', () => {
    it('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id/photos')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Invalid user ID format');
    });
  });

  // TC006: Photo data format
  describe('TC006: Photo data format', () => {
    it('should return photos with correct format', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos?limit=1`)
        .expect(200);

      const photo = response.body.data.photos[0];
      expect(photo).toHaveProperty('photoId');
      expect(photo).toHaveProperty('imageUrl');
      expect(photo).toHaveProperty('caption');
      expect(photo).toHaveProperty('likeCount');
      expect(photo).toHaveProperty('createdAt');

      expect(typeof photo.photoId).toBe('string');
      expect(typeof photo.imageUrl).toBe('string');
      expect(typeof photo.caption).toBe('string');
      expect(typeof photo.likeCount).toBe('number');
      expect(typeof photo.createdAt).toBe('string');
    });
  });

  // TC007: Query parameter defaults
  describe('TC007: Query parameter defaults', () => {
    it('should use default page 0 when not provided', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos?limit=5`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(0);
    });

    it('should use default limit 20 when not provided', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos?page=0`)
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(20);
    });

    it('should handle invalid page parameter', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos?page=invalid`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(0);
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/photos?limit=invalid`)
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(20);
    });
  });
});
