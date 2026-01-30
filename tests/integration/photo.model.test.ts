/**
 * Integration Tests: Photo Model and MongoDB Schema
 * Test Spec: TS0011
 * Story: US0011 - Photo Model and MongoDB Schema
 *
 * These tests verify the Photo model schema:
 * - AC1: Photo creation with valid userId and imageUrl
 * - AC2: Caption validation (optional, max 2200 chars)
 * - AC3: likeCount defaults to 0 and cannot be negative
 * - AC4: userId references User model
 * - AC5: Timestamps auto-generated
 * - AC6: Indexes created for efficient queries
 */

import mongoose from 'mongoose';
import { connectDatabase, closeDatabase, clearDatabase } from '../setup';
import Photo from '../../src/models/Photo';
import User from '../../src/models/User';
import bcrypt from 'bcrypt';

describe('Photo Model and MongoDB Schema', () => {
  let testUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Create a test user for photo references
    const user = await User.create({
      email: 'photographer@example.com',
      username: 'photographer',
      passwordHash: await bcrypt.hash('password123', 10)
    });
    testUserId = user._id as mongoose.Types.ObjectId;
  });

  // TC001: Successful Photo Creation - Happy Path (AC1)
  describe('TC001: Successful Photo Creation', () => {
    it('should create photo with valid userId and imageUrl', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      expect(photo).toBeTruthy();
      expect(photo.userId.toString()).toBe(testUserId.toString());
      expect(photo.imageUrl).toBe('https://s3.amazonaws.com/inchagram/photos/test.jpg');
      expect(photo.likeCount).toBe(0); // Default value
      expect(photo.caption).toBe(''); // Default empty string
      expect(photo.createdAt).toBeInstanceOf(Date);
      expect(photo.updatedAt).toBeInstanceOf(Date);
    });

    it('should create photo with userId, imageUrl, and caption', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/sunset.jpg',
        caption: 'Beautiful sunset at the beach'
      });

      expect(photo).toBeTruthy();
      expect(photo.userId.toString()).toBe(testUserId.toString());
      expect(photo.imageUrl).toBe('https://s3.amazonaws.com/inchagram/photos/sunset.jpg');
      expect(photo.caption).toBe('Beautiful sunset at the beach');
      expect(photo.likeCount).toBe(0);
    });
  });

  // TC002: Required Field - userId (AC1, AC4)
  describe('TC002: Required Field - userId', () => {
    it('should reject photo without userId', async () => {
      await expect(
        Photo.create({
          imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
        })
      ).rejects.toThrow(/User ID is required/);
    });
  });

  // TC003: Required Field - imageUrl (AC1)
  describe('TC003: Required Field - imageUrl', () => {
    it('should reject photo without imageUrl', async () => {
      await expect(
        Photo.create({
          userId: testUserId
        })
      ).rejects.toThrow(/Image URL is required/);
    });

    it('should reject photo with empty imageUrl', async () => {
      await expect(
        Photo.create({
          userId: testUserId,
          imageUrl: ''
        })
      ).rejects.toThrow(/Image URL is required/);
    });
  });

  // TC004: Caption Validation - Optional (AC2)
  describe('TC004: Caption is Optional', () => {
    it('should create photo without caption', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      expect(photo.caption).toBe(''); // Default empty string
    });

    it('should create photo with empty string caption', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg',
        caption: ''
      });

      expect(photo.caption).toBe('');
    });
  });

  // TC005: Caption Max Length Validation (AC2)
  describe('TC005: Caption Max Length (2200 chars)', () => {
    it('should accept caption at exactly 2200 characters', async () => {
      const longCaption = 'a'.repeat(2200);

      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg',
        caption: longCaption
      });

      expect(photo.caption).toBe(longCaption);
      expect(photo.caption?.length).toBe(2200);
    });

    it('should reject caption exceeding 2200 characters', async () => {
      const tooLongCaption = 'a'.repeat(2201);

      await expect(
        Photo.create({
          userId: testUserId,
          imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg',
          caption: tooLongCaption
        })
      ).rejects.toThrow(/Caption cannot exceed 2200 characters/);
    });
  });

  // TC006: likeCount Default Value (AC3)
  describe('TC006: likeCount Default Value', () => {
    it('should default likeCount to 0', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      expect(photo.likeCount).toBe(0);
    });

    it('should accept explicit likeCount value', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg',
        likeCount: 10
      });

      expect(photo.likeCount).toBe(10);
    });
  });

  // TC007: likeCount Cannot Be Negative (AC3)
  describe('TC007: likeCount Cannot Be Negative', () => {
    it('should reject negative likeCount', async () => {
      await expect(
        Photo.create({
          userId: testUserId,
          imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg',
          likeCount: -1
        })
      ).rejects.toThrow(/Like count cannot be negative/);
    });
  });

  // TC008: Timestamps Auto-Generated (AC5)
  describe('TC008: Timestamps Auto-Generated', () => {
    it('should auto-generate createdAt and updatedAt', async () => {
      const beforeCreate = new Date();

      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      const afterCreate = new Date();

      expect(photo.createdAt).toBeInstanceOf(Date);
      expect(photo.updatedAt).toBeInstanceOf(Date);
      expect(photo.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(photo.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should update updatedAt on modification', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      const originalUpdatedAt = photo.updatedAt;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      photo.caption = 'Updated caption';
      await photo.save();

      expect(photo.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  // TC009: User Reference (AC4)
  describe('TC009: User Reference', () => {
    it('should store valid ObjectId for userId', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      expect(mongoose.Types.ObjectId.isValid(photo.userId)).toBe(true);
      expect(photo.userId.toString()).toBe(testUserId.toString());
    });

    it('should populate user reference', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      const populatedPhoto = await Photo.findById(photo._id).populate('userId');

      expect(populatedPhoto).toBeTruthy();
      expect((populatedPhoto?.userId as any).username).toBe('photographer');
      expect((populatedPhoto?.userId as any).email).toBe('photographer@example.com');
    });
  });

  // TC010: Collection Name (Schema Configuration)
  describe('TC010: Collection Name', () => {
    it('should use "photos" collection', async () => {
      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      // Verify photo exists in "photos" collection
      const count = await Photo.countDocuments();
      expect(count).toBe(1);

      // Access collection directly
      const db = mongoose.connection.db;
      const collections = await db!.listCollections({ name: 'photos' }).toArray();
      expect(collections.length).toBe(1);
    });
  });

  // TC011: Multiple Photos Per User
  describe('TC011: Multiple Photos Per User', () => {
    it('should allow multiple photos from same user', async () => {
      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/photo1.jpg',
        caption: 'First photo'
      });

      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/photo2.jpg',
        caption: 'Second photo'
      });

      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/photo3.jpg',
        caption: 'Third photo'
      });

      const userPhotos = await Photo.find({ userId: testUserId });
      expect(userPhotos.length).toBe(3);
    });
  });

  // TC012: Query by userId with Index (AC6)
  describe('TC012: Query by userId', () => {
    it('should efficiently query photos by userId', async () => {
      // Create photos for test user
      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/photo1.jpg'
      });

      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/photo2.jpg'
      });

      // Create another user and their photos
      const anotherUser = await User.create({
        email: 'another@example.com',
        username: 'anotheruser',
        passwordHash: await bcrypt.hash('password123', 10)
      });

      await Photo.create({
        userId: anotherUser._id,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/other.jpg'
      });

      // Query test user's photos
      const testUserPhotos = await Photo.find({ userId: testUserId });
      expect(testUserPhotos.length).toBe(2);

      // Query another user's photos
      const anotherUserPhotos = await Photo.find({ userId: anotherUser._id });
      expect(anotherUserPhotos.length).toBe(1);
    });
  });

  // TC013: Query Photos Sorted by Date (AC6)
  describe('TC013: Query Photos Sorted by Date', () => {
    it('should return photos sorted by createdAt descending', async () => {
      // Create photos with slight delays to ensure different timestamps
      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/first.jpg',
        caption: 'First'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/second.jpg',
        caption: 'Second'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/third.jpg',
        caption: 'Third'
      });

      // Query with descending sort (newest first)
      const photos = await Photo.find({ userId: testUserId }).sort({ createdAt: -1 });

      expect(photos.length).toBe(3);
      expect(photos[0].caption).toBe('Third'); // Newest
      expect(photos[1].caption).toBe('Second');
      expect(photos[2].caption).toBe('First'); // Oldest
    });
  });

  // TC014: Caption Trimming
  describe('TC014: Caption Trimming', () => {
    it('should trim whitespace from caption', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg',
        caption: '  Beautiful sunset  '
      });

      expect(photo.caption).toBe('Beautiful sunset');
    });
  });

  // TC015: ImageUrl Trimming
  describe('TC015: ImageUrl Trimming', () => {
    it('should trim whitespace from imageUrl', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: '  https://s3.amazonaws.com/inchagram/photos/test.jpg  '
      });

      expect(photo.imageUrl).toBe('https://s3.amazonaws.com/inchagram/photos/test.jpg');
    });
  });

  // TC016: Photo Deletion
  describe('TC016: Photo Deletion', () => {
    it('should delete photo from database', async () => {
      const photo = await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      const photoId = photo._id;

      await Photo.findByIdAndDelete(photoId);

      const deletedPhoto = await Photo.findById(photoId);
      expect(deletedPhoto).toBeNull();
    });
  });

  // TC017: Index Verification
  describe('TC017: Index Verification', () => {
    it('should have indexes on userId and createdAt', async () => {
      // Create a photo to ensure collection exists
      await Photo.create({
        userId: testUserId,
        imageUrl: 'https://s3.amazonaws.com/inchagram/photos/test.jpg'
      });

      const indexes = await Photo.collection.indexes();
      const indexNames = indexes.map((idx: any) => JSON.stringify(idx.key));

      // Check for compound index on userId + createdAt
      expect(indexNames.some(name => name.includes('userId') && name.includes('createdAt'))).toBe(true);

      // Check for index on createdAt alone (for discovery feed)
      expect(indexNames.some(name => name.includes('createdAt'))).toBe(true);
    });
  });
});
