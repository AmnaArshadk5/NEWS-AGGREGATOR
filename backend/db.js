import sqlite3 from 'sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'news.db');

// Check if PostgreSQL configuration is enabled
const usePostgres = Boolean(process.env.DATABASE_URL || (process.env.USE_POSTGRES === 'true' && process.env.PG_HOST));

let pgPool = null;
let sqliteDb = null;

// Initialize SQLite Database Engine
sqliteDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[Database] SQLite failover error:', err.message);
  } else {
    sqliteDb.run('PRAGMA foreign_keys = ON;');
    initializeSqliteTables();
  }
});

// Initialize PostgreSQL Database Engine if configured
if (usePostgres) {
  const connectionString = process.env.DATABASE_URL || {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'news_aggregator',
  };

  const isRemote = typeof connectionString === 'string' && (connectionString.includes('render.com') || connectionString.includes('ssl=true') || process.env.NODE_ENV === 'production');

  const poolConfig = typeof connectionString === 'string'
    ? {
        connectionString,
        ssl: isRemote ? { rejectUnauthorized: false } : false
      }
    : {
        ...connectionString,
        ssl: isRemote ? { rejectUnauthorized: false } : false
      };

  pgPool = new Pool(poolConfig);

  pgPool.on('connect', () => {
    console.log('[Database] Connected to PostgreSQL instance');
  });

  pgPool.on('error', (err) => {
    console.error('[Database] PostgreSQL pool error:', err.message);
  });

  initializePgTables();
}

// ── Ensure PostgreSQL Tables Exist ──
async function initializePgTables() {
  if (!pgPool) return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        password TEXT,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
    await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;`);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        url_to_image TEXT,
        published_at TEXT,
        source_name TEXT,
        author TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, url)
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        enabled INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure username 'admin' always has role 'admin'
    await pgPool.query("UPDATE users SET role = 'admin' WHERE username = 'admin';");

    // Seed default categories into PostgreSQL if empty
    const defaultCategories = [
      { name: 'General', slug: 'general', sort_order: 1 },
      { name: 'Technology', slug: 'technology', sort_order: 2 },
      { name: 'Business', slug: 'business', sort_order: 3 },
      { name: 'Sports', slug: 'sports', sort_order: 4 },
      { name: 'Entertainment', slug: 'entertainment', sort_order: 5 },
      { name: 'Health', slug: 'health', sort_order: 6 },
      { name: 'Science', slug: 'science', sort_order: 7 }
    ];

    for (const cat of defaultCategories) {
      await pgPool.query(
        `INSERT INTO categories (name, slug, sort_order, enabled) 
         VALUES ($1, $2, $3, 1) 
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.sort_order]
      );
    }

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS channel_follows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        source_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, source_name)
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        url TEXT,
        source_name VARCHAR(255),
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[Database] PostgreSQL tables initialized with default categories, follows & notifications.');
  } catch (err) {
    console.error('[Database] Error initializing PostgreSQL tables:', err.message);
  }
}

// ── Ensure SQLite Tables Exist ──
function initializeSqliteTables() {
  if (!sqliteDb) return;
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        url_to_image TEXT,
        published_at TEXT,
        source_name TEXT,
        author TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, url)
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        enabled INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS channel_follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, source_name)
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        url TEXT,
        source_name TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  });
}

// ── Convert SQLite ? placeholders to PostgreSQL $1, $2, $3 ──
function convertSqlPlaceholders(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

// ── Failover Query Wrappers ──

export const runQuery = async (sql, params = []) => {
  if (usePostgres && pgPool) {
    let pgSql = convertSqlPlaceholders(sql);
    if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(pgSql)) {
      pgSql = pgSql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
      if (!/ON\s+CONFLICT/i.test(pgSql)) {
        pgSql += ' ON CONFLICT DO NOTHING';
      }
    }
    if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
      pgSql += ' RETURNING id';
    }
    try {
      const res = await pgPool.query(pgSql, params);
      const lastId = res.rows.length > 0 && res.rows[0]?.id ? res.rows[0].id : null;
      return { id: lastId, changes: res.rowCount };
    } catch (err) {
      console.warn('[Database] PostgreSQL runQuery error:', err.message);
      if (err.code === '42P01') {
        await initializePgTables();
        try {
          const res = await pgPool.query(pgSql, params);
          const lastId = res.rows.length > 0 && res.rows[0]?.id ? res.rows[0].id : null;
          return { id: lastId, changes: res.rowCount };
        } catch (e2) {
          console.warn('[Database] Retry failed:', e2.message);
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('No active database instance available'));
    sqliteDb.run(sql, params, function (err) {
      if (err && err.message.includes('no such table')) {
        initializeSqliteTables();
        sqliteDb.run(sql, params, function (err2) {
          if (err2) reject(err2);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      } else if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const getQuery = async (sql, params = []) => {
  if (usePostgres && pgPool) {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows[0] || null;
    } catch (err) {
      console.warn('[Database] PostgreSQL getQuery error:', err.message);
      if (err.code === '42P01') {
        await initializePgTables();
        try {
          const res = await pgPool.query(pgSql, params);
          return res.rows[0] || null;
        } catch (e2) {
          console.warn('[Database] Retry failed:', e2.message);
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    if (!sqliteDb) return resolve(null);
    sqliteDb.get(sql, params, (err, row) => {
      if (err && err.message.includes('no such table')) {
        initializeSqliteTables();
        sqliteDb.get(sql, params, (err2, row2) => {
          if (err2) reject(err2);
          else resolve(row2 || null);
        });
      } else if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
};

export const allQuery = async (sql, params = []) => {
  if (usePostgres && pgPool) {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.warn('[Database] PostgreSQL allQuery error:', err.message);
      if (err.code === '42P01') {
        await initializePgTables();
        try {
          const res = await pgPool.query(pgSql, params);
          return res.rows;
        } catch (e2) {
          console.warn('[Database] Retry failed:', e2.message);
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    if (!sqliteDb) return resolve([]);
    sqliteDb.all(sql, params, (err, rows) => {
      if (err && err.message.includes('no such table')) {
        initializeSqliteTables();
        sqliteDb.all(sql, params, (err2, rows2) => {
          if (err2) reject(err2);
          else resolve(rows2 || []);
        });
      } else if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

export default usePostgres ? pgPool : sqliteDb;
