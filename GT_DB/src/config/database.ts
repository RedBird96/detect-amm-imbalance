import Database from 'better-sqlite3'; // SQLite3 library for efficient database interaction.
import { TABLES } from './constants'; // Import table names for consistency across the application.

// Name of the database file where the data is stored.
const DB_NAME = 'defi.db';

// Function to initialize and set up the database. Ensures tables are created if they don't already exist.
const initializeDatabase = () => {
  const db = new Database(DB_NAME); // Establish a connection to the database.

  // Enables Write-Ahead Logging mode for better performance and concurrent reads/writes.
  db.pragma('journal_mode = WAL');

  // Create required tables if they do not exist, ensuring the application has the necessary structure.
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLES.TOKEN_INFO} (
      address TEXT PRIMARY KEY,    -- Ethereum address of the token.
      symbol TEXT NOT NULL,        -- Symbol of the token (e.g., ETH, DAI).
      name TEXT NOT NULL,          -- Full name of the token.
      decimals INTEGER NOT NULL    -- Number of decimals used by the token.
    );

    CREATE TABLE IF NOT EXISTS ${TABLES.LP_INFO} (
      address TEXT PRIMARY KEY,    -- Address of the liquidity pool.
      token1_address TEXT,         -- Address of the first token in the pool.
      token2_address TEXT          -- Address of the second token in the pool.
    );

    CREATE TABLE IF NOT EXISTS ${TABLES.ROUTE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- Unique identifier for each route.
      path TEXT NOT NULL,                   -- Serialized path for token swaps.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- Timestamp for when the route was added.
    );
  `);

  return db; // Return the initialized database connection.
};

// Create and export a singleton database instance for use throughout the application.
const db = initializeDatabase();
export default db;
