import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ProfilePage } from './ProfilePage';

const mockFetch = (response: unknown, ok = true) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () => response,
    })
  );
};

describe('ProfilePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders profile data for a valid username', async () => {
    mockFetch({
      success: true,
      data: {
        userId: '123',
        username: 'taylor',
        email: 'taylor@example.com',
        displayName: null,
        bio: 'Curator of visuals',
        profilePictureUrl: null,
        followerCount: 10,
        followingCount: 5,
        photoCount: 3,
        createdAt: '2026-01-30T00:00:00.000Z',
      },
    });

    const onNavigate = vi.fn();
    render(<ProfilePage username="taylor" onNavigate={onNavigate} />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'taylor' })).toBeInTheDocument();
    });

    expect(screen.getByText('Curator of visuals')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('followers')).toBeInTheDocument();
  });

  it('shows an error message when profile is not found', async () => {
    mockFetch(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      },
      false
    );

    render(<ProfilePage username="missing" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });
});
