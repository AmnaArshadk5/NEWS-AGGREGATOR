import express from 'express';
import { 
  getAllUsers, 
  deleteUser, 
  updateUserRole, 
  getAllCategories, 
  createCategory, 
  deleteCategory,
  getUserCount 
} from '../queries.js';
import { runQuery, getQuery, allQuery } from '../db.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

// Apply auth + admin middleware to all routes in this router
router.use(authMiddleware);
router.use(adminMiddleware);

// --- USER MANAGEMENT (CRUD) ---

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const users = await allQuery(`
      SELECT u.id, u.username, u.role, u.created_at, COUNT(b.id) as bookmark_count
      FROM users u
      LEFT JOIN bookmarks b ON u.id = b.user_id
      GROUP BY u.id, u.username, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }

  try {
    await deleteUser(targetId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PATCH /api/admin/users/:id/role - Promote/Demote User Role
router.patch('/users/:id/role', async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
  }

  if (targetId === req.user.id && role !== 'admin') {
    return res.status(400).json({ error: 'You cannot demote your own admin account.' });
  }

  try {
    await updateUserRole(targetId, role);
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// --- CATEGORIES MANAGEMENT (CRUD) ---

// GET /api/admin/categories - List all categories (including disabled ones)
router.get('/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching admin categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/admin/categories - Add a new category
router.post('/categories', async (req, res) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Category name and slug are required' });
  }

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

  try {
    const maxOrderRow = await getQuery('SELECT MAX(sort_order) as max_order FROM categories');
    const newOrder = (maxOrderRow?.max_order || 0) + 1;

    const result = await createCategory(name, cleanSlug, newOrder);

    res.status(201).json({
      message: 'Category created successfully',
      category: { id: result.id, name: name.trim(), slug: cleanSlug, sort_order: newOrder, enabled: 1 }
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A category with this slug already exists' });
    }
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/admin/categories/:id - Update category details or enable/disable
router.put('/categories/:id', async (req, res) => {
  const catId = parseInt(req.params.id, 10);
  const { name, slug, enabled, sort_order } = req.body;

  try {
    const existing = await getQuery('SELECT * FROM categories WHERE id = ?', [catId]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedSlug = slug !== undefined ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : existing.slug;
    const updatedEnabled = enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled;
    const updatedSortOrder = sort_order !== undefined ? parseInt(sort_order, 10) : existing.sort_order;

    await runQuery(
      'UPDATE categories SET name = ?, slug = ?, enabled = ?, sort_order = ? WHERE id = ?',
      [updatedName, updatedSlug, updatedEnabled, updatedSortOrder, catId]
    );

    res.json({
      message: 'Category updated successfully',
      category: { id: catId, name: updatedName, slug: updatedSlug, enabled: updatedEnabled, sort_order: updatedSortOrder }
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/admin/categories/:id - Delete a category
router.delete('/categories/:id', async (req, res) => {
  const catId = parseInt(req.params.id, 10);

  try {
    await deleteCategory(catId);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// GET /api/admin/stats - System Statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
    const adminCount = await getQuery("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const bookmarkCount = await getQuery('SELECT COUNT(*) as count FROM bookmarks');
    const categoryCount = await getQuery('SELECT COUNT(*) as count FROM categories WHERE enabled = 1');

    res.json({
      totalUsers: parseInt(userCount?.count || '0', 10),
      totalAdmins: parseInt(adminCount?.count || '0', 10),
      totalBookmarks: parseInt(bookmarkCount?.count || '0', 10),
      activeCategories: parseInt(categoryCount?.count || '0', 10)
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router;
