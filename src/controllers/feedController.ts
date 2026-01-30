/**
 * Feed Controller
 * Handles feed-related operations
 * Stories: US0023 - Personalized Feed API, US0024 - Discovery Feed API
 */

import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import Photo from '../models/Photo';
import Follow from '../models/Follow';
import Like from '../models/Like';

/**
 * Populated user data from Photo.populate('userId')
 */
interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  profilePictureUrl?: string | null;
}

/**
 * Get Personalized Feed
 * GET /api/v1/photos/feed
 *
 * Returns photos from users the authenticated user follows,
 * sorted chronologically (newest first) with pagination support.
 */
export async function getPersonalizedFeed(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.user!; // Populated by authenticateJWT middleware

    console.log('🔍 FEED: Authenticated userId:', userId);
    console.log('🔍 FEED: userId type:', typeof userId);

    // Parse and validate query parameters
    let page = parseInt(req.query.page as string) || 0;
    let limit = parseInt(req.query.limit as string) || 20;

    // Validate and sanitize pagination params
    page = Math.max(0, page); // Ensure non-negative
    limit = Math.min(Math.max(1, limit), 50); // Between 1 and 50

    // Get users the authenticated user follows
    const follows = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = follows.map(f => f.followingId);

    console.log('🔍 FEED: Following', followingIds.length, 'users');

    // If not following anyone, return empty feed
    if (followingIds.length === 0) {
      console.log('🔍 FEED: Not following anyone, returning empty feed');
      res.status(200).json({
        success: true,
        data: {
          photos: [],
          pagination: {
            page,
            limit,
            total: 0,
            hasMore: false
          }
        }
      });
      return;
    }

    // Get photos from followed users (optimized with lean())
    const photos = await Photo.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 }) // Newest first - uses index { userId: 1, createdAt: -1 }
      .skip(page * limit)
      .limit(limit)
      .populate('userId', 'username profilePictureUrl') // Populate only needed fields
      .lean(); // Use lean for better performance

    console.log('🔍 FEED: Found', photos.length, 'photos from followed users');

    // Get total count for pagination
    const total = await Photo.countDocuments({ userId: { $in: followingIds } });

    // Get user's likes for these photos
    const photoIds = photos.map(p => p._id);

    console.log('🔍 Feed: Checking likes for user:', userId);
    console.log('🔍 Feed: Photo IDs:', photoIds.map(id => id.toString()));

    const userLikes = await Like.find({
      userId: new Types.ObjectId(userId),
      photoId: { $in: photoIds }
    }).select('photoId').lean();

    console.log('🔍 Feed: Found', userLikes.length, 'likes');
    console.log('🔍 Feed: Liked photo IDs:', userLikes.map(l => l.photoId.toString()));

    const likedPhotoIds = new Set(userLikes.map(like => like.photoId.toString()));

    // Format response
    const formattedPhotos = photos.map(photo => {
      const user = photo.userId as unknown as PopulatedUser; // Populated user document
      const photoIdStr = photo._id.toString();
      return {
        photoId: photoIdStr,
        imageUrl: photo.imageUrl,
        caption: photo.caption || '',
        userId: user._id.toString(),
        username: user.username,
        profilePictureUrl: user.profilePictureUrl || null,
        likeCount: photo.likeCount,
        isLiked: likedPhotoIds.has(photoIdStr),
        createdAt: photo.createdAt
      };
    });

    // Calculate hasMore
    const hasMore = (page + 1) * limit < total;

    res.status(200).json({
      success: true,
      data: {
        photos: formattedPhotos,
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      }
    });
  } catch (error: unknown) {
    console.error('Get personalized feed error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred retrieving feed'
      }
    });
  }
}

/**
 * Get Discovery Feed
 * GET /api/v1/photos/discover
 *
 * Returns all photos from all users (public discovery feed),
 * sorted chronologically (newest first) with pagination support.
 * No authentication required - public endpoint.
 */
export async function getDiscoveryFeed(req: AuthRequest, res: Response): Promise<void> {
  try {
    console.log('🔍 DISCOVER: Called with userId:', req.user?.userId);

    // Parse and validate query parameters
    let page = parseInt(req.query.page as string) || 0;
    let limit = parseInt(req.query.limit as string) || 20;

    // Validate and sanitize pagination params
    page = Math.max(0, page); // Ensure non-negative
    limit = Math.min(Math.max(1, limit), 50); // Between 1 and 50

    // Get all photos (no filtering by follows) - optimized with lean()
    const photos = await Photo.find({})
      .sort({ createdAt: -1 }) // Newest first - uses index { createdAt: -1 }
      .skip(page * limit)
      .limit(limit)
      .populate('userId', 'username profilePictureUrl') // Populate only needed fields
      .lean(); // Use lean for better performance

    // Get total count for pagination
    const total = await Photo.countDocuments({});

    // Get user's likes for these photos (if authenticated)
    const photoIds = photos.map(p => p._id);
    let likedPhotoIds = new Set<string>();

    console.log('🔍 DISCOVER: Found', photos.length, 'photos');
    console.log('🔍 DISCOVER: Photo IDs:', photoIds.map(id => id.toString()));

    if (req.user?.userId) {
      console.log('🔍 DISCOVER: User authenticated, checking likes for userId:', req.user.userId);

      const userLikes = await Like.find({
        userId: new Types.ObjectId(req.user.userId),
        photoId: { $in: photoIds }
      }).select('photoId').lean();

      console.log('🔍 DISCOVER: Found', userLikes.length, 'likes');
      console.log('🔍 DISCOVER: Liked photo IDs:', userLikes.map(l => l.photoId.toString()));

      likedPhotoIds = new Set(userLikes.map(like => like.photoId.toString()));
    } else {
      console.log('🔍 DISCOVER: No user authenticated, all isLiked will be false');
    }

    // Format response (same logic as personalized feed)
    const formattedPhotos = photos.map(photo => {
      const user = photo.userId as unknown as PopulatedUser; // Populated user document
      const photoIdStr = photo._id.toString();
      return {
        photoId: photoIdStr,
        imageUrl: photo.imageUrl,
        caption: photo.caption || '',
        userId: user._id.toString(),
        username: user.username,
        profilePictureUrl: user.profilePictureUrl || null,
        likeCount: photo.likeCount,
        isLiked: likedPhotoIds.has(photoIdStr),
        createdAt: photo.createdAt
      };
    });

    // Calculate hasMore
    const hasMore = (page + 1) * limit < total;

    res.status(200).json({
      success: true,
      data: {
        photos: formattedPhotos,
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      }
    });
  } catch (error: unknown) {
    console.error('Get discovery feed error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred retrieving discovery feed'
      }
    });
  }
}
