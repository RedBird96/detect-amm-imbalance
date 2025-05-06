import { ethers } from "ethers";
import { LRUCache } from "lru-cache";
import {
  UNISWAP_V2_POOL_ABI,
  INFURA_API_KEY,
  BATCH_SIZE,
  UNISWAP_VIEWER_ADDRESS,
  UNISWAP_VIEWER_ABI,
} from "../config/constants";
import { DatabaseManager } from "../database/dbManager";
import { ArbitrageCalculator } from "./arbitrageCalculator";
import PQueue from "p-queue";

const RECONNECT_INTERVAL = 5000;

/**
 * Manages event subscriptions for Uniswap V2 pools.
 * Handles real-time monitoring of pool reserves and updates arbitrage calculations.
 */
export class EventSubscriber {
  private dbManager: DatabaseManager;
  private arbitrageCalculator: ArbitrageCalculator;
  private activeProviders: ethers.WebSocketProvider[] = [];
  private eventCache = new LRUCache<string, boolean>({
    max: 100_000,
    ttl: 300_000,
  });
  private eventQueue = new PQueue({ concurrency: 5 });

  /**
   * Creates a new EventSubscriber instance.
   *
   * @param {DatabaseManager} dbManager - Database manager instance for accessing pool data
   * @param {ArbitrageCalculator} arbitrageCalculator - Calculator instance for processing arbitrage opportunities
   */
  constructor(
    dbManager: DatabaseManager,
    arbitrageCalculator: ArbitrageCalculator,
  ) {
    this.dbManager = dbManager;
    this.arbitrageCalculator = arbitrageCalculator;
  }

  /**
   * Fetches initial pool reserves for all tracked pools.
   * Uses batched requests to efficiently fetch data from the blockchain.
   *
   * @async
   * @returns {Promise<void>}
   */
  async fetchInitialPoolReserves() {
    const lpMap = this.dbManager.getLPMap();
    const poolAddresses = Array.from(lpMap.keys());
    const provider = new ethers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    );
    const viewContract = new ethers.Contract(
      UNISWAP_VIEWER_ADDRESS,
      UNISWAP_VIEWER_ABI,
      provider,
    );

    for (let i = 0; i < poolAddresses.length; i += BATCH_SIZE) {
      const batch = poolAddresses.slice(i, i + BATCH_SIZE);
      try {
        const reservesArray = await viewContract.viewPair(batch);

        for (let j = 0; j < batch.length; j++) {
          const address = batch[j];
          const reserve0 = reservesArray[j * 2];
          const reserve1 = reservesArray[j * 2 + 1];
          const lpInfo = lpMap.get(address);
          if (lpInfo) {
            lpInfo.reserve1 = BigInt(reserve0.toString());
            lpInfo.reserve2 = BigInt(reserve1.toString());
          }
        }
      } catch (error) {
        console.error(
          `Error fetching reserves for batch starting at index ${i}:`,
          error,
        );
      }
    }
  }

  /**
   * Subscribes to Sync events for all tracked pools in batches.
   * Creates WebSocket connections and sets up event listeners.
   *
   * @async
   * @returns {Promise<void>}
   */
  async subscribeToPoolsInBatches() {
    const lpMap = this.dbManager.getLPMap();
    const addresses = Array.from(lpMap.keys());

    // Clear existing connections
    this.cleanupProviders();

    // Process in batched subscriptions
    for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
      const batch = addresses.slice(i, i + BATCH_SIZE);
      await this.createBatchSubscription(batch);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Add delay between batches
    }
  }

  /**
   * Creates a WebSocket subscription for a batch of pool addresses.
   * Sets up event listeners and error handling.
   *
   * @param {string[]} addresses - Array of pool addresses to subscribe to
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async createBatchSubscription(addresses: string[]) {
    const provider = new ethers.WebSocketProvider(
      `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`,
    );

    this.activeProviders.push(provider);

    try {
      const contractInterface = new ethers.Interface(UNISWAP_V2_POOL_ABI);

      // Create batch filter for Sync events
      const syncEvent = contractInterface.getEvent("Sync");
      const filter = {
        address: addresses,
        topics: [syncEvent ? syncEvent.topicHash : null],
      };

      // Event listener with proper error handling
      provider.on(filter, async (log: ethers.Log) => {
        this.eventQueue.add(() => this.handleSyncEvent(log));
      });

      provider.websocket.close = (code?: number, reason?: any) => {
        console.log(`Connection closed (${code}): ${reason}, reconnecting...`);
        this.scheduleReconnection(addresses);
      };

      provider.websocket.onerror = (error: Error) => {
        console.error("WebSocket error:", error);
        this.scheduleReconnection(addresses);
      };
    } catch (error) {
      console.error("Failed to create subscription:", error);
    }
  }

  /**
   * Handles Sync events from pools.
   * Updates pool reserves and triggers arbitrage calculations.
   *
   * @param {ethers.Log} log - The event log from the blockchain
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async handleSyncEvent(log: ethers.Log) {
    const eventId = `${log.transactionHash}`;

    // Check cache first
    if (this.eventCache.get(eventId)) return;
    this.eventCache.set(eventId, true);

    const uniswapInterface = new ethers.Interface(UNISWAP_V2_POOL_ABI);

    // Parse event data
    const parsedLog = uniswapInterface.parseLog(log);
    if (!parsedLog) {
      console.warn("Could not parse log:", log);
      return;
    }
    const reserve0 = parsedLog.args.reserve0;
    const reserve1 = parsedLog.args.reserve1;
    this.arbitrageCalculator.updateReservesAndCalculateArbitrage(
      log.address.toLocaleLowerCase(),
      reserve0,
      reserve1,
    );
  }

  /**
   * Schedules reconnection for a batch of pool addresses.
   *
   * @param {string[]} addresses - Array of pool addresses to reconnect
   * @private
   */
  private scheduleReconnection(addresses: string[]) {
    setTimeout(async () => {
      await this.createBatchSubscription(addresses);
    }, RECONNECT_INTERVAL);
  }

  /**
   * Cleans up all active WebSocket providers.
   * Removes event listeners and destroys connections.
   *
   * @private
   */
  private cleanupProviders() {
    this.activeProviders.forEach((provider) => {
      provider.removeAllListeners();
      provider.destroy();
    });
    this.activeProviders = [];
  }

  /**
   * Shuts down the event subscriber.
   * Cleans up all active connections.
   *
   * @async
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.cleanupProviders();
  }
}
