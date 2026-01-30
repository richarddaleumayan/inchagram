/**
 * Authentication Routes
 * Defines routes for user authentication
 */

import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', register);

/**
 * POST /api/v1/auth/login
 * Login user with email/username and password
 */
router.post('/login', login);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile
 * Requires: JWT token in Authorization header
 */
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
