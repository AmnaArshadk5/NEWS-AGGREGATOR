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
} else {
  console.log('[Database] Operating with embedded SQLite storage');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[Database] Error opening SQLite database:', err.message);
    } else {
      console.log('[Database] Connected to SQLite database at:', dbPath);
      sqliteDb.run('PRAGMA foreign_keys = ON;');
      initializeSqliteTables();
    }
  });
}

// ── Convert SQLite ? placeholders to PostgreSQL $1, $2, $3 ──
function convertSqlPlaceholders(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

// ── Query Wrappers ──

// Execute INSERT / UPDATE / DELETE
export const runQuery = async (sql, params = []) => {
  if (usePostgres) {
    let pgSql = convertSqlPlaceholders(sql);
    // Translate SQLite "INSERT OR IGNORE INTO" to PostgreSQL "INSERT INTO ... ON CONFLICT DO NOTHING"
    if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(pgSql)) {
      pgSql = pgSql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
      if (!/ON\s+CONFLICT/i.test(pgSql)) {
        pgSql += ' ON CONFLICT DO NOTHING';
      }
    }
    // If it's an INSERT and doesn't specify RETURNING, append RETURNING id
    if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
      pgSql += ' RETURNING id';
    }
    const res = await pgPool.query(pgSql, params);
    const lastId = res.rows.length > 0 && res.rows[0]?.id ? res.rows[0].id : null;
    return { id: lastId, changes: res.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

// Execute SELECT single row
export const getQuery = async (sql, params = []) => {
  if (usePostgres) {
    const pgSql = convertSqlPlaceholders(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
};

// Execute SELECT multiple rows
export const allQuery = async (sql, params = []) => {
  if (usePostgres) {
    const pgSql = convertSqlPlaceholders(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

// ── PostgreSQL Table Initialization ──
async function initializePgTables() {
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // Seed categories if empty
    const catCheck = await pgPool.query('SELECT COUNT(*) as count FROM categories');
    if (parseInt(catCheck.rows[0].count, 10) === 0) {
      const defaultCategories = [
        ['General', 'general', 1],
        ['Technology', 'technology', 2],
        ['Business', 'business', 3],
        ['Sports', 'sports', 4],
        ['Entertainment', 'entertainment', 5],
        ['Health', 'health', 6],
        ['Science', 'science', 7],
      ];
      for (const cat of defaultCategories) {
        await pgPool.query('INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING', cat);
      }
      console.log('[Database] Seeded default categories into PostgreSQL.');
    }
  } catch (err) {
    console.error('[Database] Error initializing PostgreSQL tables:', err.message);
  }
}

// ── SQLite Table Initialization ──
function initializeSqliteTables() {
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
  });
}

export default usePostgres ? pgPool : sqliteDb;
