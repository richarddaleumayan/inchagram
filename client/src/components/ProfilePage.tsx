/**
 * ProfilePage Component
 * Displays public profile data for a username
 */

import { useEffect, useState } from 'react';
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
    setLoading(true);
    setError(null);
    setProfile(null);

    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/v1/users/username/${encodeURIComponent(username)}`);
        const data: ProfileResponse = await response.json();

        if (!isActive) {
          return;
        }

        if (response.ok && data.success && data.data) {
          setProfile(data.data);
        } else {
          setError(data.error?.message || 'Profile not found.');
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        console.error('Profile load error:', err);
        setError('Unable to load profile. Please try again.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [username]);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-header-left">
          <button
            type="button"
            className="profile-link"
            onClick={() => onNavigate('/')}
          >
            Home
          </button>
        </div>
      </div>

      {loading && <p className="profile-status">Loading profile...</p>}

      {!loading && error && (
        <div className="profile-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && profile && (
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={`${profile.username} avatar`}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-details">
            <h2>{profile.username}</h2>
            <p className="profile-display-name">
              {profile.displayName || profile.username}
            </p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-stats">
              <div>
                <span className="profile-stat-value">{profile.photoCount}</span>
                <span className="profile-stat-label">photos</span>
              </div>
              <div>
                <span className="profile-stat-value">{profile.followerCount}</span>
                <span className="profile-stat-label">followers</span>
              </div>
              <div>
                <span className="profile-stat-value">{profile.followingCount}</span>
                <span className="profile-stat-label">following</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
