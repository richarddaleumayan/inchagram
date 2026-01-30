/**
 * PhotoCard Component
 * Displays a photo with user info, caption, and like button in feed
 * Story: US0025 - Photo Card Component for Feeds
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { LikeButton } from './LikeButton';
import './PhotoCard.css';

export interface PhotoCardProps {
  photoId: string;
  imageUrl: string;
  caption: string;
  username: string;
  userId: string;
  profilePictureUrl?: string | null;
  likeCount: number;
  createdAt: string;
  isLiked?: boolean;
  onNavigate?: (path: string) => void;
}

export function PhotoCard({
  photoId,
  imageUrl,
  caption,
  username,
  userId,
  profilePictureUrl,
  likeCount,
  createdAt,
  isLiked = false,
  onNavigate
}: PhotoCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const MAX_CAPTION_LENGTH = 200;

  const shouldTruncate = caption.length > MAX_CAPTION_LENGTH;
  const displayCaption = showFullCaption || !shouldTruncate
    ? caption
    : `${caption.slice(0, MAX_CAPTION_LENGTH)}...`;

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleUsernameClick = () => {
    if (onNavigate) {
      onNavigate(`/profile/${username}`);
    }
  };

  return (
    <article className="photo-card" data-testid={`photo-card-${photoId}`}>
      {/* User Header */}
      <header className="photo-card__header">
        <button
          className="photo-card__user-info"
          onClick={handleUsernameClick}
          aria-label={`View ${username}'s profile`}
        >
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={`${username}'s profile`}
              className="photo-card__avatar"
            />
          ) : (
            <div className="photo-card__avatar photo-card__avatar--placeholder">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="photo-card__username">{username}</span>
        </button>
      </header>

      {/* Photo Image */}
      <div className="photo-card__image-container">
        <img
          src={imageUrl}
          alt={caption || `Photo by ${username}`}
          className="photo-card__image"
          loading="lazy"
        />
      </div>

      {/* Actions Bar */}
      <div className="photo-card__actions">
        <LikeButton
          photoId={photoId}
          initialLikeCount={likeCount}
          initialIsLiked={isLiked}
        />
      </div>

      {/* Caption and Metadata */}
      <div className="photo-card__content">
        {caption && (
          <div className="photo-card__caption">
            <span className="photo-card__username">{username}</span>{' '}
            <span className="photo-card__caption-text">{displayCaption}</span>
            {shouldTruncate && !showFullCaption && (
              <button
                className="photo-card__more-button"
                onClick={() => setShowFullCaption(true)}
                aria-label="Show more"
              >
                more
              </button>
            )}
          </div>
        )}
        <time className="photo-card__timestamp" dateTime={createdAt}>
          {timeAgo}
        </time>
      </div>
    </article>
  );
}
