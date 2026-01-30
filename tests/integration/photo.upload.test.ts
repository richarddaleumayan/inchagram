/**
 * Integration Tests: Photo Upload API
 * Test Spec: TS0012
 * Story: US0012 - Photo Upload API with S3 Integration
 *
 * These tests verify photo upload functionality:
 * - AC1: Upload valid photo files (JPEG, PNG, WebP)
 * - AC2: File validation integration
 * - AC3: S3 upload and URL generation
 * - AC4: Photo metadata saved to MongoDB
 * - AC5: Authentication required
 * - AC6: Caption handling (optional, max 2200 chars)
 */

import request from 'supertest';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';
import bcrypt from 'bcrypt';
import * as s3Service from '../../src/services/s3Service';

// Mock S3 service
jest.mock('../../src/services/s3Service');
const mockUploadToS3 = s3Service.uploadToS3 as jest.MockedFunction<typeof s3Service.uploadToS3>;
const mockGenerateS3Key = s3Service.generateS3Key as jest.MockedFunction<typeof s3Service.generateS3Key>;

describe('POST /api/v1/photos', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test user and get auth token
    const user = await User.create({
      email: 'photographer@example.com',
      username: 'photographer',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    userId = user._id.toString();

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'photographer@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data.token;

    // Setup S3 mocks
    mockGenerateS3Key.mockImplementation((uid, _mimeType) => {
      return `photos/${uid}/mock-key.jpg`;
    });

    mockUploadToS3.mockResolvedValue({
      success: true,
      imageUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com/photos/test/mock-key.jpg',
      key: 'photos/test/mock-key.jpg',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC001: Upload valid JPEG photo (AC1)
  describe('TC001: Upload valid JPEG photo', () => {
    it('should upload JPEG photo successfully', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('caption', 'Beautiful sunset')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Photo uploaded successfully');
      expect(response.body.data).toHaveProperty('photoId');
      expect(response.body.data.imageUrl).toContain('s3.us-east-1.amazonaws.com');
      expect(response.body.data.caption).toBe('Beautiful sunset');
      expect(response.body.data.likeCount).toBe(0);

      // Verify photo in database
      const photo = await Photo.findById(response.body.data.photoId);
      expect(photo).toBeTruthy();
      expect(photo?.userId.toString()).toBe(userId);
      expect(photo?.caption).toBe('Beautiful sunset');
    });
  });

  // TC002: Upload valid PNG photo (AC1)
  describe('TC002: Upload valid PNG photo', () => {
    it('should upload PNG photo successfully', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-png-data'), {
          filename: 'test.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('photoId');
    });
  });

  // TC003: Upload valid WebP photo (AC1)
  describe('TC003: Upload valid WebP photo', () => {
    it('should upload WebP photo successfully', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-webp-data'), {
          filename: 'test.webp',
          contentType: 'image/webp',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('photoId');
    });
  });

  // TC004: Upload without caption (AC6)
  describe('TC004: Upload without caption', () => {
    it('should upload photo without caption', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('');

      // Verify in database
      const photo = await Photo.findById(response.body.data.photoId);
      expect(photo?.caption).toBe('');
    });
  });

  // TC005: Upload with empty caption (AC6)
  describe('TC005: Upload with empty caption', () => {
    it('should handle empty caption', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('caption', '')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('');
    });
  });

  // TC006: Caption at max length (AC6)
  describe('TC006: Caption at max length (2200 chars)', () => {
    it('should accept caption with exactly 2200 characters', async () => {
      const longCaption = 'a'.repeat(2200);

      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('caption', longCaption)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe(longCaption);
    });
  });

  // TC007: Caption exceeds max length (AC6)
  describe('TC007: Caption exceeds max length', () => {
    it('should reject caption with 2201+ characters', async () => {
      const tooLongCaption = 'a'.repeat(2201);

      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('caption', tooLongCaption)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Caption cannot exceed 2200 characters');

      // Verify no photo created
      const count = await Photo.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC008: No file uploaded (AC2)
  describe('TC008: No file uploaded', () => {
    it('should return 400 when no file is attached', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caption', 'Test caption')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FILE');
      expect(response.body.error.message).toBe('No file uploaded');
    });
  });

  // TC009: Invalid file type - GIF (AC2)
  describe('TC009: Invalid file type - GIF', () => {
    it('should reject GIF file', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-gif-data'), {
          filename: 'test.gif',
          contentType: 'image/gif',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TYPE');
    });
  });

  // TC010: Invalid file type - video (AC2)
  describe('TC010: Invalid file type - video', () => {
    it('should reject MP4 video file', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-video-data'), {
          filename: 'video.mp4',
          contentType: 'video/mp4',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TYPE');
    });
  });

  // TC011: File size exceeds limit (AC2)
  describe('TC011: File size exceeds 10MB limit', () => {
    it('should reject file larger than 10MB', async () => {
      // Multer will reject before reaching controller
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', largeBuffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        });

      // Multer returns 413 or 500 for file size limit
      expect([413, 500]).toContain(response.status);
    });
  });

  // TC012: No authentication token (AC5)
  describe('TC012: No authentication token', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/token/i);
    });
  });

  // TC013: Invalid authentication token (AC5)
  describe('TC013: Invalid authentication token', () => {
    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', 'Bearer invalid-token')
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // TC014: S3 upload failure (AC3)
  describe('TC014: S3 upload failure', () => {
    it('should return 500 when S3 upload fails', async () => {
      mockUploadToS3.mockResolvedValueOnce({
        success: false,
        error: 'S3 connection timeout',
      });

      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPLOAD_FAILED');

      // Verify no photo created in database
      const count = await Photo.countDocuments();
      expect(count).toBe(0);
    });
  });

  // TC015: Multiple photos from same user (AC4)
  describe('TC015: Multiple photos from same user', () => {
    it('should allow user to upload multiple photos', async () => {
      // Upload first photo
      const response1 = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data-1'), {
          filename: 'photo1.jpg',
          contentType: 'image/jpeg',
        })
        .field('caption', 'First photo')
        .expect(201);

      // Upload second photo
      const response2 = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data-2'), {
          filename: 'photo2.jpg',
          contentType: 'image/jpeg',
        })
        .field('caption', 'Second photo')
        .expect(201);

      expect(response1.body.data.photoId).not.toBe(response2.body.data.photoId);

      // Verify both photos in database
      const photos = await Photo.find({ userId });
      expect(photos.length).toBe(2);
    });
  });

  // TC016: Caption whitespace trimming (AC6)
  describe('TC016: Caption whitespace trimming', () => {
    it('should trim whitespace from caption', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-jpeg-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('caption', '  Beautiful photo  ')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('Beautiful photo');
    });
  });
});
