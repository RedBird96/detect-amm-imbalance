/**
 * Constants used throughout the application
 */
export const TABLES = {
  TOKEN_INFO: 'TokenInfo',
  LP_INFO: 'LPInfo',
  ROUTE: 'Route',
} as const;

export type TableName = keyof typeof TABLES;

export const CONFIG = {
  BATCH_SIZE: 1000,
  MAX_PATH_LENGTH: 5,
  MIN_PATH_LENGTH: 2,
  // Add address validation regex
  ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
} as const;
