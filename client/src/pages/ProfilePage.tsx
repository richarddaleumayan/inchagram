/**
 * ProfilePage Component
 * Displays user profile with stats and info
 * Story: US0010 - Profile Page Routing and Navigation
 * Updated: US0007 - Profile Photo Grid Component
 */

import { useEffect, useState } from 'react';
import { PhotoGrid } from '../components/PhotoGrid';
import './ProfilePage.css';

interface ProfileData {
  userId: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  followerCount: number;
  followingCount: number;
  photoCount: number;
  createdAt: string;
}

interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: {
    code: string;
    message: string;
  };
}

interface ProfilePageProps {
  username: string;
  onNavigate: (path: string) => void;
}

export function ProfilePage({ username, onNavigate }: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setProfile(null);

      try {
        const response = await fetch(
          `/api/v1/users/username/${encodeURIComponent(username)}`
        );
        const data: ProfileResponse = await response.json();

        if (!isActive) return;

        if (response.ok && data.success && data.data) {
          setProfile(data.data);
        } else {
          setError(data.error?.message || 'Profile not found');
        }
      } catch (err) {
        if (!isActive) return;
        console.error('Profile fetch error:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isActive = false;
    };
  }, [username]);

  return (
    <div className="profile-page">
      {/* Header with navigation */}
      <header className="profile-header">
        <button
          type="button"
          className="profile-back-button"
          onClick={() => onNavigate('/')}
          aria-label="Back to home"
        >
          ← Home
        </button>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="profile-loading" data-testid="profile-loading">
          <div className="profile-spinner" />
          <p>Loading profile...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="profile-error" data-testid="profile-error">
          <div className="profile-error-icon">⚠️</div>
          <h2>Profile not found</h2>
          <p>{error}</p>
          <button onClick={() => onNavigate('/')} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      )}

      {/* Profile Content */}
      {!loading && !error && profile && (
        <div className="profile-content" data-testid="profile-content">
          {/* Profile Card */}
          <div className="profile-card">
            {/* Avatar */}
            <div className="profile-avatar">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={`${profile.username}'s avatar`}
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="profile-info">
              <h1 className="profile-username">{profile.username}</h1>
              {profile.displayName && (
                <p className="profile-display-name">{profile.displayName}</p>
              )}
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </div>

            {/* Stats */}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{profile.photoCount}</span>
                <span className="profile-stat-label">photos</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{profile.followerCount}</span>
                <span className="profile-stat-label">followers</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{profile.followingCount}</span>
                <span className="profile-stat-label">following</span>
              </div>
            </div>
          </div>

          {/* Photo Grid */}
          <PhotoGrid userId={profile.userId} />
        </div>
      )}
    </div>
  );
}
