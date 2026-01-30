/**
 * PhotoUpload Component
 * Allows authenticated users to upload photos with optional captions
 */

import { useState, ChangeEvent, FormEvent } from 'react';
import './PhotoUpload.css';

interface UploadResponse {
  success: boolean;
  data?: {
    photoId: string;
    imageUrl: string;
    caption: string;
    likeCount: number;
    createdAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export function PhotoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(null);

    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2200) {
      setCaption(value);
      setError(null);
    } else {
      setError('Caption cannot exceed 2200 characters.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setError('Please select a photo to upload.');
      return;
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to upload photos.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const response = await fetch('/api/v1/photos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Photo uploaded successfully!');
        setUploadProgress(100);

        // Reset form
        setSelectedFile(null);
        setCaption('');
        setPreview(null);

        // Reset file input
        const fileInput = document.getElementById('photo-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setError(data.error?.message || 'Failed to upload photo. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setCaption('');
    setPreview(null);
    setError(null);
    setSuccess(null);

    const fileInput = document.getElementById('photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="photo-upload-container">
      <h2>Upload Photo</h2>

      <form onSubmit={handleSubmit} className="photo-upload-form">
        {/* File Input */}
        <div className="form-group">
          <label htmlFor="photo-input" className="file-input-label">
            {preview ? 'Change Photo' : 'Select Photo'}
          </label>
          <input
            id="photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="file-input"
          />
          <p className="file-hint">Supported formats: JPEG, PNG, WebP (Max 10MB)</p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="preview-image" />
          </div>
        )}

        {/* Caption Input */}
        <div className="form-group">
          <label htmlFor="caption-input">Caption (optional)</label>
          <textarea
            id="caption-input"
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Write a caption for your photo..."
            disabled={uploading}
            className="caption-input"
            rows={3}
          />
          <p className="caption-counter">
            {caption.length} / 2200 characters
          </p>
        </div>

        {/* Progress Bar */}
        {uploading && uploadProgress > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="button-group">
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="btn btn-primary"
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </form>
    </div>
  );
}
