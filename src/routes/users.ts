/**
 * User Profile Routes
 * Defines routes for user profile operations
 */

import { Router } from 'express';
import multer from 'multer';
import { getUserById, getUserByUsername, getUserPhotos, updateUser, updateProfilePicture } from '../controllers/profileController';
import { followUser, unfollowUser } from '../controllers/followController';
import { authenticateJWT } from '../middleware/authMiddleware';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

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
 * PUT /api/v1/users/:userId
 * Update user profile (requires authentication, owner only)
 * Story: US0008 - Edit Profile API and UI
 */
router.put('/:userId', authenticateJWT, updateUser);

/**
 * PUT /api/v1/users/:userId/profile-picture
 * Update user profile picture (requires authentication, owner only)
 * Story: US0009 - Upload/Update Profile Picture
 */
router.put('/:userId/profile-picture', authenticateJWT, upload.single('profilePicture'), updateProfilePicture);

/**
 * GET /api/v1/users/:userId/photos
 * Get user's photos with pagination
 * Story: US0007 - Profile Photo Grid Component
 */
router.get('/:userId/photos', getUserPhotos);

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
