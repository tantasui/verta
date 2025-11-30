import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface ChunkResult {
  chunks: string[];
  thumbnail: string;
  totalDuration: number;
}

/**
 * Chunk a video into 5-second segments at 720p, 30fps
 * @param inputPath Path to the input video file
 * @param outputDir Directory to store the chunks
 * @returns Array of chunk file paths and thumbnail path
 */
export async function chunkVideo(
  inputPath: string,
  outputDir: string
): Promise<ChunkResult> {
  const sessionId = uuidv4();
  const sessionDir = path.join(outputDir, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });

  const chunks: string[] = [];
  const thumbnailPath = path.join(sessionDir, 'thumbnail.jpg');

  // Get video duration first
  const duration = await getVideoDuration(inputPath);

  // Extract thumbnail from first frame
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        filename: 'thumbnail.jpg',
        folder: sessionDir,
        size: '720x?'
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });

  // Chunk video into 5-second segments
  const chunkDuration = 5; // seconds
  const numChunks = Math.ceil(duration / chunkDuration);

  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDuration;
    const chunkPath = path.join(sessionDir, `chunk_${i}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(chunkDuration)
        .outputOptions([
          '-c:v libx264',           // H.264 codec
          '-preset fast',            // Encoding speed
          '-crf 23',                 // Quality (lower = better, 18-28 range)
          '-vf scale=-2:720',        // Scale to 720p height, maintain aspect ratio
          '-r 30',                   // 30 fps
          '-c:a aac',                // AAC audio codec
          '-b:a 128k',               // Audio bitrate
          '-movflags +faststart'     // Enable streaming
        ])
        .output(chunkPath)
        .on('end', () => {
          chunks.push(chunkPath);
          resolve();
        })
        .on('error', (err) => reject(err))
        .run();
    });
  }

  return {
    chunks,
    thumbnail: thumbnailPath,
    totalDuration: duration
  };
}

/**
 * Get the duration of a video file in seconds
 */
function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

/**
 * Clean up temporary files
 */
export async function cleanupChunks(chunks: string[], thumbnail: string): Promise<void> {
  try {
    // Delete all chunks
    await Promise.all(chunks.map(chunk => fs.unlink(chunk)));

    // Delete thumbnail
    await fs.unlink(thumbnail);

    // Delete the session directory if it's empty
    const sessionDir = path.dirname(chunks[0]);
    try {
      await fs.rmdir(sessionDir);
    } catch (err) {
      // Directory might not be empty, ignore
    }
  } catch (err) {
    console.error('Error cleaning up chunks:', err);
  }
}
