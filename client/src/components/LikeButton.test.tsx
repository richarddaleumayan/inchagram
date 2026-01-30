/**
 * LikeButton Component Tests
 * Story: US0021 - Like Button Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LikeButton } from './LikeButton';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LikeButton', () => {
  const defaultProps = {
    photoId: 'photo123',
    initialLikeCount: 10,
    initialIsLiked: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // TC001: Render with initial state (not liked)
  describe('TC001: Initial render (not liked)', () => {
    it('should display outlined heart when not liked', () => {
      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveClass('liked');
      expect(screen.getByText('♡')).toBeInTheDocument();
    });

    it('should display the initial like count', () => {
      render(<LikeButton {...defaultProps} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  // TC002: Render with initial state (liked)
  describe('TC002: Initial render (liked)', () => {
    it('should display filled heart when liked', () => {
      render(<LikeButton {...defaultProps} initialIsLiked={true} />);

      const button = screen.getByRole('button', { name: /unlike photo/i });
      expect(button).toHaveClass('liked');
      expect(screen.getByText('❤')).toBeInTheDocument();
    });
  });

  // TC003: Like a photo (authenticated)
  describe('TC003: Like photo (authenticated)', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should call POST API and update state on like', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photoId: 'photo123', likeCount: 11 },
        }),
      });

      const onLikeChange = vi.fn();
      render(<LikeButton {...defaultProps} onLikeChange={onLikeChange} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/photos/photo123/like', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument();
        expect(button).toHaveClass('liked');
      });

      expect(onLikeChange).toHaveBeenCalledWith(true, 11);
    });
  });

  // TC004: Unlike a photo (authenticated)
  describe('TC004: Unlike photo (authenticated)', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should call DELETE API and update state on unlike', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photoId: 'photo123', likeCount: 9 },
        }),
      });

      const onLikeChange = vi.fn();
      render(
        <LikeButton
          {...defaultProps}
          initialIsLiked={true}
          initialLikeCount={10}
          onLikeChange={onLikeChange}
        />
      );

      const button = screen.getByRole('button', { name: /unlike photo/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/photos/photo123/like', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(button).not.toHaveClass('liked');
      });

      expect(onLikeChange).toHaveBeenCalledWith(false, 9);
    });
  });

  // TC005: Unauthenticated user
  describe('TC005: Unauthenticated user', () => {
    it('should show error message when not logged in', async () => {
      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      await userEvent.click(button);

      expect(screen.getByRole('alert')).toHaveTextContent('Please log in to like photos');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // TC006: API error handling
  describe('TC006: API error handling', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should revert optimistic update on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Server error' },
        }),
      });

      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });

      // Click and wait for optimistic update to be reverted
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error');
      });

      // Should revert to original state
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(button).not.toHaveClass('liked');
    });

    it('should revert optimistic update on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error. Please try again.');
      });

      // Should revert to original state
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(button).not.toHaveClass('liked');
    });
  });

  // TC007: Disabled during loading
  describe('TC007: Disabled during loading', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should be disabled while API call is in progress', async () => {
      // Create a promise that we can resolve manually
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      await userEvent.click(button);

      // Button should be disabled during loading
      expect(button).toBeDisabled();
      expect(button).toHaveClass('loading');

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: { photoId: 'photo123', likeCount: 11 },
        }),
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(button).not.toHaveClass('loading');
      });
    });
  });

  // TC008: Keyboard accessibility
  describe('TC008: Keyboard accessibility', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should be activatable with Enter key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photoId: 'photo123', likeCount: 11 },
        }),
      });

      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should be activatable with Space key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photoId: 'photo123', likeCount: 11 },
        }),
      });

      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      button.focus();
      fireEvent.keyDown(button, { key: ' ' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should have aria-pressed=false when not liked', () => {
      render(<LikeButton {...defaultProps} initialIsLiked={false} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have aria-pressed=true when liked', () => {
      render(<LikeButton {...defaultProps} initialIsLiked={true} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // TC009: Optimistic updates
  describe('TC009: Optimistic updates', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should show immediate feedback before API response', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<LikeButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /like photo/i });
      await userEvent.click(button);

      // Immediately after click, should show optimistic update
      expect(screen.getByText('11')).toBeInTheDocument();
      expect(button).toHaveClass('liked');

      // Resolve with server response
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: { photoId: 'photo123', likeCount: 11 },
        }),
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
