import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
  },
});

// Upload video
router.post(
  '/video',
  authenticate,
  uploadRateLimiter,
  upload.single('video'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No video file provided', 400);
      }

      const videoUrl = `/uploads/videos/${req.file.filename}`;

      // TODO: Process video with FFmpeg
      // - Generate thumbnails
      // - Create different quality versions
      // - Extract duration
      // - Create HLS/DASH streams

      res.json({
        message: 'Video uploaded successfully',
        videoUrl,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
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

// Upload multiple files (video + thumbnail)
router.post(
  '/drama',
  authenticate,
  uploadRateLimiter,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files;

      if (!files || !files.video) {
        throw new AppError('Video file is required', 400);
      }

      const videoUrl = `/uploads/videos/${files.video[0].filename}`;
      const thumbnailUrl = files.thumbnail
        ? `/uploads/thumbnails/${files.thumbnail[0].filename}`
        : null;

      res.json({
        message: 'Files uploaded successfully',
        videoUrl,
        thumbnailUrl,
        videoSize: files.video[0].size,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
