/**
 * Integration Tests: View Photo Likes List API
 * Test Spec: TS0018
 * Story: US0018 - View Photo Likes List
 *
 * Tests for GET /api/v1/photos/:photoId/likes endpoint
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';
import Like from '../../src/models/Like';

describe('GET /api/v1/photos/:photoId/likes', () => {
  let userA: mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };
  let userB: mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };
  let userC: mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };
  let photo: mongoose.Document & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    const passwordHash = await bcrypt.hash('password123', 10);

    userA = await User.create({
      email: 'usera@example.com',
      username: 'userA',
      displayName: 'User A',
      passwordHash
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };

    userB = await User.create({
      email: 'userb@example.com',
      username: 'userB',
      passwordHash
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };

    userC = await User.create({
      email: 'userc@example.com',
      username: 'userC',
      displayName: 'User C',
      profilePictureUrl: 'https://example.com/avatar.jpg',
      passwordHash
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };

    photo = await Photo.create({
      userId: userA._id,
      imageUrl: 'https://example.com/photo.jpg',
      caption: 'Test photo',
      likeCount: 0
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId };
  });

  // TC001: Get likes for photo with no likes
  describe('TC001: Empty likes list', () => {
    it('should return empty array when photo has no likes', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photoId).toBe(photo._id.toString());
      expect(response.body.data.likeCount).toBe(0);
      expect(response.body.data.users).toEqual([]);
      expect(response.body.data.pagination.totalLikes).toBe(0);
    });
  });

  // TC002: Get likes with users
  describe('TC002: Get likes with user details', () => {
    beforeEach(async () => {
      // Create likes
      await Like.create({ userId: userB._id, photoId: photo._id });
      await Like.create({ userId: userC._id, photoId: photo._id });
      await Photo.findByIdAndUpdate(photo._id, { likeCount: 2 });
    });

    it('should return list of users who liked the photo', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likeCount).toBe(2);
      expect(response.body.data.users).toHaveLength(2);

      // Check user details are included
      const usernames = response.body.data.users.map((u: { username: string }) => u.username);
      expect(usernames).toContain('userB');
      expect(usernames).toContain('userC');

      // Check user C has displayName and profilePictureUrl
      const userCData = response.body.data.users.find((u: { username: string }) => u.username === 'userC');
      expect(userCData.displayName).toBe('User C');
      expect(userCData.profilePictureUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should include likedAt timestamp', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes`)
        .expect(200);

      response.body.data.users.forEach((user: { likedAt: string }) => {
        expect(user.likedAt).toBeDefined();
        expect(new Date(user.likedAt)).toBeInstanceOf(Date);
      });
    });
  });

  // TC003: Pagination
  describe('TC003: Pagination', () => {
    beforeEach(async () => {
      // Create 25 users and likes
      const passwordHash = await bcrypt.hash('password123', 10);
      for (let i = 1; i <= 25; i++) {
        const user = await User.create({
          email: `user${i}@example.com`,
          username: `testuser${i}`,
          passwordHash
        });
        await Like.create({ userId: user._id, photoId: photo._id });
      }
      await Photo.findByIdAndUpdate(photo._id, { likeCount: 25 });
    });

    it('should return default 20 items per page', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes`)
        .expect(200);

      expect(response.body.data.users).toHaveLength(20);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
      expect(response.body.data.pagination.totalLikes).toBe(25);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPrevPage).toBe(false);
    });

    it('should return second page with remaining items', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes?page=2`)
        .expect(200);

      expect(response.body.data.users).toHaveLength(5);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(false);
      expect(response.body.data.pagination.hasPrevPage).toBe(true);
    });

    it('should respect custom limit parameter', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes?limit=10`)
        .expect(200);

      expect(response.body.data.users).toHaveLength(10);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });
  });

  // TC004: Photo not found
  describe('TC004: Photo not found', () => {
    it('should return 404 for non-existent photo', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/photos/${nonExistentId}/likes`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Photo not found');
    });
  });

  // TC005: Invalid photo ID
  describe('TC005: Invalid photo ID format', () => {
    it('should return 400 for invalid photo ID', async () => {
      const response = await request(app)
        .get('/api/v1/photos/invalid-id/likes')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Invalid photo ID format');
    });
  });

  // TC006: Public endpoint (no auth required)
  describe('TC006: Public endpoint', () => {
    it('should work without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // TC007: Sorted by most recent
  describe('TC007: Sorted by most recent first', () => {
    it('should return likes sorted by most recent first', async () => {
      // Create likes with delays to ensure different timestamps
      await Like.create({ userId: userB._id, photoId: photo._id });
      await new Promise(resolve => setTimeout(resolve, 10));
      await Like.create({ userId: userC._id, photoId: photo._id });
      await Photo.findByIdAndUpdate(photo._id, { likeCount: 2 });

      const response = await request(app)
        .get(`/api/v1/photos/${photo._id}/likes`)
        .expect(200);

      // Most recent (userC) should be first
      expect(response.body.data.users[0].username).toBe('userC');
      expect(response.body.data.users[1].username).toBe('userB');
    });
  });
});
