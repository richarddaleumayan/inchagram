/**
 * FollowButton Component
 * Allows authenticated users to follow/unfollow other users
 * Story: US0022 - Follow Button Component
 */

import { useState, useCallback } from 'react';
import './FollowButton.css';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

interface FollowResponse {
  success: boolean;
  data?: {
    userId: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function FollowButton({
  userId,
  initialIsFollowing,
  onFollowChange
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to follow users');
      return;
    }

    // Prevent double-clicks
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // Optimistic update
    const previousIsFollowing = isFollowing;
    const newIsFollowing = !isFollowing;

    setIsFollowing(newIsFollowing);

    try {
      const response = await fetch(`/api/v1/users/${userId}/follow`, {
        method: newIsFollowing ? 'POST' : 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data: FollowResponse = await response.json();

      if (response.ok && data.success) {
        // Success - optimistic update was correct
        onFollowChange?.(newIsFollowing);
      } else {
        // Revert optimistic update on error
        setIsFollowing(previousIsFollowing);
        setError(data.error?.message || 'Failed to update follow status');
      }
    } catch (err) {
      // Revert optimistic update on network error
      setIsFollowing(previousIsFollowing);
      setError('Network error. Please try again.');
      console.error('Follow error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isFollowing, isLoading, onFollowChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="follow-button-container">
      <button
        className={`follow-button ${isFollowing ? 'following' : 'not-following'} ${isLoading ? 'loading' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
        aria-pressed={isFollowing}
        type="button"
      >
        {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
      </button>
      {error && (
        <div className="follow-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
