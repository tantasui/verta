import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import dramaRoutes from './routes/dramas.js';
import userRoutes from './routes/users.js';
import playlistRoutes from './routes/playlists.js';
import commentRoutes from './routes/comments.js';
import reactionRoutes from './routes/reactions.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import streamRoutes from './routes/stream.js';
import streamQuiltRoutes from './routes/stream-quilt.js';

// Import config
import pool from './config/database.js';
import redisClient from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');

    // Check Redis
    await redisClient.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dramas', dramaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/stream/quilt', streamQuiltRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║   🎬 ReelShort API Server Started       ║
║                                          ║
║   Port: ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   API URL: http://localhost:${PORT}     ║
║                                          ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  await redisClient.quit();
  process.exit(0);
});

export default app;
