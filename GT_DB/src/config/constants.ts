/**
 * Constants used throughout the application
 */

// A collection of table names used in the database. Declared as a constant to prevent accidental modification.
export const TABLES = {
  TOKEN_INFO: 'TokenInfo',  // Table storing token details like address, symbol, and decimals.
  LP_INFO: 'LPInfo',        // Table storing liquidity pool information such as token addresses.
  ROUTE: 'Route',           // Table storing route data for token swaps.
} as const; // `as const` ensures these values are readonly and prevents accidental reassignment.

// Type definition for table names derived from the TABLES object. This ensures type safety when referring to tables.
export type TableName = keyof typeof TABLES;

// Application configuration settings that are used globally.
export const CONFIG = {
  BATCH_SIZE: 1000,           // Number of records processed in a single batch.
  MAX_PATH_LENGTH: 5,         // Maximum number of hops allowed in a route.
  MIN_PATH_LENGTH: 2,         // Minimum number of hops required in a valid route.
  ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/, // Regular expression to validate Ethereum addresses.
} as const; // Marked as readonly to maintain immutability.
