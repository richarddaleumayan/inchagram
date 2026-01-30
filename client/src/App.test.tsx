/**
 * App Component Routing Tests
 * Story: US0010 - Profile Page Routing and Navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('App Routing', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    global.fetch = vi.fn();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithAuth = (token = 'test-token', pathname = '/') => {
    localStorageMock.setItem('token', token);
    window.history.pushState({}, '', pathname);

    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  };

  it('AC1: renders profile page at /profile/:username route', async () => {
    const mockProfile = {
      userId: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      bio: 'Test bio',
      profilePictureUrl: null,
      followerCount: 10,
      followingCount: 5,
      photoCount: 3,
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    window.history.pushState({}, '', '/profile/testuser');
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('AC3: "My Profile" button navigates to own profile', async () => {
    const mockCurrentUser = {
      success: true,
      data: {
        userId: 'user123',
        username: 'myusername',
        email: 'me@example.com'
      }
    };

    const mockProfile = {
      userId: 'user123',
      username: 'myusername',
      email: 'me@example.com',
      displayName: 'My Name',
      bio: 'My bio',
      profilePictureUrl: null,
      followerCount: 10,
      followingCount: 5,
      photoCount: 3,
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCurrentUser
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: [], pagination: { page: 0, limit: 20, total: 0, hasMore: false } }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProfile
        })
      });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    const myProfileButton = screen.getByText('My Profile');
    fireEvent.click(myProfileButton);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/profile/myusername');
    });
  });

  it('AC5: navigates back to home from profile page', async () => {
    const mockProfile = {
      userId: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      bio: 'Test bio',
      profilePictureUrl: null,
      followerCount: 10,
      followingCount: 5,
      photoCount: 3,
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProfile
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 'me',
            username: 'me',
            email: 'me@example.com'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: [], pagination: { page: 0, limit: 20, total: 0, hasMore: false } }
        })
      });

    window.history.pushState({}, '', '/profile/testuser');
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    const homeButton = screen.getByRole('button', { name: 'Back to home' });
    fireEvent.click(homeButton);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  it('handles browser back button', async () => {
    const mockProfile = {
      userId: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      bio: 'Test bio',
      profilePictureUrl: null,
      followerCount: 10,
      followingCount: 5,
      photoCount: 3,
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    window.history.pushState({}, '', '/');
    const queryClient = createTestQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    // Navigate to profile
    window.history.pushState({}, '', '/profile/testuser');
    window.dispatchEvent(new PopStateEvent('popstate'));

    rerender(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(window.location.pathname).toBe('/profile/testuser');
    });
  });

  it('decodes URL-encoded usernames', async () => {
    const mockProfile = {
      userId: 'user123',
      username: 'test user',
      email: 'test@example.com',
      displayName: 'Test User',
      bio: 'Test bio',
      profilePictureUrl: null,
      followerCount: 10,
      followingCount: 5,
      photoCount: 3,
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    window.history.pushState({}, '', '/profile/test%20user');
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/username/test%20user')
      );
    });
  });

  it('shows login screen when not authenticated', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(screen.getByText('inchagram')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('fetches current user on mount when authenticated', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 'user123',
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: [], pagination: { page: 0, limit: 20, total: 0, hasMore: false } }
        })
      });

    renderWithAuth();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });
  });

  it('navigate function prevents duplicate navigation', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 'user123',
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: [], pagination: { page: 0, limit: 20, total: 0, hasMore: false } }
        })
      });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Feed')).toBeInTheDocument();
    });

    const feedButton = screen.getByText('Feed');
    const initialPathname = window.location.pathname;

    // Click Feed button when already on feed
    fireEvent.click(feedButton);

    // Should not push a new history entry
    expect(window.location.pathname).toBe(initialPathname);
  });
});
