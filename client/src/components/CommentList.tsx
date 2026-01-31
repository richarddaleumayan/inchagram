/**
 * CommentList Component
 * Fetches and displays comments for a photo
 */

import { useState, useEffect } from 'react';
import { Comment } from './Comment';
import type { CommentData } from '../types/comment';
import { apiUrl } from '../config/api';
import './CommentList.css';

interface CommentListProps {
  photoId: string;
  currentUserId?: string;
  newComment?: CommentData | null;
}

interface GetCommentsResponse {
  success: boolean;
  data?: {
    comments: CommentData[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export function CommentList({ photoId, currentUserId, newComment }: CommentListProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl(`api/v1/photos/${photoId}/comments?limit=10&offset=0`));
        const data: GetCommentsResponse = await response.json();

        if (response.ok && data.success && data.data) {
          setComments(data.data.comments);
          setHasMore(data.data.pagination.hasMore);
        } else {
          setError(data.error?.message || 'Failed to load comments');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Fetch comments error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [photoId]);

  // Add new comment to the list
  useEffect(() => {
    if (newComment && newComment.photoId === photoId) {
      setComments((prev) => [newComment, ...prev]);
    }
  }, [newComment, photoId]);

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.commentId !== commentId));
  };

  const loadMoreComments = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        apiUrl(`api/v1/photos/${photoId}/comments?limit=10&offset=${comments.length}`)
      );
      const data: GetCommentsResponse = await response.json();

      if (response.ok && data.success && data.data) {
        setComments((prev) => [...prev, ...data.data!.comments]);
        setHasMore(data.data!.pagination.hasMore);
      }
    } catch (err) {
      console.error('Load more comments error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return <div className="comment-list__loading">Loading comments...</div>;
  }

  if (error) {
    return (
      <div className="comment-list__error" role="alert">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return <div className="comment-list__empty">No comments yet. Be the first to comment!</div>;
  }

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <Comment
          key={comment.commentId}
          comment={comment}
          currentUserId={currentUserId}
          onDelete={handleDelete}
        />
      ))}
      {hasMore && (
        <button
          className="comment-list__load-more"
          onClick={loadMoreComments}
          disabled={isLoadingMore}
          type="button"
        >
          {isLoadingMore ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
