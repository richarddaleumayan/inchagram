/**
 * Comment Routes
 * Defines routes for comment operations
 */

import { Router } from 'express';
import { createComment, getComments, deleteComment } from '../controllers/commentController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/v1/photos/:photoId/comments
 * Create a comment on a photo
 */
router.post('/photos/:photoId/comments', authenticateJWT, createComment);

/**
 * GET /api/v1/photos/:photoId/comments
 * Get comments for a photo
 */
router.get('/photos/:photoId/comments', getComments);

/**
 * DELETE /api/v1/comments/:commentId
 * Delete a comment
 */
router.delete('/comments/:commentId', authenticateJWT, deleteComment);

export default router;
