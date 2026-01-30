/**
 * Photo Controller
 * Handles photo upload, retrieval, and deletion
 */

import { Request, Response } from 'express';
import Photo from '../models/Photo';
import { validatePhotoFile } from '../utils/validation';
import { uploadToS3, generateS3Key, deleteFromS3, extractS3Key } from '../services/s3Service';

/**
 * Upload photo
 * POST /api/v1/photos
 * @param req Express request with file upload
 * @param res Express response
 */
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  try {
    // Check if file exists
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'No file uploaded',
        },
      });
      return;
    }

    // Validate file
    const validation = validatePhotoFile({
      mimeType: req.file.mimetype,
      filename: req.file.originalname,
      size: req.file.size,
    });

    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: validation.code,
          message: validation.error,
        },
      });
      return;
    }

    // Get caption from request body (optional)
    const caption = req.body.caption?.trim() || '';

    // Validate caption length
    if (caption.length > 2200) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Caption cannot exceed 2200 characters',
        },
      });
      return;
    }

    // Get authenticated user ID from JWT middleware
    const userId = (req as any).user.userId;

    // Generate S3 key
    const s3Key = generateS3Key(userId, req.file.mimetype);

    // Upload to S3
    const uploadResult = await uploadToS3(
      req.file.buffer,
      s3Key,
      req.file.mimetype
    );

    if (!uploadResult.success) {
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: uploadResult.error || 'Failed to upload photo to storage',
        },
      });
      return;
    }

    // Save photo metadata to MongoDB
    const photo = await Photo.create({
      userId,
      imageUrl: uploadResult.imageUrl!,
      caption,
      likeCount: 0,
    });

    res.status(201).json({
      success: true,
      data: {
        photoId: photo._id,
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        likeCount: photo.likeCount,
        createdAt: photo.createdAt,
      },
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload photo',
      },
    });
  }
}

/**
 * Get photo by ID
 * GET /api/v1/photos/:photoId
 * @param req Express request
 * @param res Express response
 */
export async function getPhoto(req: Request, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;

    const photo = await Photo.findById(photoId).populate('userId', 'username displayName profilePictureUrl');

    if (!photo) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Photo not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        photoId: photo._id,
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        likeCount: photo.likeCount,
        userId: photo.userId,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve photo',
      },
    });
  }
}

/**
 * Delete photo
 * DELETE /api/v1/photos/:photoId
 * @param req Express request
 * @param res Express response
 */
export async function deletePhoto(req: Request, res: Response): Promise<void> {
  try {
    const { photoId } = req.params;
    const userId = (req as any).user.userId;

    // Find photo
    const photo = await Photo.findById(photoId);

    if (!photo) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Photo not found',
        },
      });
      return;
    }

    // Check ownership - only owner can delete
    if (photo.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this photo',
        },
      });
      return;
    }

    // Extract S3 key from imageUrl
    const s3Key = extractS3Key(photo.imageUrl);

    // Delete from MongoDB first
    await Photo.findByIdAndDelete(photoId);

    // Delete from S3 (best effort - don't fail if S3 delete fails)
    if (s3Key) {
      const s3DeleteSuccess = await deleteFromS3(s3Key);
      if (!s3DeleteSuccess) {
        console.warn(`Failed to delete S3 object: ${s3Key}`);
        // Continue anyway - MongoDB record is already deleted
      }
    }

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete photo',
      },
    });
  }
}
