/**
 * EditProfileModal Component
 * Modal for editing user profile (display name and bio)
 * Story: US0008 - Edit Profile API and UI
 */

import { useState, useEffect } from 'react';
import './EditProfileModal.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDisplayName: string | null;
  currentBio: string | null;
  userId: string;
  onSuccess: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentDisplayName,
  currentBio,
  userId,
  onSuccess
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [bio, setBio] = useState(currentBio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentDisplayName || '');
      setBio(currentBio || '');
      setError(null);
    }
  }, [isOpen, currentDisplayName, currentBio]);

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

      if (response.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error?.message || 'Failed to update profile');
      }
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
