/**
 * User Profile Routes
 * Defines routes for user profile operations
 */

import { Router } from 'express';
import { getUserById, getUserByUsername } from '../controllers/profileController';
import { followUser, unfollowUser } from '../controllers/followController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/v1/users/username/:username
 * Get user profile by username (case-insensitive)
 * Note: This route must come BEFORE /:userId to avoid username being treated as userId
 */
router.get('/username/:username', getUserByUsername);

/**
 * GET /api/v1/users/:userId
 * Get user profile by MongoDB ObjectId
 */
router.get('/:userId', getUserById);

/**
 * POST /api/v1/users/:userId/follow
 * Follow a user (requires authentication)
 */
router.post('/:userId/follow', authenticateJWT, followUser);

/**
 * DELETE /api/v1/users/:userId/follow
 * Unfollow a user (requires authentication)
 */
router.delete('/:userId/follow', authenticateJWT, unfollowUser);

export default router;
