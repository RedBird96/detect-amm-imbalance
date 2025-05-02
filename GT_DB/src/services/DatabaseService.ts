import db from '../config/database';
import { TABLES } from '../config/constants';

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface LPInfo {
  address: string;
  token1_address: string;
  token2_address: string;
}

export class DatabaseService {
  static readonly BATCH_SIZE = 1000;

  static batchInsertTokens(tokens: TokenInfo[]): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO ${TABLES.TOKEN_INFO} 
      (address, symbol, name, decimals)
      VALUES (?, ?, ?, ?)
    `);

    db.transaction(() => {
      tokens.forEach((token) => {
        stmt.run(token.address.toLowerCase(), token.symbol, token.name, token.decimals);
      });
    })();
  }

  static batchInsertLPs(lps: LPInfo[]): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO ${TABLES.LP_INFO} 
      (address, token1_address, token2_address)
      VALUES (?, ?, ?)
    `);

    // db.pragma('foreign_keys = OFF');

    db.transaction(() => {
      lps.forEach((lp) => {
        stmt.run(
          lp.address.toLowerCase(),
          lp.token1_address.toLowerCase(),
          lp.token2_address.toLowerCase()
        );
      });
    })();
  }

  static batchInsertRoutes(paths: string[]): void {
    const stmt = db.prepare(`
      INSERT INTO ${TABLES.ROUTE} (path)
      VALUES (?)
    `);

    db.transaction(() => {
      paths.forEach((path) => stmt.run(path));
    })();
  }

  static getCount(table: keyof typeof TABLES): number {
    const tableName = TABLES[table];
    const stmt = db.prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM ${tableName}`);
    const result = stmt.get();
    return result ? result.count : 0;
  }

  static getToken(address: string): TokenInfo | null {
    const stmt = db.prepare(`
      SELECT * FROM ${TABLES.TOKEN_INFO}
      WHERE address = ?
    `);
    return stmt.get(address.toLowerCase()) as TokenInfo | null;
  }
}
