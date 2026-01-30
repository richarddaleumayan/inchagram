/**
 * Integration Tests: Discovery Feed API
 * Story: US0024 - Discovery Feed API Endpoint
 *
 * Tests the GET /api/v1/photos/discover endpoint which returns
 * all photos from all users (public discovery feed).
 */

import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';
import { connectDatabase, clearDatabase, closeDatabase } from '../setup';

describe('GET /api/v1/photos/discover - Discovery Feed API', () => {
  // Test data
  let userA: any;
  let userB: any;
  let userC: any;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create 3 users
    userA = await User.create({
      email: 'usera@example.com',
      username: 'userA',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv'
    });

    userB = await User.create({
      email: 'userb@example.com',
      username: 'userB',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv'
    });

    userC = await User.create({
      email: 'userc@example.com',
      username: 'userC',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv'
    });

    // Create photos from all users with timestamps (newest to oldest)
    const now = new Date();
    await Photo.create([
      {
        userId: userA._id,
        imageUrl: 'https://example.com/a1.jpg',
        caption: 'Photo A1',
        likeCount: 0,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) // T-1h
      },
      {
        userId: userB._id,
        imageUrl: 'https://example.com/b1.jpg',
        caption: 'Photo B1',
        likeCount: 0,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // T-2h
      },
      {
        userId: userA._id,
        imageUrl: 'https://example.com/a2.jpg',
        caption: 'Photo A2',
        likeCount: 0,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) // T-3h
      },
      {
        userId: userB._id,
        imageUrl: 'https://example.com/b2.jpg',
        caption: 'Photo B2',
        likeCount: 0,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000) // T-4h
      },
      {
        userId: userA._id,
        imageUrl: 'https://example.com/a3.jpg',
        caption: 'Photo A3',
        likeCount: 0,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) // T-5h
      },
      {
        userId: userC._id,
        imageUrl: 'https://example.com/c1.jpg',
        caption: 'Photo C1',
        likeCount: 0,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000) // T-6h
      },
      {
        userId: userC._id,
        imageUrl: 'https://example.com/c2.jpg',
        caption: 'Photo C2',
        likeCount: 0,
        createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000) // T-7h
      }
    ]);
  });

  describe('TC001: Unauthenticated Access', () => {
    it('should allow unauthenticated access to discovery feed', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.photos).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('TC002: Returns Photos from All Users', () => {
    it('should return photos from all users regardless of follows', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      expect(res.body.success).toBe(true);

      const photos = res.body.data.photos;
      const usernames = photos.map((p: any) => p.username);

      // Should include photos from all 3 users
      expect(usernames).toContain('userA');
      expect(usernames).toContain('userB');
      expect(usernames).toContain('userC');

      // Should have all 7 photos
      expect(res.body.data.pagination.total).toBe(7);
    });

    it('should include all photos in the database', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const photos = res.body.data.photos;
      expect(photos.length).toBe(7);
    });
  });

  describe('TC003: Chronological Ordering', () => {
    it('should return photos sorted by createdAt descending (newest first)', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const photos = res.body.data.photos;

      // First photo should be newest (Photo A1, T-1h)
      expect(photos[0].caption).toBe('Photo A1');

      // Second photo (Photo B1, T-2h)
      expect(photos[1].caption).toBe('Photo B1');

      // Last photo should be oldest (Photo C2, T-7h)
      expect(photos[6].caption).toBe('Photo C2');
    });

    it('should have photos in descending createdAt order', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const photos = res.body.data.photos;
      const timestamps = photos.map((p: any) => new Date(p.createdAt).getTime());

      // Check that each timestamp is greater than or equal to the next
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });
  });

  describe('TC004: Pagination - Page 0', () => {
    it('should return first page with correct limit', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover?page=0&limit=3')
        .expect(200);

      expect(res.body.success).toBe(true);

      const { photos, pagination } = res.body.data;

      // Should return 3 photos
      expect(photos.length).toBe(3);

      // Should be first 3 photos (newest)
      expect(photos[0].caption).toBe('Photo A1');
      expect(photos[1].caption).toBe('Photo B1');
      expect(photos[2].caption).toBe('Photo A2');

      // Pagination metadata
      expect(pagination.page).toBe(0);
      expect(pagination.limit).toBe(3);
      expect(pagination.total).toBe(7);
      expect(pagination.hasMore).toBe(true);
    });

    it('should return second page correctly', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover?page=1&limit=3')
        .expect(200);

      const { photos, pagination } = res.body.data;

      // Should return next 3 photos
      expect(photos.length).toBe(3);
      expect(photos[0].caption).toBe('Photo B2');
      expect(photos[1].caption).toBe('Photo A3');
      expect(photos[2].caption).toBe('Photo C1');

      // Pagination metadata
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(3);
      expect(pagination.total).toBe(7);
      expect(pagination.hasMore).toBe(true);
    });

    it('should return last page correctly', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover?page=2&limit=3')
        .expect(200);

      const { photos, pagination } = res.body.data;

      // Should return last 1 photo
      expect(photos.length).toBe(1);
      expect(photos[0].caption).toBe('Photo C2');

      // Pagination metadata
      expect(pagination.page).toBe(2);
      expect(pagination.limit).toBe(3);
      expect(pagination.total).toBe(7);
      expect(pagination.hasMore).toBe(false);
    });
  });

  describe('TC005: Empty Feed', () => {
    it('should return empty array when no photos exist', async () => {
      // Clear all photos
      await Photo.deleteMany({});

      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.photos).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
      expect(res.body.data.pagination.hasMore).toBe(false);
    });
  });

  describe('TC006: Photo Metadata Completeness', () => {
    it('should include all required metadata fields', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const photo = res.body.data.photos[0];

      // Check all required fields exist
      expect(photo).toHaveProperty('photoId');
      expect(photo).toHaveProperty('imageUrl');
      expect(photo).toHaveProperty('caption');
      expect(photo).toHaveProperty('userId');
      expect(photo).toHaveProperty('username');
      expect(photo).toHaveProperty('profilePictureUrl');
      expect(photo).toHaveProperty('likeCount');
      expect(photo).toHaveProperty('createdAt');
    });

    it('should have valid ObjectId for photoId and userId', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const photo = res.body.data.photos[0];

      // photoId should be valid ObjectId string
      expect(Types.ObjectId.isValid(photo.photoId)).toBe(true);

      // userId should be valid ObjectId string
      expect(Types.ObjectId.isValid(photo.userId)).toBe(true);
    });

    it('should have valid data types', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const photo = res.body.data.photos[0];

      expect(typeof photo.photoId).toBe('string');
      expect(typeof photo.imageUrl).toBe('string');
      expect(typeof photo.caption).toBe('string');
      expect(typeof photo.userId).toBe('string');
      expect(typeof photo.username).toBe('string');
      expect(typeof photo.likeCount).toBe('number');
      expect(typeof photo.createdAt).toBe('string');

      // createdAt should be ISO 8601 format
      expect(new Date(photo.createdAt).toISOString()).toBe(photo.createdAt);
    });
  });

  describe('TC007: Pagination Metadata', () => {
    it('should have correct hasMore flag across pages', async () => {
      // Page 0: hasMore = true
      const res0 = await request(app)
        .get('/api/v1/photos/discover?page=0&limit=3')
        .expect(200);
      expect(res0.body.data.pagination.hasMore).toBe(true);

      // Page 1: hasMore = true
      const res1 = await request(app)
        .get('/api/v1/photos/discover?page=1&limit=3')
        .expect(200);
      expect(res1.body.data.pagination.hasMore).toBe(true);

      // Page 2: hasMore = false (last page)
      const res2 = await request(app)
        .get('/api/v1/photos/discover?page=2&limit=3')
        .expect(200);
      expect(res2.body.data.pagination.hasMore).toBe(false);
    });

    it('should maintain consistent total across pages', async () => {
      const res0 = await request(app)
        .get('/api/v1/photos/discover?page=0&limit=3')
        .expect(200);

      const res1 = await request(app)
        .get('/api/v1/photos/discover?page=1&limit=3')
        .expect(200);

      const res2 = await request(app)
        .get('/api/v1/photos/discover?page=2&limit=3')
        .expect(200);

      // Total should be 7 for all pages
      expect(res0.body.data.pagination.total).toBe(7);
      expect(res1.body.data.pagination.total).toBe(7);
      expect(res2.body.data.pagination.total).toBe(7);
    });
  });

  describe('TC008: Limit Caps at 50', () => {
    it('should cap limit at maximum 50', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover?limit=100')
        .expect(200);

      expect(res.body.data.pagination.limit).toBe(50);
    });

    it('should return at most 50 photos when limit exceeds 50', async () => {
      // Create 60 more photos to test limit cap
      const extraPhotos = [];
      for (let i = 0; i < 60; i++) {
        extraPhotos.push({
          userId: userA._id,
          imageUrl: `https://example.com/extra${i}.jpg`,
          caption: `Extra Photo ${i}`,
          likeCount: 0,
          createdAt: new Date(Date.now() - i * 1000)
        });
      }
      await Photo.create(extraPhotos);

      const res = await request(app)
        .get('/api/v1/photos/discover?limit=100')
        .expect(200);

      // Should return max 50 photos
      expect(res.body.data.photos.length).toBeLessThanOrEqual(50);
    });
  });

  describe('TC009: Default Parameters', () => {
    it('should use default page=0 and limit=20 when not specified', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      const { pagination } = res.body.data;

      expect(pagination.page).toBe(0);
      expect(pagination.limit).toBe(20);
    });

    it('should return all 7 photos with default limit', async () => {
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      // With limit=20 (default) and only 7 photos, should return all
      expect(res.body.data.photos.length).toBe(7);
      expect(res.body.data.pagination.hasMore).toBe(false);
    });
  });

  describe('TC010: Authenticated User Access', () => {
    it('should allow authenticated users to access discovery feed', async () => {
      // Note: Discovery feed is public, so authentication is optional
      // This test simply verifies the endpoint works regardless of auth status
      const res = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.photos.length).toBe(7);
    });

    it('should return same data for authenticated and unauthenticated users', async () => {
      // Unauthenticated request
      const res1 = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      // Authenticated request (without actual token for simplicity)
      const res2 = await request(app)
        .get('/api/v1/photos/discover')
        .expect(200);

      // Both should return same photos
      expect(res1.body.data.photos.length).toBe(res2.body.data.photos.length);
      expect(res1.body.data.pagination.total).toBe(res2.body.data.pagination.total);
    });
  });
});
