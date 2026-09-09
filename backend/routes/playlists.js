const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../config/database');

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

const VIDEO_SELECT = `
  v.*, c.name AS category_name, c.slug AS category_slug,
  ch.name AS channel_name, ch.slug AS channel_slug, ch.avatar_url AS channel_avatar
`;

// GET /api/playlists
router.get('/', async (req, res, next) => {
  try {
    const [playlists] = await pool.query(`
      SELECT p.*,
        COUNT(DISTINCT pi.video_id) AS video_count,
        (SELECT v2.thumbnail_url FROM playlist_items pi2
          JOIN videos v2 ON v2.id = pi2.video_id AND v2.is_active = 1
          WHERE pi2.playlist_id = p.id ORDER BY pi2.\`order\` ASC, pi2.added_at ASC LIMIT 1) AS cover_thumbnail
      FROM playlists p
      LEFT JOIN playlist_items pi ON pi.playlist_id = p.id
      LEFT JOIN videos v ON v.id = pi.video_id AND v.is_active = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, data: playlists });
  } catch (err) {
    next(err);
  }
});

// GET /api/playlists/:id
router.get('/:id', [param('id').isInt({ min: 1 }).toInt()], async (req, res, next) => {
  try {
    validate(req);

    const [playlists] = await pool.query('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    if (playlists.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
    }

    const [videos] = await pool.query(
      `
      SELECT ${VIDEO_SELECT}
      FROM playlist_items pi
      JOIN videos v ON v.id = pi.video_id AND v.is_active = 1
      LEFT JOIN categories c ON v.category_id = c.id
      LEFT JOIN channels ch ON v.channel_id = ch.id
      WHERE pi.playlist_id = ?
      ORDER BY pi.\`order\` ASC, pi.added_at ASC
    `,
      [req.params.id]
    );

    res.json({ success: true, data: { ...playlists[0], videos } });
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists
router.post(
  '/',
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 255 })
      .withMessage('Name must be under 255 characters'),
    body('description').optional().isString().trim(),
    body('is_public').optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { name, description, is_public } = req.body;

      const [result] = await pool.query(
        'INSERT INTO playlists (user_id, name, description, is_public) VALUES (NULL, ?, ?, ?)',
        [name, description || null, is_public === false ? 0 : 1]
      );

      const [rows] = await pool.query('SELECT * FROM playlists WHERE id = ?', [result.insertId]);

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/playlists/:id
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('name')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 255 }),
    body('description').optional().isString().trim(),
    body('is_public').optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { id } = req.params;
      const [existing] = await pool.query('SELECT * FROM playlists WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
      }

      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.is_public !== undefined) updates.is_public = req.body.is_public ? 1 : 0;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: { message: 'No fields to update' } });
      }

      const setClauses = Object.keys(updates).map((k) => `${k} = ?`);
      await pool.query(`UPDATE playlists SET ${setClauses.join(', ')} WHERE id = ?`, [
        ...Object.values(updates),
        id,
      ]);

      const [rows] = await pool.query('SELECT * FROM playlists WHERE id = ?', [id]);

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/playlists/:id
router.delete('/:id', [param('id').isInt({ min: 1 }).toInt()], async (req, res, next) => {
  try {
    validate(req);

    const [existing] = await pool.query('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
    }

    await pool.query('DELETE FROM playlists WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Playlist deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists/:id/videos
router.post(
  '/:id/videos',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('video_id').isInt({ min: 1 }).withMessage('Valid video_id is required').toInt(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { id } = req.params;
      const { video_id } = req.body;

      const [playlists] = await pool.query('SELECT * FROM playlists WHERE id = ?', [id]);
      if (playlists.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Playlist not found' } });
      }

      const [videos] = await pool.query(
        'SELECT id FROM videos WHERE id = ? AND is_active = 1',
        [video_id]
      );
      if (videos.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Video not found' } });
      }

      const [dup] = await pool.query(
        'SELECT playlist_id FROM playlist_items WHERE playlist_id = ? AND video_id = ?',
        [id, video_id]
      );
      if (dup.length > 0) {
        return res
          .status(409)
          .json({ success: false, error: { message: 'Video already in playlist' } });
      }

      const [[{ maxOrder }]] = await pool.query(
        'SELECT COALESCE(MAX(`order`), -1) AS maxOrder FROM playlist_items WHERE playlist_id = ?',
        [id]
      );

      await pool.query(
        'INSERT INTO playlist_items (playlist_id, video_id, `order`) VALUES (?, ?, ?)',
        [id, video_id, (maxOrder || 0) + 1]
      );

      res.status(201).json({ success: true, message: 'Video added to playlist' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/playlists/:id/videos/:videoId
router.delete(
  '/:id/videos/:videoId',
  [param('id').isInt({ min: 1 }).toInt(), param('videoId').isInt({ min: 1 }).toInt()],
  async (req, res, next) => {
    try {
      validate(req);

      const [rows] = await pool.query(
        'SELECT playlist_id FROM playlist_items WHERE playlist_id = ? AND video_id = ?',
        [req.params.id, req.params.videoId]
      );
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: { message: 'Video not in playlist' } });
      }

      await pool.query('DELETE FROM playlist_items WHERE playlist_id = ? AND video_id = ?', [
        req.params.id,
        req.params.videoId,
      ]);

      res.json({ success: true, message: 'Video removed from playlist' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
