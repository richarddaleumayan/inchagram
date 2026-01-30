/**
 * Profile Controller
 * Handles user profile retrieval operations
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Photo from '../models/Photo';
import { AuthRequest } from '../middleware/authMiddleware';

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

/**
 * Update user profile
 * PUT /api/v1/users/:userId
 * Story: US0008 - Edit Profile API and UI
 * Authorization: Owner only
 */
export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user!.userId;
    const { displayName, bio } = req.body;

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

    // Check authorization - only owner can update
    if (userId !== authenticatedUserId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only edit your own profile',
          details: {}
        }
      });
      return;
    }

    // Validate displayName
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' && displayName !== null) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Display name must be a string or null',
            details: { displayName }
          }
        });
        return;
      }

      if (displayName !== null && displayName.trim().length > 50) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Display name must not exceed 50 characters',
            details: { maxLength: 50, provided: displayName.trim().length }
          }
        });
        return;
      }
    }

    // Validate bio
    if (bio !== undefined) {
      if (typeof bio !== 'string' && bio !== null) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Bio must be a string or null',
            details: { bio }
          }
        });
        return;
      }

      if (bio !== null && bio.trim().length > 150) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Bio must not exceed 150 characters',
            details: { maxLength: 150, provided: bio.trim().length }
          }
        });
        return;
      }
    }

    // Build update object
    const updateData: { displayName?: string | null; bio?: string | null } = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName === null || displayName.trim() === '' ? null : displayName.trim();
    }

    if (bio !== undefined) {
      updateData.bio = bio === null || bio.trim() === '' ? null : bio.trim();
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
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

    // Get photo count
    const photoCount = await Photo.countDocuments({ userId: updatedUser._id });

    // Return updated profile
    res.status(200).json({
      success: true,
      data: {
        userId: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName || null,
        bio: updatedUser.bio || null,
        profilePictureUrl: updatedUser.profilePictureUrl || null,
        followerCount: 0, // TODO: Update when Follow counts are available
        followingCount: 0,
        photoCount,
        createdAt: updatedUser.createdAt.toISOString()
      }
    });
  } catch (error: unknown) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating profile',
        details: {}
      }
    });
  }
}
