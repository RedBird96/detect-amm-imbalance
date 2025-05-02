// Importing the database configuration and constants
import db from '../config/database';
import { TABLES } from '../config/constants';

// Define interfaces for Token and Liquidity Pool (LP) data structures
interface TokenInfo {
  address: string; // Unique address of the token
  symbol: string; // Short symbol for the token (e.g., ETH, BTC)
  name: string; // Full name of the token
  decimals: number; // Number of decimals the token supports
}

interface LPInfo {
  address: string; // Address of the liquidity pool
  token1_address: string; // Address of the first token in the pair
  token2_address: string; // Address of the second token in the pair
}

// Service class to handle database operations
export class DatabaseService {
  static readonly BATCH_SIZE = 1000; // Batch size for database operations

  // Method to batch-insert token information into the database
  static batchInsertTokens(tokens: TokenInfo[]): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO ${TABLES.TOKEN_INFO} 
      (address, symbol, name, decimals)
      VALUES (?, ?, ?, ?)
    `); // Prepare SQL statement to insert tokens

    db.transaction(() => {
      tokens.forEach((token) => {
        stmt.run(token.address.toLowerCase(), token.symbol, token.name, token.decimals);
      }); // Insert each token in a batch transaction
    })();
  }

  // Method to batch-insert LP information into the database
  static batchInsertLPs(lps: LPInfo[]): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO ${TABLES.LP_INFO} 
      (address, token1_address, token2_address)
      VALUES (?, ?, ?)
    `); // Prepare SQL statement to insert LPs

    db.transaction(() => {
      lps.forEach((lp) => {
        stmt.run(
          lp.address.toLowerCase(),
          lp.token1_address.toLowerCase(),
          lp.token2_address.toLowerCase()
        ); // Insert each LP in a batch transaction
      });
    })();
  }

  // Method to batch-insert route paths into the database
  static batchInsertRoutes(paths: string[]): void {
    const stmt = db.prepare(`
      INSERT INTO ${TABLES.ROUTE} (path)
      VALUES (?)
    `); // Prepare SQL statement to insert routes

    db.transaction(() => {
      paths.forEach((path) => stmt.run(path)); // Insert each route in a batch transaction
    })();
  }

  // Method to count the number of entries in a specified table
  static getCount(table: keyof typeof TABLES): number {
    const tableName = TABLES[table]; // Resolve table name from constants
    const stmt = db.prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM ${tableName}`);
    const result = stmt.get();
    return result ? result.count : 0; // Return count or 0 if no entries
  }

  // Method to retrieve token information by its address
  static getToken(address: string): TokenInfo | null {
    const stmt = db.prepare(`
      SELECT * FROM ${TABLES.TOKEN_INFO}
      WHERE address = ?
    `); // Prepare SQL statement to fetch token by address
    return stmt.get(address.toLowerCase()) as TokenInfo | null; // Return token info or null if not found
  }
}