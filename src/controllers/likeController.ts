/**
 * Like Controller
 * Handles like and unlike operations for photos
 * Story: US0016 - Like/Unlike Photo API Endpoints
 * Story: US0018 - View Photo Likes List
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Like from '../models/Like';
import Photo from '../models/Photo';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Like a photo
 * POST /api/v1/photos/:photoId/like
 */
export async function likePhoto(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;
    const userId = req.user!.userId;

    // Validate photoId format
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid photo ID format'
        }
      });
      return;
    }

    // Check if photo exists
    const photo = await Photo.findById(photoId);
    if (!photo) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Photo not found'
        }
      });
      return;
    }

    // Check if already liked
    const existingLike = await Like.findOne({ userId, photoId });
    if (existingLike) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Already liked this photo'
        }
      });
      return;
    }

    // Create like
    await Like.create({ userId, photoId });

    // Atomically increment like count
    const updatedPhoto = await Photo.findByIdAndUpdate(
      photoId,
      { $inc: { likeCount: 1 } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: {
        photoId,
        likeCount: updatedPhoto?.likeCount ?? 0
      },
      message: 'Photo liked successfully'
    });
  } catch (error) {
    console.error('Like photo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to like photo'
      }
    });
  }
}

/**
 * Unlike a photo
 * DELETE /api/v1/photos/:photoId/like
 */
export async function unlikePhoto(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;
    const userId = req.user!.userId;

    // Validate photoId format
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid photo ID format'
        }
      });
      return;
    }

    // Check if photo exists
    const photo = await Photo.findById(photoId);
    if (!photo) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Photo not found'
        }
      });
      return;
    }

    // Find and delete the like
    const deletedLike = await Like.findOneAndDelete({ userId, photoId });
    if (!deletedLike) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Like not found'
        }
      });
      return;
    }

    // Atomically decrement like count
    const updatedPhoto = await Photo.findByIdAndUpdate(
      photoId,
      { $inc: { likeCount: -1 } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        photoId,
        likeCount: updatedPhoto?.likeCount ?? 0
      },
      message: 'Photo unliked successfully'
    });
  } catch (error) {
    console.error('Unlike photo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unlike photo'
      }
    });
  }
}

/**
 * Get users who liked a photo
 * GET /api/v1/photos/:photoId/likes
 * Story: US0018 - View Photo Likes List
 */
export async function getPhotoLikes(req: Request, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Validate photoId format
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid photo ID format'
        }
      });
      return;
    }

    // Check if photo exists
    const photo = await Photo.findById(photoId);
    if (!photo) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Photo not found'
        }
      });
      return;
    }

    // Get likes with user info, sorted by most recent first
    const likes = await Like.find({ photoId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username displayName profilePictureUrl');

    // Get total count for pagination
    const totalLikes = await Like.countDocuments({ photoId });
    const totalPages = Math.ceil(totalLikes / limit);

    // Map to response format
    const users = likes.map(like => {
      const user = like.userId as unknown as {
        _id: mongoose.Types.ObjectId;
        username: string;
        displayName?: string;
        profilePictureUrl?: string;
      };
      return {
        userId: user._id,
        username: user.username,
        displayName: user.displayName || null,
        profilePictureUrl: user.profilePictureUrl || null,
        likedAt: like.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        photoId,
        likeCount: photo.likeCount,
        users,
        pagination: {
          page,
          limit,
          totalLikes,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get photo likes error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get photo likes'
      }
    });
  }
}
