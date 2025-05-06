/**
 * Main application class that orchestrates the arbitrage detection system.
 * This class serves as the central coordinator for all system components.
 * 
 * Responsibilities:
 * - Initializes and manages all system components
 * - Handles component lifecycle
 * - Coordinates data flow between components
 * - Manages system cleanup and shutdown
 * 
 * @class App
 */

import { DatabaseManager } from "../database/dbManager";
import { EventSubscriber } from "../services/eventSubscriber";
import { ArbitrageCalculator } from "../services/arbitrageCalculator";
import { WebSocketManager } from "../server/webSocketServer";
import { EVENT_NAME, WEB_SERVER_PORT } from "../config/constants";

export class App {
  /** Database manager instance for handling all database operations */
  private dbManager: DatabaseManager | null = null;
  
  /** Arbitrage calculator instance for detecting trading opportunities */
  private arbitrageCalculator: ArbitrageCalculator | null = null;
  
  /** Event subscriber for monitoring blockchain events */
  private eventSubscriber: EventSubscriber | null = null;
  
  /** WebSocket manager for broadcasting updates to clients */
  private webSocketManager: WebSocketManager | null = null;
  
  /** Array of cleanup callbacks to be executed during shutdown */
  private cleanupCallbacks: (() => Promise<void>)[] = [];

  /**
   * Initializes all components of the application.
   * Sets up the following components in sequence:
   * 1. Database manager for data persistence
   * 2. Arbitrage calculator for opportunity detection
   * 3. WebSocket server for real-time updates
   * 4. Event subscriber for blockchain monitoring
   * 
   * Also sets up event handlers and starts monitoring for opportunities.
   * 
   * @async
   * @throws {Error} If any component fails to initialize
   */
  async initialize() {
    // Initialize database manager for data persistence
    this.dbManager = new DatabaseManager();
    await this.dbManager.initialize();

    // Initialize arbitrage calculator with database access
    this.arbitrageCalculator = new ArbitrageCalculator(this.dbManager);
    
    // Initialize WebSocket server for real-time updates
    this.webSocketManager = new WebSocketManager(Number(WEB_SERVER_PORT));
    this.cleanupCallbacks.push(async () => this.webSocketManager?.close());

    // Set up event handler for broadcasting arbitrage opportunities
    this.arbitrageCalculator.on(
      EVENT_NAME,
      ({ pathId, pathDescription, rate }) => {
        this.webSocketManager?.broadcast({ pathId, pathDescription, rate });
      },
    );

    // Initialize event subscriber for blockchain monitoring
    this.eventSubscriber = new EventSubscriber(
      this.dbManager,
      this.arbitrageCalculator,
    );
    this.cleanupCallbacks.push(async () => this.eventSubscriber?.shutdown());

    // Load initial pool data
    await this.eventSubscriber.fetchInitialPoolReserves();

    // Start monitoring for new events
    console.log("Listening for Swap events...");
    await this.eventSubscriber.subscribeToPoolsInBatches();
  }

  /**
   * Performs cleanup of all application resources.
   * Executes all registered cleanup callbacks in parallel to ensure
   * proper shutdown of all components.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log("Cleaning up resources...");
    await Promise.all(this.cleanupCallbacks.map((cb) => cb()));
  }
}
