/**
 * Follow Button Component
 * Story: US0022 - Follow Button Component (Frontend)
 */

import { useEffect, useState } from 'react';
import './FollowButton.css';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ userId, initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const token = localStorage.getItem('authToken');

  const buttonLabel = isFollowing ? (isHovering ? 'Unfollow' : 'Following') : 'Follow';
  const isDangerState = isFollowing && isHovering;
  const buttonClassName = [
    'btn',
    isFollowing ? 'btn-secondary' : 'btn-primary',
    isDangerState ? 'btn-danger' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    if (!token) {
      setAuthMessage('Please log in to follow users.');
      return;
    }

    setAuthMessage('');
    setErrorMessage('');

    const nextFollowing = !isFollowing;
    setIsLoading(true);
    setIsFollowing(nextFollowing);

    try {
      const response = await fetch(`/api/v1/users/${userId}/follow`, {
        method: nextFollowing ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || (data && data.success === false)) {
        const error = data?.error?.message || `Failed to ${nextFollowing ? 'follow' : 'unfollow'} user.`;
        throw new Error(error);
      }

      onFollowChange?.(nextFollowing);
    } catch (error) {
      setIsFollowing(!nextFollowing);
      const message = error instanceof Error ? error.message : 'Unexpected error. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="follow-button">
      <button
        type="button"
        className={buttonClassName}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isLoading}
        aria-pressed={isFollowing}
      >
        {isLoading ? 'Please wait...' : buttonLabel}
      </button>

      {authMessage && <div className="follow-message follow-message-auth">{authMessage}</div>}
      {errorMessage && <div className="follow-message follow-message-error">{errorMessage}</div>}
    </div>
  );
}
