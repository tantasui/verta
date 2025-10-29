import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadToWalrus, uploadQuiltToWalrus } from '../services/walrus.js';
import { chunkVideoFile } from '../utils/chunker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.fieldname === 'video'
      ? path.join(__dirname, '../uploads/videos')
      : path.join(__dirname, '../uploads/thumbnails');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedVideoTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new AppError('Only video files are allowed (mp4, mov, avi, mkv, webm)', 400));
    }
  } else if (file.fieldname === 'thumbnail') {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedImageTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed (jpeg, jpg, png, gif, webp)', 400));
    }
  } else {
    cb(new AppError('Invalid field name', 400));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default (Walrus limit)
  },
});

// Upload video to Walrus with Quilt chunking
router.post(
  '/video',
  authenticate,
  uploadRateLimiter,
  upload.single('video'),
  async (req, res, next) => {
    let tempFilePath;
    try {
      if (!req.file) {
        throw new AppError('No video file provided', 400);
      }

      tempFilePath = req.file.path;
      const fileSize = req.file.size;

      console.log(`📤 Uploading video to Walrus: ${req.file.originalname} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

      // Check if file is small enough to upload as single blob (< 1MB)
      if (fileSize < 1024 * 1024) {
        console.log('📦 Small file, uploading as single blob');

        const walrusResult = await uploadToWalrus(tempFilePath, {
          epochs: 200,
          deletable: true,
        });

        fs.unlinkSync(tempFilePath);

        return res.json({
          message: 'Video uploaded to Walrus successfully',
          chunked: false,
          blobId: walrusResult.blobId,
          blobObjectId: walrusResult.blobObjectId,
          streamUrl: `/api/stream/${walrusResult.blobId}`,
          walrusUrl: walrusResult.url,
          size: walrusResult.size,
          endEpoch: walrusResult.endEpoch,
          cost: walrusResult.cost,
        });
      }

      // Large file - use Quilt chunking
      console.log('🧩 Large file, chunking into Quilt');

      // Chunk the video
      const chunks = await chunkVideoFile(tempFilePath);

      console.log(`📦 Created ${chunks.length} chunks`);

      // Prepare metadata for each chunk
      const metadata = chunks.map((chunk) => ({
        identifier: chunk.identifier,
        tags: {
          sequence: chunk.index.toString(),
          size: chunk.size.toString(),
        },
      }));

      // Upload as Quilt
      const quiltResult = await uploadQuiltToWalrus(chunks, {
        epochs: 200,
        deletable: true,
        metadata,
      });

      // Delete temporary file
      fs.unlinkSync(tempFilePath);

      res.json({
        message: 'Video uploaded to Walrus as Quilt successfully',
        chunked: true,
        quiltId: quiltResult.quiltId,
        quiltObjectId: quiltResult.quiltObjectId,
        numChunks: chunks.length,
        patches: quiltResult.patches,
        streamUrl: `/api/stream/quilt/${quiltResult.quiltId}`,
        walrusUrl: quiltResult.url,
        endEpoch: quiltResult.endEpoch,
        cost: quiltResult.cost,
      });
    } catch (error) {
      // Clean up temp file on error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      next(error);
    }
  }
);

// Upload thumbnail
router.post(
  '/thumbnail',
  authenticate,
  upload.single('thumbnail'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No thumbnail file provided', 400);
      }

      const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;

      res.json({
        message: 'Thumbnail uploaded successfully',
        thumbnailUrl,
        filename: req.file.filename,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Upload drama (video + thumbnail) to Walrus
router.post(
  '/drama',
  authenticate,
  uploadRateLimiter,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res, next) => {
    const tempFiles = [];
    try {
      const files = req.files;

      if (!files || !files.video) {
        throw new AppError('Video file is required', 400);
      }

      const videoFile = files.video[0];
      const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;

      tempFiles.push(videoFile.path);
      if (thumbnailFile) tempFiles.push(thumbnailFile.path);

      console.log(`📤 Uploading drama to Walrus: video + ${thumbnailFile ? 'thumbnail' : 'no thumbnail'}`);

      // Upload video to Walrus
      const videoResult = await uploadToWalrus(videoFile.path, {
        epochs: 200,
        deletable: true,
      });

      // Upload thumbnail to Walrus (if provided)
      let thumbnailResult = null;
      if (thumbnailFile) {
        thumbnailResult = await uploadToWalrus(thumbnailFile.path, {
          epochs: 200,
          deletable: true,
        });
      }

      // Clean up temp files
      tempFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });

      res.json({
        message: 'Drama uploaded to Walrus successfully',
        video: {
          blobId: videoResult.blobId,
          blobObjectId: videoResult.blobObjectId,
          streamUrl: `/api/stream/${videoResult.blobId}`,
          walrusUrl: videoResult.url,
          size: videoResult.size,
          endEpoch: videoResult.endEpoch,
          cost: videoResult.cost,
        },
        thumbnail: thumbnailResult
          ? {
              blobId: thumbnailResult.blobId,
              blobObjectId: thumbnailResult.blobObjectId,
              url: `/api/stream/${thumbnailResult.blobId}`,
              walrusUrl: thumbnailResult.url,
              size: thumbnailResult.size,
              endEpoch: thumbnailResult.endEpoch,
              cost: thumbnailResult.cost,
            }
          : null,
      });
    } catch (error) {
      // Clean up temp files on error
      tempFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
      next(error);
    }
  }
);

export default router;
