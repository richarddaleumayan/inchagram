/**
 * PhotoGrid Component
 * Displays user's photos in a responsive grid with infinite scroll
 * Story: US0007 - Profile Photo Grid Component
 */

import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import './PhotoGrid.css';

interface Photo {
  photoId: string;
  imageUrl: string;
  caption: string;
  likeCount: number;
  createdAt: string;
}

interface PhotoGridResponse {
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

interface PhotoGridProps {
  userId: string;
  onPhotoClick?: (photoId: string) => void;
}

export function PhotoGrid({ userId, onPhotoClick }: PhotoGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPhotos = async ({ pageParam = 0 }): Promise<PhotoGridResponse> => {
    const response = await fetch(
      `/api/v1/users/${userId}/photos?page=${pageParam}&limit=20`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch photos');
    }

    return response.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['userPhotos', userId],
    queryFn: fetchPhotos,
    getNextPageParam: (lastPage) => {
      const { page, hasMore } = lastPage.data.pagination;
      return hasMore ? page + 1 : undefined;
    },
    initialPageParam: 0,
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
      threshold: 0.1,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  const allPhotos = data?.pages.flatMap((page) => page.data.photos) || [];
  const isEmpty = !isLoading && allPhotos.length === 0;

  const handlePhotoClick = (photoId: string) => {
    if (onPhotoClick) {
      onPhotoClick(photoId);
    } else {
      console.log('Photo clicked:', photoId);
    }
  };

  return (
    <div className="photo-grid">
      {/* Loading State */}
      {isLoading && (
        <div className="photo-grid__loading" data-testid="photo-grid-loading">
          <div className="photo-grid__spinner" />
          <p>Loading photos...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="photo-grid__error" data-testid="photo-grid-error">
          <p>Failed to load photos</p>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="photo-grid__empty" data-testid="photo-grid-empty">
          <div className="photo-grid__empty-icon">📷</div>
          <p className="photo-grid__empty-text">No photos yet</p>
        </div>
      )}

      {/* Photo Grid */}
      {!isLoading && !isError && allPhotos.length > 0 && (
        <>
          <div className="photo-grid__container" data-testid="photo-grid-container">
            {allPhotos.map((photo) => (
              <button
                key={photo.photoId}
                className="photo-grid__item"
                onClick={() => handlePhotoClick(photo.photoId)}
                aria-label={`View photo: ${photo.caption || 'Untitled'}`}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || 'Photo'}
                  className="photo-grid__image"
                  loading="lazy"
                />
                <div className="photo-grid__overlay">
                  <span className="photo-grid__likes">
                    ❤️ {photo.likeCount}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="photo-grid__observer" />

          {/* Loading More Indicator */}
          {isFetchingNextPage && (
            <div className="photo-grid__loading-more">
              <div className="photo-grid__spinner photo-grid__spinner--small" />
              <p>Loading more...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
