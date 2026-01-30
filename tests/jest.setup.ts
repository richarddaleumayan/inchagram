/**
 * Jest Setup File
 * Loaded before all tests run
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Ensure JWT_SECRET is set for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-min-32-chars-recommended';
}

// Set AWS credentials for tests (mocked, not real)
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_S3_BUCKET = 'test-bucket';

// Mock uuid module globally
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));
