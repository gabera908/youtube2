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

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, COUNT(v.id) AS video_count
      FROM categories c
      LEFT JOIN videos v ON v.category_id = c.id AND v.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug
router.get('/:slug', [param('slug').isString().trim().notEmpty()], async (req, res, next) => {
  try {
    validate(req);

    const [cats] = await pool.query('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (cats.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Category not found' } });
    }

    const category = cats[0];

    const [videos] = await pool.query(
      `
      SELECT v.*, ch.name AS channel_name, ch.slug AS channel_slug, ch.avatar_url AS channel_avatar
      FROM videos v
      LEFT JOIN channels ch ON v.channel_id = ch.id
      WHERE v.category_id = ? AND v.is_active = 1
      ORDER BY v.created_at DESC
    `,
      [category.id]
    );

    res.json({ success: true, data: { ...category, videos } });
  } catch (err) {
    next(err);
  }
});

// POST /api/categories
router.post(
  '/',
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be under 100 characters'),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { name } = req.body;
      let slug = generateSlug(name);

      const [existingSlug] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
      if (existingSlug.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }

      const [result] = await pool.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [
        name,
        slug,
      ]);

      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/categories/:id
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
      .isLength({ max: 100 }),
  ],
  async (req, res, next) => {
    try {
      validate(req);

      const { id } = req.params;
      const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Category not found' } });
      }

      const updates = {};
      if (req.body.name !== undefined) {
        updates.name = req.body.name;
        updates.slug = generateSlug(req.body.name);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: { message: 'No fields to update' } });
      }

      const setClauses = Object.keys(updates).map((k) => `${k} = ?`);
      const values = Object.values(updates);

      await pool.query(`UPDATE categories SET ${setClauses.join(', ')} WHERE id = ?`, [
        ...values,
        id,
      ]);

      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/categories/:id
router.delete('/:id', [param('id').isInt({ min: 1 }).toInt()], async (req, res, next) => {
  try {
    validate(req);

    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Category not found' } });
    }

    const [[{ videoCount }]] = await pool.query(
      'SELECT COUNT(*) AS videoCount FROM videos WHERE category_id = ? AND is_active = 1',
      [req.params.id]
    );

    if (videoCount > 0) {
      const err = new Error('Cannot delete category with active videos');
      err.statusCode = 400;
      throw err;
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
