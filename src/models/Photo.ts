/**
 * Photo Model
 * Mongoose schema and model for Photo entity
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Photo interface for TypeScript
 */
export interface IPhoto extends Document {
  userId: Types.ObjectId;
  imageUrl: string;
  caption?: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Photo Schema
 */
const photoSchema = new Schema<IPhoto>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    caption: {
      type: String,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      trim: true,
      default: ''
    },
    likeCount: {
      type: Number,
      default: 0,
      min: [0, 'Like count cannot be negative']
    }
  },
  {
    timestamps: true,
    collection: 'photos'
  }
);

// Create indexes for efficient queries
photoSchema.index({ userId: 1, createdAt: -1 }); // User's photos sorted by date
photoSchema.index({ createdAt: -1 }); // Discovery feed sorted by date

/**
 * Export Photo model
 */
const Photo = mongoose.model<IPhoto>('Photo', photoSchema);

export default Photo;
