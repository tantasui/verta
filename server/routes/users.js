import express from 'express';
import pool from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get user profile
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.bio,
        u.is_verified,
        u.created_at,
        COUNT(DISTINCT d.id) as dramas_count,
        COUNT(DISTINCT f1.id) as followers_count,
        COUNT(DISTINCT f2.id) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as is_following
      FROM users u
      LEFT JOIN dramas d ON u.id = d.user_id AND d.is_published = true
      LEFT JOIN follows f1 ON u.id = f1.following_id
      LEFT JOIN follows f2 ON u.id = f2.follower_id
      WHERE u.id = $1
      GROUP BY u.id`,
      [id, req.user?.id || null]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get user's dramas
router.get('/:id/dramas', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT d.*, COUNT(DISTINCT l.id) as likes_count
       FROM dramas d
       LEFT JOIN likes l ON d.id = l.drama_id
       WHERE d.user_id = $1 AND d.is_published = true
       GROUP BY d.id
       ORDER BY d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Update own profile
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, username, display_name, bio, avatar_url`,
      [displayName, bio, avatarUrl, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Follow/unfollow user
router.post('/:id/follow', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      throw new AppError('Cannot follow yourself', 400);
    }

    // Check if already following
    const existing = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, id]
    );

    if (existing.rows.length > 0) {
      // Unfollow
      await pool.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.user.id, id]
      );
      res.json({ message: 'Unfollowed successfully', isFollowing: false });
    } else {
      // Follow
      await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [req.user.id, id]
      );
      res.json({ message: 'Followed successfully', isFollowing: true });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
