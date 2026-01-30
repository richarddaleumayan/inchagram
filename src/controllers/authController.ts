/**
 * Authentication Controller
 * Handles user authentication operations
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User';
import { generateToken } from '../services/jwtService';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendVerificationEmail } from '../services/emailService';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Input validation handled by middleware (validateRequired, validateEmail, validateUsername, validatePassword)
    const { email, username, password } = req.body;

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.username, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email
      },
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error: unknown) {
    // Type guard for MongoDB/Mongoose errors
    const err = error as { code?: number; keyPattern?: Record<string, number>; name?: string; errors?: Record<string, { message: string; path: string }> };

    // Handle MongoDB duplicate key errors (shouldn't happen due to our checks, but safety net)
    if (err.code === 11000 && err.keyPattern) {
      const field = Object.keys(err.keyPattern)[0];
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
    if (err.name === 'ValidationError' && err.errors) {
      const firstError = Object.values(err.errors)[0];
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

/**
 * Login user with email/username and password
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password } = req.body;

    // Validate required fields (check for undefined/null, not empty strings)
    // Empty strings are treated as invalid credentials (401) for security
    if (password === undefined || password === null) {
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

    if ((email === undefined || email === null) && (username === undefined || username === null)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email or username is required',
          details: { field: 'email/username', issue: 'Missing required field' }
        }
      });
      return;
    }

    // Find user by email (priority) or username
    let user;
    if (email) {
      // Email lookup (case-insensitive)
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else if (username) {
      // Username lookup (case-sensitive)
      user = await User.findOne({ username: username.trim() });
    }

    // Security: Generic error message if user not found (don't reveal which field failed)
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    // Security: Same generic error if password is wrong
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Check if email is verified
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          details: { email: user.email }
        }
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.username);

    // Return success response with token and user data
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          userId: user._id.toString(),
          username: user.username,
          email: user.email
        }
      },
      message: 'Login successful'
    });
  } catch (error: unknown) {
    // Generic server error
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login',
        details: {}
      }
    });
  }
}

/**
 * Verify email address
 * GET /api/v1/auth/verify-email?token=xxx
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Verification token is required'
        }
      });
      return;
    }

    // First check if a user with this token exists and is already verified
    const existingUser = await User.findOne({
      verificationToken: token
    }).select('+verificationToken +verificationTokenExpiry');

    // Check if user is already verified
    if (existingUser && existingUser.isVerified) {
      res.status(200).json({
        success: true,
        message: 'Email already verified! You can log in now.'
      });
      return;
    }

    // Find user with this verification token that hasn't expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    }).select('+verificationToken +verificationTokenExpiry');

    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token. Please request a new verification email.'
        }
      });
      return;
    }

    // Mark user as verified (keep token for "already verified" message)
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error: unknown) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during email verification'
      }
    });
  }
}

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
export async function resendVerificationEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+verificationToken +verificationTokenExpiry');

    if (!user) {
      // Don't reveal if email exists for security
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link will be sent.'
      });
      return;
    }

    // Check if already verified
    if (user.isVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'This email is already verified'
        }
      });
      return;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.username, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        error: {
          code: 'EMAIL_ERROR',
          message: 'Failed to send verification email. Please try again later.'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error: unknown) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while resending verification email'
      }
    });
  }
}

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 * Requires: authenticateJWT middleware
 */
export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    // userId is populated by authenticateJWT middleware
    const { userId } = req.user!;

    // Fetch fresh user data from database (excluding passwordHash)
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      // User was deleted after token was issued
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Return user profile
    res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName || null,
        bio: user.bio || null,
        profilePictureUrl: user.profilePictureUrl || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: unknown) {
    // Database or server error
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred retrieving user profile'
      }
    });
  }
}
