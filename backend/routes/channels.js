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

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /api/channels
router.get('/', async (req, res, next) => {
  try {
    const [channels] = await pool.query(`
      SELECT ch.*, COUNT(v.id) AS video_count
      FROM channels ch
      LEFT JOIN videos v ON v.channel_id = ch.id AND v.is_active = 1
      GROUP BY ch.id
      ORDER BY ch.name ASC
    `);

    res.json({ success: true, data: channels });
  } catch (err) {
    next(err);
  }
});

// GET /api/channels/:slug
router.get('/:slug', [param('slug').isString().trim().notEmpty()], async (req, res, next) => {
  try {
    validate(req);

    const [channels] = await pool.query('SELECT * FROM channels WHERE slug = ?', [req.params.slug]);
    if (channels.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Channel not found' } });
    }

    const channel = channels[0];

    const [videos] = await pool.query(
      `
      SELECT v.*, c.name AS category_name, c.slug AS category_slug
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE v.channel_id = ? AND v.is_active = 1
      ORDER BY v.created_at DESC
    `,
      [channel.id]
    );

    res.json({ success: true, data: { ...channel, videos } });
  } catch (err) {
    next(err);
  }
});

// POST /api/channels
router.post(
  '/',
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 150 })
      .withMessage('Name must be under 150 characters'),
    body('avatar_url').optional().isString().trim(),
    body('description').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { name, avatar_url, description } = req.body;
      let slug = generateSlug(name);

      const [existingSlug] = await pool.query('SELECT id FROM channels WHERE slug = ?', [slug]);
      if (existingSlug.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }

      const [result] = await pool.query(
        'INSERT INTO channels (name, slug, avatar_url, description) VALUES (?, ?, ?, ?)',
        [name, slug, avatar_url || null, description || null]
      );

      const [rows] = await pool.query('SELECT * FROM channels WHERE id = ?', [result.insertId]);

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/channels/:id
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
      .isLength({ max: 150 }),
    body('avatar_url').optional().isString().trim(),
    body('description').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { id } = req.params;
      const [existing] = await pool.query('SELECT * FROM channels WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Channel not found' } });
      }

      const updates = {};
      if (req.body.name !== undefined) {
        updates.name = req.body.name;
        updates.slug = generateSlug(req.body.name);
      }
      if (req.body.avatar_url !== undefined) updates.avatar_url = req.body.avatar_url;
      if (req.body.description !== undefined) updates.description = req.body.description;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: { message: 'No fields to update' } });
      }

      const setClauses = Object.keys(updates).map((k) => `${k} = ?`);
      const values = Object.values(updates);

      await pool.query(`UPDATE channels SET ${setClauses.join(', ')} WHERE id = ?`, [
        ...values,
        id,
      ]);

      const [rows] = await pool.query('SELECT * FROM channels WHERE id = ?', [id]);

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/channels/:id
router.delete('/:id', [param('id').isInt({ min: 1 }).toInt()], async (req, res, next) => {
  try {
    validate(req);

    const [existing] = await pool.query('SELECT * FROM channels WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Channel not found' } });
    }

    const [[{ videoCount }]] = await pool.query(
      'SELECT COUNT(*) AS videoCount FROM videos WHERE channel_id = ? AND is_active = 1',
      [req.params.id]
    );

    if (videoCount > 0) {
      const err = new Error('Cannot delete channel with active videos');
      err.statusCode = 400;
      throw err;
    }

    await pool.query('DELETE FROM channels WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Channel deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
