/**
 * ProfilePage Component
 * Displays user profile with stats and info
 * Story: US0010 - Profile Page Routing and Navigation
 * Updated: US0007 - Profile Photo Grid Component
 * Updated: US0008 - Edit Profile API and UI
 * Updated: US0009 - Upload/Update Profile Picture
 * Updated: US0022 - Follow Button Component
 */

import { useEffect, useState } from 'react';
import { PhotoGrid } from '../components/PhotoGrid';
import { EditProfileModal } from '../components/EditProfileModal';
import { FollowButton } from '../components/FollowButton';
import { Footer } from '../components/Footer';
import { apiUrl } from '../config/api';
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
  isFollowing: boolean;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setProfile(null);

      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          apiUrl(`api/v1/users/username/${encodeURIComponent(username)}`),
          { headers }
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

  // Check if viewing own profile
  useEffect(() => {
    const checkOwnProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token || !profile) {
        setIsOwnProfile(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('api/v1/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setIsOwnProfile(data.data.userId === profile.userId);
        }
      } catch (err) {
        console.error('Failed to check current user:', err);
        setIsOwnProfile(false);
      }
    };

    checkOwnProfile();
  }, [profile]);

  const handleEditSuccess = () => {
    // Refetch profile to show updated data
    const token = localStorage.getItem('token');
    if (!token || !profile) return;

    fetch(apiUrl(`api/v1/users/username/${encodeURIComponent(username)}`))
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setProfile(data.data);
        }
      })
      .catch(err => console.error('Failed to refresh profile:', err));
  };

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

              {/* Action Buttons */}
              <div className="profile-actions">
                {/* Edit Profile Button (own profile only) */}
                {isOwnProfile && (
                  <button
                    className="btn btn-secondary btn-sm profile-edit-button"
                    onClick={() => setIsEditModalOpen(true)}
                    data-testid="edit-profile-button"
                  >
                    Edit Profile
                  </button>
                )}

                {/* Follow Button (other profiles only) */}
                {!isOwnProfile && (
                  <FollowButton
                    userId={profile.userId}
                    initialIsFollowing={profile.isFollowing}
                    onFollowChange={(isFollowing) => {
                      // Update follower count optimistically
                      setProfile(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          followerCount: isFollowing
                            ? prev.followerCount + 1
                            : prev.followerCount - 1
                        };
                      });
                    }}
                  />
                )}
              </div>
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

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentDisplayName={profile.displayName}
          currentBio={profile.bio}
          currentProfilePicture={profile.profilePictureUrl}
          userId={profile.userId}
          onSuccess={handleEditSuccess}
        />
      )}

      <Footer />
    </div>
  );
}
