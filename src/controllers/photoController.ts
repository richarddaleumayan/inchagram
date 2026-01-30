/**
 * Photo Controller
 * Handles photo upload, retrieval, and deletion
 */

import { Request, Response } from 'express';
import Photo from '../models/Photo';
import { validatePhotoFile } from '../utils/validation';
import { uploadToS3, generateS3Key } from '../services/s3Service';

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
    const userId = (req as Express.Request & { user: { userId: string } }).user.userId;

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
