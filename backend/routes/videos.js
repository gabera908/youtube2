const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const pool = require('../config/database');
const { detectPlatform, getEmbedUrl, fetchOEmbedData } = require('../utils/platformDetector');

const router = express.Router();

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(
      errors
        .array()
        .map((e) => e.msg)
        .join(', ')
    );
    err.statusCode = 400;
    throw err;
  }
}

// GET /api/videos/stats/overview
router.get('/stats/overview', async (req, res, next) => {
  try {
    const [[{ totalVideos }]] = await pool.query(
      'SELECT COUNT(*) AS totalVideos FROM videos WHERE is_active = 1'
    );
    const [[{ totalViews }]] = await pool.query(
      'SELECT COALESCE(SUM(views), 0) AS totalViews FROM videos WHERE is_active = 1'
    );
    const [[{ totalCategories }]] = await pool.query(
      'SELECT COUNT(*) AS totalCategories FROM categories'
    );
    const [[{ totalChannels }]] = await pool.query(
      'SELECT COUNT(*) AS totalChannels FROM channels'
    );

    res.json({
      success: true,
      data: { totalVideos, totalViews, totalCategories, totalChannels },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/videos
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category').optional().isString().trim(),
    query('channel').optional().isString().trim(),
    query('platform').optional().isString().trim(),
    query('search').optional().isString().trim(),
    query('featured').optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 12;
      const offset = (page - 1) * limit;
      const { category, channel, platform, search, featured } = req.query;

      const where = ['v.is_active = 1'];
      const params = [];

      if (category) {
        where.push('c.slug = ?');
        params.push(category);
      }
      if (channel) {
        where.push('ch.slug = ?');
        params.push(channel);
      }
      if (platform) {
        where.push('v.platform = ?');
        params.push(platform);
      }
      if (search) {
        where.push('(v.title LIKE ? OR v.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      if (featured !== undefined && featured !== '') {
        where.push('v.is_featured = ?');
        params.push(featured ? 1 : 0);
      }

      const whereClause = where.join(' AND ');

      const countQuery = `
      SELECT COUNT(*) AS total
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      LEFT JOIN channels ch ON v.channel_id = ch.id
      WHERE ${whereClause}
    `;
      const [[{ total }]] = await pool.query(countQuery, params);

      const dataQuery = `
      SELECT v.*, c.name AS category_name, c.slug AS category_slug,
             ch.name AS channel_name, ch.slug AS channel_slug, ch.avatar_url AS channel_avatar
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      LEFT JOIN channels ch ON v.channel_id = ch.id
      WHERE ${whereClause}
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `;
      const [videos] = await pool.query(dataQuery, [...params, limit, offset]);

      res.json({
        success: true,
        data: videos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/videos/:id
router.get('/:id', [param('id').isInt({ min: 1 }).toInt()], async (req, res, next) => {
  try {
    validate(req);

    const [rows] = await pool.query(
      `SELECT v.*, c.name AS category_name, c.slug AS category_slug,
              ch.name AS channel_name, ch.slug AS channel_slug, ch.avatar_url AS channel_avatar
       FROM videos v
       LEFT JOIN categories c ON v.category_id = c.id
       LEFT JOIN channels ch ON v.channel_id = ch.id
       WHERE v.id = ? AND v.is_active = 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    }

    await pool.query('UPDATE videos SET views = views + 1 WHERE id = ?', [req.params.id]);
    rows[0].views += 1;

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/videos
router.post(
  '/',
  [
    body('title').isString().trim().notEmpty().withMessage('Title is required'),
    body('video_url').isURL().withMessage('Valid video_url is required'),
    body('description').optional().isString().trim(),
    body('thumbnail_url').optional().isString().trim(),
    body('platform')
      .optional()
      .isString()
      .isIn([
        'youtube',
        'facebook',
        'instagram',
        'tiktok',
        'vimeo',
        'telegram',
        'google_drive',
        'direct',
        'other',
      ]),
    body('category_id').optional().isInt({ min: 1 }).toInt(),
    body('channel_id').optional().isInt({ min: 1 }).toInt(),
    body('is_featured').optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { title, video_url, description, thumbnail_url, category_id, channel_id, is_featured } =
        req.body;
      let platform = req.body.platform;

      if (!platform) {
        platform = detectPlatform(video_url);
      }

      let finalThumbnail = thumbnail_url || null;
      let finalTitle = title;

      if (!finalThumbnail || finalTitle === title) {
        const oembed = await fetchOEmbedData(video_url);
        if (!finalThumbnail && oembed.thumbnail) finalThumbnail = oembed.thumbnail;
        if (oembed.title && title === oembed.title) finalTitle = oembed.title;
      }

      const [result] = await pool.query(
        `INSERT INTO videos (title, description, thumbnail_url, video_url, platform, category_id, channel_id, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalTitle,
          description || null,
          finalThumbnail,
          video_url,
          platform,
          category_id || null,
          channel_id || null,
          is_featured ? 1 : 0,
        ]
      );

      const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [result.insertId]);

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/videos/:id
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('title').optional().isString().trim().notEmpty(),
    body('video_url').optional().isURL(),
    body('description').optional().isString().trim(),
    body('thumbnail_url').optional().isString().trim(),
    body('platform')
      .optional()
      .isString()
      .isIn([
        'youtube',
        'facebook',
        'instagram',
        'tiktok',
        'vimeo',
        'telegram',
        'google_drive',
        'direct',
        'other',
      ]),
    body('category_id').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
    body('channel_id').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
    body('is_featured').optional().isBoolean().toBoolean(),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { id } = req.params;
      const [existing] = await pool.query('SELECT * FROM videos WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Video not found' } });
      }

      const fields = {};
      if (req.body.title !== undefined) fields.title = req.body.title;
      if (req.body.description !== undefined) fields.description = req.body.description;
      if (req.body.thumbnail_url !== undefined) fields.thumbnail_url = req.body.thumbnail_url;
      if (req.body.video_url !== undefined) fields.video_url = req.body.video_url;
      if (req.body.platform !== undefined) fields.platform = req.body.platform;
      if (req.body.category_id !== undefined) fields.category_id = req.body.category_id;
      if (req.body.channel_id !== undefined) fields.channel_id = req.body.channel_id;
      if (req.body.is_featured !== undefined) fields.is_featured = req.body.is_featured ? 1 : 0;
      if (req.body.is_active !== undefined) fields.is_active = req.body.is_active ? 1 : 0;

      if (Object.keys(fields).length === 0) {
        return res.status(400).json({ success: false, error: { message: 'No fields to update' } });
      }

      if (fields.video_url && !fields.platform) {
        fields.platform = detectPlatform(fields.video_url);
      }

      const setClauses = Object.keys(fields).map((k) => `${k} = ?`);
      const values = Object.values(fields);

      await pool.query(`UPDATE videos SET ${setClauses.join(', ')} WHERE id = ?`, [...values, id]);

      const [rows] = await pool.query(
        `SELECT v.*, c.name AS category_name, c.slug AS category_slug,
              ch.name AS channel_name, ch.slug AS channel_slug
       FROM videos v
       LEFT JOIN categories c ON v.category_id = c.id
       LEFT JOIN channels ch ON v.channel_id = ch.id
       WHERE v.id = ?`,
        [id]
      );

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/videos/:id (soft delete)
router.delete('/:id', [param('id').isInt({ min: 1 }).toInt()], async (req, res, next) => {
  try {
    validate(req);

    const [existing] = await pool.query('SELECT * FROM videos WHERE id = ? AND is_active = 1', [
      req.params.id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    }

    await pool.query('UPDATE videos SET is_active = 0 WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
