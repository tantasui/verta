import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { chunkVideo, cleanupChunks } from './chunker.js';
import { uploadVideoToWalrus } from './uploader.js';

const app = express();
const PORT = process.env.PORT || 3002;
const TEMP_DIR = process.env.TEMP_DIR || './temp';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

/**
 * POST /api/upload
 * Upload and process a video
 */
app.post('/api/upload', upload.single('video'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No video file uploaded' });
      return;
    }

    const { title, description } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    console.log(`Processing video: ${req.file.originalname}`);
    console.log(`Title: ${title}, Description: ${description}`);

    // Step 1: Chunk the video
    console.log('Step 1: Chunking video...');
    const { chunks, thumbnail, totalDuration } = await chunkVideo(
      req.file.path,
      TEMP_DIR
    );

    console.log(`Created ${chunks.length} chunks from ${totalDuration}s video`);

    // Step 2: Upload to Walrus and create Sui object
    console.log('Step 2: Uploading to Walrus and Sui...');
    const uploadResult = await uploadVideoToWalrus(
      chunks,
      thumbnail,
      title,
      description,
      5000 // 5 seconds per chunk in milliseconds
    );

    // Step 3: Cleanup temporary files
    console.log('Step 3: Cleaning up temporary files...');
    await cleanupChunks(chunks, thumbnail);
    await fs.unlink(req.file.path);

    // Return success response
    res.json({
      success: true,
      videoId: uploadResult.videoId,
      txDigest: uploadResult.txDigest,
      blobIds: uploadResult.blobIds,
      thumbnailBlobId: uploadResult.thumbnailBlobId,
      chunkCount: chunks.length,
      duration: totalDuration
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process video',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'verta-processor' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Verta Processor Service running on port ${PORT}`);
  console.log(`📁 Temporary files directory: ${TEMP_DIR}`);
  console.log(`🌐 CORS enabled for all origins`);
});
