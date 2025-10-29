import express from 'express';
import pool from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get comments for a drama
router.get('/drama/:dramaId', optionalAuth, async (req, res, next) => {
  try {
    const { dramaId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT
        c.*,
        u.username,
        u.display_name,
        u.avatar_url,
        COUNT(DISTINCT cl.id) as likes_count,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $3) as is_liked
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comment_likes cl ON c.id = cl.comment_id
      WHERE c.drama_id = $1 AND c.parent_id IS NULL
      GROUP BY c.id, u.id
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $4`,
      [dramaId, limit, req.user?.id || null, offset]
    );

    // Get replies for each comment
    for (const comment of result.rows) {
      const repliesResult = await pool.query(
        `SELECT
          c.*,
          u.username,
          u.display_name,
          u.avatar_url,
          COUNT(DISTINCT cl.id) as likes_count,
          EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) as is_liked
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        WHERE c.parent_id = $1
        GROUP BY c.id, u.id
        ORDER BY c.created_at ASC`,
        [comment.id, req.user?.id || null]
      );

      comment.replies = repliesResult.rows;
    }

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create comment
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { dramaId, content, parentId } = req.body;

    if (!dramaId || !content) {
      throw new AppError('Drama ID and content are required', 400);
    }

    if (content.trim().length === 0) {
      throw new AppError('Comment cannot be empty', 400);
    }

    const result = await pool.query(
      `INSERT INTO comments (drama_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dramaId, req.user.id, content.trim(), parentId || null]
    );

    // Get user info
    const userResult = await pool.query(
      'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );

    const comment = {
      ...result.rows[0],
      ...userResult.rows[0],
      likes_count: 0,
      is_liked: false,
      replies: [],
    };

    res.status(201).json({
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
});

// Update comment
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw new AppError('Content cannot be empty', 400);
    }

    // Check ownership
    const comment = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (comment.rows.length === 0) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    const result = await pool.query(
      'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
      [content.trim(), id]
    );

    res.json({
      message: 'Comment updated successfully',
      comment: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete comment
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const comment = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (comment.rows.length === 0) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized', 403);
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Like/unlike comment
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if already liked
    const existing = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      res.json({ message: 'Comment unliked', isLiked: false });
    } else {
      // Like
      await pool.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
        [id, req.user.id]
      );
      res.json({ message: 'Comment liked', isLiked: true });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
