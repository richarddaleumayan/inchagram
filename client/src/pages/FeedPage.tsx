/**
 * FeedPage Component
 * Main feed page with personalized and discovery tabs
 * Stories: US0026 - Feed Page with Infinite Scroll, US0027 - Empty State
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PhotoCard } from '../components/PhotoCard';
import { EmptyState } from '../components/EmptyState';
import { apiUrl } from '../config/api';
import './FeedPage.css';

type FeedType = 'following' | 'discover';

interface Photo {
  photoId: string;
  imageUrl: string;
  caption: string;
  userId: string;
  username: string;
  profilePictureUrl?: string | null;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface FeedResponse {
  success: boolean;
  data: {
    photos: Photo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

interface FeedPageProps {
  onNavigate?: (path: string) => void;
}

export function FeedPage({ onNavigate }: FeedPageProps) {
  const [activeTab, setActiveTab] = useState<FeedType>('following');
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchFeed = async ({ pageParam = 0 }): Promise<FeedResponse> => {
    const endpoint = activeTab === 'following'
      ? '/api/v1/photos/feed'
      : '/api/v1/photos/discover';

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Send auth token for both tabs so we can show which photos are liked
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      apiUrl(`${endpoint}?page=${pageParam}&limit=20`),
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch feed');
    }

    return response.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['feed', activeTab],
    queryFn: fetchFeed,
    getNextPageParam: (lastPage) => {
      const { page, hasMore } = lastPage.data.pagination;
      return hasMore ? page + 1 : undefined;
    },
    initialPageParam: 0
  });

  // Infinite scroll with Intersection Observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  const allPhotos = data?.pages.flatMap((page) => page.data.photos) || [];
  const isEmptyFeed = !isLoading && allPhotos.length === 0;

  const handleTabChange = (tab: FeedType) => {
    setActiveTab(tab);
  };

  const handleEmptyAction = () => {
    if (activeTab === 'following') {
      setActiveTab('discover');
    } else {
      // Navigate to upload (placeholder for now)
      console.log('Navigate to upload page');
    }
  };

  return (
    <div className="feed-page">
      {/* Tab Navigation */}
      <div className="feed-page__tabs">
        <button
          className={`feed-page__tab ${activeTab === 'following' ? 'feed-page__tab--active' : ''}`}
          onClick={() => handleTabChange('following')}
          aria-label="Following feed"
        >
          Following
        </button>
        <button
          className={`feed-page__tab ${activeTab === 'discover' ? 'feed-page__tab--active' : ''}`}
          onClick={() => handleTabChange('discover')}
          aria-label="Discover feed"
        >
          Discover
        </button>
      </div>

      {/* Feed Content */}
      <div className="feed-page__content">
        {isLoading && (
          <div className="feed-page__loading" data-testid="loading-spinner">
            <div className="feed-page__spinner" />
            <p>Loading feed...</p>
          </div>
        )}

        {isError && (
          <div className="feed-page__error" data-testid="error-message">
            <p>Failed to load feed</p>
            <button onClick={() => refetch()} className="feed-page__retry">
              Retry
            </button>
          </div>
        )}

        {isEmptyFeed && (
          <EmptyState
            type={activeTab === 'following' ? 'no-following' : 'no-photos'}
            onAction={handleEmptyAction}
          />
        )}

        {!isLoading && !isError && allPhotos.length > 0 && (
          <div className="feed-page__photos">
            {allPhotos.map((photo) => (
              <PhotoCard key={photo.photoId} {...photo} onNavigate={onNavigate} />
            ))}

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="feed-page__observer" />

            {/* Loading More Indicator */}
            {isFetchingNextPage && (
              <div className="feed-page__loading-more">
                <div className="feed-page__spinner feed-page__spinner--small" />
                <p>Loading more...</p>
              </div>
            )}

            {/* All Caught Up */}
            {!hasNextPage && allPhotos.length > 0 && (
              <EmptyState type="all-caught-up" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
