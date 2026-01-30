/**
 * Authentication Routes
 * Defines routes for user authentication
 */

import { Router } from 'express';
import { register, login } from '../controllers/authController';

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

export default router;
