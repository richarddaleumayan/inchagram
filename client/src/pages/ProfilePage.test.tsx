/**
 * ProfilePage Component Tests
 * Story: US0010 - Profile Page Routing and Navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';

describe('ProfilePage', () => {
  const mockProfile = {
    userId: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    bio: 'This is a test bio',
    profilePictureUrl: 'https://example.com/avatar.jpg',
    followerCount: 100,
    followingCount: 50,
    photoCount: 25,
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('AC2: displays profile data correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('This is a test bio')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('AC7: shows loading state', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('AC6: shows error for invalid username', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      })
    });

    render(<ProfilePage username="invaliduser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Profile not found')).toBeInTheDocument();
    expect(screen.getByText('User not found')).toBeInTheDocument();
  });

  it('AC5: navigates back to home', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    const homeButton = screen.getByRole('button', { name: 'Back to home' });
    homeButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders profile picture when available', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      const avatar = screen.getByAltText("testuser's avatar");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', mockProfile.profilePictureUrl);
    });
  });

  it('renders placeholder avatar when no profile picture', async () => {
    const profileWithoutPicture = {
      ...mockProfile,
      profilePictureUrl: null
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: profileWithoutPicture
      })
    });

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  it('fetches profile with correct API endpoint', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    render(<ProfilePage username="test user" onNavigate={mockNavigate} />);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/users/username/test%20user'
    );
  });

  it('handles network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load profile. Please try again.')).toBeInTheDocument();
  });

  it('cleans up fetch when component unmounts', async () => {
    (global.fetch as any).mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockProfile
            })
          });
        }, 100);
      })
    );

    const { unmount } = render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    unmount();

    // Should not cause state updates after unmount
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  it('renders photo grid placeholder', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Photo grid coming soon (US0007)')).toBeInTheDocument();
    });
  });

  it('renders stats correctly when zero', async () => {
    const profileWithZeroStats = {
      ...mockProfile,
      photoCount: 0,
      followerCount: 0,
      followingCount: 0
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: profileWithZeroStats
      })
    });

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Should show 0 for all stats
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3); // photos, followers, following
  });

  it('handles missing optional fields', async () => {
    const minimalProfile = {
      ...mockProfile,
      displayName: null,
      bio: null,
      profilePictureUrl: null
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: minimalProfile
      })
    });

    render(<ProfilePage username="testuser" onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Should not show display name or bio
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByText('This is a test bio')).not.toBeInTheDocument();
  });
});
