/**
 * Integration Tests: Personalized Feed API
 * Story: US0023 - Personalized Feed API Endpoint
 * Test Spec: TS0023
 *
 * Tests GET /api/v1/photos/feed endpoint:
 * - Returns photos from followed users only
 * - Chronological ordering (newest first)
 * - Pagination support
 * - Complete photo metadata
 * - Empty feed when not following anyone
 * - Authentication required
 */

import request from 'supertest';
import app from '../../src/app';
import { connectDatabase, closeDatabase } from '../setup';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';
import Follow from '../../src/models/Follow';
import { generateToken } from '../../src/services/jwtService';

// Test users
let userA: any; // Authenticated user requesting feed
let userB: any; // Followed by userA, has 5 photos
let userC: any; // Followed by userA, has 3 photos
let userD: any; // NOT followed by userA, has 2 photos

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  // Clear collections
  await User.deleteMany({});
  await Photo.deleteMany({});
  await Follow.deleteMany({});

  // Create test users
  userA = await User.create({
    email: 'usera@example.com',
    username: 'userA',
    passwordHash: '$2b$10$abc123'
  });

  userB = await User.create({
    email: 'userb@example.com',
    username: 'userB',
    passwordHash: '$2b$10$abc123',
    profilePictureUrl: 'https://s3.amazonaws.com/bucket/userB.jpg'
  });

  userC = await User.create({
    email: 'userc@example.com',
    username: 'userC',
    passwordHash: '$2b$10$abc123',
    profilePictureUrl: 'https://s3.amazonaws.com/bucket/userC.jpg'
  });

  userD = await User.create({
    email: 'userd@example.com',
    username: 'userD',
    passwordHash: '$2b$10$abc123'
  });

  // userA follows userB and userC (but NOT userD)
  await Follow.create({ followerId: userA._id, followingId: userB._id });
  await Follow.create({ followerId: userA._id, followingId: userC._id });

  // Create photos with specific timestamps (newest first for reference)
  const now = new Date();

  // userB photos (5 total): T-1h, T-2h, T-4h, T-6h, T-8h
  await Photo.create([
    {
      userId: userB._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoB1.jpg',
      caption: 'userB photo 1 (newest)',
      likeCount: 10,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) // T-1h
    },
    {
      userId: userB._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoB2.jpg',
      caption: 'userB photo 2',
      likeCount: 5,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // T-2h
    },
    {
      userId: userB._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoB3.jpg',
      caption: 'userB photo 3',
      likeCount: 3,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000) // T-4h
    },
    {
      userId: userB._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoB4.jpg',
      caption: 'userB photo 4',
      likeCount: 2,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000) // T-6h
    },
    {
      userId: userB._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoB5.jpg',
      caption: 'userB photo 5 (oldest from userB)',
      likeCount: 1,
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000) // T-8h
    }
  ]);

  // userC photos (3 total): T-3h, T-5h, T-7h
  await Photo.create([
    {
      userId: userC._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoC1.jpg',
      caption: 'userC photo 1',
      likeCount: 8,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) // T-3h
    },
    {
      userId: userC._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoC2.jpg',
      caption: 'userC photo 2',
      likeCount: 4,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) // T-5h
    },
    {
      userId: userC._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoC3.jpg',
      caption: 'userC photo 3',
      likeCount: 2,
      createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000) // T-7h
    }
  ]);

  // userD photos (2 total): T-9h, T-1h30m - should NOT appear in userA's feed
  await Photo.create([
    {
      userId: userD._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoD1.jpg',
      caption: 'userD photo 1 (should not appear)',
      likeCount: 0,
      createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000) // T-9h
    },
    {
      userId: userD._id,
      imageUrl: 'https://s3.amazonaws.com/bucket/photoD2.jpg',
      caption: 'userD photo 2 (should not appear)',
      likeCount: 0,
      createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000) // T-1h30m
    }
  ]);
});

/**
 * TC001: Feed Shows Only Followed Users' Photos
 */
describe('TC001: Feed Shows Only Followed Users\' Photos', () => {
  /**
   * TC001.1: Authenticated user sees followed users' photos
   */
  it('should return photos only from followed users', async () => {
    // Arrange: userA follows userB and userC
    const token = generateToken(userA._id.toString(), userA.username);

    // Act: GET /feed
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: 8 photos from userB (5) + userC (3)
    expect(response.body.success).toBe(true);
    expect(response.body.data.photos).toHaveLength(8);

    // Verify all photos are from userB or userC
    const photoUserIds = response.body.data.photos.map((p: any) => p.userId);
    const userBId = userB._id.toString();
    const userCId = userC._id.toString();

    photoUserIds.forEach((userId: string) => {
      expect([userBId, userCId]).toContain(userId);
    });
  });

  /**
   * TC001.2: Does not include photos from non-followed users
   */
  it('should not include photos from users not followed', async () => {
    // Arrange: userD posted photos but userA doesn't follow userD
    const token = generateToken(userA._id.toString(), userA.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: No photos from userD
    const userDPhotos = response.body.data.photos.filter(
      (p: any) => p.userId === userD._id.toString()
    );
    expect(userDPhotos).toHaveLength(0);
  });
});

/**
 * TC002: Photos Sorted Chronologically (Newest First)
 */
describe('TC002: Photos Sorted Chronologically', () => {
  /**
   * TC002.1: Photos ordered by createdAt descending
   */
  it('should return photos sorted by createdAt descending', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: Each photo older than or equal to previous
    const photos = response.body.data.photos;
    for (let i = 1; i < photos.length; i++) {
      const prevDate = new Date(photos[i - 1].createdAt).getTime();
      const currDate = new Date(photos[i].createdAt).getTime();
      expect(prevDate).toBeGreaterThanOrEqual(currDate);
    }
  });

  /**
   * TC002.2: Newest photo appears first
   */
  it('should have newest photo first in feed', async () => {
    // Arrange: userB's most recent photo is at T-1h
    const token = generateToken(userA._id.toString(), userA.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: First photo is from userB (T-1h is the newest)
    const firstPhoto = response.body.data.photos[0];
    expect(firstPhoto.userId).toBe(userB._id.toString());
    expect(firstPhoto.caption).toContain('newest');
  });
});

/**
 * TC003: Pagination Works Correctly
 */
describe('TC003: Pagination', () => {
  /**
   * TC003.1: First page returns correct number of photos
   */
  it('should return first page with specified limit', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act: Request first 3 photos
    const response = await request(app)
      .get('/api/v1/photos/feed?page=0&limit=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert
    expect(response.body.data.photos).toHaveLength(3);
    expect(response.body.data.pagination.page).toBe(0);
    expect(response.body.data.pagination.limit).toBe(3);
    expect(response.body.data.pagination.total).toBe(8);
    expect(response.body.data.pagination.hasMore).toBe(true);
  });

  /**
   * TC003.2: Second page returns next batch without overlap
   */
  it('should return second page without overlap', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act: Get both pages
    const page0 = await request(app)
      .get('/api/v1/photos/feed?page=0&limit=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const page1 = await request(app)
      .get('/api/v1/photos/feed?page=1&limit=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: No overlap
    const page0Ids = page0.body.data.photos.map((p: any) => p.photoId);
    const page1Ids = page1.body.data.photos.map((p: any) => p.photoId);
    const overlap = page0Ids.filter((id: string) => page1Ids.includes(id));
    expect(overlap).toHaveLength(0);

    // Assert: Second page has correct pagination
    expect(page1.body.data.pagination.page).toBe(1);
    expect(page1.body.data.pagination.hasMore).toBe(true);
  });

  /**
   * TC003.3: Last page indicates no more results
   */
  it('should indicate no more results on last page', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act: Request page that includes last photos (page=1, limit=5 → photos 6-8)
    const response = await request(app)
      .get('/api/v1/photos/feed?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: Only 3 remaining photos
    expect(response.body.data.photos).toHaveLength(3);
    expect(response.body.data.pagination.hasMore).toBe(false);
  });
});

/**
 * TC004: Photo Metadata Complete
 */
describe('TC004: Photo Metadata', () => {
  /**
   * TC004.1: Photo includes all required fields
   */
  it('should include all required photo metadata', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: First photo has all fields
    const photo = response.body.data.photos[0];
    expect(photo).toHaveProperty('photoId');
    expect(photo).toHaveProperty('imageUrl');
    expect(photo).toHaveProperty('caption');
    expect(photo).toHaveProperty('userId');
    expect(photo).toHaveProperty('username');
    expect(photo).toHaveProperty('profilePictureUrl');
    expect(photo).toHaveProperty('likeCount');
    expect(photo).toHaveProperty('createdAt');
  });

  /**
   * TC004.2: Username and profilePictureUrl populated from user
   */
  it('should populate username and profilePictureUrl from user data', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert: Photo shows correct username (userB has first photo)
    const firstPhoto = response.body.data.photos[0];
    expect(firstPhoto.username).toBe('userB');
    expect(firstPhoto.profilePictureUrl).toBe('https://s3.amazonaws.com/bucket/userB.jpg');
  });
});

/**
 * TC005: Empty Feed When Not Following Anyone
 */
describe('TC005: Empty Feed', () => {
  /**
   * TC005.1: Returns empty array when no follows
   */
  it('should return empty photos array when user follows nobody', async () => {
    // Arrange: Create userE who follows nobody
    const userE = await User.create({
      email: 'usere@example.com',
      username: 'userE',
      passwordHash: '$2b$10$abc123'
    });
    const token = generateToken(userE._id.toString(), userE.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert
    expect(response.body.success).toBe(true);
    expect(response.body.data.photos).toEqual([]);
    expect(response.body.data.pagination.total).toBe(0);
    expect(response.body.data.pagination.hasMore).toBe(false);
  });
});

/**
 * TC006: Authentication Required
 */
describe('TC006: Authentication', () => {
  /**
   * TC006.1: 401 without Authorization header
   */
  it('should return 401 when no auth token provided', async () => {
    // Arrange: No authorization header

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .expect(401);

    // Assert
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  /**
   * TC006.2: 401 with invalid token
   */
  it('should return 401 with invalid token', async () => {
    // Arrange: Invalid JWT
    const invalidToken = 'invalid.jwt.token';

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    // Assert
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

/**
 * TC007: Query Parameter Validation
 */
describe('TC007: Query Parameter Validation', () => {
  /**
   * TC007.1: Defaults to page=0, limit=20 when not specified
   */
  it('should use default page=0, limit=20 when not specified', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert
    expect(response.body.data.pagination.page).toBe(0);
    expect(response.body.data.pagination.limit).toBe(20);
  });

  /**
   * TC007.2: Caps limit at 50
   */
  it('should cap limit at maximum of 50', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act: Request limit=100 (should be capped at 50)
    const response = await request(app)
      .get('/api/v1/photos/feed?limit=100')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert
    expect(response.body.data.pagination.limit).toBe(50);
  });

  /**
   * TC007.3: Handles negative page number
   */
  it('should treat negative page as page 0', async () => {
    // Arrange
    const token = generateToken(userA._id.toString(), userA.username);

    // Act
    const response = await request(app)
      .get('/api/v1/photos/feed?page=-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Assert
    expect(response.body.data.pagination.page).toBe(0);
  });
});
