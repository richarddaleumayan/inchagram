/**
 * Integration Tests: Follow/Unfollow User API
 * Test Spec: TS0019
 * Story: US0019 - Follow/Unfollow User API Endpoints
 *
 * These tests verify all acceptance criteria:
 * - AC1: Follow user successfully
 * - AC2: Unfollow user successfully
 * - AC3: Duplicate follow prevention
 * - AC4: Unfollow non-existent relationship
 * - AC5: User not found
 * - AC6: Self-follow prevention
 * - AC7: Authentication required
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../src/app';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import User from '../../src/models/User';
import Follow from '../../src/models/Follow';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing';

describe('Follow/Unfollow User API', () => {
  let userA: mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };
  let userB: mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };
  let userC: mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };
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

    const passwordHash = await bcrypt.hash('password123', 10);

    userA = await User.create({
      email: 'usera@example.com',
      username: 'userA',
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
      passwordHash
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId; username: string };

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

  // TC001: Follow User Successfully (AC1)
  describe('TC001: Follow User Successfully', () => {
    it('should follow a user successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followingId).toBe(userB._id.toString());
      expect(response.body.data.followingUsername).toBe('userB');
      expect(response.body.message).toBe('Successfully followed user');

      // Verify follow record created
      const follow = await Follow.findOne({
        followerId: userA._id,
        followingId: userB._id
      });
      expect(follow).toBeTruthy();
    });

    it('should allow following multiple users', async () => {
      await request(app)
        .post(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      await request(app)
        .post(`/api/v1/users/${userC._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      const followCount = await Follow.countDocuments({ followerId: userA._id });
      expect(followCount).toBe(2);
    });
  });

  // TC002: Unfollow User Successfully (AC2)
  describe('TC002: Unfollow User Successfully', () => {
    beforeEach(async () => {
      await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });
    });

    it('should unfollow a user successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unfollowedId).toBe(userB._id.toString());
      expect(response.body.data.unfollowedUsername).toBe('userB');
      expect(response.body.message).toBe('Successfully unfollowed user');

      // Verify follow record deleted
      const follow = await Follow.findOne({
        followerId: userA._id,
        followingId: userB._id
      });
      expect(follow).toBeNull();
    });
  });

  // TC003: Duplicate Follow Prevention (AC3)
  describe('TC003: Duplicate Follow Prevention', () => {
    it('should return 409 when already following', async () => {
      // First follow
      await request(app)
        .post(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      // Duplicate attempt
      const response = await request(app)
        .post(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Already following this user');
    });
  });

  // TC004: Unfollow Non-Existent Relationship (AC4)
  describe('TC004: Unfollow Non-Existent Relationship', () => {
    it('should return 404 when not following', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Follow relationship not found');
    });
  });

  // TC005: User Not Found (AC5)
  describe('TC005: User Not Found', () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();

    it('should return 404 when following non-existent user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${nonExistentUserId}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('User not found');
    });

    it('should return 404 when unfollowing non-existent user', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${nonExistentUserId}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('User not found');
    });
  });

  // TC006: Self-Follow Prevention (AC6)
  describe('TC006: Self-Follow Prevention', () => {
    it('should return 400 when trying to follow self', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userA._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Cannot follow yourself');
    });
  });

  // TC007: Authentication Required (AC7)
  describe('TC007: Authentication Required', () => {
    it('should return 401 when following without auth', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userB._id}/follow`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when unfollowing without auth', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userB._id}/follow`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // TC008: Invalid User ID Format
  describe('TC008: Invalid User ID Format', () => {
    it('should return 400 for invalid userId on follow', async () => {
      const response = await request(app)
        .post('/api/v1/users/invalid-id/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Invalid user ID format');
    });

    it('should return 400 for invalid userId on unfollow', async () => {
      const response = await request(app)
        .delete('/api/v1/users/invalid-id/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // TC009: Mutual Follow
  describe('TC009: Mutual Follow', () => {
    it('should allow mutual follow (A follows B, B follows A)', async () => {
      // A follows B
      await request(app)
        .post(`/api/v1/users/${userB._id}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      // B follows A
      await request(app)
        .post(`/api/v1/users/${userA._id}/follow`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(201);

      // Verify both relationships exist
      const aFollowsB = await Follow.findOne({
        followerId: userA._id,
        followingId: userB._id
      });
      const bFollowsA = await Follow.findOne({
        followerId: userB._id,
        followingId: userA._id
      });

      expect(aFollowsB).toBeTruthy();
      expect(bFollowsA).toBeTruthy();
    });
  });
});
