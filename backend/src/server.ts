import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  generateMasterManifest,
  generateMediaPlaylist,
  streamChunk,
  getCacheStats
} from './streaming.js';
import {
  fetchVideoMetadata,
  fetchAllVideos,
  incrementViews
} from './metadata.js';

const app = new Hono();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use('/*', cors());

/**
 * GET /v1/videos/:videoId/metadata
 * Fetch video metadata from Sui
 */
app.get('/v1/videos/:videoId/metadata', async (c) => {
  try {
    const videoId = c.req.param('videoId');
    const metadata = await fetchVideoMetadata(videoId);

    return c.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return c.json(
      { error: 'Failed to fetch video metadata' },
      500
    );
  }
});

/**
 * GET /v1/videos
 * Fetch all videos (for feed)
 */
app.get('/v1/videos', async (c) => {
  try {
    const videos = await fetchAllVideos();
    return c.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return c.json(
      { error: 'Failed to fetch videos' },
      500
    );
  }
});

/**
 * GET /v1/videos/:videoId/manifest.m3u8
 * Generate HLS master manifest
 */
app.get('/v1/videos/:videoId/manifest.m3u8', async (c) => {
  try {
    const videoId = c.req.param('videoId');
    const manifest = generateMasterManifest(videoId);

    c.header('Content-Type', 'application/vnd.apple.mpegurl');
    c.header('Cache-Control', 'public, max-age=3600');

    return c.text(manifest);
  } catch (error) {
    console.error('Error generating manifest:', error);
    return c.text('Failed to generate manifest', 500);
  }
});

/**
 * GET /v1/videos/:videoId/playlist.m3u8
 * Generate HLS media playlist
 */
app.get('/v1/videos/:videoId/playlist.m3u8', async (c) => {
  try {
    const videoId = c.req.param('videoId');

    // Get the base URL from the request
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const host = c.req.header('host') || `localhost:${PORT}`;
    const baseUrl = `${protocol}://${host}`;

    const playlist = await generateMediaPlaylist(videoId, baseUrl);

    c.header('Content-Type', 'application/vnd.apple.mpegurl');
    c.header('Cache-Control', 'public, max-age=60');

    return c.text(playlist);
  } catch (error) {
    console.error('Error generating playlist:', error);
    return c.text('Failed to generate playlist', 500);
  }
});

/**
 * GET /v1/videos/:videoId/stream/:sequence
 * Stream a video chunk
 */
app.get('/v1/videos/:videoId/stream/:sequence', async (c) => {
  try {
    const videoId = c.req.param('videoId');
    const sequence = parseInt(c.req.param('sequence'), 10);

    if (isNaN(sequence)) {
      return c.text('Invalid sequence number', 400);
    }

    const chunkData = await streamChunk(videoId, sequence);

    // Increment view count on first chunk
    if (sequence === 0) {
      incrementViews(videoId).catch(err => {
        console.error('Failed to increment views:', err);
      });
    }

    c.header('Content-Type', 'video/mp4');
    c.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    c.header('Accept-Ranges', 'bytes');

    return c.body(chunkData);
  } catch (error) {
    console.error('Error streaming chunk:', error);
    return c.text('Failed to stream chunk', 500);
  }
});

/**
 * GET /v1/cache/stats
 * Get cache statistics
 */
app.get('/v1/cache/stats', (c) => {
  const stats = getCacheStats();
  return c.json(stats);
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'verta-aggregator',
    timestamp: new Date().toISOString()
  });
});

// Start server
console.log(`🎬 Verta Streaming Aggregator starting on port ${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`✅ Server running at http://localhost:${info.port}`);
  console.log(`📊 Cache stats: /v1/cache/stats`);
  console.log(`❤️  Health check: /health`);
});
