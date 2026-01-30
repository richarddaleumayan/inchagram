/**
 * PhotoCard Component Tests
 * Story: US0025 - Photo Card Component for Feeds
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoCard } from './PhotoCard';

describe('PhotoCard', () => {
  const mockPhoto = {
    photoId: '123',
    imageUrl: 'https://example.com/photo.jpg',
    caption: 'Test caption',
    username: 'testuser',
    userId: 'user123',
    profilePictureUrl: 'https://example.com/avatar.jpg',
    likeCount: 42,
    createdAt: new Date().toISOString(),
    isLiked: false
  };

  it('renders photo image', () => {
    render(<PhotoCard {...mockPhoto} />);
    const img = screen.getByRole('img', { name: /Test caption/ });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockPhoto.imageUrl);
  });

  it('renders username and profile picture', () => {
    render(<PhotoCard {...mockPhoto} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    const avatar = screen.getByAltText("testuser's profile");
    expect(avatar).toHaveAttribute('src', mockPhoto.profilePictureUrl);
  });

  it('renders placeholder avatar when no profile picture', () => {
    const photoWithoutAvatar = { ...mockPhoto, profilePictureUrl: null };
    render(<PhotoCard {...photoWithoutAvatar} />);

    // Should show first letter of username
    const placeholder = screen.getByText('T');
    expect(placeholder).toBeInTheDocument();
  });

  it('renders caption', () => {
    render(<PhotoCard {...mockPhoto} />);
    expect(screen.getByText('Test caption')).toBeInTheDocument();
  });

  it('truncates long captions', () => {
    const longCaption = 'A'.repeat(250);
    const photoWithLongCaption = { ...mockPhoto, caption: longCaption };

    render(<PhotoCard {...photoWithLongCaption} />);

    // Caption should be truncated
    const captionText = screen.getByText(/A+\.\.\./);
    expect(captionText.textContent).toHaveLength(203); // 200 chars + "..."

    // "more" button should be present
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });

  it('shows full caption when "more" is clicked', () => {
    const longCaption = 'A'.repeat(250);
    const photoWithLongCaption = { ...mockPhoto, caption: longCaption };

    render(<PhotoCard {...photoWithLongCaption} />);

    const moreButton = screen.getByRole('button', { name: 'Show more' });
    fireEvent.click(moreButton);

    // Full caption should now be visible
    const fullCaption = screen.getByText(longCaption);
    expect(fullCaption).toBeInTheDocument();

    // "more" button should be gone
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('renders like count', () => {
    render(<PhotoCard {...mockPhoto} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    const now = new Date();
    const photo = { ...mockPhoto, createdAt: now.toISOString() };

    render(<PhotoCard {...photo} />);

    // Should show relative time (e.g., "less than a minute ago")
    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });

  it('handles username click', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<PhotoCard {...mockPhoto} />);

    const userButton = screen.getByRole('button', { name: "View testuser's profile" });
    fireEvent.click(userButton);

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to profile: user123');
    consoleSpy.mockRestore();
  });

  it('uses lazy loading for image', () => {
    render(<PhotoCard {...mockPhoto} />);
    const img = screen.getByRole('img', { name: /Test caption/ });
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('has correct accessibility attributes', () => {
    render(<PhotoCard {...mockPhoto} />);

    // Article should have test id
    const article = screen.getByTestId('photo-card-123');
    expect(article).toBeInTheDocument();

    // Time element should have datetime attribute
    const time = screen.getByText(/ago/i);
    expect(time).toHaveAttribute('datetime');
  });
});
