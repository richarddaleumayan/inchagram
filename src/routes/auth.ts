/**
 * Authentication Routes
 * Defines routes for user authentication
 */

import { Router } from 'express';
import { register } from '../controllers/authController';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', register);

export default router;
