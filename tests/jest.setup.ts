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
