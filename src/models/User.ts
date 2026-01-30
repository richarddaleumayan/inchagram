/**
 * User Model
 * Mongoose schema and model for User entity
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * User interface for TypeScript
 */
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Schema
 */
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      index: true,
      minlength: [3, 'Username must be between 3-30 characters'],
      maxlength: [30, 'Username must be between 3-30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username must contain only alphanumeric characters and underscores'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true, // Automatically convert to lowercase
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email format is invalid'],
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    displayName: {
      type: String,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
      trim: true
    },
    bio: {
      type: String,
      maxlength: [150, 'Bio cannot exceed 150 characters'],
      trim: true
    },
    profilePictureUrl: {
      type: String,
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      select: false // Don't include in queries by default
    },
    verificationTokenExpiry: {
      type: Date,
      select: false // Don't include in queries by default
    }
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    collection: 'users'
  }
);

// Create indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

/**
 * Export User model
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User;
