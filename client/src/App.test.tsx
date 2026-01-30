import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';

const mockFetch = (response: unknown, ok = true) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () => response,
    })
  );
};

describe('App routing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders profile page for /profile/:username and navigates home', async () => {
    window.history.pushState({}, '', '/profile/taylor');
    mockFetch({
      success: true,
      data: {
        userId: '123',
        username: 'taylor',
        email: 'taylor@example.com',
        displayName: 'Taylor',
        bio: null,
        profilePictureUrl: null,
        followerCount: 1,
        followingCount: 2,
        photoCount: 3,
        createdAt: '2026-01-30T00:00:00.000Z',
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Taylor')).toBeInTheDocument();
    });

    const homeButton = screen.getByRole('button', { name: 'Home' });
    await userEvent.click(homeButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    });
  });
});
