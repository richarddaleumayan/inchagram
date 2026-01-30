/**
 * Integration Tests: Like/Unlike Photo API
 * Test Spec: TS0016
 * Story: US0016 - Like/Unlike Photo API Endpoints
 *
 * These tests verify all acceptance criteria:
 * - AC1: Like photo successfully
 * - AC2: Unlike photo successfully
 * - AC3: Duplicate like prevention
 * - AC4: Unlike non-existent like
 * - AC5: Photo not found
 * - AC6: Authentication required
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';
import Like from '../../src/models/Like';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing';

describe('Like/Unlike Photo API', () => {
  let userA: mongoose.Document & { _id: mongoose.Types.ObjectId };
  let userB: mongoose.Document & { _id: mongoose.Types.ObjectId };
  let photo: mongoose.Document & { _id: mongoose.Types.ObjectId };
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test users
    const passwordHash = await bcrypt.hash('password123', 10);

    userA = await User.create({
      email: 'usera@example.com',
      username: 'userA',
      passwordHash
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId };

    userB = await User.create({
      email: 'userb@example.com',
      username: 'userB',
      passwordHash
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId };

    // Create test photo
    photo = await Photo.create({
      userId: userA._id,
      imageUrl: 'https://example.com/photo.jpg',
      caption: 'Test photo',
      likeCount: 0
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId };

    // Generate JWT tokens
    tokenA = jwt.sign(
      { userId: userA._id.toString(), username: 'userA' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    tokenB = jwt.sign(
      { userId: userB._id.toString(), username: 'userB' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  // TC001: Like Photo Successfully (AC1)
  describe('TC001: Like Photo Successfully', () => {
    it('should like a photo and increment likeCount', async () => {
      const response = await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photoId).toBe(photo._id.toString());
      expect(response.body.data.likeCount).toBe(1);
      expect(response.body.message).toBe('Photo liked successfully');

      // Verify like record created
      const like = await Like.findOne({ userId: userA._id, photoId: photo._id });
      expect(like).toBeTruthy();

      // Verify photo likeCount updated
      const updatedPhoto = await Photo.findById(photo._id);
      expect(updatedPhoto?.likeCount).toBe(1);
    });

    it('should allow multiple users to like the same photo', async () => {
      // User A likes
      await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      // User B likes
      const response = await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(201);

      expect(response.body.data.likeCount).toBe(2);

      // Verify photo likeCount
      const updatedPhoto = await Photo.findById(photo._id);
      expect(updatedPhoto?.likeCount).toBe(2);
    });
  });

  // TC002: Unlike Photo Successfully (AC2)
  describe('TC002: Unlike Photo Successfully', () => {
    beforeEach(async () => {
      // Create an existing like
      await Like.create({ userId: userA._id, photoId: photo._id });
      await Photo.findByIdAndUpdate(photo._id, { likeCount: 1 });
    });

    it('should unlike a photo and decrement likeCount', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photoId).toBe(photo._id.toString());
      expect(response.body.data.likeCount).toBe(0);
      expect(response.body.message).toBe('Photo unliked successfully');

      // Verify like record deleted
      const like = await Like.findOne({ userId: userA._id, photoId: photo._id });
      expect(like).toBeNull();

      // Verify photo likeCount updated
      const updatedPhoto = await Photo.findById(photo._id);
      expect(updatedPhoto?.likeCount).toBe(0);
    });
  });

  // TC003: Duplicate Like Prevention (AC3)
  describe('TC003: Duplicate Like Prevention', () => {
    it('should return 409 when liking a photo already liked', async () => {
      // First like
      await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      // Duplicate like attempt
      const response = await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Already liked this photo');

      // Verify likeCount not incremented
      const updatedPhoto = await Photo.findById(photo._id);
      expect(updatedPhoto?.likeCount).toBe(1);
    });
  });

  // TC004: Unlike Non-Existent Like (AC4)
  describe('TC004: Unlike Non-Existent Like', () => {
    it('should return 404 when unliking a photo not previously liked', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Like not found');
    });
  });

  // TC005: Photo Not Found (AC5)
  describe('TC005: Photo Not Found', () => {
    const nonExistentPhotoId = new mongoose.Types.ObjectId();

    it('should return 404 when liking a non-existent photo', async () => {
      const response = await request(app)
        .post(`/api/v1/photos/${nonExistentPhotoId}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Photo not found');
    });

    it('should return 404 when unliking a non-existent photo', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${nonExistentPhotoId}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Photo not found');
    });
  });

  // TC006: Authentication Required (AC6)
  describe('TC006: Authentication Required', () => {
    it('should return 401 when liking without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when unliking without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${photo._id}/like`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // TC007: Invalid Photo ID Format
  describe('TC007: Invalid Photo ID Format', () => {
    it('should return 400 for invalid photoId format on like', async () => {
      const response = await request(app)
        .post('/api/v1/photos/invalid-id/like')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Invalid photo ID format');
    });

    it('should return 400 for invalid photoId format on unlike', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/invalid-id/like')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC008: Like Count Consistency
  describe('TC008: Like Count Consistency', () => {
    it('should maintain accurate like count with multiple like/unlike operations', async () => {
      // User A likes
      await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      // User B likes
      await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(201);

      let updatedPhoto = await Photo.findById(photo._id);
      expect(updatedPhoto?.likeCount).toBe(2);

      // User A unlikes
      await request(app)
        .delete(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      updatedPhoto = await Photo.findById(photo._id);
      expect(updatedPhoto?.likeCount).toBe(1);

      // User A likes again
      await request(app)
        .post(`/api/v1/photos/${photo._id}/like`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      updatedPhoto = await Photo.findById(photo._id);
      expect(updatedPhoto?.likeCount).toBe(2);

      // Verify actual like count matches Like collection
      const actualLikeCount = await Like.countDocuments({ photoId: photo._id });
      expect(actualLikeCount).toBe(2);
    });
  });
});
