/**
 * Integration Tests: Follow Model
 * Test Spec: TS0020
 * Story: US0020 - Follow Model with Self-Follow Validation
 *
 * These tests verify all acceptance criteria for the Follow model:
 * - AC1: Follow model schema with proper fields
 * - AC2: Compound unique index (duplicate prevention)
 * - AC3: Self-follow validation
 * - AC4: Timestamps
 */

import mongoose from 'mongoose';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import Follow from '../../src/models/Follow';
import User from '../../src/models/User';
import bcrypt from 'bcrypt';

describe('Follow Model', () => {
  let userA: mongoose.Document;
  let userB: mongoose.Document;
  let userC: mongoose.Document;

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
    });

    userB = await User.create({
      email: 'userb@example.com',
      username: 'userB',
      passwordHash
    });

    userC = await User.create({
      email: 'userc@example.com',
      username: 'userC',
      passwordHash
    });
  });

  // TC001: Successful Follow Relationship (AC1)
  describe('TC001: Successful Follow Relationship', () => {
    it('should create a follow relationship with valid followerId and followingId', async () => {
      const follow = await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });

      expect(follow).toBeTruthy();
      expect(follow.followerId.toString()).toBe(userA._id.toString());
      expect(follow.followingId.toString()).toBe(userB._id.toString());
      expect(follow.createdAt).toBeInstanceOf(Date);
      expect(follow.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow user A to follow multiple users', async () => {
      await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });

      await Follow.create({
        followerId: userA._id,
        followingId: userC._id
      });

      const follows = await Follow.find({ followerId: userA._id });
      expect(follows).toHaveLength(2);
    });

    it('should allow a user to be followed by multiple users', async () => {
      await Follow.create({
        followerId: userA._id,
        followingId: userC._id
      });

      await Follow.create({
        followerId: userB._id,
        followingId: userC._id
      });

      const followers = await Follow.find({ followingId: userC._id });
      expect(followers).toHaveLength(2);
    });
  });

  // TC002: Compound Unique Index - Duplicate Prevention (AC2)
  describe('TC002: Duplicate Follow Prevention', () => {
    it('should reject duplicate follow relationship', async () => {
      // Create first follow
      await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });

      // Attempt duplicate follow
      await expect(
        Follow.create({
          followerId: userA._id,
          followingId: userB._id
        })
      ).rejects.toThrow();

      // Verify only one follow exists
      const count = await Follow.countDocuments({
        followerId: userA._id,
        followingId: userB._id
      });
      expect(count).toBe(1);
    });

    it('should return E11000 duplicate key error for duplicate follow', async () => {
      await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });

      try {
        await Follow.create({
          followerId: userA._id,
          followingId: userB._id
        });
        fail('Expected duplicate key error');
      } catch (error: unknown) {
        const mongoError = error as { code?: number };
        expect(mongoError.code).toBe(11000); // MongoDB duplicate key error code
      }
    });

    it('should allow reverse follow (B follows A when A follows B)', async () => {
      // A follows B
      await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });

      // B follows A (should succeed - not a duplicate)
      const reverseFollow = await Follow.create({
        followerId: userB._id,
        followingId: userA._id
      });

      expect(reverseFollow).toBeTruthy();

      // Verify both follows exist
      const count = await Follow.countDocuments();
      expect(count).toBe(2);
    });
  });

  // TC003: Self-Follow Validation (AC3)
  describe('TC003: Self-Follow Prevention', () => {
    it('should reject self-follow attempt', async () => {
      await expect(
        Follow.create({
          followerId: userA._id,
          followingId: userA._id
        })
      ).rejects.toThrow('Users cannot follow themselves');

      // Verify no follow was created
      const count = await Follow.countDocuments();
      expect(count).toBe(0);
    });

    it('should return ValidationError for self-follow', async () => {
      try {
        await Follow.create({
          followerId: userA._id,
          followingId: userA._id
        });
        fail('Expected validation error');
      } catch (error: unknown) {
        const validationError = error as { name?: string; message?: string };
        expect(validationError.name).toBe('ValidationError');
        expect(validationError.message).toContain('cannot follow themselves');
      }
    });
  });

  // TC004: Timestamps (AC4)
  describe('TC004: Timestamps', () => {
    it('should automatically set createdAt timestamp', async () => {
      const beforeCreate = new Date();

      const follow = await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });

      const afterCreate = new Date();

      expect(follow.createdAt).toBeInstanceOf(Date);
      expect(follow.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(follow.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should automatically set updatedAt timestamp', async () => {
      const follow = await Follow.create({
        followerId: userA._id,
        followingId: userB._id
      });

      expect(follow.updatedAt).toBeInstanceOf(Date);
      expect(follow.updatedAt.getTime()).toBe(follow.createdAt.getTime());
    });
  });

  // TC005: Required Fields Validation
  describe('TC005: Required Fields Validation', () => {
    it('should reject follow without followerId', async () => {
      await expect(
        Follow.create({
          followingId: userB._id
        })
      ).rejects.toThrow(/follower.*required/i);
    });

    it('should reject follow without followingId', async () => {
      await expect(
        Follow.create({
          followerId: userA._id
        })
      ).rejects.toThrow(/following.*required/i);
    });
  });

  // TC006: Index Verification
  describe('TC006: Index Verification', () => {
    it('should have compound unique index on followerId and followingId', async () => {
      // Ensure indexes are created
      await Follow.ensureIndexes();

      const indexes = await Follow.collection.indexes();

      // Find the compound index
      const compoundIndex = indexes.find(
        (index) =>
          index.key.followerId === 1 &&
          index.key.followingId === 1 &&
          index.unique === true
      );

      expect(compoundIndex).toBeTruthy();
    });

    it('should have index on followerId for efficient follower queries', async () => {
      await Follow.ensureIndexes();
      const indexes = await Follow.collection.indexes();

      const followerIndex = indexes.find(
        (index) => index.key.followerId === 1
      );

      expect(followerIndex).toBeTruthy();
    });

    it('should have index on followingId for efficient following queries', async () => {
      await Follow.ensureIndexes();
      const indexes = await Follow.collection.indexes();

      const followingIndex = indexes.find(
        (index) => index.key.followingId === 1
      );

      expect(followingIndex).toBeTruthy();
    });
  });

  // TC007: Query Functionality
  describe('TC007: Query Functionality', () => {
    beforeEach(async () => {
      // Set up follow relationships: A follows B and C
      await Follow.create({ followerId: userA._id, followingId: userB._id });
      await Follow.create({ followerId: userA._id, followingId: userC._id });
      // B follows C
      await Follow.create({ followerId: userB._id, followingId: userC._id });
    });

    it('should query all users that a user is following', async () => {
      const following = await Follow.find({ followerId: userA._id });
      expect(following).toHaveLength(2);

      const followingIds = following.map(f => f.followingId.toString());
      expect(followingIds).toContain(userB._id.toString());
      expect(followingIds).toContain(userC._id.toString());
    });

    it('should query all followers of a user', async () => {
      const followers = await Follow.find({ followingId: userC._id });
      expect(followers).toHaveLength(2);

      const followerIds = followers.map(f => f.followerId.toString());
      expect(followerIds).toContain(userA._id.toString());
      expect(followerIds).toContain(userB._id.toString());
    });

    it('should check if a specific follow relationship exists', async () => {
      const followExists = await Follow.findOne({
        followerId: userA._id,
        followingId: userB._id
      });
      expect(followExists).toBeTruthy();

      const followNotExists = await Follow.findOne({
        followerId: userB._id,
        followingId: userA._id
      });
      expect(followNotExists).toBeNull();
    });
  });
});
