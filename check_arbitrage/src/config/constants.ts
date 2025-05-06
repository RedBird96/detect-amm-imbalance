/**
 * Configuration constants for the arbitrage detection system.
 * This file contains all the configurable parameters and constants used throughout the application.
 * 
 * @module constants
 */

/** Infura API key for Ethereum network access */
export const INFURA_API_KEY =
  process.env.INFURA_API_KEY || "ea0a5cbdb47b4dbfb799f3269d449904";

/** Address of the Uniswap viewer contract for fetching pool data */
export const UNISWAP_VIEWER_ADDRESS =
  "0x416355755f32b2710ce38725ed0fa102ce7d07e6";

/** WebSocket server port for real-time updates */
export const WEB_SERVER_PORT = process.env.WEB_SERVER_PORT || 8080;

/**
 * ABI definition for the Uniswap viewer contract.
 * Used to interact with the contract for fetching pool data.
 */
export const UNISWAP_VIEWER_ABI = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_pair",
        type: "address[]",
      },
    ],
    name: "viewPair",
    outputs: [
      {
        internalType: "uint112[]",
        name: "",
        type: "uint112[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * ABI definition for Uniswap V2 pool contract.
 * Contains event definitions for monitoring pool updates.
 */
export const UNISWAP_V2_POOL_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint112",
        name: "reserve0",
        type: "uint112",
      },
      {
        indexed: false,
        internalType: "uint112",
        name: "reserve1",
        type: "uint112",
      },
    ],
    name: "Sync",
    type: "event",
  },
];

/** Number of pools to process in each batch */
export const BATCH_SIZE = 800;

/** Initial amount in ETH for arbitrage calculations */
export const START_AMOUNT = "1";

/** Starting currency for arbitrage calculations */
export const START_CURRENCY = "WETH";

/** Trading fee percentage (0.5%) */
export const FEE_PERCENT = 0.5;

/** Maximum number of concurrent connections */
export const MAX_CONNECTIONS = 2;

/** SQLite database filename */
export const DB_NAME = "defi.db";

/** Log file name for arbitrage opportunities */
export const LOG_FILE_NAME = "arbitrage.log";

/** Event name for arbitrage rate updates */
export const EVENT_NAME = "arbitrageRateUpdated";
