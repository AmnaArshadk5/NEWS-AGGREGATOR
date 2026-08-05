import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DATABASE || 'news_aggregator',
};

const pool = new Pool(typeof connectionString === 'string' ? { connectionString } : connectionString);

async function showPgData() {
  try {
    console.log('\n=================== PostgreSQL Database Viewer ===================');
    console.log(`Database: ${process.env.PG_DATABASE || 'news_aggregator'} @ ${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || '5432'}`);

    // 1. Show Users
    console.log('\n👥 REGISTERED USERS:');
    const users = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
    if (users.rows.length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(users.rows);
    }

    // 2. Show Categories
    console.log('\n📁 CATEGORIES:');
    const categories = await pool.query('SELECT id, name, slug, enabled, sort_order FROM categories ORDER BY sort_order ASC');
    console.table(categories.rows);

    // 3. Show Bookmarks
    console.log('\n🔖 BOOKMARKED ARTICLES:');
    const bookmarks = await pool.query('SELECT id, user_id, title, source_name, url FROM bookmarks ORDER BY id ASC');
    if (bookmarks.rows.length === 0) {
      console.log('No bookmarked articles found in database.');
    } else {
      console.table(bookmarks.rows.map(b => ({
        id: b.id,
        user_id: b.user_id,
        title: b.title.length > 40 ? `${b.title.slice(0, 40)}...` : b.title,
        source: b.source_name,
        url: b.url.length > 40 ? `${b.url.slice(0, 40)}...` : b.url
      })));
    }

    console.log('==================================================================\n');
  } catch (err) {
    console.error('\n❌ Could not query PostgreSQL database:', err.message);
    console.error('Make sure PostgreSQL is running and credentials in backend/.env are correct.\n');
  } finally {
    await pool.end();
  }
}

showPgData();
