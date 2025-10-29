import express from 'express';
import fs from 'fs';
import { downloadQuiltPatch, isCached } from '../services/walrus.js';
import { AppError } from '../middleware/errorHandler.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Stream chunked video from Quilt
 * This endpoint handles progressive chunk downloading
 * GET /api/stream/quilt/:dramaId
 * GET /api/stream/quilt/:dramaId/:chunkIndex
 */
router.get('/:dramaId/:chunkIndex?', async (req, res, next) => {
  try {
    const { dramaId, chunkIndex } = req.params;

    if (!dramaId) {
      throw new AppError('Drama ID is required', 400);
    }

    // Get drama chunks from database
    const chunksResult = await pool.query(
      `SELECT * FROM drama_chunks
       WHERE drama_id = $1
       ORDER BY chunk_index`,
      [dramaId]
    );

    if (chunksResult.rows.length === 0) {
      throw new AppError('No chunks found for this drama', 404);
    }

    const chunks = chunksResult.rows;
    const targetIndex = chunkIndex ? parseInt(chunkIndex) : 0;

    // Validate chunk index
    if (targetIndex < 0 || targetIndex >= chunks.length) {
      throw new AppError(`Invalid chunk index. Valid range: 0-${chunks.length - 1}`, 400);
    }

    const chunk = chunks[targetIndex];

    console.log(
      `🎬 Streaming chunk ${targetIndex}/${chunks.length - 1} for drama ${dramaId} ${
        isCached(chunk.quilt_patch_id) ? '(cached)' : '(downloading)'
      }`
    );

    // Download chunk if not cached
    const cachedPath = await downloadQuiltPatch(chunk.quilt_patch_id);

    // Get file stats
    const stats = fs.statSync(cachedPath);

    // Set headers
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('X-Chunk-Index', targetIndex);
    res.setHeader('X-Total-Chunks', chunks.length);
    res.setHeader('X-Chunk-Duration', chunk.duration || 0);

    // Stream the chunk
    const stream = fs.createReadStream(cachedPath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming failed' });
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get chunk manifest for a drama
 * GET /api/stream/quilt/:dramaId/manifest
 */
router.get('/:dramaId/manifest', async (req, res, next) => {
  try {
    const { dramaId } = req.params;

    const chunksResult = await pool.query(
      `SELECT
        chunk_index,
        quilt_patch_id,
        chunk_size,
        start_time,
        end_time,
        duration
       FROM drama_chunks
       WHERE drama_id = $1
       ORDER BY chunk_index`,
      [dramaId]
    );

    if (chunksResult.rows.length === 0) {
      throw new AppError('No chunks found for this drama', 404);
    }

    res.json({
      dramaId,
      totalChunks: chunksResult.rows.length,
      chunks: chunksResult.rows.map((chunk) => ({
        index: chunk.chunk_index,
        patchId: chunk.quilt_patch_id,
        size: chunk.chunk_size,
        startTime: chunk.start_time,
        endTime: chunk.end_time,
        duration: chunk.duration,
        streamUrl: `/api/stream/quilt/${dramaId}/${chunk.chunk_index}`,
        cached: isCached(chunk.quilt_patch_id),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-fetch multiple chunks (for progressive loading)
 * POST /api/stream/quilt/:dramaId/prefetch
 * Body: { chunkIndexes: [0, 1, 2] }
 */
router.post('/:dramaId/prefetch', async (req, res, next) => {
  try {
    const { dramaId } = req.params;
    const { chunkIndexes } = req.body;

    if (!Array.isArray(chunkIndexes) || chunkIndexes.length === 0) {
      throw new AppError('chunkIndexes array is required', 400);
    }

    // Get chunks from database
    const chunksResult = await pool.query(
      `SELECT * FROM drama_chunks
       WHERE drama_id = $1 AND chunk_index = ANY($2)
       ORDER BY chunk_index`,
      [dramaId, chunkIndexes]
    );

    if (chunksResult.rows.length === 0) {
      throw new AppError('No chunks found', 404);
    }

    // Download chunks in background (don't wait)
    const downloadPromises = chunksResult.rows.map(async (chunk) => {
      try {
        if (!isCached(chunk.quilt_patch_id)) {
          console.log(`🔄 Pre-fetching chunk ${chunk.chunk_index}`);
          await downloadQuiltPatch(chunk.quilt_patch_id);
        }
        return { index: chunk.chunk_index, cached: true };
      } catch (error) {
        console.error(`Failed to pre-fetch chunk ${chunk.chunk_index}:`, error);
        return { index: chunk.chunk_index, cached: false, error: error.message };
      }
    });

    const results = await Promise.all(downloadPromises);

    res.json({
      message: 'Pre-fetch completed',
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
