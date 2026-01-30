/**
 * S3 Service
 * Handles photo uploads to AWS S3
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getExtensionFromMimeType } from '../utils/validation';

/**
 * S3 Client configuration
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * S3 bucket name from environment
 */
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'inchagram-photos-dev';

/**
 * Upload result
 */
export interface S3UploadResult {
  success: boolean;
  imageUrl?: string;
  key?: string;
  error?: string;
}

/**
 * Generate S3 key for photo
 * Format: photos/{userId}/{timestamp}-{uuid}.{ext}
 * @param userId User ID
 * @param mimeType File MIME type
 * @returns S3 key string
 */
export function generateS3Key(userId: string, mimeType: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = getExtensionFromMimeType(mimeType) || '.jpg';

  return `photos/${userId}/${timestamp}-${uuid}${extension}`;
}

/**
 * Upload photo to S3
 * @param buffer File buffer
 * @param key S3 key
 * @param mimeType File MIME type
 * @returns Upload result with S3 URL
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<S3UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Generate public URL
    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      success: true,
      imageUrl,
      key,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload to S3',
    };
  }
}

/**
 * Delete photo from S3
 * @param key S3 key
 * @returns Success boolean
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
}

/**
 * Extract S3 key from full URL
 * @param imageUrl Full S3 URL
 * @returns S3 key or null if invalid URL
 */
export function extractS3Key(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    // Remove leading slash
    return url.pathname.substring(1);
  } catch {
    return null;
  }
}
