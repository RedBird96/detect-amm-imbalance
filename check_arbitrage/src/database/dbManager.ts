/**
 * Database Manager for handling all database operations.
 * This class manages the SQLite database connection and provides access to
 * token, liquidity pool, and route information.
 * 
 * Features:
 * - Database connection management
 * - Data caching using Maps
 * - Efficient data retrieval
 * - Type-safe data structures
 * 
 * @class DatabaseManager
 */

import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import { TokenInfo, LPInfo, RouteInfo, PathIdArray } from "../types/interfaces";
import { DB_NAME } from "../config/constants";

export class DatabaseManager {
  /** Map of token addresses to token information */
  private tokenMap = new Map<string, TokenInfo>();
  
  /** Map of liquidity pool addresses to pool information */
  private lpMap = new Map<string, LPInfo>();
  
  /** Map of route IDs to route information */
  private routeMap = new Map<string, RouteInfo>();
  
  /** Map of liquidity pool addresses to route IDs that include the pool */
  private lp2routeMapping = new Map<string, PathIdArray>();

  /**
   * Initializes the database manager.
   * Opens the database connection, fetches all necessary data,
   * and populates the in-memory maps.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    const db = await this.openDatabase();
    await this.fetchData(db);
    await db.close();
  }

  /**
   * Opens a connection to the SQLite database.
   * 
   * @private
   * @async
   * @returns {Promise<Database>} SQLite database connection
   */
  private async openDatabase(): Promise<Database> {
    return open({
      filename: DB_NAME,
      driver: sqlite3.Database,
    });
  }

  /**
   * Fetches and caches all necessary data from the database.
   * Populates token, liquidity pool, and route information maps.
   * Also creates the LP to route mapping for efficient lookups.
   * 
   * @private
   * @async
   * @param {Database} db - SQLite database connection
   * @returns {Promise<void>}
   */
  private async fetchData(db: Database) {
    // Fetch and cache token information
    const tokens = (await db.all("SELECT * FROM TokenInfo")) as TokenInfo[];
    tokens.forEach((token: TokenInfo) => {
      this.tokenMap.set(token.address.toLocaleLowerCase(), token);
    });

    // Fetch and cache liquidity pool information
    const lps = (await db.all("SELECT * FROM LPInfo")) as LPInfo[];
    lps.forEach((lp: LPInfo) => {
      this.lpMap.set(lp.address.toLocaleLowerCase(), {
        ...lp,
        reserve1: 0n,
        reserve2: 0n,
      });
    });

    // Fetch and cache route information
    const routes = (await db.all("SELECT id, path FROM Route")) as {
      id: string;
      path: string;
    }[];
    routes.forEach((route: { id: string; path: string }) => {
      // Parse route path and create route information
      const pathArray: [string, [string]][] = JSON.parse(route.path);
      const routeInfo = pathArray.map(([target, [lp]]: [string, [string]]) => ({
        target,
        lp,
      }));
      this.routeMap.set(route.id, { id: route.id, routeInfo });

      // Create LP to route mapping for efficient lookups
      routeInfo.forEach(({ lp }) => {
        if (!this.lp2routeMapping.has(lp)) {
          this.lp2routeMapping.set(lp, []);
        }
        this.lp2routeMapping.get(lp)!.push(route.id);
      });
    });
  }

  /**
   * Returns the token information map.
   * 
   * @returns {Map<string, TokenInfo>} Map of token addresses to token information
   */
  getTokenMap(): Map<string, TokenInfo> {
    return this.tokenMap;
  }

  /**
   * Returns the liquidity pool information map.
   * 
   * @returns {Map<string, LPInfo>} Map of pool addresses to pool information
   */
  getLPMap(): Map<string, LPInfo> {
    return this.lpMap;
  }

  /**
   * Returns the route information map.
   * 
   * @returns {Map<string, RouteInfo>} Map of route IDs to route information
   */
  getRouteMap(): Map<string, RouteInfo> {
    return this.routeMap;
  }

  /**
   * Returns the LP to route mapping.
   * 
   * @returns {Map<string, PathIdArray>} Map of pool addresses to route IDs
   */
  getLP2RouteMapping(): Map<string, PathIdArray> {
    return this.lp2routeMapping;
  }
}
