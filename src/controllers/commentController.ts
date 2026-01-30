/**
 * Comment Controller
 * Handles comment operations
 */

import { Response } from 'express';
import Comment from '../models/Comment';
import Photo from '../models/Photo';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Create a comment on a photo
 * POST /api/v1/photos/:photoId/comments
 */
export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;
    const { text } = req.body;
    const { userId, username } = req.user!;

    // Validate input
    if (!text || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Comment text is required'
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

    // Create comment
    const comment = await Comment.create({
      photoId,
      userId,
      username,
      text: text.trim()
    });

    res.status(201).json({
      success: true,
      data: {
        commentId: comment._id.toString(),
        photoId: comment.photoId.toString(),
        userId: comment.userId.toString(),
        username: comment.username,
        text: comment.text,
        createdAt: comment.createdAt
      },
      message: 'Comment added successfully'
    });
  } catch (error: unknown) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating comment'
      }
    });
  }
}

/**
 * Get comments for a photo
 * GET /api/v1/photos/:photoId/comments
 */
export async function getComments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get comments
    const comments = await Comment.find({ photoId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Comment.countDocuments({ photoId });

    res.status(200).json({
      success: true,
      data: {
        comments: comments.map(c => ({
          commentId: c._id.toString(),
          userId: c.userId.toString(),
          username: c.username,
          text: c.text,
          createdAt: c.createdAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + comments.length < total
        }
      }
    });
  } catch (error: unknown) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching comments'
      }
    });
  }
}

/**
 * Delete a comment
 * DELETE /api/v1/comments/:commentId
 */
export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { commentId } = req.params;
    const { userId } = req.user!;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Comment not found'
        }
      });
      return;
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments'
        }
      });
      return;
    }

    // Delete comment
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting comment'
      }
    });
  }
}
