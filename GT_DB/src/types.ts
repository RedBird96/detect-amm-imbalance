// src/types.ts

/**
 * Represents data related to a token.
 */
export interface TokenData {
  address: string; // The token's unique blockchain address.
  symbol: string;  // The token's symbol (e.g., ETH, WBTC).
  name: string;    // The token's name (e.g., Ethereum, Wrapped Bitcoin).
  decimals: number; // The number of decimal places the token supports.
}

/**
 * Represents data related to a liquidity pool (LP).
 */
export interface LPData {
  address: string;         // The liquidity pool's unique blockchain address.
  token1_address: string;  // The address of the first token in the pool.
  token2_address: string;  // The address of the second token in the pool.
}

/**
 * Represents a single route path in a trading or routing context.
 * Each element is a tuple consisting of a token address and an array of liquidity pool addresses.
 */
export type RoutePath = Array<[string, string[]]>;

/**
 * Represents an item in a path group.
 */
export interface PathGroupItem {
  token: string;        // The token's blockchain address.
  liquidities: string[]; // An array of liquidity pool addresses associated with the token.
}

/**
 * Represents a group of paths.
 * Each element is a tuple consisting of a token address and an array of liquidity pool addresses.
 */
export type PathGroup = Array<[string, string[]]>;

/**
 * Enum defining table names used in the database.
 */
export const enum TABLES {
  TOKEN_INFO = 'TokenInfo', // Table storing token-related data.
  LP_INFO = 'LPInfo',       // Table storing liquidity pool data.
  ROUTE = 'Route',          // Table storing route path data.
}

/**
 * A type representing the keys of the `TABLES` enum.
 * Used to ensure database queries reference valid table names.
 */
export type TableName = keyof typeof TABLES;
