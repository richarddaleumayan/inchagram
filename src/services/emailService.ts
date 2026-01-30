/**
 * Email Service
 * Handles sending emails via Resend
 */

import { Resend } from 'resend';

// Initialize Resend only if API key is provided
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const resend = RESEND_API_KEY && RESEND_API_KEY !== 'your_resend_api_key_here'
  ? new Resend(RESEND_API_KEY)
  : null;

// Helper to check if email service is configured
function checkEmailService(): void {
  if (!resend) {
    console.warn('⚠️  Email service not configured. Please set RESEND_API_KEY in .env');
    console.warn('   Sign up at https://resend.com to get your free API key');
    throw new Error('Email service not configured');
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationToken: string
): Promise<void> {
  checkEmailService();

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

  try {
    await resend!.emails.send({
      from: process.env.EMAIL_FROM || 'Inchagram <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your Inchagram account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: 'Brush Script MT', cursive; font-size: 48px; margin: 0; color: #2563eb;">inchagram</h1>
            </div>

            <div style="background: #f5f5f5; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <h2 style="margin-top: 0; color: #1a1a1a;">Welcome, ${username}! 👋</h2>
              <p style="margin-bottom: 24px; color: #666666;">Thanks for signing up for Inchagram. Please verify your email address to get started.</p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="color: #999999; font-size: 14px; margin-bottom: 0;">
                Or copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>

            <div style="text-align: center; color: #999999; font-size: 12px;">
              <p>This verification link will expire in 24 hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset email (for future use)
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
): Promise<void> {
  checkEmailService();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  try {
    await resend!.emails.send({
      from: process.env.EMAIL_FROM || 'Inchagram <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your Inchagram password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-family: 'Brush Script MT', cursive; font-size: 48px; margin: 0; color: #2563eb;">inchagram</h1>
            </div>

            <div style="background: #f5f5f5; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <h2 style="margin-top: 0; color: #1a1a1a;">Reset your password</h2>
              <p style="margin-bottom: 24px; color: #666666;">Hi ${username}, we received a request to reset your password. Click the button below to create a new password.</p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #999999; font-size: 14px; margin-bottom: 0;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>

            <div style="text-align: center; color: #999999; font-size: 12px;">
              <p>This reset link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}
