/**
 * Like Model
 * Mongoose schema and model for Like relationships between users and photos
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * Like interface for TypeScript
 */
export interface ILike extends Document {
  userId: mongoose.Types.ObjectId;
  photoId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Like Schema
 */
const likeSchema = new Schema<ILike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    photoId: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: [true, 'Photo ID is required'],
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'likes'
  }
);

// Compound unique index to prevent duplicate likes
likeSchema.index({ userId: 1, photoId: 1 }, { unique: true });

// Index for efficient "users who liked this photo" queries
likeSchema.index({ photoId: 1, createdAt: -1 });

/**
 * Export Like model
 */
const Like = mongoose.model<ILike>('Like', likeSchema);

export default Like;
