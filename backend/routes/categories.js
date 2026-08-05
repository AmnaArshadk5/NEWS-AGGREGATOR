import express from 'express';
import { allQuery } from '../db.js';

const router = express.Router();

// GET /api/categories - Public endpoint to retrieve active categories for pill bar
router.get('/', async (req, res) => {
  try {
    const categories = await allQuery(
      'SELECT id, name, slug, sort_order FROM categories WHERE enabled = 1 ORDER BY sort_order ASC, name ASC'
    );
    res.json(categories);
  } catch (err) {
    console.error('Error fetching public categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
