/**
 * Comment Component
 * Displays an individual comment with user info and delete option
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { CommentData } from '../types/comment';
import './Comment.css';

interface CommentProps {
  comment: CommentData;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
}

interface DeleteResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export function Comment({ comment, currentUserId, onDelete }: CommentProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnComment = currentUserId === comment.userId;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to delete comments');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/comments/${comment.commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data: DeleteResponse = await response.json();

      if (response.ok && data.success) {
        onDelete?.(comment.commentId);
      } else {
        setError(data.error?.message || 'Failed to delete comment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete comment error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="comment" data-testid={`comment-${comment.commentId}`}>
      <div className="comment__content">
        <span className="comment__username">{comment.username}</span>{' '}
        <span className="comment__text">{comment.text}</span>
      </div>
      <div className="comment__footer">
        <time className="comment__timestamp" dateTime={comment.createdAt}>
          {timeAgo}
        </time>
        {isOwnComment && (
          <button
            className="comment__delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete comment"
            type="button"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
      {error && (
        <div className="comment__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
