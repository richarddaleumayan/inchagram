/**
 * EditProfileModal Component
 * Modal for editing user profile (display name, bio, profile picture)
 * Story: US0008 - Edit Profile API and UI
 * Updated: US0009 - Upload/Update Profile Picture
 */

import { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../config/api';
import './EditProfileModal.css';
import { apiUrl } from '../config/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDisplayName: string | null;
  currentBio: string | null;
  currentProfilePicture: string | null;
  userId: string;
  onSuccess: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentDisplayName,
  currentBio,
  currentProfilePicture,
  userId,
  onSuccess
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [bio, setBio] = useState(currentBio || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentProfilePicture);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentDisplayName || '');
      setBio(currentBio || '');
      setProfilePicture(null);
      setPreviewUrl(currentProfilePicture);
      setError(null);
    }
  }, [isOpen, currentDisplayName, currentBio, currentProfilePicture]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setProfilePicture(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      // Update text fields (display name and bio)
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Failed to update profile');
        setSaving(false);
        return;
      }

      // Upload profile picture if one was selected
      if (profilePicture) {
        const formData = new FormData();
        formData.append('profilePicture', profilePicture);

        const pictureResponse = await fetch(`/api/v1/users/${userId}/profile-picture`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const pictureData = await pictureResponse.json();

        if (!pictureResponse.ok || !pictureData.success) {
          setError(pictureData.error?.message || 'Failed to upload profile picture');
          setSaving(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayNameLength = displayName.length;
  const bioLength = bio.length;
  const isDisplayNameTooLong = displayNameLength > 50;
  const isBioTooLong = bioLength > 150;
  const isValid = !isDisplayNameTooLong && !isBioTooLong;

  return (
    <div className="edit-profile-modal" data-testid="edit-profile-modal">
      <div className="edit-profile-modal__overlay" onClick={onClose} />
      <div className="edit-profile-modal__content">
        <header className="edit-profile-modal__header">
          <h2>Edit Profile</h2>
          <button
            className="edit-profile-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form className="edit-profile-modal__form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Profile Picture */}
          <div className="edit-profile-modal__field edit-profile-modal__picture-field">
            <label className="edit-profile-modal__label">Profile Picture</label>
            <div className="edit-profile-modal__picture-container">
              <div className="edit-profile-modal__picture-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile preview" />
                ) : (
                  <div className="edit-profile-modal__picture-placeholder">
                    📷
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            <p className="edit-profile-modal__hint">JPEG, PNG, or WebP. Max 10MB.</p>
          </div>

          {/* Display Name */}
          <div className="edit-profile-modal__field">
            <label htmlFor="displayName" className="edit-profile-modal__label">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              className={`edit-profile-modal__input ${isDisplayNameTooLong ? 'edit-profile-modal__input--error' : ''}`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={60}
              disabled={saving}
            />
            <div className={`edit-profile-modal__char-count ${isDisplayNameTooLong ? 'edit-profile-modal__char-count--error' : ''}`}>
              {displayNameLength}/50
            </div>
          </div>

          {/* Bio */}
          <div className="edit-profile-modal__field">
            <label htmlFor="bio" className="edit-profile-modal__label">
              Bio
            </label>
            <textarea
              id="bio"
              className={`edit-profile-modal__textarea ${isBioTooLong ? 'edit-profile-modal__textarea--error' : ''}`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
              maxLength={160}
              disabled={saving}
            />
            <div className={`edit-profile-modal__char-count ${isBioTooLong ? 'edit-profile-modal__char-count--error' : ''}`}>
              {bioLength}/150
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="edit-profile-modal__error" data-testid="edit-profile-error">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="edit-profile-modal__actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !isValid}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
