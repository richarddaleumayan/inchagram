/**
 * CommentInput Component
 * Allows users to write and post comments on photos
 */

import { useState, FormEvent } from 'react';
import type { CommentData } from '../types/comment';
import './CommentInput.css';

interface CommentInputProps {
  photoId: string;
  onCommentAdded?: (comment: CommentData) => void;
}

interface CreateCommentResponse {
  success: boolean;
  data?: CommentData;
  error?: {
    code: string;
    message: string;
  };
}

export function CommentInput({ photoId, onCommentAdded }: CommentInputProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/photos/${photoId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: trimmedText })
      });

      const data: CreateCommentResponse = await response.json();

      if (response.ok && data.success && data.data) {
        setText('');
        onCommentAdded?.(data.data);
      } else {
        setError(data.error?.message || 'Failed to post comment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Post comment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comment-input" onSubmit={handleSubmit}>
      <input
        type="text"
        className="comment-input__field"
        placeholder="Add a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
        maxLength={500}
        aria-label="Add a comment"
      />
      <button
        type="submit"
        className="comment-input__submit"
        disabled={isSubmitting || !text.trim()}
      >
        {isSubmitting ? 'Posting...' : 'Post'}
      </button>
      {error && (
        <div className="comment-input__error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
