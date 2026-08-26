import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  findUserByUsername, 
  findUserById, 
  getUserCount, 
  createUser, 
  updateUserPassword 
} from '../queries.js';
import authMiddleware from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'news_aggregator_secret_key_12345';

// POST /api/auth/register (Protected by authLimiter - max 5 requests / 5 mins)
router.post('/register', authLimiter, async (req, res) => {
  const { username, password, firstName, email, contactNumber } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username.trim().length < 3 || password.length < 6) {
    return res.status(400).json({ 
      error: 'Username must be at least 3 characters and password at least 6 characters' 
    });
  }

  try {
    const existingUser = await findUserByUsername(username.trim());
    if (existingUser) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    const userCount = await getUserCount();
    const role = (userCount === 0) ? 'admin' : 'user';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const fName = firstName ? firstName.trim() : null;
    const mail = email ? email.trim() : null;
    const phone = contactNumber ? contactNumber.trim() : null;

    const result = await createUser({
      username: username.trim(),
      passwordHash,
      firstName: fName,
      email: mail,
      contactNumber: phone,
      role
    });

    const token = jwt.sign(
      { id: result.id, username: username.trim(), role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        username: username.trim(),
        firstName: fName,
        email: mail,
        contactNumber: phone,
        role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during registration' });
  }
});

// POST /api/auth/login (Protected by authLimiter - max 5 requests / 5 mins)
router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await findUserByUsername(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passHash = user.password_hash || user.password;
    const isMatch = await bcrypt.compare(password, passHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const userRole = user.role || 'user';

    const token = jwt.sign(
      { id: user.id, username: user.username, role: userRole }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        email: user.email,
        contactNumber: user.contact_number,
        role: userRole
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        email: user.email,
        contactNumber: user.contact_number,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Auth-me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/password - Change Password for Logged-In User
router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const user = await findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passHash = user.password_hash || user.password;
    const isMatch = await bcrypt.compare(currentPassword, passHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(req.user.id, newHash);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
