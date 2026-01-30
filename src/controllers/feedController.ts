/**
 * Feed Controller
 * Handles feed-related operations
 * Stories: US0023 - Personalized Feed API, US0024 - Discovery Feed API
 */

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import Photo from '../models/Photo';
import Follow from '../models/Follow';

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

    // Parse and validate query parameters
    let page = parseInt(req.query.page as string) || 0;
    let limit = parseInt(req.query.limit as string) || 20;

    // Validate and sanitize pagination params
    page = Math.max(0, page); // Ensure non-negative
    limit = Math.min(Math.max(1, limit), 50); // Between 1 and 50

    // Get users the authenticated user follows
    const follows = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = follows.map(f => f.followingId);

    // If not following anyone, return empty feed
    if (followingIds.length === 0) {
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

    // Get photos from followed users
    const photos = await Photo.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 }) // Newest first
      .skip(page * limit)
      .limit(limit)
      .populate('userId', 'username profilePictureUrl'); // Populate user data

    // Get total count for pagination
    const total = await Photo.countDocuments({ userId: { $in: followingIds } });

    // Format response
    const formattedPhotos = photos.map(photo => {
      const user = photo.userId as unknown as PopulatedUser; // Populated user document
      return {
        photoId: photo._id.toString(),
        imageUrl: photo.imageUrl,
        caption: photo.caption || '',
        userId: user._id.toString(),
        username: user.username,
        profilePictureUrl: user.profilePictureUrl || null,
        likeCount: photo.likeCount,
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
export async function getDiscoveryFeed(req: Request, res: Response): Promise<void> {
  try {
    // Parse and validate query parameters
    let page = parseInt(req.query.page as string) || 0;
    let limit = parseInt(req.query.limit as string) || 20;

    // Validate and sanitize pagination params
    page = Math.max(0, page); // Ensure non-negative
    limit = Math.min(Math.max(1, limit), 50); // Between 1 and 50

    // Get all photos (no filtering by follows)
    const photos = await Photo.find({})
      .sort({ createdAt: -1 }) // Newest first
      .skip(page * limit)
      .limit(limit)
      .populate('userId', 'username profilePictureUrl'); // Populate user data

    // Get total count for pagination
    const total = await Photo.countDocuments({});

    // Format response (same logic as personalized feed)
    const formattedPhotos = photos.map(photo => {
      const user = photo.userId as unknown as PopulatedUser; // Populated user document
      return {
        photoId: photo._id.toString(),
        imageUrl: photo.imageUrl,
        caption: photo.caption || '',
        userId: user._id.toString(),
        username: user.username,
        profilePictureUrl: user.profilePictureUrl || null,
        likeCount: photo.likeCount,
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
