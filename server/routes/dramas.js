import express from 'express';
import pool from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheHelpers } from '../config/redis.js';

const router = express.Router();

// Get all dramas with pagination and filters
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tag,
      sort = 'created_at',
      order = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = `
      SELECT
        d.*,
        u.username,
        u.display_name,
        u.avatar_url,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        EXISTS(SELECT 1 FROM likes WHERE drama_id = d.id AND user_id = $1) as is_liked
      FROM dramas d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN likes l ON d.id = l.drama_id
      LEFT JOIN comments c ON d.id = c.drama_id
      WHERE d.is_published = true
    `;

    const params = [req.user?.id || null];
    let paramIndex = 2;

    if (category) {
      query += ` AND d.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (tag) {
      query += ` AND $${paramIndex} = ANY(d.tags)`;
      params.push(tag);
      paramIndex++;
    }

    query += ` GROUP BY d.id, u.id`;

    // Add sorting
    const validSorts = ['created_at', 'views_count', 'likes_count', 'title'];
    const validOrders = ['ASC', 'DESC'];

    if (validSorts.includes(sort) && validOrders.includes(order.toUpperCase())) {
      query += ` ORDER BY d.${sort} ${order}`;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Check cache
    const cacheKey = `dramas:${page}:${limit}:${category || 'all'}:${tag || 'all'}:${sort}:${order}`;
    const cached = await cacheHelpers.get(cacheKey);

    if (cached && !req.user) {
      return res.json(cached);
    }

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM dramas WHERE is_published = true';
    const countParams = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (tag) {
      countQuery += ` AND $${countParamIndex} = ANY(tags)`;
      countParams.push(tag);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    const response = {
      dramas: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 5 minutes
    if (!req.user) {
      await cacheHelpers.set(cacheKey, response, 300);
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get single drama by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        d.*,
        u.username,
        u.display_name,
        u.avatar_url,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count,
        EXISTS(SELECT 1 FROM likes WHERE drama_id = d.id AND user_id = $2) as is_liked
      FROM dramas d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN likes l ON d.id = l.drama_id
      LEFT JOIN comments c ON d.id = c.drama_id
      WHERE d.id = $1
      GROUP BY d.id, u.id`,
      [id, req.user?.id || null]
    );

    if (result.rows.length === 0) {
      throw new AppError('Drama not found', 404);
    }

    // Increment view count
    await pool.query(
      'UPDATE dramas SET views_count = views_count + 1 WHERE id = $1',
      [id]
    );

    // Track view
    if (req.user) {
      await pool.query(
        `INSERT INTO views (drama_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [id, req.user.id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create new drama
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      category,
      tags,
      emotionalTags,
    } = req.body;

    if (!title || !videoUrl || !duration) {
      throw new AppError('Title, video URL, and duration are required', 400);
    }

    const result = await pool.query(
      `INSERT INTO dramas (
        user_id, title, description, video_url, thumbnail_url,
        duration, category, tags, emotional_tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        req.user.id,
        title,
        description,
        videoUrl,
        thumbnailUrl,
        duration,
        category,
        tags || [],
        emotionalTags || [],
      ]
    );

    // Clear cache
    await cacheHelpers.delPattern('dramas:*');

    res.status(201).json({
      message: 'Drama created successfully',
      drama: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Update drama
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      thumbnailUrl,
      category,
      tags,
      emotionalTags,
      isPublished,
    } = req.body;

    // Check ownership
    const drama = await pool.query('SELECT user_id FROM dramas WHERE id = $1', [id]);

    if (drama.rows.length === 0) {
      throw new AppError('Drama not found', 404);
    }

    if (drama.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized to update this drama', 403);
    }

    const result = await pool.query(
      `UPDATE dramas
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           category = COALESCE($4, category),
           tags = COALESCE($5, tags),
           emotional_tags = COALESCE($6, emotional_tags),
           is_published = COALESCE($7, is_published)
       WHERE id = $8
       RETURNING *`,
      [title, description, thumbnailUrl, category, tags, emotionalTags, isPublished, id]
    );

    // Clear cache
    await cacheHelpers.delPattern('dramas:*');

    res.json({
      message: 'Drama updated successfully',
      drama: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete drama
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const drama = await pool.query('SELECT user_id FROM dramas WHERE id = $1', [id]);

    if (drama.rows.length === 0) {
      throw new AppError('Drama not found', 404);
    }

    if (drama.rows[0].user_id !== req.user.id) {
      throw new AppError('Not authorized to delete this drama', 403);
    }

    await pool.query('DELETE FROM dramas WHERE id = $1', [id]);

    // Clear cache
    await cacheHelpers.delPattern('dramas:*');

    res.json({ message: 'Drama deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Like/unlike drama
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if already liked
    const existing = await pool.query(
      'SELECT id FROM likes WHERE drama_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM likes WHERE drama_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      res.json({ message: 'Drama unliked', isLiked: false });
    } else {
      // Like
      await pool.query(
        'INSERT INTO likes (drama_id, user_id) VALUES ($1, $2)',
        [id, req.user.id]
      );
      res.json({ message: 'Drama liked', isLiked: true });
    }

    // Clear cache
    await cacheHelpers.delPattern('dramas:*');
  } catch (error) {
    next(error);
  }
});

// Get trending dramas
router.get('/trending/list', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const cacheKey = `dramas:trending:${limit}`;
    const cached = await cacheHelpers.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const result = await pool.query(
      `SELECT
        d.*,
        u.username,
        u.display_name,
        u.avatar_url
      FROM dramas d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.is_published = true
      ORDER BY (d.views_count * 0.5 + d.likes_count * 0.3 + d.comments_count * 0.2) DESC
      LIMIT $1`,
      [limit]
    );

    // Cache for 10 minutes
    await cacheHelpers.set(cacheKey, result.rows, 600);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
