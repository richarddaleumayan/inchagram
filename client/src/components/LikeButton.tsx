/**
 * LikeButton Component
 * Allows authenticated users to like/unlike photos
 * Story: US0021 - Like Button Component
 */

import { useState, useCallback, useEffect } from 'react';
import { apiUrl } from '../config/api';
import './LikeButton.css';
import { apiUrl } from '../config/api';

interface LikeButtonProps {
  photoId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  onLikeChange?: (isLiked: boolean, likeCount: number) => void;
}

interface LikeResponse {
  success: boolean;
  data?: {
    photoId: string;
    likeCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function LikeButton({
  photoId,
  initialLikeCount,
  initialIsLiked,
  onLikeChange
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with prop changes
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const handleClick = useCallback(async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to like photos');
      return;
    }

    // Prevent double-clicks
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // Optimistic update
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;
    const newIsLiked = !isLiked;
    const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
    const method = newIsLiked ? 'POST' : 'DELETE';

    console.log('Like button clicked:', {
      previousIsLiked,
      newIsLiked,
      method,
      photoId
    });

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      const response = await fetch(`/api/v1/photos/${photoId}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data: LikeResponse = await response.json();

      if (response.ok && data.success) {
        // Update with server's like count (source of truth)
        const serverLikeCount = data.data?.likeCount ?? newLikeCount;
        setLikeCount(serverLikeCount);
        onLikeChange?.(newIsLiked, serverLikeCount);
      } else {
        // Revert optimistic update on error
        setIsLiked(previousIsLiked);
        setLikeCount(previousLikeCount);
        setError(data.error?.message || 'Failed to update like');
      }
    } catch (err) {
      // Revert optimistic update on network error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      setError('Network error. Please try again.');
      console.error('Like error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [photoId, isLiked, likeCount, isLoading, onLikeChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="like-button-container">
      <button
        className={`like-button ${isLiked ? 'liked' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        aria-label={isLiked ? 'Unlike photo' : 'Like photo'}
        aria-pressed={isLiked}
        type="button"
      >
        <span className="like-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </span>
        <span className="like-count">{likeCount}</span>
      </button>
      {error && (
        <div className="like-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
