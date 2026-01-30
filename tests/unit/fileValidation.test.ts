/**
 * Unit Tests: File Validation
 * Test Spec: TS0013
 * Story: US0013 - File Validation (Type, Size, Format)
 *
 * These tests verify file validation for photo uploads:
 * - AC1: Validate file MIME type (JPEG, PNG, WebP only)
 * - AC2: Validate file extension
 * - AC3: Validate file size (max 10MB)
 * - AC4: Combined validation for photo files
 * - AC5: Reject invalid file types (videos, GIFs, etc.)
 */

import {
  validateFileType,
  validateFileExtension,
  validateFileSize,
  validatePhotoFile,
  getExtensionFromMimeType,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  FileInfo
} from '../../src/utils/validation';

describe('File Validation (US0013)', () => {
  // ============================================
  // validateFileType Tests
  // ============================================
  describe('validateFileType', () => {
    // TC001: Valid JPEG MIME type
    describe('TC001: Valid JPEG MIME type', () => {
      it('should accept image/jpeg', () => {
        const result = validateFileType('image/jpeg');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    // TC002: Valid PNG MIME type
    describe('TC002: Valid PNG MIME type', () => {
      it('should accept image/png', () => {
        const result = validateFileType('image/png');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    // TC003: Valid WebP MIME type
    describe('TC003: Valid WebP MIME type', () => {
      it('should accept image/webp', () => {
        const result = validateFileType('image/webp');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    // TC004: Case-insensitive MIME type
    describe('TC004: Case-insensitive MIME type', () => {
      it('should accept uppercase MIME type', () => {
        const result = validateFileType('IMAGE/JPEG');
        expect(result.isValid).toBe(true);
      });

      it('should accept mixed case MIME type', () => {
        const result = validateFileType('Image/Png');
        expect(result.isValid).toBe(true);
      });
    });

    // TC005: Reject GIF
    describe('TC005: Reject GIF', () => {
      it('should reject image/gif', () => {
        const result = validateFileType('image/gif');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC006: Reject video types
    describe('TC006: Reject video types', () => {
      it('should reject video/mp4', () => {
        const result = validateFileType('video/mp4');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });

      it('should reject video/quicktime', () => {
        const result = validateFileType('video/quicktime');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });

      it('should reject video/webm', () => {
        const result = validateFileType('video/webm');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC007: Reject BMP
    describe('TC007: Reject BMP', () => {
      it('should reject image/bmp', () => {
        const result = validateFileType('image/bmp');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC008: Reject TIFF
    describe('TC008: Reject TIFF', () => {
      it('should reject image/tiff', () => {
        const result = validateFileType('image/tiff');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC009: Reject SVG
    describe('TC009: Reject SVG', () => {
      it('should reject image/svg+xml', () => {
        const result = validateFileType('image/svg+xml');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC010: Missing MIME type
    describe('TC010: Missing MIME type', () => {
      it('should reject undefined MIME type', () => {
        const result = validateFileType(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File type is required');
        expect(result.code).toBe('MISSING_FILE');
      });

      it('should reject empty string MIME type', () => {
        const result = validateFileType('');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_FILE');
      });
    });

    // TC011: Reject non-image types
    describe('TC011: Reject non-image types', () => {
      it('should reject application/pdf', () => {
        const result = validateFileType('application/pdf');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });

      it('should reject text/plain', () => {
        const result = validateFileType('text/plain');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });

      it('should reject application/javascript', () => {
        const result = validateFileType('application/javascript');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });
  });

  // ============================================
  // validateFileExtension Tests
  // ============================================
  describe('validateFileExtension', () => {
    // TC012: Valid extensions
    describe('TC012: Valid extensions', () => {
      it('should accept .jpg extension', () => {
        const result = validateFileExtension('photo.jpg');
        expect(result.isValid).toBe(true);
      });

      it('should accept .jpeg extension', () => {
        const result = validateFileExtension('photo.jpeg');
        expect(result.isValid).toBe(true);
      });

      it('should accept .png extension', () => {
        const result = validateFileExtension('photo.png');
        expect(result.isValid).toBe(true);
      });

      it('should accept .webp extension', () => {
        const result = validateFileExtension('photo.webp');
        expect(result.isValid).toBe(true);
      });
    });

    // TC013: Case-insensitive extensions
    describe('TC013: Case-insensitive extensions', () => {
      it('should accept uppercase .JPG', () => {
        const result = validateFileExtension('PHOTO.JPG');
        expect(result.isValid).toBe(true);
      });

      it('should accept mixed case .Png', () => {
        const result = validateFileExtension('Photo.Png');
        expect(result.isValid).toBe(true);
      });
    });

    // TC014: Reject invalid extensions
    describe('TC014: Reject invalid extensions', () => {
      it('should reject .gif extension', () => {
        const result = validateFileExtension('photo.gif');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed');
        expect(result.code).toBe('INVALID_TYPE');
      });

      it('should reject .mp4 extension', () => {
        const result = validateFileExtension('video.mp4');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });

      it('should reject .bmp extension', () => {
        const result = validateFileExtension('photo.bmp');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC015: Missing extension
    describe('TC015: Missing extension', () => {
      it('should reject filename without extension', () => {
        const result = validateFileExtension('photofile');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File must have a valid extension');
        expect(result.code).toBe('INVALID_TYPE');
      });

      it('should reject undefined filename', () => {
        const result = validateFileExtension(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Filename is required');
        expect(result.code).toBe('MISSING_FILE');
      });

      it('should reject empty filename', () => {
        const result = validateFileExtension('');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_FILE');
      });
    });

    // TC016: Filenames with multiple dots
    describe('TC016: Filenames with multiple dots', () => {
      it('should validate extension from last dot', () => {
        const result = validateFileExtension('my.photo.file.jpg');
        expect(result.isValid).toBe(true);
      });

      it('should reject if last extension is invalid', () => {
        const result = validateFileExtension('photo.jpg.gif');
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });
  });

  // ============================================
  // validateFileSize Tests
  // ============================================
  describe('validateFileSize', () => {
    // TC017: Valid file sizes
    describe('TC017: Valid file sizes', () => {
      it('should accept 1 byte file', () => {
        const result = validateFileSize(1);
        expect(result.isValid).toBe(true);
      });

      it('should accept 1KB file', () => {
        const result = validateFileSize(1024);
        expect(result.isValid).toBe(true);
      });

      it('should accept 1MB file', () => {
        const result = validateFileSize(1024 * 1024);
        expect(result.isValid).toBe(true);
      });

      it('should accept 5MB file', () => {
        const result = validateFileSize(5 * 1024 * 1024);
        expect(result.isValid).toBe(true);
      });

      it('should accept exactly 10MB file', () => {
        const result = validateFileSize(10 * 1024 * 1024);
        expect(result.isValid).toBe(true);
      });
    });

    // TC018: Reject files exceeding 10MB
    describe('TC018: Reject files exceeding 10MB', () => {
      it('should reject 10MB + 1 byte file', () => {
        const result = validateFileSize(10 * 1024 * 1024 + 1);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File size exceeds 10MB limit');
        expect(result.code).toBe('INVALID_SIZE');
      });

      it('should reject 15MB file', () => {
        const result = validateFileSize(15 * 1024 * 1024);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_SIZE');
      });

      it('should reject 100MB file', () => {
        const result = validateFileSize(100 * 1024 * 1024);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_SIZE');
      });
    });

    // TC019: Invalid size values
    describe('TC019: Invalid size values', () => {
      it('should reject zero size', () => {
        const result = validateFileSize(0);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File cannot be empty');
        expect(result.code).toBe('INVALID_SIZE');
      });

      it('should reject negative size', () => {
        const result = validateFileSize(-100);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_SIZE');
      });

      it('should reject undefined size', () => {
        const result = validateFileSize(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File size is required');
        expect(result.code).toBe('MISSING_FILE');
      });

      it('should reject NaN', () => {
        const result = validateFileSize(NaN);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File size must be a valid number');
        expect(result.code).toBe('INVALID_SIZE');
      });
    });

    // TC020: Custom max size
    describe('TC020: Custom max size', () => {
      it('should accept custom max size', () => {
        const customMax = 5 * 1024 * 1024; // 5MB
        const result = validateFileSize(5 * 1024 * 1024, customMax);
        expect(result.isValid).toBe(true);
      });

      it('should reject file exceeding custom max size', () => {
        const customMax = 5 * 1024 * 1024; // 5MB
        const result = validateFileSize(6 * 1024 * 1024, customMax);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File size exceeds 5MB limit');
      });
    });
  });

  // ============================================
  // validatePhotoFile Tests (Combined)
  // ============================================
  describe('validatePhotoFile', () => {
    // TC021: Valid photo file
    describe('TC021: Valid photo file', () => {
      it('should accept valid JPEG file', () => {
        const file: FileInfo = {
          mimeType: 'image/jpeg',
          filename: 'photo.jpg',
          size: 5 * 1024 * 1024
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should accept valid PNG file', () => {
        const file: FileInfo = {
          mimeType: 'image/png',
          filename: 'photo.png',
          size: 2 * 1024 * 1024
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should accept valid WebP file', () => {
        const file: FileInfo = {
          mimeType: 'image/webp',
          filename: 'photo.webp',
          size: 1024 * 1024
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    // TC022: Missing file info
    describe('TC022: Missing file info', () => {
      it('should reject null file', () => {
        const result = validatePhotoFile(null as unknown as FileInfo);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File is required');
        expect(result.code).toBe('MISSING_FILE');
      });

      it('should reject undefined file', () => {
        const result = validatePhotoFile(undefined as unknown as FileInfo);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_FILE');
      });
    });

    // TC023: Invalid MIME type in combined validation
    describe('TC023: Invalid MIME type in combined validation', () => {
      it('should reject file with invalid MIME type', () => {
        const file: FileInfo = {
          mimeType: 'video/mp4',
          filename: 'video.mp4',
          size: 5 * 1024 * 1024
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC024: Invalid extension in combined validation
    describe('TC024: Invalid extension in combined validation', () => {
      it('should reject file with mismatched extension', () => {
        const file: FileInfo = {
          mimeType: 'image/jpeg',
          filename: 'photo.gif', // MIME says JPEG but extension is GIF
          size: 5 * 1024 * 1024
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_TYPE');
      });
    });

    // TC025: Invalid size in combined validation
    describe('TC025: Invalid size in combined validation', () => {
      it('should reject file exceeding size limit', () => {
        const file: FileInfo = {
          mimeType: 'image/jpeg',
          filename: 'photo.jpg',
          size: 15 * 1024 * 1024 // 15MB
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('INVALID_SIZE');
      });
    });

    // TC026: Missing fields in file info
    describe('TC026: Missing fields in file info', () => {
      it('should reject missing mimeType', () => {
        const file: FileInfo = {
          filename: 'photo.jpg',
          size: 5 * 1024 * 1024
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_FILE');
      });

      it('should reject missing filename', () => {
        const file: FileInfo = {
          mimeType: 'image/jpeg',
          size: 5 * 1024 * 1024
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_FILE');
      });

      it('should reject missing size', () => {
        const file: FileInfo = {
          mimeType: 'image/jpeg',
          filename: 'photo.jpg'
        };
        const result = validatePhotoFile(file);
        expect(result.isValid).toBe(false);
        expect(result.code).toBe('MISSING_FILE');
      });
    });
  });

  // ============================================
  // getExtensionFromMimeType Tests
  // ============================================
  describe('getExtensionFromMimeType', () => {
    // TC027: Get extension from MIME type
    describe('TC027: Get extension from MIME type', () => {
      it('should return .jpg for image/jpeg', () => {
        expect(getExtensionFromMimeType('image/jpeg')).toBe('.jpg');
      });

      it('should return .png for image/png', () => {
        expect(getExtensionFromMimeType('image/png')).toBe('.png');
      });

      it('should return .webp for image/webp', () => {
        expect(getExtensionFromMimeType('image/webp')).toBe('.webp');
      });

      it('should return null for unknown MIME type', () => {
        expect(getExtensionFromMimeType('video/mp4')).toBeNull();
      });

      it('should handle case-insensitive MIME type', () => {
        expect(getExtensionFromMimeType('IMAGE/JPEG')).toBe('.jpg');
      });
    });
  });

  // ============================================
  // Constants Tests
  // ============================================
  describe('Constants', () => {
    // TC028: Verify constants
    describe('TC028: Verify constants', () => {
      it('should have correct allowed MIME types', () => {
        expect(ALLOWED_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
      });

      it('should have correct allowed extensions', () => {
        expect(ALLOWED_EXTENSIONS).toEqual(['.jpg', '.jpeg', '.png', '.webp']);
      });

      it('should have correct max file size (10MB)', () => {
        expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
      });
    });
  });
});
