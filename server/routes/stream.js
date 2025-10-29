import express from 'express';
import { streamBlobWithRange, isCached } from '../services/walrus.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Stream video from Walrus with range support (for seeking)
 * GET /api/stream/:blobId
 */
router.get('/:blobId', async (req, res, next) => {
  try {
    const { blobId } = req.params;

    if (!blobId) {
      throw new AppError('Blob ID is required', 400);
    }

    console.log(`🎬 Streaming blob: ${blobId} ${isCached(blobId) ? '(cached)' : '(downloading)'}`);

    // Stream with range support for video seeking
    await streamBlobWithRange(blobId, req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * Get blob info
 * GET /api/stream/:blobId/info
 */
router.get('/:blobId/info', async (req, res, next) => {
  try {
    const { blobId } = req.params;

    if (!blobId) {
      throw new AppError('Blob ID is required', 400);
    }

    const cached = isCached(blobId);

    res.json({
      blobId,
      cached,
      streamUrl: `/api/stream/${blobId}`,
      walrusUrl: `${process.env.WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space'}/v1/blobs/${blobId}`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
