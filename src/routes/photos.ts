/**
 * Photo Routes
 * API endpoints for photo upload and management
 */

import express from 'express';
import multer from 'multer';
import { uploadPhoto, getPhoto, deletePhoto } from '../controllers/photoController';
import { likePhoto, unlikePhoto } from '../controllers/likeController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { MAX_FILE_SIZE } from '../utils/validation';

const router = express.Router();

/**
 * Configure Multer for file uploads
 * - Store in memory (buffer)
 * - Max file size from validation constants
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE, // 10MB
  },
});

/**
 * POST /api/v1/photos
 * Upload new photo (requires authentication)
 * - Multipart/form-data with 'photo' field
 * - Optional 'caption' field in body
 */
router.post('/', authenticateJWT, upload.single('photo'), uploadPhoto);

/**
 * GET /api/v1/photos/:photoId
 * Get photo by ID (public, no auth required)
 */
router.get('/:photoId', getPhoto);

/**
 * DELETE /api/v1/photos/:photoId
 * Delete photo (requires authentication, owner only)
 */
router.delete('/:photoId', authenticateJWT, deletePhoto);

/**
 * POST /api/v1/photos/:photoId/like
 * Like a photo (requires authentication)
 */
router.post('/:photoId/like', authenticateJWT, likePhoto);

/**
 * DELETE /api/v1/photos/:photoId/like
 * Unlike a photo (requires authentication)
 */
router.delete('/:photoId/like', authenticateJWT, unlikePhoto);

export default router;
