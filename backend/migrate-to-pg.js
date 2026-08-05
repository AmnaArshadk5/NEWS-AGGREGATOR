import sqlite3 from 'sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'news.db');

async function migrate() {
  console.log('\n=================== SQLite ➔ PostgreSQL Data Migration ===================');

  // 1. Connect to SQLite
  console.log(`[1/5] Opening SQLite database: ${dbPath}`);
  const sqliteDb = new sqlite3.Database(dbPath);

  const sqliteAll = (sql) => new Promise((resolve, reject) => {
    sqliteDb.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  // 2. Connect to PostgreSQL
  const pgConfig = process.env.DATABASE_URL || {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'news_aggregator',
  };

  console.log(`[2/5] Connecting to PostgreSQL database...`);
  const pgPool = new Pool(typeof pgConfig === 'string' ? { connectionString: pgConfig } : pgConfig);

  try {
    await pgPool.query('SELECT 1');
    console.log('✓ Successfully connected to PostgreSQL.');
  } catch (err) {
    console.error('\n❌ PostgreSQL Connection Failed!');
    console.error(`Error: ${err.message}`);
    console.error('\nPlease check your .env PostgreSQL configuration:');
    console.error('  USE_POSTGRES=true');
    console.error('  PG_HOST=localhost');
    console.error('  PG_PORT=5432');
    console.error('  PG_USER=postgres');
    console.error('  PG_PASSWORD=your_password');
    console.error('  PG_DATABASE=news_aggregator\n');
    process.exit(1);
  }

  // 3. Create PostgreSQL Tables if not exist
  console.log(`[3/5] Initializing PostgreSQL schema...`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      url_to_image TEXT,
      published_at TEXT,
      source_name TEXT,
      author TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, url)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ PostgreSQL tables initialized.');

  // 4. Migrate Data
  console.log(`[4/5] Migrating records from SQLite to PostgreSQL...`);

  // 4a. Migrate Users
  const users = await sqliteAll('SELECT * FROM users');
  let usersMigrated = 0;
  for (const u of users) {
    await pgPool.query(
      `INSERT INTO users (id, username, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role`,
      [u.id, u.username, u.password_hash, u.role || 'user', u.created_at || new Date()]
    );
    usersMigrated++;
  }
  console.log(`  - Migrated ${usersMigrated} user(s).`);

  // Reset Users ID sequence
  if (users.length > 0) {
    await pgPool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
  }

  // 4b. Migrate Categories
  const categories = await sqliteAll('SELECT * FROM categories');
  let categoriesMigrated = 0;
  for (const c of categories) {
    await pgPool.query(
      `INSERT INTO categories (id, name, slug, enabled, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         enabled = EXCLUDED.enabled,
         sort_order = EXCLUDED.sort_order`,
      [c.id, c.name, c.slug, c.enabled ?? 1, c.sort_order ?? 0, c.created_at || new Date()]
    );
    categoriesMigrated++;
  }
  console.log(`  - Migrated ${categoriesMigrated} category/categories.`);

  if (categories.length > 0) {
    await pgPool.query(`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))`);
  }

  // 4c. Migrate Bookmarks
  const bookmarks = await sqliteAll('SELECT * FROM bookmarks');
  let bookmarksMigrated = 0;
  for (const b of bookmarks) {
    await pgPool.query(
      `INSERT INTO bookmarks (id, user_id, title, description, url, url_to_image, published_at, source_name, author, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [b.id, b.user_id, b.title, b.description, b.url, b.url_to_image, b.published_at, b.source_name, b.author, b.created_at || new Date()]
    );
    bookmarksMigrated++;
  }
  console.log(`  - Migrated ${bookmarksMigrated} bookmark(s).`);

  if (bookmarks.length > 0) {
    await pgPool.query(`SELECT setval('bookmarks_id_seq', (SELECT MAX(id) FROM bookmarks))`);
  }

  // 5. Verification
  console.log(`[5/5] Verification & Summary:`);
  const pgUsersCount = await pgPool.query('SELECT COUNT(*) FROM users');
  const pgCatCount = await pgPool.query('SELECT COUNT(*) FROM categories');
  const pgBookmarkCount = await pgPool.query('SELECT COUNT(*) FROM bookmarks');

  console.table([
    { Table: 'Users', 'SQLite Count': users.length, 'PostgreSQL Count': pgUsersCount.rows[0].count },
    { Table: 'Categories', 'SQLite Count': categories.length, 'PostgreSQL Count': pgCatCount.rows[0].count },
    { Table: 'Bookmarks', 'SQLite Count': bookmarks.length, 'PostgreSQL Count': pgBookmarkCount.rows[0].count },
  ]);

  console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('To activate PostgreSQL for the backend server, update your backend/.env:');
  console.log('  USE_POSTGRES=true\n');

  sqliteDb.close();
  await pgPool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
