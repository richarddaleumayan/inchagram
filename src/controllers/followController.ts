/**
 * Follow Controller
 * Handles follow and unfollow operations for users
 * Story: US0019 - Follow/Unfollow User API Endpoints
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import Follow from '../models/Follow';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Follow a user
 * POST /api/v1/users/:userId/follow
 */
export async function followUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId: targetUserId } = req.params;
    const followerId = req.user!.userId;

    // Validate targetUserId format
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID format'
        }
      });
      return;
    }

    // Check if trying to follow self
    if (followerId === targetUserId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot follow yourself'
        }
      });
      return;
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      followerId,
      followingId: targetUserId
    });
    if (existingFollow) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Already following this user'
        }
      });
      return;
    }

    // Create follow relationship
    await Follow.create({
      followerId,
      followingId: targetUserId
    });

    res.status(201).json({
      success: true,
      data: {
        followingId: targetUserId,
        followingUsername: targetUser.username
      },
      message: 'Successfully followed user'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to follow user'
      }
    });
  }
}

/**
 * Unfollow a user
 * DELETE /api/v1/users/:userId/follow
 */
export async function unfollowUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId: targetUserId } = req.params;
    const followerId = req.user!.userId;

    // Validate targetUserId format
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID format'
        }
      });
      return;
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Find and delete the follow relationship
    const deletedFollow = await Follow.findOneAndDelete({
      followerId,
      followingId: targetUserId
    });
    if (!deletedFollow) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Follow relationship not found'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        unfollowedId: targetUserId,
        unfollowedUsername: targetUser.username
      },
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unfollow user'
      }
    });
  }
}
