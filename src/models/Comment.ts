/**
 * Comment Model
 * Mongoose schema and model for Comment entity
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  photoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  username: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    photoId: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: [true, 'Photo ID is required'],
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'comments'
  }
);

// Create indexes
commentSchema.index({ photoId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
