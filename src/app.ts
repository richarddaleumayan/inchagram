/**
 * Express Application Setup
 * Configures Express app with middleware and routes
 */

import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import photoRoutes from './routes/photos';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/photos', photoRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
