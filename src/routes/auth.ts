/**
 * Authentication Routes
 * Defines routes for user authentication
 */

import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';
import {
  validateRequired,
  validateEmail,
  validateUsername,
  validatePassword
} from '../middleware/validationMiddleware';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 * Validates: required fields, email format, username pattern, password strength
 */
router.post('/register',
  validateRequired(['email', 'username', 'password']),
  validateEmail('email'),
  validateUsername('username'),
  validatePassword('password'),
  register
);

/**
 * POST /api/v1/auth/login
 * Login user with email/username and password
 * Note: Login accepts either email OR username, so validation is handled in controller
 */
router.post('/login', login);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile
 * Requires: JWT token in Authorization header
 */
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
