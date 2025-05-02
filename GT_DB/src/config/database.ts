import Database from 'better-sqlite3';
import { TABLES } from './constants';

const DB_NAME = 'defi.db';

const initializeDatabase = () => {
  const db = new Database(DB_NAME);

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLES.TOKEN_INFO} (
      address TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      decimals INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${TABLES.LP_INFO} (
      address TEXT PRIMARY KEY,
      token1_address TEXT,
      token2_address TEXT
    );

    CREATE TABLE IF NOT EXISTS ${TABLES.ROUTE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
};

const db = initializeDatabase();
export default db;
