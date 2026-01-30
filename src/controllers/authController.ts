/**
 * Authentication Controller
 * Handles user authentication operations
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { isValidEmail, isValidUsername, isValidPassword } from '../utils/validation';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password } = req.body;

    // Validate required fields
    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
          details: { field: 'email', issue: 'Missing required field' }
        }
      });
      return;
    }

    if (!username) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username is required',
          details: { field: 'username', issue: 'Missing required field' }
        }
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password is required',
          details: { field: 'password', issue: 'Missing required field' }
        }
      });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email format is invalid',
          details: { field: 'email', issue: 'Invalid email format' }
        }
      });
      return;
    }

    // Validate username format
    const usernameValidation = isValidUsername(username);
    if (!usernameValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: usernameValidation.error,
          details: { field: 'username', issue: usernameValidation.error }
        }
      });
      return;
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: passwordValidation.error,
          details: { field: 'password', issue: passwordValidation.error }
        }
      });
      return;
    }

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email already registered',
          details: { field: 'email', issue: 'Email already exists' }
        }
      });
      return;
    }

    // Check for duplicate username (case-insensitive)
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }
    });
    if (existingUsername) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Username already taken',
          details: { field: 'username', issue: 'Username already exists' }
        }
      });
      return;
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash
    });

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email
      },
      message: 'User registered successfully'
    });
  } catch (error: any) {
    // Handle MongoDB duplicate key errors (shouldn't happen due to our checks, but safety net)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: field === 'email' ? 'Email already registered' : 'Username already taken',
          details: { field, issue: 'Duplicate value' }
        }
      });
      return;
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0] as any;
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: firstError.message,
          details: { field: firstError.path, issue: firstError.message }
        }
      });
      return;
    }

    // Generic server error
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during registration',
        details: {}
      }
    });
  }
}
