/**
 * Integration Tests: Photo Deletion API
 * Test Spec: TS0014
 * Story: US0014 - Photo Deletion (MongoDB + S3 Cleanup)
 *
 * These tests verify photo deletion functionality:
 * - AC1: Owner can delete their own photo
 * - AC2: Non-owner cannot delete photo (403)
 * - AC3: Photo deleted from MongoDB
 * - AC4: Photo deleted from S3
 * - AC5: Authentication required
 * - AC6: Handle non-existent photo (404)
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
const mockDeleteFromS3 = s3Service.deleteFromS3 as jest.MockedFunction<typeof s3Service.deleteFromS3>;
const mockExtractS3Key = s3Service.extractS3Key as jest.MockedFunction<typeof s3Service.extractS3Key>;

describe('DELETE /api/v1/photos/:photoId', () => {
  let authToken: string;
  let userId: string;
  let photoId: string;
  let anotherUserToken: string;

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

    // Create another user for ownership tests
    await User.create({
      email: 'another@example.com',
      username: 'anotheruser',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    const anotherLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'another@example.com',
        password: 'password123',
      });

    anotherUserToken = anotherLoginResponse.body.data.token;

    // Create a test photo
    const photo = await Photo.create({
      userId,
      imageUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com/photos/test/photo1.jpg',
      caption: 'Test photo',
      likeCount: 0,
    });

    photoId = photo._id.toString();

    // Setup S3 mocks
    mockExtractS3Key.mockReturnValue('photos/test/photo1.jpg');
    mockDeleteFromS3.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC001: Owner successfully deletes photo (AC1, AC3, AC4)
  describe('TC001: Owner successfully deletes photo', () => {
    it('should delete photo from MongoDB and S3', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Photo deleted successfully');

      // Verify photo deleted from MongoDB
      const deletedPhoto = await Photo.findById(photoId);
      expect(deletedPhoto).toBeNull();

      // Verify S3 delete was called
      expect(mockExtractS3Key).toHaveBeenCalledWith(
        'https://test-bucket.s3.us-east-1.amazonaws.com/photos/test/photo1.jpg'
      );
      expect(mockDeleteFromS3).toHaveBeenCalledWith('photos/test/photo1.jpg');
    });
  });

  // TC002: Non-owner cannot delete photo (AC2)
  describe('TC002: Non-owner cannot delete photo', () => {
    it('should return 403 when non-owner tries to delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBe('You do not have permission to delete this photo');

      // Verify photo still exists
      const photo = await Photo.findById(photoId);
      expect(photo).toBeTruthy();

      // Verify S3 delete was not called
      expect(mockDeleteFromS3).not.toHaveBeenCalled();
    });
  });

  // TC003: No authentication token (AC5)
  describe('TC003: No authentication token', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/token/i);

      // Verify photo still exists
      const photo = await Photo.findById(photoId);
      expect(photo).toBeTruthy();
    });
  });

  // TC004: Invalid authentication token (AC5)
  describe('TC004: Invalid authentication token', () => {
    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);

      // Verify photo still exists
      const photo = await Photo.findById(photoId);
      expect(photo).toBeTruthy();
    });
  });

  // TC005: Photo not found (AC6)
  describe('TC005: Photo not found', () => {
    it('should return 404 for non-existent photo', async () => {
      const fakePhotoId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      const response = await request(app)
        .delete(`/api/v1/photos/${fakePhotoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Photo not found');

      // Verify S3 delete was not called
      expect(mockDeleteFromS3).not.toHaveBeenCalled();
    });
  });

  // TC006: Invalid photo ID format
  describe('TC006: Invalid photo ID format', () => {
    it('should return 500 for invalid ObjectId format', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  // TC007: S3 deletion fails but MongoDB succeeds
  describe('TC007: S3 deletion fails but MongoDB succeeds', () => {
    it('should still succeed if S3 delete fails', async () => {
      mockDeleteFromS3.mockResolvedValueOnce(false);

      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Photo deleted successfully');

      // Verify photo deleted from MongoDB despite S3 failure
      const deletedPhoto = await Photo.findById(photoId);
      expect(deletedPhoto).toBeNull();

      // Verify S3 delete was attempted
      expect(mockDeleteFromS3).toHaveBeenCalled();
    });
  });

  // TC008: Delete photo with no S3 key extracted
  describe('TC008: Delete photo with no S3 key extracted', () => {
    it('should succeed even if S3 key extraction fails', async () => {
      mockExtractS3Key.mockReturnValueOnce(null);

      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify photo deleted from MongoDB
      const deletedPhoto = await Photo.findById(photoId);
      expect(deletedPhoto).toBeNull();

      // Verify S3 delete was not called (no key)
      expect(mockDeleteFromS3).not.toHaveBeenCalled();
    });
  });

  // TC009: Delete multiple photos by same owner
  describe('TC009: Delete multiple photos by same owner', () => {
    it('should allow owner to delete multiple photos', async () => {
      // Create second photo
      const photo2 = await Photo.create({
        userId,
        imageUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com/photos/test/photo2.jpg',
        caption: 'Second photo',
        likeCount: 0,
      });

      const photoId2 = photo2._id.toString();

      // Delete first photo
      await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Delete second photo
      await request(app)
        .delete(`/api/v1/photos/${photoId2}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify both photos deleted
      const photo1 = await Photo.findById(photoId);
      const photo2Found = await Photo.findById(photoId2);
      expect(photo1).toBeNull();
      expect(photo2Found).toBeNull();

      // Verify S3 delete called twice
      expect(mockDeleteFromS3).toHaveBeenCalledTimes(2);
    });
  });

  // TC010: Attempt to delete already deleted photo
  describe('TC010: Attempt to delete already deleted photo', () => {
    it('should return 404 for already deleted photo', async () => {
      // Delete photo first time
      await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Attempt to delete again
      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  // TC011: Photo with likes can be deleted
  describe('TC011: Photo with likes can be deleted', () => {
    it('should allow deletion of photo with likes', async () => {
      // Update photo to have likes
      await Photo.findByIdAndUpdate(photoId, { likeCount: 10 });

      const response = await request(app)
        .delete(`/api/v1/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify photo deleted
      const deletedPhoto = await Photo.findById(photoId);
      expect(deletedPhoto).toBeNull();
    });
  });
});
