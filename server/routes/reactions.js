import express from 'express';
import pool from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get reactions for a drama
router.get('/drama/:dramaId', async (req, res, next) => {
  try {
    const { dramaId } = req.params;

    const result = await pool.query(
      `SELECT
        emotion,
        COUNT(*) as count,
        json_agg(json_build_object(
          'userId', user_id,
          'timestamp', timestamp
        )) as reactions
      FROM reactions
      WHERE drama_id = $1
      GROUP BY emotion
      ORDER BY count DESC`,
      [dramaId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get user's reactions for a drama
router.get('/drama/:dramaId/user', authenticate, async (req, res, next) => {
  try {
    const { dramaId } = req.params;

    const result = await pool.query(
      'SELECT emotion, timestamp FROM reactions WHERE drama_id = $1 AND user_id = $2',
      [dramaId, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Add reaction
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { dramaId, emotion, timestamp } = req.body;

    if (!dramaId || !emotion) {
      throw new AppError('Drama ID and emotion are required', 400);
    }

    const validEmotions = [
      'happy',
      'sad',
      'shocked',
      'angry',
      'romantic',
      'suspenseful',
      'funny',
    ];

    if (!validEmotions.includes(emotion)) {
      throw new AppError('Invalid emotion type', 400);
    }

    const result = await pool.query(
      `INSERT INTO reactions (drama_id, user_id, emotion, timestamp)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (drama_id, user_id, emotion)
       DO UPDATE SET timestamp = $4
       RETURNING *`,
      [dramaId, req.user.id, emotion, timestamp || null]
    );

    res.status(201).json({
      message: 'Reaction added successfully',
      reaction: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Remove reaction
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const { dramaId, emotion } = req.body;

    if (!dramaId || !emotion) {
      throw new AppError('Drama ID and emotion are required', 400);
    }

    await pool.query(
      'DELETE FROM reactions WHERE drama_id = $1 AND user_id = $2 AND emotion = $3',
      [dramaId, req.user.id, emotion]
    );

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
