import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Walrus configuration
const PUBLISHER = process.env.WALRUS_PUBLISHER || 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = process.env.WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space';
const STORAGE_EPOCHS = parseInt(process.env.WALRUS_EPOCHS) || 200; // How long to store
const CACHE_DIR = path.join(__dirname, '../cache/videos');
const MAX_BLOB_SIZE = 10 * 1024 * 1024; // 10MB limit

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Upload a file to Walrus
 * @param {string} filePath - Path to the file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with blobId
 */
export async function uploadToWalrus(filePath, options = {}) {
  try {
    const { epochs = STORAGE_EPOCHS, deletable = true } = options;

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_BLOB_SIZE) {
      throw new Error(`File size ${stats.size} bytes exceeds Walrus limit of ${MAX_BLOB_SIZE} bytes (10MB)`);
    }

    console.log(`📤 Uploading to Walrus: ${path.basename(filePath)} (${stats.size} bytes)`);

    // Read file and upload to Walrus
    const fileStream = fs.createReadStream(filePath);
    const url = `${PUBLISHER}/v1/blobs?epochs=${epochs}&deletable=${deletable}`;

    const response = await axios.put(url, fileStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      maxBodyLength: MAX_BLOB_SIZE,
      maxContentLength: MAX_BLOB_SIZE,
    });

    console.log('✅ Walrus upload response:', JSON.stringify(response.data, null, 2));

    // Extract blob ID from response
    let blobId, blobObjectId, endEpoch, cost;

    if (response.data.newlyCreated) {
      const { blobObject, cost: uploadCost } = response.data.newlyCreated;
      blobId = blobObject.blobId;
      blobObjectId = blobObject.id;
      endEpoch = blobObject.storage.endEpoch;
      cost = uploadCost;
    } else if (response.data.alreadyCertified) {
      const { blobId: existingBlobId, endEpoch: existingEndEpoch } = response.data.alreadyCertified;
      blobId = existingBlobId;
      endEpoch = existingEndEpoch;
      cost = 0; // Already exists, no cost
    } else {
      throw new Error('Unexpected response from Walrus publisher');
    }

    return {
      success: true,
      blobId,
      blobObjectId,
      endEpoch,
      cost,
      size: stats.size,
      url: `${AGGREGATOR}/v1/blobs/${blobId}`,
    };
  } catch (error) {
    console.error('❌ Walrus upload error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw new Error(`Failed to upload to Walrus: ${error.message}`);
  }
}

/**
 * Download a blob from Walrus and cache it locally
 * @param {string} blobId - Walrus blob ID
 * @returns {Promise<string>} - Path to cached file
 */
export async function downloadFromWalrus(blobId) {
  try {
    const cachedPath = getCachePath(blobId);

    // Check if already cached
    if (fs.existsSync(cachedPath)) {
      console.log(`💾 Using cached blob: ${blobId}`);
      return cachedPath;
    }

    console.log(`📥 Downloading from Walrus: ${blobId}`);

    const url = `${AGGREGATOR}/v1/blobs/${blobId}`;
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000, // 30 second timeout
    });

    // Stream to cache file
    const writer = createWriteStream(cachedPath);
    await pipeline(response.data, writer);

    console.log(`✅ Cached blob: ${blobId}`);
    return cachedPath;
  } catch (error) {
    console.error('❌ Walrus download error:', error.message);
    throw new Error(`Failed to download from Walrus: ${error.message}`);
  }
}

/**
 * Get the cache path for a blob ID
 * @param {string} blobId - Walrus blob ID
 * @returns {string} - Path to cache file
 */
export function getCachePath(blobId) {
  // Sanitize blob ID for filename
  const sanitizedId = blobId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(CACHE_DIR, `${sanitizedId}.blob`);
}

/**
 * Check if a blob is cached
 * @param {string} blobId - Walrus blob ID
 * @returns {boolean}
 */
export function isCached(blobId) {
  return fs.existsSync(getCachePath(blobId));
}

/**
 * Stream a blob from cache or download from Walrus
 * @param {string} blobId - Walrus blob ID
 * @param {Object} res - Express response object
 */
export async function streamBlob(blobId, res) {
  try {
    // Download if not cached
    const cachedPath = await downloadFromWalrus(blobId);

    // Get file stats for content length
    const stats = fs.statSync(cachedPath);

    // Set headers
    res.setHeader('Content-Type', 'video/mp4'); // Default to mp4, can be made dynamic
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Create read stream and pipe to response
    const stream = createReadStream(cachedPath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming failed' });
      }
    });
  } catch (error) {
    console.error('Error streaming blob:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}

/**
 * Stream blob with range support (for seeking in videos)
 * @param {string} blobId - Walrus blob ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function streamBlobWithRange(blobId, req, res) {
  try {
    // Download if not cached
    const cachedPath = await downloadFromWalrus(blobId);

    // Get file stats
    const stats = fs.statSync(cachedPath);
    const fileSize = stats.size;

    // Parse range header
    const range = req.headers.range;

    if (range) {
      // Parse range request
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Set partial content headers
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      // Create read stream for range
      const stream = createReadStream(cachedPath, { start, end });
      stream.pipe(res);
    } else {
      // No range, send entire file
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = createReadStream(cachedPath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error streaming blob with range:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}

/**
 * Clear old cache files (LRU - Least Recently Used)
 * @param {number} maxSizeBytes - Maximum cache size in bytes
 */
export async function clearCache(maxSizeBytes = 1024 * 1024 * 1024) {
  // Default 1GB cache
  try {
    const files = fs.readdirSync(CACHE_DIR);
    if (files.length === 0) return;

    // Get file stats with timestamps
    const fileStats = files.map((file) => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: file,
        size: stats.size,
        atime: stats.atime, // Last access time
      };
    });

    // Calculate total size
    const totalSize = fileStats.reduce((sum, file) => sum + file.size, 0);

    if (totalSize <= maxSizeBytes) {
      console.log(`📦 Cache size OK: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      return;
    }

    // Sort by access time (oldest first)
    fileStats.sort((a, b) => a.atime - b.atime);

    let currentSize = totalSize;
    let deletedCount = 0;

    // Delete oldest files until under limit
    for (const file of fileStats) {
      if (currentSize <= maxSizeBytes) break;

      fs.unlinkSync(file.path);
      currentSize -= file.size;
      deletedCount++;
      console.log(`🗑️ Deleted cached file: ${file.name}`);
    }

    console.log(`✅ Cache cleared: ${deletedCount} files deleted, ${(currentSize / 1024 / 1024).toFixed(2)} MB remaining`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Delete a specific blob from cache
 * @param {string} blobId - Walrus blob ID
 */
export function deleteCachedBlob(blobId) {
  const cachedPath = getCachePath(blobId);
  if (fs.existsSync(cachedPath)) {
    fs.unlinkSync(cachedPath);
    console.log(`🗑️ Deleted cached blob: ${blobId}`);
  }
}

// Auto-clear cache every hour
setInterval(() => {
  clearCache();
}, 60 * 60 * 1000); // 1 hour

export default {
  uploadToWalrus,
  downloadFromWalrus,
  streamBlob,
  streamBlobWithRange,
  getCachePath,
  isCached,
  clearCache,
  deleteCachedBlob,
};
