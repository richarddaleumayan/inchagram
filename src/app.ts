/**
 * Express Application Setup
 * Configures Express app with middleware and routes
 */

import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import photoRoutes from './routes/photos';
import commentRoutes from './routes/comments';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static assets for emails
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/photos', photoRoutes);
app.use('/api/v1', commentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
