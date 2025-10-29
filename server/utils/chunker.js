import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 500 * 1024; // 500KB chunks (good balance for streaming)
const MAX_CHUNKS_PER_QUILT = 666; // Walrus limit

/**
 * Split a video file into chunks
 * @param {string} filePath - Path to the video file
 * @param {number} chunkSize - Size of each chunk in bytes (default 500KB)
 * @returns {Promise<Array>} - Array of chunk objects with buffer and metadata
 */
export async function chunkVideoFile(filePath, chunkSize = CHUNK_SIZE) {
  return new Promise((resolve, reject) => {
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Calculate number of chunks
      const numChunks = Math.ceil(fileSize / chunkSize);

      if (numChunks > MAX_CHUNKS_PER_QUILT) {
        reject(new Error(`File too large: ${numChunks} chunks exceeds Walrus limit of ${MAX_CHUNKS_PER_QUILT}`));
        return;
      }

      console.log(`📦 Chunking file: ${path.basename(filePath)}`);
      console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Chunks: ${numChunks} x ${(chunkSize / 1024).toFixed(0)} KB`);

      const chunks = [];
      const readStream = fs.createReadStream(filePath, {
        highWaterMark: chunkSize,
      });

      let chunkIndex = 0;
      let buffers = [];
      let currentSize = 0;

      readStream.on('data', (chunk) => {
        buffers.push(chunk);
        currentSize += chunk.length;

        // When we have a full chunk or this is the last chunk
        if (currentSize >= chunkSize || chunkIndex === numChunks - 1) {
          const chunkBuffer = Buffer.concat(buffers);

          chunks.push({
            index: chunkIndex,
            buffer: chunkBuffer,
            size: chunkBuffer.length,
            identifier: `chunk-${chunkIndex}`,
          });

          // Reset for next chunk
          buffers = [];
          currentSize = 0;
          chunkIndex++;
        }
      });

      readStream.on('end', () => {
        // Handle any remaining data
        if (buffers.length > 0) {
          const chunkBuffer = Buffer.concat(buffers);
          chunks.push({
            index: chunkIndex,
            buffer: chunkBuffer,
            size: chunkBuffer.length,
            identifier: `chunk-${chunkIndex}`,
          });
        }

        console.log(`✅ Created ${chunks.length} chunks`);
        resolve(chunks);
      });

      readStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Write chunks to temporary files (needed for HTTP multipart upload)
 * @param {Array} chunks - Array of chunk objects
 * @param {string} tempDir - Temporary directory path
 * @returns {Promise<Array>} - Array of chunk file paths
 */
export async function writeChunksToTempFiles(chunks, tempDir) {
  const tempFiles = [];

  for (const chunk of chunks) {
    const tempFilePath = path.join(tempDir, `${chunk.identifier}.tmp`);
    fs.writeFileSync(tempFilePath, chunk.buffer);
    tempFiles.push({
      ...chunk,
      filePath: tempFilePath,
    });
  }

  return tempFiles;
}

/**
 * Clean up temporary chunk files
 * @param {Array} chunkFiles - Array of chunk file objects with filePath
 */
export function cleanupChunkFiles(chunkFiles) {
  for (const chunk of chunkFiles) {
    if (chunk.filePath && fs.existsSync(chunk.filePath)) {
      fs.unlinkSync(chunk.filePath);
    }
  }
}

/**
 * Calculate the chunk index for a given time offset
 * @param {number} timeSeconds - Time offset in seconds
 * @param {number} videoDuration - Total video duration in seconds
 * @param {number} totalChunks - Total number of chunks
 * @returns {number} - Chunk index
 */
export function getChunkIndexForTime(timeSeconds, videoDuration, totalChunks) {
  const percentage = timeSeconds / videoDuration;
  const chunkIndex = Math.floor(percentage * totalChunks);
  return Math.max(0, Math.min(chunkIndex, totalChunks - 1));
}

/**
 * Get time range for a chunk
 * @param {number} chunkIndex - Index of the chunk
 * @param {number} totalChunks - Total number of chunks
 * @param {number} videoDuration - Total video duration in seconds
 * @returns {Object} - Start and end times
 */
export function getChunkTimeRange(chunkIndex, totalChunks, videoDuration) {
  const chunkDuration = videoDuration / totalChunks;
  return {
    startTime: chunkIndex * chunkDuration,
    endTime: Math.min((chunkIndex + 1) * chunkDuration, videoDuration),
    duration: chunkDuration,
  };
}

/**
 * Estimate optimal chunk size based on video duration
 * @param {number} videoDuration - Video duration in seconds
 * @param {number} targetChunks - Target number of chunks (default 20)
 * @returns {number} - Recommended chunk size in bytes
 */
export function estimateOptimalChunkSize(videoDuration, targetChunks = 20) {
  // For short videos (< 60s), use smaller chunks for better granularity
  if (videoDuration < 60) {
    return 256 * 1024; // 256KB
  }

  // For medium videos (60-180s), use 500KB
  if (videoDuration < 180) {
    return 500 * 1024; // 500KB
  }

  // For longer videos, use 1MB
  return 1024 * 1024; // 1MB
}

export default {
  chunkVideoFile,
  writeChunksToTempFiles,
  cleanupChunkFiles,
  getChunkIndexForTime,
  getChunkTimeRange,
  estimateOptimalChunkSize,
  CHUNK_SIZE,
  MAX_CHUNKS_PER_QUILT,
};
