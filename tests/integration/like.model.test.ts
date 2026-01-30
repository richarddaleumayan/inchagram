/**
 * Integration Tests: Like Model
 * Test Spec: TS0017
 * Story: US0017 - Like Model and Denormalized Count Logic
 *
 * These tests verify all acceptance criteria for the Like model:
 * - AC1: Like model schema with proper fields
 * - AC2: Compound unique index (duplicate prevention)
 * - AC3: Timestamps
 * - AC4: Photo model has likeCount field
 */

import mongoose from 'mongoose';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import Like from '../../src/models/Like';
import User from '../../src/models/User';
import Photo from '../../src/models/Photo';
import bcrypt from 'bcrypt';

describe('Like Model', () => {
  let userA: mongoose.Document;
  let userB: mongoose.Document;
  let photoA: mongoose.Document;
  let photoB: mongoose.Document;

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

    // Create test photos
    photoA = await Photo.create({
      userId: userA._id,
      imageUrl: 'https://example.com/photo-a.jpg',
      caption: 'Photo A'
    });

    photoB = await Photo.create({
      userId: userB._id,
      imageUrl: 'https://example.com/photo-b.jpg',
      caption: 'Photo B'
    });
  });

  // TC001: Successful Like Creation (AC1)
  describe('TC001: Successful Like Creation', () => {
    it('should create a like with valid userId and photoId', async () => {
      const like = await Like.create({
        userId: userA._id,
        photoId: photoB._id
      });

      expect(like).toBeTruthy();
      expect(like.userId.toString()).toBe(userA._id.toString());
      expect(like.photoId.toString()).toBe(photoB._id.toString());
      expect(like.createdAt).toBeInstanceOf(Date);
      expect(like.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow a user to like multiple photos', async () => {
      await Like.create({
        userId: userA._id,
        photoId: photoA._id
      });

      await Like.create({
        userId: userA._id,
        photoId: photoB._id
      });

      const likes = await Like.find({ userId: userA._id });
      expect(likes).toHaveLength(2);
    });

    it('should allow a photo to be liked by multiple users', async () => {
      await Like.create({
        userId: userA._id,
        photoId: photoA._id
      });

      await Like.create({
        userId: userB._id,
        photoId: photoA._id
      });

      const likes = await Like.find({ photoId: photoA._id });
      expect(likes).toHaveLength(2);
    });
  });

  // TC002: Compound Unique Index - Duplicate Prevention (AC2)
  describe('TC002: Duplicate Like Prevention', () => {
    it('should reject duplicate like from same user on same photo', async () => {
      // Create first like
      await Like.create({
        userId: userA._id,
        photoId: photoB._id
      });

      // Attempt duplicate like
      await expect(
        Like.create({
          userId: userA._id,
          photoId: photoB._id
        })
      ).rejects.toThrow();

      // Verify only one like exists
      const count = await Like.countDocuments({
        userId: userA._id,
        photoId: photoB._id
      });
      expect(count).toBe(1);
    });

    it('should return E11000 duplicate key error for duplicate like', async () => {
      await Like.create({
        userId: userA._id,
        photoId: photoB._id
      });

      try {
        await Like.create({
          userId: userA._id,
          photoId: photoB._id
        });
        fail('Expected duplicate key error');
      } catch (error: unknown) {
        const mongoError = error as { code?: number };
        expect(mongoError.code).toBe(11000); // MongoDB duplicate key error code
      }
    });

    it('should allow same user to like different photos', async () => {
      await Like.create({
        userId: userA._id,
        photoId: photoA._id
      });

      const secondLike = await Like.create({
        userId: userA._id,
        photoId: photoB._id
      });

      expect(secondLike).toBeTruthy();

      const count = await Like.countDocuments({ userId: userA._id });
      expect(count).toBe(2);
    });

    it('should allow different users to like same photo', async () => {
      await Like.create({
        userId: userA._id,
        photoId: photoA._id
      });

      const secondLike = await Like.create({
        userId: userB._id,
        photoId: photoA._id
      });

      expect(secondLike).toBeTruthy();

      const count = await Like.countDocuments({ photoId: photoA._id });
      expect(count).toBe(2);
    });
  });

  // TC003: Timestamps (AC3)
  describe('TC003: Timestamps', () => {
    it('should automatically set createdAt timestamp', async () => {
      const beforeCreate = new Date();

      const like = await Like.create({
        userId: userA._id,
        photoId: photoB._id
      });

      const afterCreate = new Date();

      expect(like.createdAt).toBeInstanceOf(Date);
      expect(like.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(like.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should automatically set updatedAt timestamp', async () => {
      const like = await Like.create({
        userId: userA._id,
        photoId: photoB._id
      });

      expect(like.updatedAt).toBeInstanceOf(Date);
      expect(like.updatedAt.getTime()).toBe(like.createdAt.getTime());
    });
  });

  // TC004: Photo Model likeCount Field (AC4)
  describe('TC004: Photo Model likeCount Field', () => {
    it('should have likeCount field with default value 0', async () => {
      const photo = await Photo.findById(photoA._id);
      expect(photo).toBeTruthy();
      expect(photo?.likeCount).toBe(0);
    });

    it('should not allow negative likeCount', async () => {
      await expect(
        Photo.create({
          userId: userA._id,
          imageUrl: 'https://example.com/test.jpg',
          likeCount: -1
        })
      ).rejects.toThrow(/cannot be negative/i);
    });

    it('should allow manual update of likeCount for atomic operations', async () => {
      // Simulate atomic increment (as will be used in US0016)
      const updatedPhoto = await Photo.findByIdAndUpdate(
        photoA._id,
        { $inc: { likeCount: 1 } },
        { new: true }
      );

      expect(updatedPhoto?.likeCount).toBe(1);

      // Simulate atomic decrement
      const decrementedPhoto = await Photo.findByIdAndUpdate(
        photoA._id,
        { $inc: { likeCount: -1 } },
        { new: true }
      );

      expect(decrementedPhoto?.likeCount).toBe(0);
    });
  });

  // TC005: Required Fields Validation
  describe('TC005: Required Fields Validation', () => {
    it('should reject like without userId', async () => {
      await expect(
        Like.create({
          photoId: photoB._id
        })
      ).rejects.toThrow(/user.*required/i);
    });

    it('should reject like without photoId', async () => {
      await expect(
        Like.create({
          userId: userA._id
        })
      ).rejects.toThrow(/photo.*required/i);
    });
  });

  // TC006: Index Verification
  describe('TC006: Index Verification', () => {
    it('should have compound unique index on userId and photoId', async () => {
      await Like.ensureIndexes();
      const indexes = await Like.collection.indexes();

      const compoundIndex = indexes.find(
        (index) =>
          index.key.userId === 1 &&
          index.key.photoId === 1 &&
          index.unique === true
      );

      expect(compoundIndex).toBeTruthy();
    });

    it('should have index on userId for efficient user likes queries', async () => {
      await Like.ensureIndexes();
      const indexes = await Like.collection.indexes();

      const userIndex = indexes.find(
        (index) => index.key.userId === 1
      );

      expect(userIndex).toBeTruthy();
    });

    it('should have index on photoId for efficient photo likes queries', async () => {
      await Like.ensureIndexes();
      const indexes = await Like.collection.indexes();

      const photoIndex = indexes.find(
        (index) => index.key.photoId === 1
      );

      expect(photoIndex).toBeTruthy();
    });
  });

  // TC007: Query Functionality
  describe('TC007: Query Functionality', () => {
    beforeEach(async () => {
      // Set up like relationships
      // User A likes Photo A and Photo B
      await Like.create({ userId: userA._id, photoId: photoA._id });
      await Like.create({ userId: userA._id, photoId: photoB._id });
      // User B likes Photo A
      await Like.create({ userId: userB._id, photoId: photoA._id });
    });

    it('should query all photos liked by a user', async () => {
      const likes = await Like.find({ userId: userA._id });
      expect(likes).toHaveLength(2);

      const photoIds = likes.map(l => l.photoId.toString());
      expect(photoIds).toContain(photoA._id.toString());
      expect(photoIds).toContain(photoB._id.toString());
    });

    it('should query all users who liked a photo', async () => {
      const likes = await Like.find({ photoId: photoA._id });
      expect(likes).toHaveLength(2);

      const userIds = likes.map(l => l.userId.toString());
      expect(userIds).toContain(userA._id.toString());
      expect(userIds).toContain(userB._id.toString());
    });

    it('should check if a specific like exists', async () => {
      const likeExists = await Like.findOne({
        userId: userA._id,
        photoId: photoA._id
      });
      expect(likeExists).toBeTruthy();

      const likeNotExists = await Like.findOne({
        userId: userB._id,
        photoId: photoB._id
      });
      expect(likeNotExists).toBeNull();
    });

    it('should count likes for a photo', async () => {
      const count = await Like.countDocuments({ photoId: photoA._id });
      expect(count).toBe(2);
    });
  });
});
