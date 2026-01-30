/**
 * Test Environment Setup
 * Provides database connection and cleanup utilities for integration tests
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

/**
 * Connect to in-memory MongoDB instance for testing
 */
export async function connectDatabase(): Promise<void> {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect mongoose
    await mongoose.connect(mongoUri);
    console.log('✓ Test database connected');
  } catch (error) {
    console.error('Failed to connect test database:', error);
    throw error;
  }
}

/**
 * Clear all collections in the database
 * Call this in beforeEach() to ensure clean state
 */
export async function clearDatabase(): Promise<void> {
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established');
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Close database connection and stop MongoDB server
 * Call this in afterAll()
 */
export async function closeDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✓ Test database disconnected');
  } catch (error) {
    console.error('Failed to close test database:', error);
    throw error;
  }
}
