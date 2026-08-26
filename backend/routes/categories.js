import express from 'express';
import { getEnabledCategories } from '../queries.js';

const router = express.Router();

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'General', slug: 'general', sort_order: 1 },
  { id: 2, name: 'Technology', slug: 'technology', sort_order: 2 },
  { id: 3, name: 'Business', slug: 'business', sort_order: 3 },
  { id: 4, name: 'Sports', slug: 'sports', sort_order: 4 },
  { id: 5, name: 'Entertainment', slug: 'entertainment', sort_order: 5 },
  { id: 6, name: 'Health', slug: 'health', sort_order: 6 },
  { id: 7, name: 'Science', slug: 'science', sort_order: 7 },
];

// GET /api/categories - Public endpoint to retrieve active categories for pill bar
router.get('/', async (req, res) => {
  try {
    const categories = await getEnabledCategories();
    if (categories && categories.length > 0) {
      return res.json(categories);
    }
    return res.json(DEFAULT_CATEGORIES);
  } catch (err) {
    console.error('Error fetching public categories:', err);
    return res.json(DEFAULT_CATEGORIES);
  }
});

export default router;
