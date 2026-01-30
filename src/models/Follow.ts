/**
 * Follow Model
 * Mongoose schema and model for Follow relationships between users
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * Follow interface for TypeScript
 */
export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Follow Schema
 */
const followSchema = new Schema<IFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower ID is required'],
      index: true
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following ID is required'],
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'follows'
  }
);

// Compound unique index to prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

/**
 * Pre-save validation to prevent self-follows
 */
followSchema.pre('save', function (next) {
  if (this.followerId.equals(this.followingId)) {
    const error = new Error('Users cannot follow themselves');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

/**
 * Export Follow model
 */
const Follow = mongoose.model<IFollow>('Follow', followSchema);

export default Follow;
