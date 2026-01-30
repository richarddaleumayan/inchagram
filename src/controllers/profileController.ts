/**
 * Profile Controller
 * Handles user profile retrieval operations
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Photo from '../models/Photo';

/**
 * Get user profile by ID
 * GET /api/v1/users/:userId
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID format',
          details: { userId }
        }
      });
      return;
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: { userId }
        }
      });
      return;
    }

    // Get photo count for this user
    const photoCount = await Photo.countDocuments({ userId: user._id });

    // TODO: Get follower/following counts when Follow model is available (US0020)
    const followerCount = 0;
    const followingCount = 0;

    // Return profile data (never include passwordHash)
    res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName || null,
        bio: user.bio || null,
        profilePictureUrl: user.profilePictureUrl || null,
        followerCount,
        followingCount,
        photoCount,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (error: unknown) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching user profile',
        details: {}
      }
    });
  }
}

/**
 * Get user profile by username
 * GET /api/v1/users/username/:username
 */
export async function getUserByUsername(req: Request, res: Response): Promise<void> {
  try {
    const { username } = req.params;

    // Find user by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: { username }
        }
      });
      return;
    }

    // Get photo count for this user
    const photoCount = await Photo.countDocuments({ userId: user._id });

    // TODO: Get follower/following counts when Follow model is available (US0020)
    const followerCount = 0;
    const followingCount = 0;

    // Return profile data (never include passwordHash)
    res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName || null,
        bio: user.bio || null,
        profilePictureUrl: user.profilePictureUrl || null,
        followerCount,
        followingCount,
        photoCount,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (error: unknown) {
    console.error('Get user by username error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching user profile',
        details: {}
      }
    });
  }
}

/**
 * Get user's photos
 * GET /api/v1/users/:userId/photos
 * Story: US0007 - Profile Photo Grid Component
 */
export async function getUserPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID format',
          details: { userId }
        }
      });
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: { userId }
        }
      });
      return;
    }

    // Get total photo count
    const total = await Photo.countDocuments({ userId });

    // Fetch photos with pagination (newest first)
    const photos = await Photo.find({ userId })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .select('_id imageUrl caption likeCount createdAt')
      .lean();

    // Calculate if there are more photos
    const hasMore = (page + 1) * limit < total;

    // Format response
    const formattedPhotos = photos.map((photo: any) => ({
      photoId: photo._id.toString(),
      imageUrl: photo.imageUrl,
      caption: photo.caption || '',
      likeCount: photo.likeCount || 0,
      createdAt: photo.createdAt.toISOString()
    }));

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
    console.error('Get user photos error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching user photos',
        details: {}
      }
    });
  }
}
