/**
 * Type definitions for the arbitrage detection system.
 * This file contains all the interfaces and types used throughout the application.
 * These types ensure type safety and provide clear documentation of data structures.
 * 
 * @module interfaces
 */

/**
 * Represents information about a token in the system.
 * Used for storing and retrieving token metadata.
 * 
 * @interface TokenInfo
 */
export interface TokenInfo {
  /** Blockchain address of the token */
  address: string;
  
  /** Token symbol (e.g., "ETH", "USDC") */
  symbol: string;
  
  /** Full name of the token */
  name: string;
  
  /** Number of decimal places the token supports */
  decimals: number;
}

/**
 * Represents information about a liquidity pool.
 * Contains pool address, token pairs, and current reserves.
 * 
 * @interface LPInfo
 */
export interface LPInfo {
  /** Blockchain address of the liquidity pool */
  address: string;
  
  /** Address of the first token in the pool */
  token1_address: string;
  
  /** Address of the second token in the pool */
  token2_address: string;
  
  /** Current reserve amount of the first token */
  reserve1: bigint;
  
  /** Current reserve amount of the second token */
  reserve2: bigint;
}

/**
 * Represents a single step in a trading route.
 * Defines the target token and the liquidity pool to use.
 * 
 * @interface RouteItem
 */
export interface RouteItem {
  /** Address of the target token for this step */
  target: string;
  
  /** Address of the liquidity pool to use */
  lp: string;
}

/**
 * Represents a complete trading route.
 * Contains a unique identifier and an array of route steps.
 * 
 * @interface RouteInfo
 */
export interface RouteInfo {
  /** Unique identifier for the route */
  id: string;
  
  /** Array of steps that make up the complete route */
  routeInfo: RouteItem[];
}

/**
 * Array of route IDs.
 * Used for mapping liquidity pools to the routes that include them.
 * 
 * @typedef {string[]} PathIdArray
 */
export type PathIdArray = string[];
