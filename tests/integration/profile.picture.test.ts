/**
 * Integration Tests: Profile Picture Upload API
 * Story: US0009 - Upload/Update Profile Picture
 *
 * Tests for PUT /api/v1/users/:userId/profile-picture endpoint
 */

import request from 'supertest';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import bcrypt from 'bcrypt';
import * as s3Service from '../../src/services/s3Service';

// Mock S3 service
jest.mock('../../src/services/s3Service');
const mockUploadToS3 = s3Service.uploadToS3 as jest.MockedFunction<typeof s3Service.uploadToS3>;

describe('PUT /api/v1/users/:userId/profile-picture', () => {
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

    // Create another user
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

    // Setup S3 mocks
    mockUploadToS3.mockResolvedValue({
      success: true,
      imageUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com/avatars/test/profile.jpg',
      key: 'avatars/test/profile.jpg'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC001: Successfully upload profile picture
  describe('TC001: Upload profile picture', () => {
    it('should upload profile picture and update user', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', Buffer.from('fake-image-data'), {
          filename: 'profile.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profilePictureUrl).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/avatars/test/profile.jpg');

      // Verify S3 upload was called
      expect(mockUploadToS3).toHaveBeenCalled();

      // Verify database update
      const updatedUser = await User.findById(userId);
      expect(updatedUser!.profilePictureUrl).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/avatars/test/profile.jpg');
    });
  });

  // TC002: Replace existing profile picture
  describe('TC002: Replace profile picture', () => {
    it('should replace existing profile picture', async () => {
      // Set initial profile picture
      await User.findByIdAndUpdate(userId, {
        profilePictureUrl: 'https://old-url.com/old.jpg'
      });

      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', Buffer.from('new-image-data'), {
          filename: 'new-profile.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response.body.data.profilePictureUrl).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/avatars/test/profile.jpg');

      const updatedUser = await User.findById(userId);
      expect(updatedUser!.profilePictureUrl).not.toBe('https://old-url.com/old.jpg');
    });
  });

  // TC003: File validation - invalid format
  describe('TC003: File validation', () => {
    it('should reject invalid file format', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', Buffer.from('fake-pdf-data'), {
          filename: 'profile.pdf',
          contentType: 'application/pdf'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid file type');
    });

    it('should reject file that is too large', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', largeBuffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('10MB');
    });

    it('should reject missing file', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('required');
    });
  });

  // TC004: Authorization
  describe('TC004: Authorization', () => {
    it('should reject non-owner trying to update', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .attach('profilePicture', Buffer.from('fake-image-data'), {
          filename: 'profile.jpg',
          contentType: 'image/jpeg'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .attach('profilePicture', Buffer.from('fake-image-data'), {
          filename: 'profile.jpg',
          contentType: 'image/jpeg'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // TC005: S3 upload failure
  describe('TC005: S3 upload failure', () => {
    it('should return error if S3 upload fails', async () => {
      mockUploadToS3.mockResolvedValueOnce({
        success: false,
        error: 'S3 upload failed'
      });

      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', Buffer.from('fake-image-data'), {
          filename: 'profile.jpg',
          contentType: 'image/jpeg'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPLOAD_FAILED');
    });
  });

  // TC006: Accept PNG files
  describe('TC006: File format support', () => {
    it('should accept PNG files', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', Buffer.from('fake-png-data'), {
          filename: 'profile.png',
          contentType: 'image/png'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept WebP files', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${userId}/profile-picture`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profilePicture', Buffer.from('fake-webp-data'), {
          filename: 'profile.webp',
          contentType: 'image/webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
