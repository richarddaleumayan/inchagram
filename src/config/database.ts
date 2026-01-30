/**
 * MongoDB Database Connection Configuration
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inchagram';

/**
 * Connect to MongoDB database
 * @returns Promise that resolves when connection is established
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection error:', error);
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to', MONGODB_URI);
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});
