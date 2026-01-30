/**
 * EmptyState Component
 * Displays helpful messages when feed is empty
 * Story: US0027 - Feed Empty State Handling
 */

import './EmptyState.css';

export type EmptyStateType = 'no-following' | 'no-photos' | 'all-caught-up';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const content = {
    'no-following': {
      icon: '👥',
      title: 'Your feed is empty',
      message: 'Follow users to see their photos here.',
      actionLabel: 'Discover Photos',
      actionAriaLabel: 'Navigate to discovery feed'
    },
    'no-photos': {
      icon: '📸',
      title: 'No photos yet',
      message: 'Be the first to upload!',
      actionLabel: 'Upload Photo',
      actionAriaLabel: 'Navigate to upload page'
    },
    'all-caught-up': {
      icon: '✨',
      title: "You're all caught up!",
      message: 'Check back later for new photos.',
      actionLabel: null,
      actionAriaLabel: null
    }
  }[type];

  return (
    <div className="empty-state" data-testid={`empty-state-${type}`}>
      <div className="empty-state__icon">{content.icon}</div>
      <h2 className="empty-state__title">{content.title}</h2>
      <p className="empty-state__message">{content.message}</p>
      {content.actionLabel && onAction && (
        <button
          className="empty-state__action"
          onClick={onAction}
          aria-label={content.actionAriaLabel || undefined}
        >
          {content.actionLabel}
        </button>
      )}
    </div>
  );
}
