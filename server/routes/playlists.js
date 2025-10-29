import express from 'express';
import pool from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all playlists
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT
        p.*,
        u.username,
        u.display_name,
        u.avatar_url,
        COUNT(DISTINCT pi.id) as items_count
      FROM playlists p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.is_public = true
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get single playlist
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const playlistResult = await pool.query(
      `SELECT
        p.*,
        u.username,
        u.display_name,
        u.avatar_url
      FROM playlists p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (playlistResult.rows.length === 0) {
      throw new AppError('Playlist not found', 404);
    }

    const playlist = playlistResult.rows[0];

    // Get playlist items
    const itemsResult = await pool.query(
      `SELECT
        d.*,
        pi.position,
        u.username,
        u.display_name
      FROM playlist_items pi
      JOIN dramas d ON pi.drama_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE pi.playlist_id = $1
      ORDER BY pi.position`,
      [id]
    );

    playlist.dramas = itemsResult.rows;

    res.json(playlist);
  } catch (error) {
    next(error);
  }
});

// Create playlist
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, description, thumbnailUrl, isPublic = true } = req.body;

    if (!title) {
      throw new AppError('Title is required', 400);
    }

    const result = await pool.query(
      `INSERT INTO playlists (user_id, title, description, thumbnail_url, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, title, description, thumbnailUrl, isPublic]
    );

    res.status(201).json({
      message: 'Playlist created successfully',
      playlist: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Update playlist
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnailUrl, isPublic } = req.body;

    // Check ownership
    const playlist = await pool.query(
      'SELECT user_id FROM playlists WHERE id = $1',
      [id]
    );

    if (playlist.rows.length === 0) {
      throw new AppError('Playlist not found', 404);
    }

    if (playlist.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    const result = await pool.query(
      `UPDATE playlists
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           is_public = COALESCE($4, is_public)
       WHERE id = $5
       RETURNING *`,
      [title, description, thumbnailUrl, isPublic, id]
    );

    res.json({
      message: 'Playlist updated successfully',
      playlist: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete playlist
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const playlist = await pool.query(
      'SELECT user_id FROM playlists WHERE id = $1',
      [id]
    );

    if (playlist.rows.length === 0) {
      throw new AppError('Playlist not found', 404);
    }

    if (playlist.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    await pool.query('DELETE FROM playlists WHERE id = $1', [id]);

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add drama to playlist
router.post('/:id/items', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dramaId } = req.body;

    if (!dramaId) {
      throw new AppError('Drama ID is required', 400);
    }

    // Check ownership
    const playlist = await pool.query(
      'SELECT user_id FROM playlists WHERE id = $1',
      [id]
    );

    if (playlist.rows.length === 0) {
      throw new AppError('Playlist not found', 404);
    }

    if (playlist.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    // Get next position
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM playlist_items WHERE playlist_id = $1',
      [id]
    );

    const position = positionResult.rows[0].next_position;

    // Add item
    await pool.query(
      'INSERT INTO playlist_items (playlist_id, drama_id, position) VALUES ($1, $2, $3)',
      [id, dramaId, position]
    );

    res.json({ message: 'Drama added to playlist successfully' });
  } catch (error) {
    if (error.code === '23505') {
      return next(new AppError('Drama already in playlist', 409));
    }
    next(error);
  }
});

// Remove drama from playlist
router.delete('/:id/items/:dramaId', authenticate, async (req, res, next) => {
  try {
    const { id, dramaId } = req.params;

    // Check ownership
    const playlist = await pool.query(
      'SELECT user_id FROM playlists WHERE id = $1',
      [id]
    );

    if (playlist.rows.length === 0) {
      throw new AppError('Playlist not found', 404);
    }

    if (playlist.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    await pool.query(
      'DELETE FROM playlist_items WHERE playlist_id = $1 AND drama_id = $2',
      [id, dramaId]
    );

    res.json({ message: 'Drama removed from playlist successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
