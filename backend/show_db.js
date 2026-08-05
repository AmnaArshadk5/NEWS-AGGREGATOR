import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'news.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  showData();
});

function query(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function showData() {
  try {
    console.log('\n=================== SQLite Database Viewer ===================');
    console.log(`Database File: ${dbPath}`);
    
    // 1. Show Users
    console.log('\n👥 REGISTERED USERS:');
    const users = await query('SELECT id, username, role, created_at FROM users');
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(users);
    }

    // 2. Show Categories
    console.log('\n📁 CATEGORIES:');
    const categories = await query('SELECT id, name, slug, enabled, sort_order FROM categories');
    console.table(categories);

    // 3. Show Bookmarks
    console.log('\n🔖 BOOKMARKED ARTICLES:');
    const bookmarks = await query('SELECT id, user_id, title, source_name, url FROM bookmarks');
    if (bookmarks.length === 0) {
      console.log('No bookmarked articles found in database.');
    } else {
      console.table(bookmarks.map(b => ({
        id: b.id,
        user_id: b.user_id,
        title: b.title.length > 40 ? `${b.title.slice(0, 40)}...` : b.title,
        source: b.source_name,
        url: b.url.length > 40 ? `${b.url.slice(0, 40)}...` : b.url
      })));
    }
    
    console.log('==============================================================\n');
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    db.close();
  }
}
